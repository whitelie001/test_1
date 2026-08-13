import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';

class _StubbedResponse {
  _StubbedResponse(this.statusCode, this.body);
  final int statusCode;
  final Map<String, dynamic> body;
}

/// 실제 네트워크 없이 [ApiClient]/[AuthRepository] 통합 흐름(인터셉터,
/// 401→refresh 재시도 등)을 검증하기 위한 테스트 전용 어댑터.
/// 등록되지 않은 요청은 예외를 던져 테스트가 무엇을 놓쳤는지 바로 드러낸다.
class FakeHttpClientAdapter implements HttpClientAdapter {
  final Map<String, List<_StubbedResponse>> _stubs = {};
  final List<RequestOptions> requests = [];

  String _key(String method, String path) => '${method.toUpperCase()} $path';

  /// [path]에 대한 응답을 큐에 등록한다. 같은 (method, path)에 여러 번
  /// 호출하면 순서대로 소비된다(예: 첫 호출은 401, 두 번째는 200).
  void whenRequest(
    String method,
    String path, {
    required int statusCode,
    required Map<String, dynamic> body,
  }) {
    _stubs.putIfAbsent(_key(method, path), () => []).add(
          _StubbedResponse(statusCode, body),
        );
  }

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    requests.add(options);
    final key = _key(options.method, options.path);
    final queue = _stubs[key];
    if (queue == null || queue.isEmpty) {
      throw StateError('스텁이 등록되지 않은 요청: $key');
    }
    final stub = queue.removeAt(0);
    return ResponseBody.fromString(
      jsonEncode(stub.body),
      stub.statusCode,
      headers: {
        'content-type': ['application/json'],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}
