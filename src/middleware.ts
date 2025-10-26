export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/intake/step2/:path*",
    "/intake/upload/:path*",
    "/intake/consent/:path*",
    "/portal/:path*",
  ],
};
