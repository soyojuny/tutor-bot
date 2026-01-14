-- Secure RLS Policies
-- This migration removes permissive policies and adds restrictive ones
-- All data access should go through API routes with session validation

-- ============================================
-- Step 1: Drop existing permissive policies (from 003)
-- ============================================

DROP POLICY IF EXISTS "Allow all access to profiles" ON profiles;
DROP POLICY IF EXISTS "Allow all access to activities" ON activities;
DROP POLICY IF EXISTS "Allow all access to rewards" ON rewards;
DROP POLICY IF EXISTS "Allow all access to points_ledger" ON points_ledger;
DROP POLICY IF EXISTS "Allow all access to reward_redemptions" ON reward_redemptions;
DROP POLICY IF EXISTS "Allow all access to daily_streaks" ON daily_streaks;

-- ============================================
-- Step 2: Create secure view for public profile data
-- (Excludes sensitive fields like pin_code)
-- ============================================

CREATE OR REPLACE VIEW public_profiles AS
SELECT
  id,
  name,
  role,
  age,
  avatar_url,
  created_at
FROM profiles;

-- ============================================
-- Step 3: Create restrictive policies
-- ============================================

-- Profiles: Only allow SELECT of non-sensitive fields via view
-- Direct table access is denied, use public_profiles view instead
CREATE POLICY "Deny direct profiles access"
  ON profiles
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Activities: Deny all direct access (use API routes)
CREATE POLICY "Deny direct activities access"
  ON activities
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Rewards: Deny all direct access (use API routes)
CREATE POLICY "Deny direct rewards access"
  ON rewards
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Points Ledger: Deny all direct access (use API routes)
CREATE POLICY "Deny direct points_ledger access"
  ON points_ledger
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Reward Redemptions: Deny all direct access (use API routes)
CREATE POLICY "Deny direct reward_redemptions access"
  ON reward_redemptions
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Daily Streaks: Deny all direct access (use API routes)
CREATE POLICY "Deny direct daily_streaks access"
  ON daily_streaks
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- ============================================
-- Notes
-- ============================================

-- 1. All tables now deny direct access via anon key
-- 2. API routes use Service Role Key which bypasses RLS
-- 3. API routes validate sessions before allowing access
-- 4. For login screen, use /api/profiles endpoint instead of direct query
-- 5. The public_profiles view can be used if direct read is needed
--    (but current implementation uses API routes for everything)
