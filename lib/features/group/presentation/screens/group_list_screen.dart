import 'package:flutter/material.dart';

/// 운동 모임 목록 화면 (placeholder).
///
/// 현재는 스캐폴드 단계로, Firestore 연동(모임 CRUD)은 다음 개발 단계에서
/// `GroupRepository`를 통해 붙일 예정이다.
class GroupListScreen extends StatelessWidget {
  const GroupListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('pium')),
      body: const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Text(
            '운동 모임이 아직 없어요.\n모임을 만들고 함께 성장시켜 보세요!',
            textAlign: TextAlign.center,
          ),
        ),
      ),
    );
  }
}
