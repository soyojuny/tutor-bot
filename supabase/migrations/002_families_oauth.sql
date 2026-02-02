-- =============================================
-- 002: families 테이블 및 OAuth 지원
-- Google OAuth 기반 가족 단위 인증 시스템
-- =============================================

-- families 테이블 생성
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL DEFAULT 'Our Family',
  owner_id UUID NOT NULL,  -- auth.users(id) 참조
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Deny direct access" ON families FOR ALL USING (false) WITH CHECK (false);

-- profiles에 family_id 추가, pin_code nullable로 변경
ALTER TABLE profiles ADD COLUMN family_id UUID REFERENCES families(id) ON DELETE CASCADE;
ALTER TABLE profiles ALTER COLUMN pin_code DROP NOT NULL;
CREATE INDEX idx_profiles_family ON profiles(family_id);

-- 기존 데이터 마이그레이션 (기존 프로필들을 기본 가족에 할당)
-- 첫 Google 로그인 시 owner_id를 실제 auth user로 교체
DO $$ DECLARE fid UUID;
BEGIN
  INSERT INTO families (name, owner_id)
  VALUES ('Default Family', '00000000-0000-0000-0000-000000000000')
  RETURNING id INTO fid;
  UPDATE profiles SET family_id = fid WHERE family_id IS NULL;
END $$;

ALTER TABLE profiles ALTER COLUMN family_id SET NOT NULL;
