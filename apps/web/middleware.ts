import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const PROTECTED_ROUTES = ["/user", "/user/dashboard"];
const PUBLIC_AUTH_ROUTE = "/user/login";
const AUTH_COOKIE = "auth_token";

function matchesRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isLoginRoute = matchesRoute(pathname, PUBLIC_AUTH_ROUTE);
  const isProtectedRoute = PROTECTED_ROUTES.some((route) => matchesRoute(pathname, route));
  const isAuthenticated = Boolean(request.cookies.get(AUTH_COOKIE)?.value);

  if (isLoginRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/user/dashboard", request.url));
  }

  if (isLoginRoute && !isAuthenticated) {
    return NextResponse.next();
  }

  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL(PUBLIC_AUTH_ROUTE, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/user/:path*"]
};
