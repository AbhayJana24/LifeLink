import "dotenv/config";
import postgres from "postgres";

async function main() {
  const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!url || url.includes("[YOUR-DATABASE-PASSWORD]")) {
    console.error("❌ Please replace [YOUR-DATABASE-PASSWORD] in .env with your Supabase DB password first.");
    process.exit(1);
  }
  const sql = postgres(url, { max: 1 });
  console.log("🗺️  Enabling PostGIS extension on Supabase...");
  await sql`CREATE EXTENSION IF NOT EXISTS postgis`;
  console.log("✅ PostGIS extension is active.");
  await sql.end();
}

main().catch((err) => {
  console.error("❌ Failed to enable PostGIS:", err);
  process.exit(1);
});
