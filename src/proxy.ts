import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/server/auth/config";

const SUPERADMIN_ROLE_ID = 1;

const { auth } = NextAuth(authConfig);

const publicRoutes = [
  "/login",
  "/register",
  "/verify",
  "/forgot-password",
  "/reset-password",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  const isPublic = publicRoutes.some((r) => pathname.startsWith(r));
  const isTwoFactor = pathname.startsWith("/two-factor");

  if (!session) {
    if (isPublic) return NextResponse.next();
    const loginUrl = new URL("/login", req.nextUrl);
    if (pathname !== "/") loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session.user.twoFactorPending && !isTwoFactor) {
    return NextResponse.redirect(new URL("/two-factor", req.nextUrl));
  }

  if (!session.user.twoFactorPending && (isPublic || isTwoFactor || pathname === "/")) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  if (
    pathname.startsWith("/user-management") &&
    session.user.roleId !== SUPERADMIN_ROLE_ID
  ) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)"],
};
