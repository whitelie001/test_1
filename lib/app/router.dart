import 'package:go_router/go_router.dart';

import '../features/group/presentation/screens/group_list_screen.dart';

/// 앱 전역 라우팅 설정.
///
/// 지금은 모임 목록(placeholder) 화면 하나만 연결되어 있다. 인증/모임 생성/
/// 세션/체크인 화면은 각 기능 구현 단계에서 라우트를 추가한다.
final GoRouter piumRouter = GoRouter(
  initialLocation: '/',
  routes: [
    GoRoute(
      path: '/',
      builder: (context, state) => const GroupListScreen(),
    ),
  ],
);
