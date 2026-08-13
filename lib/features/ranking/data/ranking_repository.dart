import '../../../core/network/api_client.dart';

class RankingEntry {
  const RankingEntry({
    required this.rank,
    required this.meetupId,
    required this.name,
    required this.score,
    required this.growthLevel,
    required this.change,
  });

  final int rank;
  final String meetupId;
  final String name;
  final num score;
  final int growthLevel;
  final int change;

  factory RankingEntry.fromJson(Map<String, dynamic> json) {
    return RankingEntry(
      rank: json['rank'] as int,
      meetupId: json['meetup_id'] as String,
      name: json['name'] as String,
      score: json['score'] as num,
      growthLevel: json['growth_level'] as int,
      change: json['change'] as int,
    );
  }
}

/// `/rankings/*` REST 래퍼. 문서 8장 기준.
class RankingRepository {
  RankingRepository({required this.apiClient});

  final ApiClient apiClient;

  Future<List<RankingEntry>> national({String? sport, int page = 1}) async {
    final response = await apiClient.get(
      '/rankings/national',
      queryParameters: {if (sport != null) 'sport': sport, 'page': page},
    );
    final rankings = (response as Map<String, dynamic>)['rankings'] as List;
    return rankings.map((j) => RankingEntry.fromJson(j as Map<String, dynamic>)).toList();
  }

  Future<List<RankingEntry>> bySport(String sport, {int page = 1}) async {
    final response = await apiClient.get(
      '/rankings/sport',
      queryParameters: {'sport': sport, 'page': page},
    );
    final rankings = (response as Map<String, dynamic>)['rankings'] as List;
    return rankings.map((j) => RankingEntry.fromJson(j as Map<String, dynamic>)).toList();
  }
}
