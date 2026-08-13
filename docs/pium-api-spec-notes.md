# 피움 API 기획서 v1.0 — 엔지니어링 참고 정리본

> 원본: 사용자가 제공한 `1ced3871-___API____v1.0.docx` (2025년 4월,
> CONFIDENTIAL)을 텍스트로 추출/정리한 내용. 구현 시 상세 파라미터/응답
> 예시는 이 문서를 1차 참고하고, 애매한 부분은
> `/root/.claude/plans/api-elegant-hinton.md`의 "잠정 채택" 섹션을 따른다.
> 플랫폼은 문서상 React Native이나, 실제 구현은 **Flutter**로 진행한다
> (사용자 결정, 문서의 플랫폼 언급은 비구속적).

## 문서 메타

| 항목 | 내용 |
|---|---|
| 문서명 | 피움 앱 API 기획서 v1.0 |
| 작성일 | 2025년 4월 |
| 플랫폼(문서 원안) | iOS / Android (React Native) — **실제로는 Flutter 사용** |
| 백엔드 | REST API (Node.js / NestJS 예정) |
| DB | PostgreSQL(관계형) + Redis(캐시/실시간) |
| 지도 API | 카카오 지도 API |
| 인증 | JWT Access Token(1시간) + Refresh Token(30일) |
| 파일 저장 | AWS S3 |
| 알림 | FCM |
| Base URL | `https://api.pium.app/v1` (실 도메인 아직 없음, 플레이스홀더) |

## 1. 프로젝트 개요

피움(PIUM)은 운동 모임 중심 스포츠 커뮤니티. GPS 기반 출석 체크인으로
모임 활동을 기록하고, 참여도에 따라 모임이 씨앗→울창한숲으로 성장하는
'피움 시스템'으로 모임 지속성을 높인다. 오프라인 스포츠 이벤트 사업과
연계.

### 1.1 핵심 기능

| 기능 | 설명 |
|---|---|
| 모임 탐색 & 가입 | 카카오 지도 기반 주변 모임 탐색, 종목·지역·성장단계 필터 |
| GPS 출석 체크인 | 반경 100m 입장 + 1시간 체류 + 퇴장 인증. 팀장 앵커 모드 지원 |
| 피움 성장 시스템 | 7단계 성장(씨앗→울창한숲). 소/대모임 분리 복합 지표 |
| 월간 랭킹 | 전국·지역·종목별 모임 랭킹. 이벤트 연계 특별 랭킹 |
| 활동 공유 | 달력 메인 + 피드. 사진·영상 업로드, 이모지 반응 |
| 이벤트 연계 | 이벤트 사이트 SSO 연동, 참가 자격 데이터 제공 |

### 1.2 모임 유형 분류

| 구분 | 인원 기준 | 성장 지표 가중치 |
|---|---|---|
| 소모임 | 2~15명 | 출석률(40%) + 연속출석(30%) + 누적모임수(20%) + 인원채움률(10%) |
| 대모임 | 16명 이상 | 누적인원(35%) + 모임횟수(30%) + 출석률(25%) + 신규유입률(10%) |

### 1.3 피움 성장 7단계

| 단계 | 이름 | 아이콘 | 소모임 조건(전부 충족) | 대모임 조건(전부 충족) |
|---|---|---|---|---|
| 1 | 씨앗 | 🌱 | 모임 생성 시 | 모임 생성 시 |
| 2 | 새싹 | 🌿 | 출석률 60%+ / 연속 2회+ / 5회+ | 누적 50명+ / 4회+ / 출석 50%+ |
| 3 | 묘목 | 🪴 | 65%+ / 4회+ / 12회+ | 130명+ / 10회+ / 55%+ |
| 4 | 나무 | 🌳 | 70%+ / 6회+ / 25회+ | 300명+ / 20회+ / 60%+ |
| 5 | 큰나무 | 🌲 | 75%+ / 9회+ / 40회+ | 600명+ / 35회+ / 60%+ |
| 6 | 숲 | 🌲🌲 | 80%+ / 12회+ / 60회+ | 1,000명+ / 55회+ / 65%+ |
| 7 | 울창한숲 | 🌳🌲🌳 | 90%+ / 20회+ / 100회+ | 1,800명+ / 80회+ / 70%+ |

내부 구현은 level 0~6, API 응답에서 `display_stage = level+1`.

## 2. 공통 규격

