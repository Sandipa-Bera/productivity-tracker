-- Add appearance preferences to user_preferences table
-- These columns control the user's theme, font, and font size preferences

ALTER TABLE user_preferences 
ADD COLUMN IF NOT EXISTS theme VARCHAR(20) DEFAULT 'dark',
ADD COLUMN IF NOT EXISTS font_family VARCHAR(20) DEFAULT 'inter',
ADD COLUMN IF NOT EXISTS font_size VARCHAR(20) DEFAULT 'medium';

-- Add check constraints for valid values
ALTER TABLE user_preferences 
ADD CONSTRAINT check_theme_value CHECK (theme IN ('dark', 'light', 'system')),
ADD CONSTRAINT check_font_family_value CHECK (font_family IN ('inter', 'geist', 'manrope', 'system')),
ADD CONSTRAINT check_font_size_value CHECK (font_size IN ('small', 'medium', 'large'));

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_theme ON user_preferences(theme);
CREATE INDEX IF NOT EXISTS idx_user_preferences_font ON user_preferences(font_family, font_size);