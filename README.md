# pium (피움)

운동 모임(GPS 체크인)으로 모임이 함께 성장하는 헬스케어/웰니스 Flutter 앱.

## 개발 계획

전체 계획(데이터 모델, 성장 포인트 공식, 로드맵)은
`/root/.claude/plans/api-elegant-hinton.md` 참고.

## 지금까지 구현된 것 (Phase 0 + Phase 4)

- Flutter 프로젝트 스캐폴드 (`flutter create`, Riverpod/go_router/Firebase/geolocator 의존성)
- 순수 Dart 도메인 로직 + 단위테스트 (Firebase 없이 `flutter test`로 검증 가능)
  - `lib/features/checkin/domain/growth_point_calculator.dart` — 체크인 시간 → 성장 포인트
  - `lib/features/checkin/domain/checkin_duration_calculator.dart` — 체크인/체크아웃 시간 클램프
  - `lib/features/checkin/domain/distance_calculator.dart` — GPS 반경 판정
  - `lib/features/group/domain/growth_stage_resolver.dart` + `growth_stage_config.dart` — 5단계 성장 판정 (임계값/이모지는 TODO, 후속 작업)
- 최소 앱 셸 (`lib/main.dart`, `lib/app/app.dart`, `lib/app/router.dart`) + placeholder 모임 목록 화면

## 다음에 할 일 (사용자 준비 필요)

1. **Firebase 프로젝트 생성** 후 `flutterfire configure` 실행 → `lib/main.dart`에
   `Firebase.initializeApp()` 연결
2. **카카오맵 API 키 발급** (개발자 사이트에서) → 지도 SDK 연동 방식(A: 커뮤니티
   패키지 / B: WebView+JS SDK) 스파이크 진행
3. 모임/세션/체크인 Firestore repository 및 Cloud Functions(`checkIn`/`checkOut`) 구현
4. 성장 단계별 임계값 및 이모지/캐릭터 디자인 확정

## 개발 환경

```bash
flutter pub get
flutter analyze
flutter test
```
