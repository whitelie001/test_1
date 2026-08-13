class PiumEvent {
  const PiumEvent({
    required this.id,
    required this.name,
    required this.type,
    required this.status,
    required this.startDate,
    this.endDate,
    this.requiredGrowthLevel,
    this.requiredAttendanceCount,
    required this.siteUrl,
  });

  final String id;
  final String name;
  final String type; // 'league' | 'festival' | 'sponsor'
  final String status;
  final DateTime startDate;
  final DateTime? endDate;
  final int? requiredGrowthLevel;
  final int? requiredAttendanceCount;
  final String siteUrl;

  factory PiumEvent.fromJson(Map<String, dynamic> json) {
    return PiumEvent(
      id: json['id'] as String,
      name: json['name'] as String,
      type: json['type'] as String,
      status: json['status'] as String,
      startDate: DateTime.parse(json['start_date'] as String),
      endDate: json['end_date'] == null ? null : DateTime.parse(json['end_date'] as String),
      requiredGrowthLevel: json['required_growth_level'] as int?,
      requiredAttendanceCount: json['required_attendance_count'] as int?,
      siteUrl: json['site_url'] as String,
    );
  }
}

class EventEligibility {
  const EventEligibility({
    required this.eligible,
    required this.growthLevel,
    required this.attendanceCount,
    required this.reasons,
  });

  final bool eligible;
  final int growthLevel;
  final int attendanceCount;
  final List<String> reasons;

  factory EventEligibility.fromJson(Map<String, dynamic> json) {
    return EventEligibility(
      eligible: json['eligible'] as bool,
      growthLevel: json['growth_level'] as int,
      attendanceCount: json['attendance_count'] as int,
      reasons: (json['reasons'] as List).cast<String>(),
    );
  }
}

class EventToken {
  const EventToken({required this.eventToken, required this.expiresIn, required this.redirectUrl});

  final String eventToken;
  final int expiresIn;
  final String redirectUrl;

  factory EventToken.fromJson(Map<String, dynamic> json) {
    return EventToken(
      eventToken: json['event_token'] as String,
      expiresIn: json['expires_in'] as int,
      redirectUrl: json['redirect_url'] as String,
    );
  }
}
