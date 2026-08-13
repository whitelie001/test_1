import 'package:dio/dio.dart';

import '../../../core/network/api_client.dart';
import '../domain/feed_post.dart';

class CalendarResult {
  const CalendarResult({required this.feedDates});
  final List<String> feedDates;

  factory CalendarResult.fromJson(Map<String, dynamic> json) {
    return CalendarResult(
      feedDates: (json['feed_dates'] as List).cast<String>(),
    );
  }
}

/// `/meetups/{id}/feed`, `/feed/{id}`, `/meetups/{id}/calendar` REST 래퍼.
class FeedRepository {
  FeedRepository({required this.apiClient});

  final ApiClient apiClient;

  Future<List<FeedPost>> listFeed(String meetupId, {String? date, int page = 1}) async {
    final response = await apiClient.get(
      '/meetups/$meetupId/feed',
      queryParameters: {if (date != null) 'date': date, 'page': page},
    );
    final posts = (response as Map<String, dynamic>)['posts'] as List;
    return posts.map((p) => FeedPost.fromJson(p as Map<String, dynamic>)).toList();
  }

  Future<CalendarResult> getCalendar(String meetupId, {required int year, required int month}) async {
    final response = await apiClient.get(
      '/meetups/$meetupId/calendar',
      queryParameters: {'year': year, 'month': month},
    );
    return CalendarResult.fromJson(response as Map<String, dynamic>);
  }

  /// [filePaths]는 로컬 파일 경로(사진 최대 10장, 또는 영상 1개)이다.
  Future<String> createPost(String meetupId, {String? text, List<String> filePaths = const []}) async {
    final formData = FormData.fromMap({
      if (text != null) 'text': text,
      'media': [
        for (final path in filePaths) await MultipartFile.fromFile(path),
      ],
    });
    final response = await apiClient.post('/meetups/$meetupId/feed', data: formData);
    return (response as Map<String, dynamic>)['post_id'] as String;
  }

  Future<void> deletePost(String postId) async {
    await apiClient.delete('/feed/$postId');
  }

  Future<ReactionSummary> toggleReaction(String postId, String emoji) async {
    final response = await apiClient.post(
      '/feed/$postId/reactions',
      data: {'emoji': emoji},
    );
    return ReactionSummary.fromJson(response as Map<String, dynamic>);
  }
}
