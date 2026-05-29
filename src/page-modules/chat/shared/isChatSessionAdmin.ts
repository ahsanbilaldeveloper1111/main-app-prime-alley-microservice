/** Whether the signed-in user is a platform admin (can pick any company in chat UIs). */
export function isChatSessionAdminUser(user: unknown): boolean {
  if (!user || typeof user !== "object") {
    return false;
  }
  const isAdmin = (user as { is_admin?: string | number | boolean | null }).is_admin;
  if (isAdmin == null) {
    return false;
  }
  if (typeof isAdmin === "boolean") {
    return isAdmin;
  }
  if (typeof isAdmin === "number") {
    return isAdmin === 1;
  }
  const normalized = String(isAdmin).trim();
  return normalized === "1" || normalized.toLowerCase() === "true";
}
