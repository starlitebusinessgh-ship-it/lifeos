-- Today: day tasks and focus for timeline view
CREATE TABLE IF NOT EXISTS public.lifeos_today_tasks (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  day_date DATE NOT NULL,
  title TEXT NOT NULL,
  hour INT CHECK (hour IS NULL OR (hour >= 0 AND hour <= 23)),
  minute INT CHECK (minute IS NULL OR (minute >= 0 AND minute <= 59)),
  duration_mins INT NOT NULL DEFAULT 30 CHECK (duration_mins > 0 AND duration_mins <= 480),
  completed BOOLEAN NOT NULL DEFAULT false,
  is_focus BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS lifeos_today_tasks_day_date_idx
  ON public.lifeos_today_tasks (day_date);

ALTER TABLE public.lifeos_today_tasks DISABLE ROW LEVEL SECURITY;