- Content-Type: `application/json`
- 인증 헤더: `Authorization: Bearer {access_token}`
- 날짜: ISO 8601 (`2025-04-22T19:00:00Z`)
- 좌표: WGS84 (latitude, longitude)
- 페이지네이션: `?page=1&limit=20` (cursor 방식 병행)
- 응답 래퍼: `{ success, data, error, meta }`

```json
{ "success": true, "data": { }, "meta": { "page": 1, "total": 100 }, "error": null }
```

## 3. 인증 API

카카오 OAuth 기반. `POST /auth/kakao` { kakao_token, device_token? } →
{ access_token, refresh_token, user }. `POST /auth/refresh` { refresh_token }
→ { access_token, expires_in }. `POST /auth/logout`. `DELETE /auth/withdraw`
(전체 데이터 삭제 처리).

## 4. 사용자 API

- `GET /users/me` — 프로필 + 피움 점수 + 배지 + 운동 기록
- `PUT /users/me` — { nickname?, profile_image?, sports? }
- `GET /users/me/stats?year&month` — 월별 히트맵, 종목 비율
- `GET /users/me/badges`

## 5. 모임 API

- `GET /meetups?lat&lng&radius(기본5000)&sport&time_slot&level&growth_level&type&page&limit`
- `GET /meetups/{id}`
- `POST /meetups` { name, sport, description?, max_members, lat, lng,
  location_name, schedule, level?, fee? } — 15명 이하 소모임/16명+ 대모임
  자동 분류
- `PUT /meetups/{id}` / `DELETE /meetups/{id}` — 호스트만
- `POST /meetups/{id}/join` { message? } / `DELETE /meetups/{id}/leave`
- `GET /meetups/{id}/members?page`
- `PUT /meetups/{id}/members/{user_id}/role` { role: host|co_host|member }
- `GET /users/me/meetups?role`

## 6. GPS 체크인 API

흐름: 장소 도착 확인 → 입장 체크인 → 1시간 이상 체류 → 퇴장 체크인 → 출석 인정

### 6.1 기본 체크인 규칙

| 항목 | 규격 |
|---|---|
| 인정 반경 | 고정 장소 기준 100m 이내 |
| 체크인 방식 | 입장 + 퇴장 2회 필수 |
| 최소 체류 시간 | 1시간(3,600초) 이상 |
| 인정 시간대 | 당일 중 언제든 |
| 이탈 처리 | 타이머 일시정지 → 복귀 시 재개(이탈 시간 제외) |
| 앱 종료 처리 | 당일 자정까지 재접속 시 타이머 복원(서버 기록 기준) |
| 자정 초기화 | 날짜 변경 시 미완료 체크인 초기화 |

### 6.2 팀장 앵커 모드

| 항목 | 규격 |
|---|---|
| 대상 | 실내 장소/이동형 운동 |
| 앵커 반경 | 팀장 기기 기준 30m 이내 |
| 활성화 권한 | 호스트/공동호스트 |
| 활성화 시간 | 모임 시작 전후 30분 이내만 |
| 이탈 유예 | 앵커 범위 이탈 후 30초 유예 → 타이머 일시정지 |
| 페일오버 | 팀장 연결 끊김 → 부팀장 앵커 자동 승계 |

### 6.3 엔드포인트

- `POST /meetups/{id}/checkin/enter` { lat, lng, anchor_mode? } → { checkin_id, entered_at, status }
- `PUT /checkins/{checkin_id}/location` (30초 주기) { lat, lng, is_anchor? } → { status, elapsed_seconds, is_in_range }
- `POST /checkins/{checkin_id}/exit` { lat, lng } → { status, total_seconds, pium_score_earned, attendance_confirmed } (최소 1시간 체류 필요)
- `GET /checkins/{checkin_id}/status` — 앱 재시작 복원용
- `POST /meetups/{id}/anchor/activate` { lat, lng } → { anchor_id, activated_at, expires_at }
- `PUT /anchors/{anchor_id}/location` (10초 주기) { lat, lng }
- `GET /meetups/{id}/attendance?year&month`

## 7. 피움 성장 API

- `GET /meetups/{id}/growth` → { growth_level, growth_name, pium_score, next_level, progress_pct, attendance_rate, streak_count, total_count }
- `GET /meetups/{id}/growth/history` → 단계 달성 이력
- `GET /users/me/pium-score` → { total_score, this_month, breakdown:{attendance,streak,events} }

## 8. 랭킹 API

매월 1일 초기화, 말일 23:59 최종 확정.

