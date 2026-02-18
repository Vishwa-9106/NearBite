export const SESSION_COOKIE_BY_ROLE = {
  user: "nearbite_user_session",
  restaurant: "nearbite_restaurant_session",
  admin: "nearbite_admin_session"
} as const;

export type SessionCookieRole = keyof typeof SESSION_COOKIE_BY_ROLE;

export const SESSION_COOKIE_NAMES = Object.values(SESSION_COOKIE_BY_ROLE);
export const LEGACY_SESSION_COOKIE_NAME = "nearbite_session";

export function getSessionCookieName(role: SessionCookieRole) {
  return SESSION_COOKIE_BY_ROLE[role];
}
