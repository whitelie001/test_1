import '../../../core/network/api_client.dart';

class GrowthStatus {
  const GrowthStatus({
    required this.growthLevel,
    required this.growthName,
    required this.piumScore,
    required this.nextLevel,
    required this.progressPct,
    required this.attendanceRate,
    required this.streakCount,
    required this.totalCount,
  });

  final int growthLevel;
  final String growthName;
  final num piumScore;
  final int? nextLevel;
  final int progressPct;
  final double attendanceRate;
  final int streakCount;
  final int totalCount;

  factory GrowthStatus.fromJson(Map<String, dynamic> json) {
    return GrowthStatus(
      growthLevel: json['growth_level'] as int,
      growthName: json['growth_name'] as String,
      piumScore: json['pium_score'] as num,
      nextLevel: json['next_level'] as int?,
      progressPct: json['progress_pct'] as int,
      attendanceRate: (json['attendance_rate'] as num).toDouble(),
      streakCount: json['streak_count'] as int,
      totalCount: json['total_count'] as int,
    );
  }
}

class GrowthHistoryEntry {
  const GrowthHistoryEntry({required this.level, required this.name, required this.achievedAt});

  final int level;
  final String name;
  final DateTime achievedAt;

  factory GrowthHistoryEntry.fromJson(Map<String, dynamic> json) {
    return GrowthHistoryEntry(
      level: json['level'] as int,
      name: json['name'] as String,
      achievedAt: DateTime.parse(json['achieved_at'] as String),
    );
  }
}

/// `GET /meetups/{id}/growth`, `.../growth/history` REST 래퍼.
class GrowthRepository {
  GrowthRepository({required this.apiClient});

  final ApiClient apiClient;

  Future<GrowthStatus> getGrowth(String meetupId) async {
    final response = await apiClient.get('/meetups/$meetupId/growth');
    return GrowthStatus.fromJson(response as Map<String, dynamic>);
  }

  Future<List<GrowthHistoryEntry>> getGrowthHistory(String meetupId) async {
    final response = await apiClient.get('/meetups/$meetupId/growth/history');
    final history = (response as Map<String, dynamic>)['history'] as List;
    return history
        .map((json) => GrowthHistoryEntry.fromJson(json as Map<String, dynamic>))
        .toList();
  }
}
