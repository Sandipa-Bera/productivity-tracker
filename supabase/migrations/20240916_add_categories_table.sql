-- Categories Table
-- Stores user-defined categories for organizing tasks
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  color VARCHAR(7) DEFAULT '#6366f1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, slug)
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own categories"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);

-- Updated at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON categories(slug);

-- Insert default categories for existing users
INSERT INTO categories (user_id, name, slug, color)
SELECT 
  id as user_id,
  'Data Science' as name,
  'data_science' as slug,
  '#6366f1' as color
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM categories 
  WHERE categories.user_id = auth.users.id 
  AND categories.slug = 'data_science'
);

INSERT INTO categories (user_id, name, slug, color)
SELECT 
  id as user_id,
  'College' as name,
  'college' as slug,
  '#10b981' as color
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM categories 
  WHERE categories.user_id = auth.users.id 
  AND categories.slug = 'college'
);

INSERT INTO categories (user_id, name, slug, color)
SELECT 
  id as user_id,
  'Project' as name,
  'project' as slug,
  '#f59e0b' as color
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM categories 
  WHERE categories.user_id = auth.users.id 
  AND categories.slug = 'project'
);

INSERT INTO categories (user_id, name, slug, color)
SELECT 
  id as user_id,
  'Government Exam' as name,
  'government_exam' as slug,
  '#ef4444' as color
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM categories 
  WHERE categories.user_id = auth.users.id 
  AND categories.slug = 'government_exam'
);

INSERT INTO categories (user_id, name, slug, color)
SELECT 
  id as user_id,
  'Other' as name,
  'other' as slug,
  '#8b5cf6' as color
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM categories 
  WHERE categories.user_id = auth.users.id 
  AND categories.slug = 'other'
);
