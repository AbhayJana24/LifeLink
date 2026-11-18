import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pgClient?: postgres.Sql };

/**
 * Supabase transaction pooler (port 6543) does not support prepared statements,
 * hence `prepare: false`. The connection is lazy: nothing connects until the first query.
 */
const client =
  globalForDb.pgClient ??
  postgres(process.env.DATABASE_URL ?? "postgres://missing-database-url", {
    prepare: false,
    max: process.env.NODE_ENV === "production" ? 5 : 10,
  });

if (process.env.NODE_ENV !== "production") globalForDb.pgClient = client;

export const db = drizzle(client, { schema });
export { schema };
