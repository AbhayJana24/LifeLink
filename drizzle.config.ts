import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    // Migrations need a session-mode / direct connection (not the transaction pooler)
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL ?? "",
  },
  schemaFilter: ["public"],
  extensionsFilters: ["postgis"],
  strict: true,
  verbose: true,
});
