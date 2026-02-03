import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = ["/sign-in"];
const PROTECTED_ROUTES = ["/dashboard"];

/**
 * Proxy function (formerly middleware)
 * Next.js 16+ renamed middleware to proxy for better clarity
 * https://nextjs.org/docs/messages/middleware-to-proxy
 */
export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const accessToken = req.cookies.get("access_token")?.value;

  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route),
  );

  /**
   * 1. ĐÃ login nhưng vào trang public → redirect dashboard
   */
  if (accessToken && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  /**
   * 2. CHƯA login nhưng vào trang protected → redirect login
   * Lưu ý: Khi redirect cần đảm bảo không redirect loop
   */
  if (!accessToken && isProtectedRoute) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  return NextResponse.next();
}

/**
 * Chỉ chạy proxy với các route cần thiết
 */
export const config = {
  matcher: ["/sign-in", "/dashboard/:path*"],
};
