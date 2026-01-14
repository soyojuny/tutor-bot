export type ActivityStatus = 'pending' | 'in_progress' | 'completed' | 'verified';
export type ActivityCategory = 'homework' | 'reading' | 'problem-solving' | 'practice' | 'other';
export type ActivityFrequency = 'once' | 'weekdays' | 'daily';
export type CompletionStatus = 'completed' | 'verified';

export interface Activity {
  id: string;
  title: string;
  description?: string;
  category: ActivityCategory;
  points_value: number;
  assigned_to?: string;
  created_by?: string;
  status: ActivityStatus;
  due_date?: string;
  completed_at?: string;
  verified_at?: string;
  verified_by?: string;
  created_at: string;
  updated_at: string;
  // 빈도 관련 필드
  frequency: ActivityFrequency;
  max_daily_count: number;
  is_template: boolean;
}

// 활동 완료 기록 메타데이터 (확장 가능)
export interface ActivityCompletionMetadata {
  notes?: string;
  // 독서 활동용 확장 필드
  reading?: {
    book_title?: string;
    pages_read?: number;
    impression?: string;
  };
  [key: string]: unknown;
}

// 활동 완료 기록
export interface ActivityCompletion {
  id: string;
  activity_id: string;
  profile_id: string;
  completed_date: string;
  completed_at: string;
  status: CompletionStatus;
  verified_at?: string;
  verified_by?: string;
  metadata: ActivityCompletionMetadata;
  points_awarded?: number;
  created_at: string;
  updated_at: string;
  // 조인된 데이터 (선택적)
  activity?: Activity;
  profile?: { id: string; name: string };
}

// 프론트엔드용 활동 뷰 (당일 완료 정보 포함)
export interface ActivityWithTodayStatus extends Activity {
  today_completion_count: number;
  can_complete_today: boolean;
  is_available_today: boolean;
  pending_completions: ActivityCompletion[];
}

export interface CreateActivityInput {
  title: string;
  description?: string;
  category: ActivityCategory;
  points_value: number;
  assigned_to?: string;
  due_date?: string;
  // 빈도 관련 필드
  frequency?: ActivityFrequency;
  max_daily_count?: number;
}

export interface UpdateActivityInput {
  title?: string;
  description?: string;
  category?: ActivityCategory;
  points_value?: number;
  status?: ActivityStatus;
  due_date?: string;
  // 빈도 관련 필드
  frequency?: ActivityFrequency;
  max_daily_count?: number;
}

// 활동 완료 기록 생성 입력
export interface CreateCompletionInput {
  activity_id: string;
  metadata?: ActivityCompletionMetadata;
}

// 활동 완료 기록 검증 입력
export interface VerifyCompletionInput {
  verified_by: string;
}
