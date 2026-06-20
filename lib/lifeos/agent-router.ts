/** Fast finance path: logging, balances, in-app tab actions. */
export function isFinanceFastPath(text: string): boolean {
  const lower = text.toLowerCase().trim();
  if (
    /^(go to|open|show|switch to|take me to)\b/i.test(text) ||
    /delete|remove/i.test(lower)
  ) {
    return true;
  }
  if (
    /paid|got paid|received salary|log|logged|spent|saving|saved|tithe|family support|salary|gh₵|ghc|\b\d{3,4}\b/i.test(
      lower
    )
  ) {
    return true;
  }
  if (
    /balance|net worth|loan|transaction|how much|what is my|what's my/i.test(
      lower
    )
  ) {
    return true;
  }
  if (
    /advice|recommend|on track|should i save|financial plan|budget|goal/i.test(
      lower
    )
  ) {
    return true;
  }
  return false;
}

/** Cursor path: code changes, UI work, "do what we discussed", app building. */
export function shouldUseCursor(
  text: string,
  options?: { forceCursor?: boolean }
): boolean {
  if (options?.forceCursor) return true;
  if (isFinanceFastPath(text)) return false;

  const lower = text.toLowerCase().trim();
  return (
    /fix|build|implement|change|update|apply|add|remove|refactor|redesign|style|layout|background|component|page|ui|code|cursor|we discussed|what we did|make the|deploy|migration|script|npm run/i.test(
      lower
    ) || lower.length > 120
  );
}
