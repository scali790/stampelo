/**
 * Auth.js configuration using @auth/express (framework-agnostic).
 * Works in standalone Express server and Vercel serverless functions.
 * Supports: Email magic link (Resend), Google OAuth (optional).
 * Admin bootstrap: first sign-in with ADMIN_EMAIL is auto-promoted to admin.
 */
import { ExpressAuth, getSession } from "@auth/express";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Resend from "@auth/express/providers/resend";
import Google from "@auth/express/providers/google";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { users, accounts, sessions, verificationTokens } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import type { ExpressAuthConfig } from "@auth/express";

function getDb() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: false },
    max: 5,
  });
  return drizzle(pool);
}

export const authConfig: ExpressAuthConfig = {
  adapter: DrizzleAdapter(getDb(), {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Resend({
      from: process.env.EMAIL_FROM || "noreply@stampelo.ch",
      apiKey: process.env.RESEND_API_KEY,
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [Google({ clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET })]
      : []),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
        const db = getDb();
        const dbUser = await db.select({ role: users.role }).from(users).where(eq(users.id, user.id)).limit(1);
        (session.user as { id: string; role?: string }).role = dbUser[0]?.role ?? "user";
      }
      return session;
    },
    async signIn({ user }) {
      const adminEmail = process.env.ADMIN_EMAIL;
      if (adminEmail && user.email === adminEmail && user.id) {
        const db = getDb();
        await db.update(users).set({ role: "admin" }).where(eq(users.id, user.id));
      }
      return true;
    },
  },
  pages: {
    signIn: "/account",
    error: "/account",
  },
  trustHost: true,
};

// Express middleware — mount at app.use("/api/auth/*", authMiddleware)
export const authMiddleware = ExpressAuth(authConfig);

// Helper to get session in other Express routes
export { getSession };
