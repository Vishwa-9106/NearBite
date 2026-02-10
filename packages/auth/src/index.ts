export type Role = "user" | "restaurant" | "admin";

export function hasRole(currentRole: Role, requiredRole: Role): boolean {
  return currentRole === requiredRole;
}
