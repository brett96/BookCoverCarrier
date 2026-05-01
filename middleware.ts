import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  if (!req.auth && req.nextUrl.pathname.startsWith("/admin")) {
    const u = new URL("/login", req.nextUrl.origin);
    u.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return Response.redirect(u);
  }
});

export const config = {
  matcher: ["/admin/:path*"],
};
