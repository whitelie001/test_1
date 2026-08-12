import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app/app.dart';

// TODO: Firebase 프로젝트 연결 후 `flutterfire configure`로 생성되는
// firebase_options.dart를 임포트하고 Firebase.initializeApp(options: ...)을
// 여기서 호출해야 한다 (Phase 0의 나머지 절반 — Firebase 프로젝트 자체는
// 사용자 계정으로 생성해야 하므로 이 세션에서는 대신 진행할 수 없음).
void main() {
  runApp(const ProviderScope(child: PiumApp()));
}
