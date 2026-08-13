import 'package:go_router/go_router.dart';

import '../features/auth/presentation/screens/login_screen.dart';
import '../features/checkin/presentation/screens/checkin_screen.dart';
import '../features/group/presentation/screens/group_create_screen.dart';
import '../features/group/presentation/screens/group_detail_screen.dart';
import '../features/group/presentation/screens/group_list_screen.dart';
import '../features/ranking/presentation/screens/ranking_screen.dart';

/// 앱 전역 라우팅 설정.
///
/// 피드/이벤트/알림 등 나머지 화면은 각 기능 구현 단계에서 라우트를
/// 추가한다. 로그인 상태에 따른 자동 리다이렉트(redirect)는 사용자 세션
/// 확인 로직이 붙는 다음 단계에서 도입한다 — 지금은 로그인 성공 시 명시적
/// `context.go('/')` 로 전환한다.
final GoRouter piumRouter = GoRouter(
  initialLocation: '/login',
  routes: [
    GoRoute(
      path: '/login',
      builder: (context, state) => LoginScreen(
        onLoggedIn: () => piumRouter.go('/'),
      ),
    ),
    GoRoute(
      path: '/',
      builder: (context, state) => GroupListScreen(
        onCreatePressed: () => piumRouter.push('/meetups/new'),
        onMeetupTap: (id) => piumRouter.push('/meetups/$id'),
        onRankingsPressed: () => piumRouter.push('/rankings'),
      ),
    ),
    GoRoute(
      path: '/rankings',
      builder: (context, state) => const RankingScreen(),
    ),
    GoRoute(
      path: '/meetups/new',
      builder: (context, state) => GroupCreateScreen(
        onCreated: (id) {
          piumRouter.pop();
          piumRouter.push('/meetups/$id');
        },
      ),
    ),
    GoRoute(
      path: '/meetups/:id',
      builder: (context, state) => GroupDetailScreen(
        meetupId: state.pathParameters['id']!,
      ),
    ),
    GoRoute(
      path: '/meetups/:id/checkin',
      builder: (context, state) => CheckinScreen(
        meetupId: state.pathParameters['id']!,
        targetLat: double.parse(state.uri.queryParameters['lat']!),
        targetLng: double.parse(state.uri.queryParameters['lng']!),
      ),
    ),
  ],
);
