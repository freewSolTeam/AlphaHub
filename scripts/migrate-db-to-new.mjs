/**
 * Copy all app tables from the previous Neon database into DATABASE_URL.
 * Usage: node --env-file=.env scripts/migrate-db-to-new.mjs
 */
import { PrismaClient } from "@prisma/client";

const OLD_DATABASE_URL =
  process.env.OLD_DATABASE_URL?.trim() ||
  "postgresql://neondb_owner:npg_lVBm4LYAzbt6@ep-still-bird-ansvkc5m-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require";

const TABLES = [
  "User",
  "Account",
  "Session",
  "VerificationToken",
  "Project",
  "ProjectPriceOption",
  "EscrowOrder",
  "EscrowReview",
  "ProjectReport",
  "TelegramLinkToken",
  "TelegramSetGroupToken",
  "TelegramSetGroupSession",
];

function sqlLiteral(value) {
  if (value === null || value === undefined) return "NULL";
  if (value instanceof Date) return `'${value.toISOString()}'::timestamptz`;
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (typeof value === "number") return Number.isFinite(value) ? String(value) : "NULL";
  if (typeof value === "bigint") return String(value);
  if (typeof value === "object") return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
  return `'${String(value).replace(/'/g, "''")}'`;
}

async function copyTable(oldDb, newDb, table) {
  const rows = await oldDb.$queryRawUnsafe(`SELECT * FROM "${table}"`);
  if (!Array.isArray(rows) || rows.length === 0) {
    console.log(`[skip] ${table}: 0 rows`);
    return 0;
  }

  const columns = Object.keys(rows[0]);
  const colList = columns.map((c) => `"${c}"`).join(", ");

  let copied = 0;
  for (const row of rows) {
    const values = columns.map((c) => sqlLiteral(row[c])).join(", ");
    await newDb.$executeRawUnsafe(
      `INSERT INTO "${table}" (${colList}) VALUES (${values}) ON CONFLICT DO NOTHING`,
    );
    copied += 1;
  }

  console.log(`[ok] ${table}: ${copied} rows`);
  return copied;
}

async function main() {
  const newUrl = process.env.DATABASE_URL?.trim();
  if (!newUrl) throw new Error("DATABASE_URL is missing");

  const oldDb = new PrismaClient({ datasources: { db: { url: OLD_DATABASE_URL } } });
  const newDb = new PrismaClient({ datasources: { db: { url: newUrl } } });

  console.log("Migrating data from old Neon → new DATABASE_URL …");

  let total = 0;
  for (const table of TABLES) {
    try {
      total += await copyTable(oldDb, newDb, table);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes("does not exist")) {
        console.log(`[skip] ${table}: not in source`);
        continue;
      }
      console.error(`[fail] ${table}:`, msg);
    }
  }

  console.log(`Done. Copied ${total} rows total.`);
  await oldDb.$disconnect();
  await newDb.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
