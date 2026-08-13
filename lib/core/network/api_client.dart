import 'package:dio/dio.dart';

import 'api_exception.dart';
import 'token_storage.dart';

/// 백엔드 REST API(`{success,data,error,meta}` 래퍼) 통신을 담당하는 클라이언트.
///
/// - 모든 요청에 저장된 access token을 자동으로 첨부한다.
/// - 응답을 언래핑해 `data`만 돌려주고, 실패 시 [PiumApiException]을 던진다.
/// - `TOKEN_EXPIRED` 에러를 받으면 refresh token으로 1회 자동 재시도한다.
class ApiClient {
  ApiClient({
    required String baseUrl,
    required this.tokenStorage,
    Dio? dio,
  }) : _dio = dio ?? Dio(BaseOptions(baseUrl: baseUrl)) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await tokenStorage.readAccessToken();
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
      ),
    );
  }

  final Dio _dio;
  final TokenStorage tokenStorage;

  Future<dynamic> get(String path, {Map<String, dynamic>? queryParameters}) {
    return _request('GET', path, queryParameters: queryParameters);
  }

  Future<dynamic> post(String path, {dynamic data}) {
    return _request('POST', path, data: data);
  }

  Future<dynamic> put(String path, {dynamic data}) {
    return _request('PUT', path, data: data);
  }

  Future<dynamic> delete(String path, {dynamic data}) {
    return _request('DELETE', path, data: data);
  }

  Future<dynamic> _request(
    String method,
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    bool isRetry = false,
  }) async {
    try {
      final response = await _dio.request(
        path,
        data: data,
        queryParameters: queryParameters,
        options: Options(method: method),
      );
      return unwrapEnvelope(response.data);
    } on DioException catch (e) {
      final body = e.response?.data;
      if (body is! Map) {
        throw const NetworkUnavailableException();
      }

      final exception = PiumApiException.fromJson(
        Map<String, dynamic>.from(body['error'] as Map),
      );

      if (exception.code == 'TOKEN_EXPIRED' && !isRetry) {
        final refreshed = await _tryRefresh();
        if (refreshed) {
          return _request(
            method,
            path,
            data: data,
            queryParameters: queryParameters,
            isRetry: true,
          );
        }
      }
      throw exception;
    }
  }

  Future<bool> _tryRefresh() async {
    final refreshToken = await tokenStorage.readRefreshToken();
    if (refreshToken == null) return false;

    try {
      final response = await _dio.post(
        '/auth/refresh',
        data: {'refresh_token': refreshToken},
      );
      final result = unwrapEnvelope(response.data) as Map<String, dynamic>;
      await tokenStorage.saveTokens(
        accessToken: result['access_token'] as String,
        refreshToken: result['refresh_token'] as String,
      );
      return true;
    } catch (_) {
      await tokenStorage.clear();
      return false;
    }
  }
}

/// `{success, data, error}` 응답 바디를 언래핑한다. 성공이면 data를,
/// 실패면 [PiumApiException]을 던진다. Dio 의존성이 없는 순수 함수라
/// [ApiClient] 없이도 단위테스트할 수 있다.
dynamic unwrapEnvelope(dynamic body) {
  if (body is! Map) {
    throw const NetworkUnavailableException('알 수 없는 응답 형식입니다');
  }
  if (body['success'] == true) {
    return body['data'];
  }
  throw PiumApiException.fromJson(
    Map<String, dynamic>.from(body['error'] as Map),
  );
}
