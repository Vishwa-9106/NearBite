import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const AUTH_COOKIE = "auth_token";
const AUTH_ROLE_COOKIE = "auth_role";

type AuthRole = "user" | "restaurant" | "admin";
type ProtectedRoute = {
  route: string;
  role: Extract<AuthRole, "user" | "restaurant">;
  loginRoute: string;
};

const LOGIN_ROUTES = [
  { route: "/user/login", dashboardRoute: "/user/dashboard" },
  { route: "/restaurant/login", dashboardRoute: "/restaurant/dashboard" }
];

const PROTECTED_ROUTES: ProtectedRoute[] = [
  { route: "/user", role: "user", loginRoute: "/user/login" },
  { route: "/restaurant/dashboard", role: "restaurant", loginRoute: "/restaurant/login" }
];

function matchesRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

function getDashboardRouteForRole(role: string | undefined): string | null {
  if (role === "user") {
    return "/user/dashboard";
  }

  if (role === "restaurant") {
    return "/restaurant/dashboard";
  }

  return null;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const loginRoute = LOGIN_ROUTES.find((route) => matchesRoute(pathname, route.route));
  const protectedRoute = PROTECTED_ROUTES.find((route) => matchesRoute(pathname, route.route));
  const isAuthenticated = Boolean(request.cookies.get(AUTH_COOKIE)?.value);
  const role = request.cookies.get(AUTH_ROLE_COOKIE)?.value;

  if (loginRoute && isAuthenticated) {
    const dashboardRoute = getDashboardRouteForRole(role) ?? loginRoute.dashboardRoute;
    return NextResponse.redirect(new URL(dashboardRoute, request.url));
  }

  if (loginRoute && !isAuthenticated) {
    return NextResponse.next();
  }

  if (protectedRoute && (!isAuthenticated || role !== protectedRoute.role)) {
    return NextResponse.redirect(new URL(protectedRoute.loginRoute, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/user/:path*", "/restaurant/:path*"]
};
