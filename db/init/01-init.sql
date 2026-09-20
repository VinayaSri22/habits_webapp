CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS habits (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL UNIQUE DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  question TEXT DEFAULT '',
  color_index INTEGER NOT NULL DEFAULT 8,
  type TEXT NOT NULL DEFAULT 'YES_NO',
  frequency_numerator INTEGER NOT NULL DEFAULT 1,
  frequency_denominator INTEGER NOT NULL DEFAULT 1,
  target_type TEXT NOT NULL DEFAULT 'AT_LEAST',
  target_value DOUBLE PRECISION NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT '',
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS entries (
  id SERIAL PRIMARY KEY,
  habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL,
  value INTEGER NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  UNIQUE (habit_id, entry_date)
);

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entries_habit_date ON entries (habit_id, entry_date);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_habits_updated_at
BEFORE UPDATE ON habits
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_app_settings_updated_at
BEFORE UPDATE ON app_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
