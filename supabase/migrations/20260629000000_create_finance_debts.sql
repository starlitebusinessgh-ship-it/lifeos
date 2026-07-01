-- finance_debts: money owed to me and money I owe
CREATE TABLE IF NOT EXISTS public.finance_debts (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  direction TEXT NOT NULL,          -- 'owed_to_me' | 'i_owe'
  counterparty TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  paid NUMERIC NOT NULL DEFAULT 0,
  due_date DATE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.finance_debts DISABLE ROW LEVEL SECURITY;
