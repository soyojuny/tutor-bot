-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
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

-- Create index for role lookups
CREATE INDEX idx_profiles_role ON profiles(role);

-- Create activities table
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for activities
CREATE INDEX idx_activities_assigned_to ON activities(assigned_to);
CREATE INDEX idx_activities_status ON activities(status);
CREATE INDEX idx_activities_due_date ON activities(due_date);

-- Create rewards table
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

-- Create index for active rewards
CREATE INDEX idx_rewards_active ON rewards(is_active);

-- Create points_ledger table
CREATE TABLE points_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
  reward_id UUID REFERENCES rewards(id) ON DELETE SET NULL,
  points_change INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('earned', 'spent', 'adjusted', 'bonus')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for points_ledger
CREATE INDEX idx_points_ledger_profile ON points_ledger(profile_id);
CREATE INDEX idx_points_ledger_created_at ON points_ledger(created_at DESC);

-- Create reward_redemptions table
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

-- Create indexes for redemptions
CREATE INDEX idx_redemptions_profile ON reward_redemptions(profile_id);
CREATE INDEX idx_redemptions_status ON reward_redemptions(status);

-- Create daily_streaks table
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

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_streaks ENABLE ROW LEVEL SECURITY;

-- Create view for current points balance per profile
CREATE VIEW profile_points_balance AS
SELECT
  p.id,
  p.name,
  COALESCE(SUM(pl.points_change), 0) as current_balance
FROM profiles p
LEFT JOIN points_ledger pl ON p.id = pl.profile_id
GROUP BY p.id, p.name;
