const usd2 = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function parsePerUserBudgetUsd(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const amount = Number.parseFloat(trimmed);
  if (!Number.isFinite(amount) || amount < 0) return null;
  return amount;
}

export function computeTotalCompanyBudgetUsd(
  defaultPerUserUsd: string,
  userCount: number,
): number | null {
  const perUser = parsePerUserBudgetUsd(defaultPerUserUsd);
  if (perUser == null || userCount <= 0) return null;
  return perUser * userCount;
}

export function formatTenantCompanyBudgetTotal(
  defaultPerUserUsd: string,
  userCount: number,
  usersLoading: boolean,
): string {
  if (usersLoading) {
    return "Calculating…";
  }

  const perUser = parsePerUserBudgetUsd(defaultPerUserUsd);
  if (perUser == null) {
    return "—";
  }

  if (userCount <= 0) {
    return "—";
  }

  const total = perUser * userCount;
  return usd2.format(total);
}

export function tenantCompanyBudgetTotalHint(
  defaultPerUserUsd: string,
  userCount: number,
  usersLoading: boolean,
): string {
  if (usersLoading) {
    return "Loading user count from Users & Teams…";
  }

  const perUser = parsePerUserBudgetUsd(defaultPerUserUsd);
  if (perUser == null) {
    return "Enter a default per user budget to calculate the company total.";
  }

  if (userCount <= 0) {
    return "No users found in User Directory for this company.";
  }

  return `Default ${usd2.format(perUser)} × ${userCount} user${userCount === 1 ? "" : "s"} in User Directory.`;
}
