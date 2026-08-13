/// 문서 1.4절 "피움 성장 7단계" 표를 그대로 옮긴 상수.
/// 내부적으로는 0~6 레벨(0=씨앗)로 다루고, API 응답에서는 `display_stage
/// = level + 1`로 문서의 "1~7단계" 표기와 맞춘다.
export const SEED_STAGE = { level: 0, name: '씨앗', icon: '🌱' } as const;

export interface SmallGroupStageThreshold {
  level: number;
  name: string;
  icon: string;
  attendanceRate: number; // 0~1
  streakCount: number;
  totalCount: number;
}

export interface LargeGroupStageThreshold {
  level: number;
  name: string;
  icon: string;
  cumulativeMembers: number;
  meetingCount: number;
  attendanceRate: number; // 0~1
}

export const SMALL_GROUP_STAGE_THRESHOLDS: SmallGroupStageThreshold[] = [
  { level: 1, name: '새싹', icon: '🌿', attendanceRate: 0.6, streakCount: 2, totalCount: 5 },
  { level: 2, name: '묘목', icon: '🪴', attendanceRate: 0.65, streakCount: 4, totalCount: 12 },
  { level: 3, name: '나무', icon: '🌳', attendanceRate: 0.7, streakCount: 6, totalCount: 25 },
  { level: 4, name: '큰나무', icon: '🌲', attendanceRate: 0.75, streakCount: 9, totalCount: 40 },
  { level: 5, name: '숲', icon: '🌲🌲', attendanceRate: 0.8, streakCount: 12, totalCount: 60 },
  { level: 6, name: '울창한숲', icon: '🌳🌲🌳', attendanceRate: 0.9, streakCount: 20, totalCount: 100 },
];

export const LARGE_GROUP_STAGE_THRESHOLDS: LargeGroupStageThreshold[] = [
  { level: 1, name: '새싹', icon: '🌿', cumulativeMembers: 50, meetingCount: 4, attendanceRate: 0.5 },
  { level: 2, name: '묘목', icon: '🪴', cumulativeMembers: 130, meetingCount: 10, attendanceRate: 0.55 },
  { level: 3, name: '나무', icon: '🌳', cumulativeMembers: 300, meetingCount: 20, attendanceRate: 0.6 },
  { level: 4, name: '큰나무', icon: '🌲', cumulativeMembers: 600, meetingCount: 35, attendanceRate: 0.6 },
  { level: 5, name: '숲', icon: '🌲🌲', cumulativeMembers: 1000, meetingCount: 55, attendanceRate: 0.65 },
  { level: 6, name: '울창한숲', icon: '🌳🌲🌳', cumulativeMembers: 1800, meetingCount: 80, attendanceRate: 0.7 },
];
