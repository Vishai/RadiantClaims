import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

// @ts-expect-error - NextAuth v4 has TypeScript module resolution issues
const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
