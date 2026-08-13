/// 성장 단계(0~6) → 이모지. 문서 1.4절 표 기준, 소/대모임 공통(이름/아이콘은
/// 유형에 상관없이 단계별로 동일하다).
///
/// 성장 단계 자체는 서버(`GET /meetups/{id}/growth`)가 계산한 결과를 그대로
/// 쓰므로, 클라이언트는 원시 지표로 단계를 재계산할 필요가 없다 — 이 맵은
/// 응답에 아이콘이 포함되어 있지 않아 마스코트 UI를 그리기 위한 조회용이다.
const growthStageIcons = <int, String>{
  0: '🌱',
  1: '🌿',
  2: '🪴',
  3: '🌳',
  4: '🌲',
  5: '🌲🌲',
  6: '🌳🌲🌳',
};

String iconForGrowthLevel(int level) => growthStageIcons[level] ?? growthStageIcons[0]!;
