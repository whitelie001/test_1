import 'package:flutter/material.dart';

import '../network/api_exception.dart';

/// `FutureProvider`/`AsyncValue.when(error: ...)` 공통 에러 화면.
///
/// [PiumApiException]/[NetworkUnavailableException]은 이미 문서 12장 에러
/// 카탈로그에 대응하는 한국어 메시지를 담고 있으므로 그걸 그대로 보여준다.
/// 그 외(파싱 실패 등 예상 못한 예외)는 원문 대신 안내 문구로 대체해
/// `Instance of 'FormatException'` 같은 내부 타입 표기가 노출되지 않게 한다.
class ErrorView extends StatelessWidget {
  const ErrorView({super.key, required this.error});

  final Object error;

  static String messageFor(Object error) {
    return switch (error) {
      PiumApiException(:final message) => message,
      NetworkUnavailableException(:final message) => message,
      _ => '알 수 없는 오류가 발생했습니다',
    };
  }

  @override
  Widget build(BuildContext context) {
    return Center(child: Text(messageFor(error)));
  }
}
