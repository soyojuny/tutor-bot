-- Row Level Security Policies
-- This migration sets up RLS policies for all tables
--
-- IMPORTANT: Current implementation uses Service Role Key which bypasses RLS
-- These policies are for future use when implementing proper authentication

-- ============================================
-- Profiles Table Policies
-- ============================================

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
USING (auth.uid()::text = id);

-- Allow parents to read all profiles
CREATE POLICY "Parents can read all profiles"
ON profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()::text AND role = 'parent'
  )
);

-- Only admins can insert/update/delete profiles (not implemented yet)
-- For now, we rely on Service Role Key for these operations

-- ============================================
-- Activities Table Policies
-- ============================================

-- Parents can read all activities
CREATE POLICY "Parents can read all activities"
ON activities FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()::text AND role = 'parent'
  )
);

-- Children can read activities assigned to them or unassigned
CREATE POLICY "Children can read their activities"
ON activities FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()::text AND role = 'child'
  )
  AND (assigned_to IS NULL OR assigned_to = auth.uid()::text)
);

-- Parents can create activities
CREATE POLICY "Parents can create activities"
ON activities FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()::text AND role = 'parent'
  )
  AND created_by = auth.uid()::text
);

-- Parents can update activities they created
CREATE POLICY "Parents can update their activities"
ON activities FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()::text AND role = 'parent'
  )
  AND created_by = auth.uid()::text
);

-- Children can update activity status (start, complete)
CREATE POLICY "Children can update activity status"
ON activities FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()::text AND role = 'child'
  )
  AND (assigned_to IS NULL OR assigned_to = auth.uid()::text)
)
WITH CHECK (
  -- Children can only update status field
  status IN ('in_progress', 'completed')
);

-- Parents can delete activities they created
CREATE POLICY "Parents can delete their activities"
ON activities FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()::text AND role = 'parent'
  )
  AND created_by = auth.uid()::text
);

-- ============================================
-- Points Ledger Policies
-- ============================================

-- Users can read their own points
CREATE POLICY "Users can read own points"
ON points_ledger FOR SELECT
USING (profile_id = auth.uid()::text);

-- Parents can read all points
CREATE POLICY "Parents can read all points"
ON points_ledger FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()::text AND role = 'parent'
  )
);

-- Only system (Service Role) can insert/update points
-- No user-facing policies for INSERT/UPDATE/DELETE

-- ============================================
-- Rewards Table Policies
-- ============================================

-- Everyone can read active rewards
CREATE POLICY "Everyone can read active rewards"
ON rewards FOR SELECT
USING (is_active = true);

-- Parents can read all rewards (including inactive)
CREATE POLICY "Parents can read all rewards"
ON rewards FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()::text AND role = 'parent'
  )
);

-- Parents can create rewards
CREATE POLICY "Parents can create rewards"
ON rewards FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()::text AND role = 'parent'
  )
  AND created_by = auth.uid()::text
);

-- Parents can update rewards they created
CREATE POLICY "Parents can update their rewards"
ON rewards FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()::text AND role = 'parent'
  )
  AND created_by = auth.uid()::text
);

-- Parents can delete rewards they created
CREATE POLICY "Parents can delete their rewards"
ON rewards FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()::text AND role = 'parent'
  )
  AND created_by = auth.uid()::text
);

-- ============================================
-- Reward Redemptions Policies
-- ============================================

-- Users can read their own redemptions
CREATE POLICY "Users can read own redemptions"
ON reward_redemptions FOR SELECT
USING (redeemed_by = auth.uid()::text);

-- Parents can read all redemptions
CREATE POLICY "Parents can read all redemptions"
ON reward_redemptions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()::text AND role = 'parent'
  )
);

-- Children can create redemptions
CREATE POLICY "Children can create redemptions"
ON reward_redemptions FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()::text AND role = 'child'
  )
  AND redeemed_by = auth.uid()::text
);

-- Parents can update redemption status
CREATE POLICY "Parents can update redemption status"
ON reward_redemptions FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()::text AND role = 'parent'
  )
);

-- ============================================
-- Daily Streaks Policies
-- ============================================

-- Users can read their own streaks
CREATE POLICY "Users can read own streaks"
ON daily_streaks FOR SELECT
USING (profile_id = auth.uid()::text);

-- Parents can read all streaks
CREATE POLICY "Parents can read all streaks"
ON daily_streaks FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()::text AND role = 'parent'
  )
);

-- Only system (Service Role) can insert/update streaks
-- No user-facing policies for INSERT/UPDATE/DELETE

-- ============================================
-- Notes
-- ============================================

-- These policies assume Supabase Auth is being used
-- Currently, the app uses PIN-based authentication and Service Role Key
-- To enable these policies:
-- 1. Implement Supabase Auth integration
-- 2. Link profiles to auth.users
-- 3. Update API routes to use authenticated user context
-- 4. Remove Service Role Key usage from client-side code
