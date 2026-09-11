-- Navratri Journey Settings Table
-- Stores user's journey configuration (start date, target date, title)
CREATE TABLE IF NOT EXISTS navratri_journey_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  target_date DATE NOT NULL,
  title VARCHAR(255) DEFAULT 'Navratri Journey',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE navratri_journey_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own journey settings"
  ON navratri_journey_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own journey settings"
  ON navratri_journey_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own journey settings"
  ON navratri_journey_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_navratri_journey_settings_updated_at
  BEFORE UPDATE ON navratri_journey_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Navratri Daily Notes Table
-- Stores user's personal notes for each day of their journey
CREATE TABLE IF NOT EXISTS navratri_daily_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  journey_date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, journey_date)
);

-- Enable RLS
ALTER TABLE navratri_daily_notes ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own daily notes"
  ON navratri_daily_notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own daily notes"
  ON navratri_daily_notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own daily notes"
  ON navratri_daily_notes FOR UPDATE
  USING (auth.uid() = user_id);

-- Updated at trigger
CREATE TRIGGER update_navratri_daily_notes_updated_at
  BEFORE UPDATE ON navratri_daily_notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_navratri_journey_settings_user_id ON navratri_journey_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_navratri_daily_notes_user_id ON navratri_daily_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_navratri_daily_notes_journey_date ON navratri_daily_notes(journey_date);
CREATE INDEX IF NOT EXISTS idx_navratri_daily_notes_user_date ON navratri_daily_notes(user_id, journey_date);