-- =============================================
-- 003: Multi-tenancy with Family ID and RLS
-- =============================================

-- Step 1: Add family_id column to all relevant tables
ALTER TABLE public.activities ADD COLUMN family_id UUID REFERENCES public.families(id) ON DELETE CASCADE;
ALTER TABLE public.activity_completions ADD COLUMN family_id UUID REFERENCES public.families(id) ON DELETE CASCADE;
ALTER TABLE public.rewards ADD COLUMN family_id UUID REFERENCES public.families(id) ON DELETE CASCADE;
ALTER TABLE public.points_ledger ADD COLUMN family_id UUID REFERENCES public.families(id) ON DELETE CASCADE;
ALTER TABLE public.reward_redemptions ADD COLUMN family_id UUID REFERENCES public.families(id) ON DELETE CASCADE;
ALTER TABLE public.daily_streaks ADD COLUMN family_id UUID REFERENCES public.families(id) ON DELETE CASCADE;
ALTER TABLE public.book_discussions ADD COLUMN family_id UUID REFERENCES public.families(id) ON DELETE CASCADE;

-- Step 2: Backfill family_id for existing data
-- Note: This assumes existing data has a valid corresponding profile.
DO $$
DECLARE
  default_family_id UUID;
BEGIN
  -- Find the default family created in migration 002
  SELECT id INTO default_family_id FROM public.families WHERE owner_id = '00000000-0000-0000-0000-000000000000' LIMIT 1;

  -- Backfill activities
  UPDATE public.activities a
  SET family_id = p.family_id
  FROM public.profiles p
  WHERE a.created_by = p.id AND a.family_id IS NULL;

  -- Backfill activity_completions
  UPDATE public.activity_completions ac
  SET family_id = p.family_id
  FROM public.profiles p
  WHERE ac.profile_id = p.id AND ac.family_id IS NULL;

  -- Backfill rewards (handle potentially NULL created_by)
  UPDATE public.rewards r
  SET family_id = COALESCE(
    (SELECT p.family_id FROM public.profiles p WHERE p.id = r.created_by),
    default_family_id
  )
  WHERE r.family_id IS NULL;

  -- Backfill points_ledger
  UPDATE public.points_ledger pl
  SET family_id = p.family_id
  FROM public.profiles p
  WHERE pl.profile_id = p.id AND pl.family_id IS NULL;

  -- Backfill reward_redemptions
  UPDATE public.reward_redemptions rr
  SET family_id = p.family_id
  FROM public.profiles p
  WHERE rr.profile_id = p.id AND rr.family_id IS NULL;

  -- Backfill daily_streaks
  UPDATE public.daily_streaks ds
  SET family_id = p.family_id
  FROM public.profiles p
  WHERE ds.profile_id = p.id AND ds.family_id IS NULL;

  -- Backfill book_discussions
  UPDATE public.book_discussions bd
  SET family_id = p.family_id
  FROM public.profiles p
  WHERE bd.profile_id = p.id AND bd.family_id IS NULL;
END $$;

-- Step 3: Set family_id column to NOT NULL
ALTER TABLE public.activities ALTER COLUMN family_id SET NOT NULL;
ALTER TABLE public.activity_completions ALTER COLUMN family_id SET NOT NULL;
ALTER TABLE public.rewards ALTER COLUMN family_id SET NOT NULL;
ALTER TABLE public.points_ledger ALTER COLUMN family_id SET NOT NULL;
ALTER TABLE public.reward_redemptions ALTER COLUMN family_id SET NOT NULL;
ALTER TABLE public.daily_streaks ALTER COLUMN family_id SET NOT NULL;
ALTER TABLE public.book_discussions ALTER COLUMN family_id SET NOT NULL;

-- Step 4: Create index on the new family_id columns
CREATE INDEX ON public.activities (family_id);
CREATE INDEX ON public.activity_completions (family_id);
CREATE INDEX ON public.rewards (family_id);
CREATE INDEX ON public.points_ledger (family_id);
CREATE INDEX ON public.reward_redemptions (family_id);
CREATE INDEX ON public.daily_streaks (family_id);
CREATE INDEX ON public.book_discussions (family_id);

-- Step 5: Create the helper function to get current family_id
create or replace function public.get_current_family_id()
returns uuid
language sql
stable
as $$
  select family_id from public.profiles where id = auth.uid() limit 1;
$$;

-- Step 6: Update RLS policies for all tables

-- Profiles: Allow family members to see each other and create new profiles for their family
DROP POLICY IF EXISTS "Deny direct profiles access" ON public.profiles;
CREATE POLICY "Enable access for family members" ON public.profiles
  FOR ALL USING (family_id = public.get_current_family_id())
  WITH CHECK (family_id = public.get_current_family_id());

-- Activities
DROP POLICY IF EXISTS "Deny direct activities access" ON public.activities;
CREATE POLICY "Enable access for family members" ON public.activities
  FOR ALL USING (family_id = public.get_current_family_id())
  WITH CHECK (family_id = public.get_current_family_id());

-- activity_completions
DROP POLICY IF EXISTS "Deny direct activity_completions access" ON public.activity_completions;
CREATE POLICY "Enable access for family members" ON public.activity_completions
  FOR ALL USING (family_id = public.get_current_family_id())
  WITH CHECK (family_id = public.get_current_family_id());

-- rewards
DROP POLICY IF EXISTS "Deny direct rewards access" ON public.rewards;
CREATE POLICY "Enable access for family members" ON public.rewards
  FOR ALL USING (family_id = public.get_current_family_id())
  WITH CHECK (family_id = public.get_current_family_id());

-- points_ledger
DROP POLICY IF EXISTS "Deny direct points_ledger access" ON public.points_ledger;
CREATE POLICY "Enable access for family members" ON public.points_ledger
  FOR ALL USING (family_id = public.get_current_family_id())
  WITH CHECK (family_id = public.get_current_family_id());

-- reward_redemptions
DROP POLICY IF EXISTS "Deny direct reward_redemptions access" ON public.reward_redemptions;
CREATE POLICY "Enable access for family members" ON public.reward_redemptions
  FOR ALL USING (family_id = public.get_current_family_id())
  WITH CHECK (family_id = public.get_current_family_id());

-- daily_streaks
DROP POLICY IF EXISTS "Deny direct daily_streaks access" ON public.daily_streaks;
CREATE POLICY "Enable access for family members" ON public.daily_streaks
  FOR ALL USING (family_id = public.get_current_family_id())
  WITH CHECK (family_id = public.get_current_family_id());

-- book_discussions
DROP POLICY IF EXISTS "Deny direct book_discussions access" ON public.book_discussions;
CREATE POLICY "Enable access for family members" ON public.book_discussions
  FOR ALL USING (family_id = public.get_current_family_id())
  WITH CHECK (family_id = public.get_current_family_id());

-- Families: Allow members to read their family details
DROP POLICY IF EXISTS "Deny direct access" ON public.families;
CREATE POLICY "Allow members to read their family" ON public.families
  FOR SELECT USING (id = public.get_current_family_id());
