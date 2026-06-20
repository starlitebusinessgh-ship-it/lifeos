-- One-time seed: June 2026 demo transactions for finance_entries
INSERT INTO public.finance_entries (date, description, category, type, intent, amount)
SELECT v.date, v.description, v.category, v.type, v.intent, v.amount
FROM (
  VALUES
    ('2026-06-01'::date, 'Monthly Salary', 'Salary', 'Income', 'Necessary', 2800),
    ('2026-06-02'::date, 'Family Support', 'Family Support', 'Expense', 'Giving', 400),
    ('2026-06-03'::date, 'Church Tithe', 'Tithe', 'Expense', 'Giving', 300),
    ('2026-06-05'::date, 'Personal Spending', 'Personal Spending', 'Expense', 'Optional', 100),
    ('2026-06-07'::date, 'Transfer to Savings', 'Savings Transfer', 'Savings', 'Investment', 2000)
) AS v(date, description, category, type, intent, amount)
WHERE NOT EXISTS (
  SELECT 1
  FROM public.finance_entries
  WHERE date = '2026-06-01'::date
    AND description = 'Monthly Salary'
);
