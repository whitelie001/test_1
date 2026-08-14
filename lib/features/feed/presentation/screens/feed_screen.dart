import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../core/network/api_exception.dart';
import '../../../../core/widgets/error_view.dart';
import '../../domain/reaction_emojis.dart';
import '../feed_providers.dart';

/// 모임 활동 피드 화면 (문서 9.2절). 사진 선택은 [image_picker]로 처리하고,
/// 영상 업로드/달력 뷰는 이후 반복에서 추가한다.
class FeedScreen extends ConsumerStatefulWidget {
  const FeedScreen({super.key, required this.meetupId});

  final String meetupId;

  @override
  ConsumerState<FeedScreen> createState() => _FeedScreenState();
}

class _FeedScreenState extends ConsumerState<FeedScreen> {
  final _textController = TextEditingController();
  final _picker = ImagePicker();
  final List<XFile> _selectedPhotos = [];
  bool _isPosting = false;

  @override
  void dispose() {
    _textController.dispose();
    super.dispose();
  }

  Future<void> _pickPhotos() async {
    final images = await _picker.pickMultiImage(limit: 10);
    setState(() => _selectedPhotos
      ..clear()
      ..addAll(images));
  }

  Future<void> _submitPost() async {
    if (_textController.text.isEmpty && _selectedPhotos.isEmpty) return;
    setState(() => _isPosting = true);
    try {
      await ref.read(feedRepositoryProvider).createPost(
            widget.meetupId,
            text: _textController.text.isEmpty ? null : _textController.text,
            filePaths: _selectedPhotos.map((f) => f.path).toList(),
          );
      _textController.clear();
      setState(() => _selectedPhotos.clear());
      ref.invalidate(feedListProvider(widget.meetupId));
    } on PiumApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
      }
    } finally {
      if (mounted) setState(() => _isPosting = false);
    }
  }

  Future<void> _toggleReaction(String postId, String emoji) async {
    await ref.read(feedRepositoryProvider).toggleReaction(postId, emoji);
    ref.invalidate(feedListProvider(widget.meetupId));
  }

  @override
  Widget build(BuildContext context) {
    final feedAsync = ref.watch(feedListProvider(widget.meetupId));

    return Scaffold(
      appBar: AppBar(title: const Text('활동 피드')),
      body: Column(
        children: [
          Expanded(
            child: feedAsync.when(
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (error, stackTrace) => ErrorView(error: error),
              data: (posts) {
                if (posts.isEmpty) {
                  return const Center(child: Text('아직 활동 기록이 없어요.'));
                }
                return ListView.builder(
                  itemCount: posts.length,
                  itemBuilder: (context, index) {
                    final post = posts[index];
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(post.author.nickname, style: const TextStyle(fontWeight: FontWeight.bold)),
                            if (post.text != null) ...[
                              const SizedBox(height: 4),
                              Text(post.text!),
                            ],
                            if (post.media.isNotEmpty) ...[
                              const SizedBox(height: 8),
                              SizedBox(
                                height: 96,
                                child: ListView.separated(
                                  scrollDirection: Axis.horizontal,
                                  itemCount: post.media.length,
                                  separatorBuilder: (context, index) => const SizedBox(width: 8),
                                  itemBuilder: (context, i) => ClipRRect(
                                    borderRadius: BorderRadius.circular(8),
                                    child: Image.network(post.media[i].url, width: 96, height: 96, fit: BoxFit.cover),
                                  ),
                                ),
                              ),
                            ],
                            const SizedBox(height: 8),
                            Wrap(
                              spacing: 4,
                              children: allowedReactionEmojis.map((emoji) {
                                final summary = post.reactions[emoji];
                                final isActive = summary?.myReaction ?? false;
                                return ActionChip(
                                  label: Text('$emoji ${summary?.count ?? ''}'),
                                  backgroundColor: isActive ? Theme.of(context).colorScheme.primaryContainer : null,
                                  onPressed: () => _toggleReaction(post.id, emoji),
                                );
                              }).toList(),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(8),
              child: Column(
                children: [
                  if (_selectedPhotos.isNotEmpty)
                    Align(
                      alignment: Alignment.centerLeft,
                      child: Text('사진 ${_selectedPhotos.length}장 선택됨'),
                    ),
                  Row(
                    children: [
                      IconButton(onPressed: _pickPhotos, icon: const Icon(Icons.photo_outlined)),
                      Expanded(
                        child: TextField(
                          controller: _textController,
                          decoration: const InputDecoration(hintText: '오늘 운동 어땠나요?'),
                        ),
                      ),
                      IconButton(
                        onPressed: _isPosting ? null : _submitPost,
                        icon: const Icon(Icons.send),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
