-- finance_budget: monthly budget targets per category
CREATE TABLE IF NOT EXISTS public.finance_budget (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  monthly_budget NUMERIC NOT NULL DEFAULT 0
);

ALTER TABLE public.finance_budget DISABLE ROW LEVEL SECURITY;

INSERT INTO public.finance_budget (category, type, monthly_budget) VALUES
  ('Salary', 'Income', 2800),
  ('Other Income', 'Income', 0),
  ('Family Support', 'Expense', 400),
  ('Tithe', 'Expense', 300),
  ('Personal Spending', 'Expense', 100),
  ('Transport', 'Expense', 0),
  ('Food', 'Expense', 0),
  ('Health', 'Expense', 0),
  ('Gifts', 'Expense', 0),
  ('Loan Payment', 'Expense', 0),
  ('Other', 'Expense', 0),
  ('Savings Transfer', 'Savings', 2000);
