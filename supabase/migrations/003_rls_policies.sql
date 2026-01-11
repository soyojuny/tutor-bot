-- RLS Policies for Development
-- WARNING: These policies allow full access. Tighten for production!

-- Profiles: Allow all operations
CREATE POLICY "Allow all access to profiles"
  ON profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Activities: Allow all operations
CREATE POLICY "Allow all access to activities"
  ON activities
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Rewards: Allow all operations
CREATE POLICY "Allow all access to rewards"
  ON rewards
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Points Ledger: Allow all operations
CREATE POLICY "Allow all access to points_ledger"
  ON points_ledger
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Reward Redemptions: Allow all operations
CREATE POLICY "Allow all access to reward_redemptions"
  ON reward_redemptions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Daily Streaks: Allow all operations
CREATE POLICY "Allow all access to daily_streaks"
  ON daily_streaks
  FOR ALL
  USING (true)
  WITH CHECK (true);
