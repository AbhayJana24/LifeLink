import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { normalizeIndianPhone } from "@/lib/phone";

const SELF_SERVICE_ROLES = ["DONOR", "REQUESTER"] as const;

export const auth = betterAuth({
  appName: "LifeLink",
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 days
    cookieCache: { enabled: true, maxAge: 60 * 5 },
  },
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "DONOR", input: true },
      phone: { type: "string", required: false, input: true },
    },
  },
  databaseHooks: {
    user: {
      create: {
        // Never trust the client: users can only self-assign DONOR or REQUESTER.
        before: async (data) => {
          const role = (SELF_SERVICE_ROLES as readonly string[]).includes(String(data.role))
            ? data.role
            : "DONOR";
          const phone = data.phone ? normalizeIndianPhone(String(data.phone)) : null;
          return { data: { ...data, role, phone } };
        },
      },
    },
  },
  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
