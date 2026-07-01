-- App settings (savings goal, etc.)
CREATE TABLE IF NOT EXISTS public.finance_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.finance_settings DISABLE ROW LEVEL SECURITY;

INSERT INTO public.finance_settings (key, value) VALUES
  ('savings_goal', '{"amount": 20000, "deadline": "2026-11-30", "label": "End of national service"}'::jsonb)
ON CONFLICT (key) DO NOTHING;
