-- finance_entries: income, expense, and savings transactions
CREATE TABLE IF NOT EXISTS public.finance_entries (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  type TEXT NOT NULL,
  intent TEXT,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.finance_entries DISABLE ROW LEVEL SECURITY;
