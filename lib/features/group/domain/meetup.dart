import 'meetup_type_classifier.dart';

/// 운동 모임. 백엔드 `GET /meetups`, `GET /meetups/{id}` 응답에 대응.
class Meetup {
  const Meetup({
    required this.id,
    required this.hostId,
    required this.name,
    required this.sport,
    this.description,
    required this.meetupType,
    required this.maxMembers,
    required this.currentMembers,
    required this.lat,
    required this.lng,
    required this.locationName,
    this.level,
    this.fee,
  });

  final String id;
  final String hostId;
  final String name;
  final String sport;
  final String? description;
  final MeetupType meetupType;
  final int maxMembers;
  final int currentMembers;
  final double lat;
  final double lng;
  final String locationName;
  final String? level;
  final int? fee;

  bool get isFull => currentMembers >= maxMembers;

  factory Meetup.fromJson(Map<String, dynamic> json) {
    return Meetup(
      id: json['id'] as String,
      hostId: json['hostId'] as String,
      name: json['name'] as String,
      sport: json['sport'] as String,
      description: json['description'] as String?,
      meetupType: json['meetupType'] == 'large' ? MeetupType.large : MeetupType.small,
      maxMembers: json['maxMembers'] as int,
      currentMembers: json['currentMembers'] as int,
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
      locationName: json['locationName'] as String,
      level: json['level'] as String?,
      fee: json['fee'] as int?,
    );
  }
}
