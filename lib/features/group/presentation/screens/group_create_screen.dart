import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/network/api_exception.dart';
import '../group_providers.dart';

/// 모임 생성 화면. 문서 5.2절 `POST /meetups`에 필요한 필수 항목만 입력받는다
/// (위치는 텍스트로 좌표를 직접 입력 — 지도로 위치를 찍는 UI는 카카오맵
/// 연동 단계에서 교체).
class GroupCreateScreen extends ConsumerStatefulWidget {
  const GroupCreateScreen({super.key, this.onCreated});

  final void Function(String meetupId)? onCreated;

  @override
  ConsumerState<GroupCreateScreen> createState() => _GroupCreateScreenState();
}

class _GroupCreateScreenState extends ConsumerState<GroupCreateScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _sportController = TextEditingController();
  final _maxMembersController = TextEditingController(text: '10');
  final _locationNameController = TextEditingController();
  final _latController = TextEditingController(text: '37.5665');
  final _lngController = TextEditingController(text: '126.9780');

  bool _isSubmitting = false;
  String? _errorMessage;

  @override
  void dispose() {
    _nameController.dispose();
    _sportController.dispose();
    _maxMembersController.dispose();
    _locationNameController.dispose();
    _latController.dispose();
    _lngController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() {
      _isSubmitting = true;
      _errorMessage = null;
    });
    try {
      final meetup = await ref.read(meetupRepositoryProvider).create(
            name: _nameController.text,
            sport: _sportController.text,
            maxMembers: int.parse(_maxMembersController.text),
            lat: double.parse(_latController.text),
            lng: double.parse(_lngController.text),
            locationName: _locationNameController.text,
            // TODO(카카오맵 연동): 요일/시간 선택 UI로 교체. 지금은 고정값.
            schedule: const {'day': '미정', 'time': '미정'},
          );
      widget.onCreated?.call(meetup.id);
    } on PiumApiException catch (e) {
      setState(() => _errorMessage = e.message);
    } on NetworkUnavailableException catch (e) {
      setState(() => _errorMessage = e.message);
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('모임 만들기')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: '모임 이름'),
              validator: (v) => (v == null || v.isEmpty) ? '모임 이름을 입력하세요' : null,
            ),
            TextFormField(
              controller: _sportController,
              decoration: const InputDecoration(labelText: '종목'),
              validator: (v) => (v == null || v.isEmpty) ? '종목을 입력하세요' : null,
            ),
            TextFormField(
              controller: _maxMembersController,
              decoration: const InputDecoration(labelText: '최대 인원'),
              keyboardType: TextInputType.number,
              validator: (v) =>
                  (int.tryParse(v ?? '') ?? 0) > 0 ? null : '1 이상의 숫자를 입력하세요',
            ),
            TextFormField(
              controller: _locationNameController,
              decoration: const InputDecoration(labelText: '장소명'),
              validator: (v) => (v == null || v.isEmpty) ? '장소명을 입력하세요' : null,
            ),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _latController,
                    decoration: const InputDecoration(labelText: '위도'),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: TextFormField(
                    controller: _lngController,
                    decoration: const InputDecoration(labelText: '경도'),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            if (_errorMessage != null) ...[
              Text(_errorMessage!, style: const TextStyle(color: Colors.red)),
              const SizedBox(height: 8),
            ],
            ElevatedButton(
              onPressed: _isSubmitting ? null : _submit,
              child: _isSubmitting
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('만들기'),
            ),
          ],
        ),
      ),
    );
  }
}
