import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";
import * as schema from "@/db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  socialProviders: {
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
          },
        }
      : {}
    ),
    ...(process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
      ? {
          github: {
            clientId: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
          },
        }
      : {}
    ),
  },
  // Database lifecycle hooks let us intercept user creation and validate
  // the email against an allowlist (when configured).
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          // Only allow emails from the configured allowlist
          const allowlist = (process.env.EMAIL_ALLOWLIST || '')
            .split(',')
            .map(email => email.trim().toLowerCase())
            .filter(email => email.length > 0);

          if (!allowlist.includes(user.email.toLowerCase())) {
            throw new APIError('UNAUTHORIZED', {
              message: 'EMAIL_ADDRESS_NOT_ALLOWED',
            });
          }

          // Return the (possibly modified) user object to continue creation.
          return { data: user };
        },
      },
    },
  },
});
