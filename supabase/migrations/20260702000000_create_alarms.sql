-- LifeOS alarms: wake-up times with weekly repeat
CREATE TABLE IF NOT EXISTS public.lifeos_alarms (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  label TEXT NOT NULL DEFAULT 'Alarm',
  hour INT NOT NULL CHECK (hour >= 0 AND hour <= 23),
  minute INT NOT NULL CHECK (minute >= 0 AND minute <= 59),
  repeat_days INT[] NOT NULL DEFAULT ARRAY[0,1,2,3,4,5,6],
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.lifeos_alarms DISABLE ROW LEVEL SECURITY;
