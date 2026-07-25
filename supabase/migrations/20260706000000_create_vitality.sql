-- Vitality: daily mood/sleep + habits

CREATE TABLE IF NOT EXISTS public.lifeos_vitality_days (
  day_date DATE PRIMARY KEY,
  mood SMALLINT CHECK (mood IS NULL OR (mood >= 1 AND mood <= 5)),
  sleep_hours NUMERIC(4, 1) CHECK (sleep_hours IS NULL OR (sleep_hours >= 0 AND sleep_hours <= 24)),
  energy SMALLINT CHECK (energy IS NULL OR (energy >= 1 AND energy <= 5)),
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lifeos_habits (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '✦',
  color TEXT NOT NULL DEFAULT '#2dd4a8',
  sort_order INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.lifeos_habit_completions (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  habit_id BIGINT NOT NULL REFERENCES public.lifeos_habits(id) ON DELETE CASCADE,
  day_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (habit_id, day_date)
);

CREATE INDEX IF NOT EXISTS lifeos_habit_completions_day_idx
  ON public.lifeos_habit_completions (day_date);

ALTER TABLE public.lifeos_vitality_days DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lifeos_habits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.lifeos_habit_completions DISABLE ROW LEVEL SECURITY;

-- Starter habits (only if table empty)
INSERT INTO public.lifeos_habits (name, icon, color, sort_order)
SELECT * FROM (VALUES
  ('Move your body', '🏃', '#14b8a6', 0),
  ('Drink water', '💧', '#06b6d4', 1),
  ('Read', '📖', '#8b5cf6', 2),
  ('Pray / reflect', '🙏', '#f59e0b', 3)
) AS v(name, icon, color, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.lifeos_habits LIMIT 1);
