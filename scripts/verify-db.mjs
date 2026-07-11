import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const tables = await prisma.$queryRawUnsafe(
  `SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY 1`,
);
console.log("Tables:", tables.map((t) => t.table_name).join(", "));

for (const name of ["User", "Project", "EscrowOrder"]) {
  try {
    const rows = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS c FROM "${name}"`);
    console.log(`${name}: ${rows[0]?.c ?? 0} rows`);
  } catch {
    console.log(`${name}: (missing)`);
  }
}

await prisma.$disconnect();
