class FeedAuthor {
  const FeedAuthor({required this.id, required this.nickname, this.profileImage});

  final String id;
  final String nickname;
  final String? profileImage;

  factory FeedAuthor.fromJson(Map<String, dynamic> json) {
    return FeedAuthor(
      id: json['id'] as String,
      nickname: json['nickname'] as String,
      profileImage: json['profile_image'] as String?,
    );
  }
}

class FeedMediaItem {
  const FeedMediaItem({required this.type, required this.url});

  final String type; // 'photo' | 'video'
  final String url;

  factory FeedMediaItem.fromJson(Map<String, dynamic> json) {
    return FeedMediaItem(type: json['type'] as String, url: json['url'] as String);
  }
}

class ReactionSummary {
  const ReactionSummary({required this.count, required this.myReaction});

  final int count;
  final bool myReaction;

  factory ReactionSummary.fromJson(Map<String, dynamic> json) {
    return ReactionSummary(
      count: json['count'] as int,
      myReaction: json['my_reaction'] as bool,
    );
  }
}

class FeedPost {
  const FeedPost({
    required this.id,
    required this.author,
    required this.media,
    this.text,
    required this.reactions,
    required this.createdAt,
  });

  final String id;
  final FeedAuthor author;
  final List<FeedMediaItem> media;
  final String? text;
  final Map<String, ReactionSummary> reactions;
  final DateTime createdAt;

  factory FeedPost.fromJson(Map<String, dynamic> json) {
    final reactionsJson = json['reactions'] as Map<String, dynamic>? ?? {};
    return FeedPost(
      id: json['id'] as String,
      author: FeedAuthor.fromJson(json['author'] as Map<String, dynamic>),
      media: (json['media'] as List)
          .map((m) => FeedMediaItem.fromJson(m as Map<String, dynamic>))
          .toList(),
      text: json['text'] as String?,
      reactions: reactionsJson.map(
        (key, value) => MapEntry(key, ReactionSummary.fromJson(value as Map<String, dynamic>)),
      ),
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}