- `GET /rankings/national?sport&page`
- `GET /rankings/regional?region&sport`
- `GET /rankings/sport?sport&page`
- `GET /rankings/my-meetup`

## 9. 활동 공유 API

- `GET /meetups/{id}/calendar?year&month` → 일정 + 피드 유무
- `GET /meetups/{id}/feed?date&page`
- `POST /meetups/{id}/feed` { text?, media?[] } (사진 최대 10장 또는 영상 1개 최대 60초)
- `DELETE /feed/{post_id}` — 작성자/호스트만
- `POST /feed/{post_id}/reactions` { emoji: 🔥/👍/😄/👏/🏆/❤️/💪/😮 } — 토글

## 10. 이벤트 API

별도 사이트(pium-events.com 예정), 피움 앱과 SSO 계정/데이터 공유.
유형: league(리그/토너먼트, 성장단계 기반 시드) / festival(지역 축제) /
sponsor(B2B).

- `GET /events?type&status`
- `GET /events/{id}` → { required_growth_level, required_attendance_count, site_url, ... }
- `GET /users/me/event-eligibility/{event_id}` → { eligible, growth_level, attendance_count, reasons }
- `GET /users/me/event-token` → { event_token, expires_in(300s), redirect_url }

## 11. 알림 API

- `GET /notifications?is_read&page`
- `PUT /notifications/{id}/read` / `PUT /notifications/read-all`

### 11.1 알림 유형 7종

| type | 발생 시점 |
|---|---|
| checkin_reminder | 모임 시작 30분 전 |
| growth_achieved | 성장 단계 달성 시 |
| ranking_change | 주간 랭킹 변동 |
| new_member | 새 멤버 가입 |
| event_notice | 이벤트 공지 |
| anchor_disconnected | 팀장 앵커 끊김 |
| checkin_completed | 출석 완료 |

## 12. 에러 코드

| HTTP | 코드 | 메시지 |
|---|---|---|
| 400 | INVALID_LOCATION | 유효하지 않은 좌표입니다 |
| 400 | OUT_OF_RANGE | 모임 장소 반경 밖입니다 |
| 400 | INSUFFICIENT_STAY | 체류 시간이 부족합니다 |
| 400 | CHECKIN_ALREADY_ACTIVE | 이미 진행 중인 체크인이 있습니다 |
| 401 | UNAUTHORIZED | 인증이 필요합니다 |
| 401 | TOKEN_EXPIRED | 토큰이 만료됐습니다 |
| 403 | FORBIDDEN | 권한이 없습니다 |
| 403 | NOT_MEMBER | 모임 멤버가 아닙니다 |
| 403 | ANCHOR_NOT_AUTHORIZED | 앵커 모드 권한이 없습니다 |
| 404 | MEETUP_NOT_FOUND | 모임을 찾을 수 없습니다 |
| 404 | CHECKIN_NOT_FOUND | 체크인 기록이 없습니다 |
| 409 | MEETUP_FULL | 모임 정원이 가득 찼습니다 |
| 422 | ANCHOR_TIME_EXCEEDED | 앵커 활성화 가능 시간이 초과됐습니다 |
| 500 | INTERNAL_ERROR | 서버 오류가 발생했습니다 |

## 13. 부록 — 사업 구조 (참고용, 구현 범위 아님)

앱(피움)은 GPS 출석·성장·랭킹으로 리텐션을 확보하는 일상 운동 모임
플랫폼, 이벤트 사이트는 별도 운영되며 SSO/성장단계 시드/랭킹 초청권으로
연계. 수익 모델 미정.

## 문서에 없어 구현 시 별도로 결정/잠정 채택한 사항

자세한 내용과 근거는 `/root/.claude/plans/api-elegant-hinton.md` 참고. 요약:

- **세션(회차) 엔티티**: 문서에 명시 없음 — 연속출석/모임횟수 계산을 위해
  체크인 입장 시 당일 세션을 지연 생성하는 방식으로 내부 설계.
- **성장 복합점수 정규화 방법**: 문서에 없음 — `min(raw/7단계임계값, 1.0)`
  가중합으로 잠정 채택.
- **체크인 퇴장 시 `pium_score_earned` 계산식**: 문서엔 예시값(8점)만 있고
  공식 없음 — 1시간 기본 점수 + 30분 단위 보너스로 잠정 설계.
- **이벤트 사이트 인증 모델**: 사용자가 "아직 결정하지 않음"으로 보류.
