import 'package:go_router/go_router.dart';

import '../features/auth/presentation/screens/login_screen.dart';
import '../features/group/presentation/screens/group_list_screen.dart';

/// 앱 전역 라우팅 설정.
///
/// 모임 CRUD/체크인/성장 등 나머지 화면은 각 기능 구현 단계에서 라우트를
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
      builder: (context, state) => const GroupListScreen(),
    ),
  ],
);
