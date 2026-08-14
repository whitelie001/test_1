class PiumScoreBreakdown {
  const PiumScoreBreakdown({required this.attendance, required this.streak, required this.events});

  final num attendance;
  final num streak;
  final num events;

  factory PiumScoreBreakdown.fromJson(Map<String, dynamic> json) {
    return PiumScoreBreakdown(
      attendance: json['attendance'] as num,
      streak: json['streak'] as num,
      events: json['events'] as num,
    );
  }
}

class PiumScoreSummary {
  const PiumScoreSummary({required this.totalScore, required this.thisMonth, required this.breakdown});

  final num totalScore;
  final num thisMonth;
  final PiumScoreBreakdown breakdown;

  factory PiumScoreSummary.fromJson(Map<String, dynamic> json) {
    return PiumScoreSummary(
      totalScore: json['total_score'] as num,
      thisMonth: json['this_month'] as num,
      breakdown: PiumScoreBreakdown.fromJson(json['breakdown'] as Map<String, dynamic>),
    );
  }
}

class UserBadge {
  const UserBadge({required this.id, required this.name, required this.icon, required this.earnedAt});

  final String id;
  final String name;
  final String icon;
  final DateTime earnedAt;

  factory UserBadge.fromJson(Map<String, dynamic> json) {
    return UserBadge(
      id: json['id'] as String,
      name: json['name'] as String,
      icon: json['icon'] as String,
      earnedAt: DateTime.parse(json['earned_at'] as String),
    );
  }
}

class ActivitySummary {
  const ActivitySummary({required this.totalCheckins, required this.meetupsJoined});

  final int totalCheckins;
  final int meetupsJoined;

  factory ActivitySummary.fromJson(Map<String, dynamic> json) {
    return ActivitySummary(
      totalCheckins: json['total_checkins'] as int,
      meetupsJoined: json['meetups_joined'] as int,
    );
  }
}

class UserProfile {
  const UserProfile({
    required this.id,
    required this.nickname,
    this.profileImage,
    required this.favoriteSports,
    required this.piumScore,
    required this.badges,
    required this.activitySummary,
  });

  final String id;
  final String nickname;
  final String? profileImage;
  final List<String> favoriteSports;
  final PiumScoreSummary piumScore;
  final List<UserBadge> badges;
  final ActivitySummary activitySummary;

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      id: json['id'] as String,
      nickname: json['nickname'] as String,
      profileImage: json['profile_image'] as String?,
      favoriteSports: (json['favorite_sports'] as List).cast<String>(),
      piumScore: PiumScoreSummary.fromJson(json['pium_score'] as Map<String, dynamic>),
      badges: (json['badges'] as List)
          .map((b) => UserBadge.fromJson(b as Map<String, dynamic>))
          .toList(),
      activitySummary: ActivitySummary.fromJson(json['activity_summary'] as Map<String, dynamic>),
    );
  }
}

class UserStats {
  const UserStats({required this.attendedDates, required this.sportRatio});

  final List<String> attendedDates;
  final Map<String, num> sportRatio;

  factory UserStats.fromJson(Map<String, dynamic> json) {
    final heatmap = json['heatmap'] as List;
    final sportRatio = json['sport_ratio'] as Map<String, dynamic>;
    return UserStats(
      attendedDates: heatmap.map((h) => (h as Map<String, dynamic>)['date'] as String).toList(),
      sportRatio: sportRatio.map((key, value) => MapEntry(key, value as num)),
    );
  }
}
