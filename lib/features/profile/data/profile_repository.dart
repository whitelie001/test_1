import '../../../core/network/api_client.dart';
import '../domain/user_profile.dart';

/// `/users/me`, `/users/me/stats`, `/users/me/badges`, `/users/me/pium-score` REST 래퍼.
class ProfileRepository {
  ProfileRepository({required this.apiClient});

  final ApiClient apiClient;

  Future<UserProfile> getProfile() async {
    final response = await apiClient.get('/users/me');
    return UserProfile.fromJson(response as Map<String, dynamic>);
  }

  Future<UserProfile> updateProfile({String? nickname, List<String>? sports}) async {
    await apiClient.put(
      '/users/me',
      data: {
        if (nickname != null) 'nickname': nickname,
        if (sports != null) 'sports': sports,
      },
    );
    return getProfile();
  }

  Future<UserStats> getStats({int? year, int? month}) async {
    final response = await apiClient.get(
      '/users/me/stats',
      queryParameters: {if (year != null) 'year': year, if (month != null) 'month': month},
    );
    return UserStats.fromJson(response as Map<String, dynamic>);
  }
}
