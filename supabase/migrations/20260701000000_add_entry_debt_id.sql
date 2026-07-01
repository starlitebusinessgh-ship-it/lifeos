-- Link transactions to debts when paying/recording
ALTER TABLE public.finance_entries
  ADD COLUMN IF NOT EXISTS debt_id BIGINT REFERENCES public.finance_debts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS finance_entries_debt_id_idx ON public.finance_entries(debt_id);
