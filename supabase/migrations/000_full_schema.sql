-- ============================================
-- Tutor Bot - Full Database Schema
-- 모든 테이블을 재생성하는 통합 마이그레이션
-- ============================================

-- ============================================
-- Step 0: Drop existing tables (역순으로)
-- ============================================

DROP VIEW IF EXISTS profile_points_balance CASCADE;
DROP VIEW IF EXISTS public_profiles CASCADE;

DROP TABLE IF EXISTS activity_completions CASCADE;
DROP TABLE IF EXISTS daily_streaks CASCADE;
DROP TABLE IF EXISTS reward_redemptions CASCADE;
DROP TABLE IF EXISTS points_ledger CASCADE;
DROP TABLE IF EXISTS rewards CASCADE;
DROP TABLE IF EXISTS activities CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================
-- Step 1: Enable Extensions
-- ============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- Step 2: Create Tables
-- ============================================

-- Profiles 테이블
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('parent', 'child')),
  age INTEGER,
  avatar_url TEXT,
  pin_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON profiles(role);

-- Activities 테이블 (빈도 기능 포함)
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('homework', 'reading', 'problem-solving', 'practice', 'other')),
  points_value INTEGER NOT NULL DEFAULT 10,
  assigned_to UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_by UUID REFERENCES profiles(id),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'verified')),
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES profiles(id),
  -- 빈도 관련 필드
  frequency TEXT NOT NULL DEFAULT 'once' CHECK (frequency IN ('once', 'weekdays', 'daily')),
  max_daily_count INTEGER NOT NULL DEFAULT 1,
  is_template BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_activities_assigned_to ON activities(assigned_to);
CREATE INDEX idx_activities_status ON activities(status);
CREATE INDEX idx_activities_due_date ON activities(due_date);
CREATE INDEX idx_activities_frequency ON activities(frequency);
CREATE INDEX idx_activities_is_template ON activities(is_template);

-- Activity Completions 테이블 (반복 활동 완료 기록)
CREATE TABLE activity_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'verified')),
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES profiles(id),
  metadata JSONB DEFAULT '{}',
  points_awarded INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_completions_activity ON activity_completions(activity_id);
CREATE INDEX idx_completions_profile ON activity_completions(profile_id);
CREATE INDEX idx_completions_date ON activity_completions(completed_date);
CREATE INDEX idx_completions_status ON activity_completions(status);
CREATE INDEX idx_completions_activity_profile_date ON activity_completions(activity_id, profile_id, completed_date);

-- Rewards 테이블
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  points_cost INTEGER NOT NULL,
  category TEXT CHECK (category IN ('screen_time', 'treat', 'activity', 'toy', 'privilege', 'other')),
  icon_emoji TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_rewards_active ON rewards(is_active);

-- Points Ledger 테이블
CREATE TABLE points_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
  reward_id UUID REFERENCES rewards(id) ON DELETE SET NULL,
  completion_id UUID REFERENCES activity_completions(id) ON DELETE SET NULL,
  points_change INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'spent', 'adjusted', 'bonus')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_points_ledger_profile ON points_ledger(profile_id);
CREATE INDEX idx_points_ledger_created_at ON points_ledger(created_at DESC);
CREATE INDEX idx_points_ledger_completion ON points_ledger(completion_id);

-- Reward Redemptions 테이블
CREATE TABLE reward_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reward_id UUID REFERENCES rewards(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'fulfilled', 'rejected')),
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fulfilled_at TIMESTAMP WITH TIME ZONE,
  fulfilled_by UUID REFERENCES profiles(id),
  notes TEXT
);

CREATE INDEX idx_redemptions_profile ON reward_redemptions(profile_id);
CREATE INDEX idx_redemptions_status ON reward_redemptions(status);

-- Daily Streaks 테이블
CREATE TABLE daily_streaks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  streak_count INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE NOT NULL,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(profile_id)
);

-- ============================================
-- Step 3: Create Views
-- ============================================

-- 프로필별 포인트 잔액 뷰
CREATE VIEW profile_points_balance AS
SELECT
  p.id,
  p.name,
  COALESCE(
    (SELECT balance_after FROM points_ledger WHERE profile_id = p.id ORDER BY created_at DESC LIMIT 1),
    0
  ) as current_balance
FROM profiles p;

-- 공개 프로필 뷰 (민감 정보 제외)
CREATE VIEW public_profiles AS
SELECT
  id,
  name,
  role,
  age,
  avatar_url,
  created_at
FROM profiles;

-- ============================================
-- Step 4: Enable RLS (Row Level Security)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_streaks ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Step 5: Create RLS Policies (모두 차단 - API 통해서만 접근)
-- ============================================

CREATE POLICY "Deny direct profiles access"
  ON profiles FOR ALL USING (false) WITH CHECK (false);

CREATE POLICY "Deny direct activities access"
  ON activities FOR ALL USING (false) WITH CHECK (false);

CREATE POLICY "Deny direct activity_completions access"
  ON activity_completions FOR ALL USING (false) WITH CHECK (false);

CREATE POLICY "Deny direct rewards access"
  ON rewards FOR ALL USING (false) WITH CHECK (false);

CREATE POLICY "Deny direct points_ledger access"
  ON points_ledger FOR ALL USING (false) WITH CHECK (false);

CREATE POLICY "Deny direct reward_redemptions access"
  ON reward_redemptions FOR ALL USING (false) WITH CHECK (false);

CREATE POLICY "Deny direct daily_streaks access"
  ON daily_streaks FOR ALL USING (false) WITH CHECK (false);

-- ============================================
-- Step 6: Seed Data (기본 데이터)
-- ============================================

-- 테스트용 프로필 (개발용 평문 PIN - 서버에서 평문/해시 둘 다 지원)
-- PIN: 1234
INSERT INTO profiles (name, role, age, pin_code) VALUES
  ('아빠', 'parent', null, '1234'),
  ('John', 'child', 10, '0000'),
  ('Daniel', 'child', 8, '1111');

-- 테스트용 보상
INSERT INTO rewards (title, description, points_cost, category, icon_emoji, is_active) VALUES
  ('30분 게임 시간', '좋아하는 게임을 30분 동안 할 수 있어요', 50, 'screen_time', '🎮', true),
  ('아이스크림', '맛있는 아이스크림 하나!', 30, 'treat', '🍦', true),
  ('영화 보기', '가족과 함께 영화 한 편', 100, 'activity', '🎬', true),
  ('새 책 사기', '읽고 싶은 책 한 권', 80, 'toy', '📚', true),
  ('늦잠 자기', '주말에 1시간 더 자기', 40, 'privilege', '😴', true);

-- ============================================
-- Notes
-- ============================================
-- 1. 모든 테이블은 RLS가 활성화되어 직접 접근 불가
-- 2. API 라우트는 Service Role Key를 사용하여 RLS 우회
-- 3. PIN 코드는 bcrypt로 해시되어 저장됨
-- 4. 활동 빈도: once(한번), weekdays(주중 월~금), daily(매일)
-- 5. 반복 활동의 완료 기록은 activity_completions 테이블에 저장
