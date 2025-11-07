import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  async function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Allow access to change password page without redirect loop
    if (path === "/portal/change-password") {
      return NextResponse.next();
    }

    // Force password change if required
    if (token?.passwordResetRequired === true) {
      const url = new URL("/portal/change-password", req.url);
      url.searchParams.set("required", "true");
      return NextResponse.redirect(url);
    }

    // Admin routes - require ADMIN role
    if (path.startsWith("/admin")) {
      if (token?.role !== "ADMIN") {
        const url = new URL("/portal", req.url);
        return NextResponse.redirect(url);
      }
    }

    // For RECA form routes, check subscription status
    if (path.startsWith("/reca/form/")) {
      if (!token?.sub) {
        // Not authenticated - redirect to login
        const url = new URL("/login", req.url);
        url.searchParams.set("callbackUrl", req.nextUrl.pathname);
        return NextResponse.redirect(url);
      }

      // Check subscription status by making internal API call
      // Note: In middleware, we can't easily access Prisma, so we'll handle this on the client side
      // The middleware just ensures authentication, the page itself will check subscription
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/intake/step2/:path*",
    "/intake/upload/:path*",
    "/intake/consent/:path*",
    "/portal/:path*",
    "/attorney/:path*", // Protect attorney portal routes
    "/reca/form/:path*", // Protect RECA form pages (require auth + subscription)
    "/admin/:path*", // Protect admin routes (require ADMIN role)
  ],
};
