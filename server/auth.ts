/**
 * Auth.js v5 configuration — replaces Manus OAuth entirely.
 * Supports: Email magic link (Resend), Google OAuth
 * Admin bootstrap: any user whose email matches ADMIN_EMAIL env var is auto-promoted to admin.
 */
import NextAuth from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import Resend from "next-auth/providers/resend";
import Google from "next-auth/providers/google";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { users, accounts, sessions, verificationTokens } from "../drizzle/schema";
import { eq } from "drizzle-orm";

function getDb() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: false },
  });
  return drizzle(pool);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(getDb(), {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  providers: [
    Resend({
      from: "noreply@stampelo.ch",
      apiKey: process.env.RESEND_API_KEY,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        // Auto-promote admin by email
        const adminEmail = process.env.ADMIN_EMAIL;
        if (adminEmail && user.email === adminEmail) {
          const db = getDb();
          const [dbUser] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
          if (dbUser && dbUser.role !== "admin") {
            await db.update(users).set({ role: "admin" }).where(eq(users.id, user.id));
          }
          (session.user as any).role = "admin";
        } else {
          const db = getDb();
          const [dbUser] = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
          (session.user as any).role = dbUser?.role ?? "user";
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify",
    error: "/auth/error",
  },
  session: {
    strategy: "database",
  },
});
