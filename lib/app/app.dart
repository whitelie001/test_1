import 'package:flutter/material.dart';

import 'router.dart';

/// pium 앱의 최상위 위젯. 라우팅/테마 설정을 담당한다.
class PiumApp extends StatelessWidget {
  const PiumApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'pium',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorSchemeSeed: const Color(0xFF50C878),
        useMaterial3: true,
      ),
      routerConfig: piumRouter,
    );
  }
}
