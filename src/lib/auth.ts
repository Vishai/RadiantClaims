import { type NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { env } from "@/env.mjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("🔐 Authorize called with:", {
          email: credentials?.email,
          hasPassword: !!credentials?.password,
        });

        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing credentials");
          return null;
        }

        const user = await db.user.findUnique({
          where: {
            email: credentials.email.toLowerCase(), // Normalize email to lowercase
          },
          include: {
            firm: true, // Include firm data for attorneys
          },
        });

        console.log("👤 User found:", {
          found: !!user,
          hasPassword: !!user?.password,
          email: user?.email,
          role: user?.role,
        });

        if (!user || !user.password) {
          console.log("❌ User not found or no password");
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        console.log("🔑 Password valid:", isPasswordValid);

        if (!isPasswordValid) {
          console.log("❌ Invalid password");
          return null;
        }

        console.log("✅ Authentication successful for:", user.email);
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          firmId: user.firmId,
          passwordResetRequired: user.passwordResetRequired,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.firmId = user.firmId;
        token.passwordResetRequired = user.passwordResetRequired;

        // Fetch firm slug if user has a firm
        if (user.firmId) {
          const firm = await db.lawFirm.findUnique({
            where: { id: user.firmId },
            select: { slug: true },
          });
          token.firmSlug = firm?.slug;
        }
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role;
        session.user.firmId = token.firmId;
        session.user.firmSlug = token.firmSlug;
        session.user.passwordResetRequired = token.passwordResetRequired;
      }
      return session;
    },
  },
  secret: env.NEXTAUTH_SECRET,
};

export const getServerAuthSession = () => getServerSession(authOptions);
