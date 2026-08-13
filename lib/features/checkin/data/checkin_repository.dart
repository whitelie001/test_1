import '../../../core/network/api_client.dart';

class CheckinEnterResult {
  const CheckinEnterResult({
    required this.checkinId,
    required this.enteredAt,
    required this.status,
  });

  final String checkinId;
  final DateTime enteredAt;
  final String status;

  factory CheckinEnterResult.fromJson(Map<String, dynamic> json) {
    return CheckinEnterResult(
      checkinId: json['checkin_id'] as String,
      enteredAt: DateTime.parse(json['entered_at'] as String),
      status: json['status'] as String,
    );
  }
}

class CheckinLocationResult {
  const CheckinLocationResult({
    required this.status,
    required this.elapsedSeconds,
    required this.isInRange,
  });

  final String status;
  final int elapsedSeconds;
  final bool isInRange;

  factory CheckinLocationResult.fromJson(Map<String, dynamic> json) {
    return CheckinLocationResult(
      status: json['status'] as String,
      elapsedSeconds: json['elapsed_seconds'] as int,
      isInRange: json['is_in_range'] as bool,
    );
  }
}

class CheckinExitResult {
  const CheckinExitResult({
    required this.status,
    required this.totalSeconds,
    required this.piumScoreEarned,
    required this.attendanceConfirmed,
  });

  final String status;
  final int totalSeconds;
  final num piumScoreEarned;
  final bool attendanceConfirmed;

  factory CheckinExitResult.fromJson(Map<String, dynamic> json) {
    return CheckinExitResult(
      status: json['status'] as String,
      totalSeconds: json['total_seconds'] as int,
      piumScoreEarned: json['pium_score_earned'] as num,
      attendanceConfirmed: json['attendance_confirmed'] as bool,
    );
  }
}

class CheckinStatusResult {
  const CheckinStatusResult({
    required this.checkinId,
    required this.status,
    required this.elapsedSeconds,
    required this.enteredAt,
  });

  final String checkinId;
  final String status;
  final int elapsedSeconds;
  final DateTime enteredAt;

  factory CheckinStatusResult.fromJson(Map<String, dynamic> json) {
    return CheckinStatusResult(
      checkinId: json['checkin_id'] as String,
      status: json['status'] as String,
      elapsedSeconds: json['elapsed_seconds'] as int,
      enteredAt: DateTime.parse(json['entered_at'] as String),
    );
  }
}

/// GPS 체크인(`/meetups/{id}/checkin/enter`, `/checkins/{id}/...`) REST 래퍼.
class CheckinRepository {
  CheckinRepository({required this.apiClient});

  final ApiClient apiClient;

  Future<CheckinEnterResult> enter(
    String meetupId, {
    required double lat,
    required double lng,
    bool anchorMode = false,
  }) async {
    final response = await apiClient.post(
      '/meetups/$meetupId/checkin/enter',
      data: {'lat': lat, 'lng': lng, 'anchor_mode': anchorMode},
    );
    return CheckinEnterResult.fromJson(response as Map<String, dynamic>);
  }

  Future<CheckinLocationResult> updateLocation(
    String checkinId, {
    required double lat,
    required double lng,
    bool isAnchor = false,
  }) async {
    final response = await apiClient.put(
      '/checkins/$checkinId/location',
      data: {'lat': lat, 'lng': lng, 'is_anchor': isAnchor},
    );
    return CheckinLocationResult.fromJson(response as Map<String, dynamic>);
  }

  Future<CheckinExitResult> exit(
    String checkinId, {
    required double lat,
    required double lng,
  }) async {
    final response = await apiClient.post(
      '/checkins/$checkinId/exit',
      data: {'lat': lat, 'lng': lng},
    );
    return CheckinExitResult.fromJson(response as Map<String, dynamic>);
  }

  Future<CheckinStatusResult> getStatus(String checkinId) async {
    final response = await apiClient.get('/checkins/$checkinId/status');
    return CheckinStatusResult.fromJson(response as Map<String, dynamic>);
  }
}
