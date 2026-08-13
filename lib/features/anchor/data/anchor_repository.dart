import '../../../core/network/api_client.dart';

class AnchorActivateResult {
  const AnchorActivateResult({
    required this.anchorId,
    required this.activatedAt,
    required this.expiresAt,
  });

  final String anchorId;
  final DateTime activatedAt;
  final DateTime expiresAt;

  factory AnchorActivateResult.fromJson(Map<String, dynamic> json) {
    return AnchorActivateResult(
      anchorId: json['anchor_id'] as String,
      activatedAt: DateTime.parse(json['activated_at'] as String),
      expiresAt: DateTime.parse(json['expires_at'] as String),
    );
  }
}

/// 팀장 앵커 모드(`/meetups/{id}/anchor/activate`, `/anchors/{id}/location`) REST 래퍼.
class AnchorRepository {
  AnchorRepository({required this.apiClient});

  final ApiClient apiClient;

  Future<AnchorActivateResult> activate(
    String meetupId, {
    required double lat,
    required double lng,
  }) async {
    final response = await apiClient.post(
      '/meetups/$meetupId/anchor/activate',
      data: {'lat': lat, 'lng': lng},
    );
    return AnchorActivateResult.fromJson(response as Map<String, dynamic>);
  }

  Future<void> updateLocation(
    String anchorId, {
    required double lat,
    required double lng,
  }) async {
    await apiClient.put(
      '/anchors/$anchorId/location',
      data: {'lat': lat, 'lng': lng},
    );
  }
}
