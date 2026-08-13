import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

import '../../../../core/constants/checkin_constants.dart';
import '../../../../core/network/api_exception.dart';
import '../../../anchor/domain/anchor_constants.dart';
import '../../domain/distance_calculator.dart';
import '../providers/checkin_providers.dart';

enum _CheckinPhase { locating, outOfRange, inRange, checkedIn, completed, error }

/// GPS 체크인 화면. 지도를 그리지 않고 목표 지점까지의 거리/재실 여부만
/// 보여준다(문서 6.3절 흐름: 도착 확인 → 입장 → 체류 → 퇴장).
///
/// [anchorMode]가 true면 팀장 앵커 위치([targetLat]/[targetLng]에 앵커의
/// 최신 좌표를 전달)를 기준으로, 아니면 모임 고정 위치를 기준으로 판정한다.
class CheckinScreen extends ConsumerStatefulWidget {
  const CheckinScreen({
    super.key,
    required this.meetupId,
    required this.targetLat,
    required this.targetLng,
    this.anchorId,
  });

  final String meetupId;
  final double targetLat;
  final double targetLng;

  /// null이 아니면 팀장 앵커 모드로 체크인한다.
  final String? anchorId;

  @override
  ConsumerState<CheckinScreen> createState() => _CheckinScreenState();
}

class _CheckinScreenState extends ConsumerState<CheckinScreen> {
  final _distanceCalculator = GeolocatorDistanceCalculator();

  _CheckinPhase _phase = _CheckinPhase.locating;
  double? _distanceMeters;
  String? _checkinId;
  int _elapsedSeconds = 0;
  String? _message;

  Timer? _locationTimer;
  bool get _isAnchorMode => widget.anchorId != null;

  double get _radiusMeters =>
      _isAnchorMode ? AnchorConstants.anchorRadiusMeters : CheckinConstants.meetupCheckinRadiusMeters;

  @override
  void initState() {
    super.initState();
    _refreshDistance();
  }

  @override
  void dispose() {
    _locationTimer?.cancel();
    super.dispose();
  }

  Future<Position> _currentPosition() async {
    final permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      final requested = await Geolocator.requestPermission();
      if (requested == LocationPermission.denied ||
          requested == LocationPermission.deniedForever) {
        throw const NetworkUnavailableException('위치 권한이 필요합니다');
      }
    }
    return Geolocator.getCurrentPosition();
  }

  Future<void> _refreshDistance() async {
    try {
      final position = await _currentPosition();
      final distance = _distanceCalculator.distanceMeters(
        position.latitude,
        position.longitude,
        widget.targetLat,
        widget.targetLng,
      );
      if (!mounted) return;
      setState(() {
        _distanceMeters = distance;
        if (_phase == _CheckinPhase.locating ||
            _phase == _CheckinPhase.inRange ||
            _phase == _CheckinPhase.outOfRange) {
          _phase = isWithinRadius(distance, _radiusMeters)
              ? _CheckinPhase.inRange
              : _CheckinPhase.outOfRange;
        }
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _phase = _CheckinPhase.error;
        _message = '위치를 가져올 수 없습니다';
      });
    }
  }

  Future<void> _checkin() async {
    try {
      final position = await _currentPosition();
      final result = await ref.read(checkinRepositoryProvider).enter(
            widget.meetupId,
            lat: position.latitude,
            lng: position.longitude,
            anchorMode: _isAnchorMode,
          );
      setState(() {
        _checkinId = result.checkinId;
        _phase = _CheckinPhase.checkedIn;
        _elapsedSeconds = 0;
      });
      _startLocationPingTimer();
    } on PiumApiException catch (e) {
      setState(() {
        _phase = _CheckinPhase.error;
        _message = e.message;
      });
    }
  }

  void _startLocationPingTimer() {
    _locationTimer?.cancel();
    _locationTimer = Timer.periodic(
      const Duration(seconds: CheckinConstants.locationPingIntervalSeconds),
      (_) => _sendLocationPing(),
    );
  }

  Future<void> _sendLocationPing() async {
    final checkinId = _checkinId;
    if (checkinId == null) return;
    try {
      final position = await _currentPosition();
      final result = await ref.read(checkinRepositoryProvider).updateLocation(
            checkinId,
            lat: position.latitude,
            lng: position.longitude,
            isAnchor: _isAnchorMode,
          );
      if (!mounted) return;
      setState(() => _elapsedSeconds = result.elapsedSeconds);
    } on PiumApiException catch (e) {
      if (!mounted) return;
      setState(() => _message = e.message);
    }
  }

  Future<void> _checkout() async {
    final checkinId = _checkinId;
    if (checkinId == null) return;
    try {
      final position = await _currentPosition();
      final result = await ref.read(checkinRepositoryProvider).exit(
            checkinId,
            lat: position.latitude,
            lng: position.longitude,
          );
      _locationTimer?.cancel();
      setState(() {
        _phase = _CheckinPhase.completed;
        _elapsedSeconds = result.totalSeconds;
        _message = '출석 완료! 피움 점수 +${result.piumScoreEarned}점 획득';
      });
    } on PiumApiException catch (e) {
      setState(() => _message = e.message);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_isAnchorMode ? 'GPS 체크인 (팀장 앵커)' : 'GPS 체크인')),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              if (_distanceMeters != null && _phase != _CheckinPhase.checkedIn)
                Text('목표까지 약 ${_distanceMeters!.round()}m'),
              const SizedBox(height: 16),
              if (_phase == _CheckinPhase.checkedIn)
                Text(
                  '체류 시간: ${_elapsedSeconds ~/ 60}분 ${_elapsedSeconds % 60}초',
                  style: Theme.of(context).textTheme.headlineSmall,
                ),
              if (_message != null) ...[
                const SizedBox(height: 16),
                Text(_message!),
              ],
              const SizedBox(height: 24),
              if (_phase == _CheckinPhase.outOfRange || _phase == _CheckinPhase.locating)
                OutlinedButton(onPressed: _refreshDistance, child: const Text('위치 새로고침')),
              if (_phase == _CheckinPhase.inRange)
                ElevatedButton(onPressed: _checkin, child: const Text('체크인')),
              if (_phase == _CheckinPhase.checkedIn)
                ElevatedButton(onPressed: _checkout, child: const Text('체크아웃')),
            ],
          ),
        ),
      ),
    );
  }
}
