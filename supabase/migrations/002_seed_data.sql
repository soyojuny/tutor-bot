-- Insert sample profiles
-- Note: In production, PIN codes should be hashed using bcrypt
-- For now, using plain text for simplicity (MUST be changed in production!)

INSERT INTO profiles (id, name, role, age, pin_code) VALUES
  ('00000000-0000-0000-0000-000000000001', '엄마/아빠', 'parent', NULL, '1234'),
  ('00000000-0000-0000-0000-000000000002', '큰아이', 'child', 10, '0000'),
  ('00000000-0000-0000-0000-000000000003', '작은아이', 'child', 7, '1111');

-- Insert sample rewards
INSERT INTO rewards (title, description, points_cost, category, icon_emoji, created_by) VALUES
  ('30분 게임 시간', '좋아하는 게임을 30분 동안 할 수 있어요', 50, 'screen_time', '🎮', '00000000-0000-0000-0000-000000000001'),
  ('아이스크림', '맛있는 아이스크림 한 개!', 30, 'treat', '🍦', '00000000-0000-0000-0000-000000000001'),
  ('영화 관람', '가족과 함께 영화관에 가요', 100, 'activity', '🎬', '00000000-0000-0000-0000-000000000001'),
  ('늦잠 쿠폰', '주말에 30분 늦게 일어날 수 있어요', 40, 'privilege', '😴', '00000000-0000-0000-0000-000000000001'),
  ('작은 장난감', '원하는 작은 장난감을 살 수 있어요', 80, 'toy', '🧸', '00000000-0000-0000-0000-000000000001');

-- Insert sample activities for today
INSERT INTO activities (title, description, category, points_value, assigned_to, created_by, due_date) VALUES
  ('수학 숙제', '수학 문제집 10페이지', 'homework', 20, '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', CURRENT_DATE),
  ('영어 단어 외우기', '영어 단어 20개 암기', 'homework', 15, '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', CURRENT_DATE),
  ('독서 30분', '책 읽기 30분', 'reading', 10, '00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', CURRENT_DATE),
  ('한글 쓰기 연습', '한글 쓰기 노트 2페이지', 'practice', 15, '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', CURRENT_DATE),
  ('동화책 읽기', '좋아하는 동화책 한 권', 'reading', 10, '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', CURRENT_DATE);

-- Initialize daily streaks for children
INSERT INTO daily_streaks (profile_id, streak_count, last_activity_date, longest_streak) VALUES
  ('00000000-0000-0000-0000-000000000002', 0, CURRENT_DATE - INTERVAL '1 day', 5),
  ('00000000-0000-0000-0000-000000000003', 0, CURRENT_DATE - INTERVAL '1 day', 3);
