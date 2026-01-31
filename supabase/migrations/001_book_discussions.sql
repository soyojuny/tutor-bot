-- ============================================
-- Book Discussions 테이블
-- 독서 토론 기록 저장
-- ============================================

CREATE TABLE book_discussions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  book_title TEXT NOT NULL,
  summary TEXT,
  discussed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_book_discussions_profile ON book_discussions(profile_id);
CREATE INDEX idx_book_discussions_discussed_at ON book_discussions(discussed_at DESC);

-- RLS 활성화 및 차단 정책 (API 통해서만 접근)
ALTER TABLE book_discussions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny direct book_discussions access"
  ON book_discussions FOR ALL USING (false) WITH CHECK (false);
