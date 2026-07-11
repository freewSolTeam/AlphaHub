#!/usr/bin/env node
/**
 * Rename Ponks / FarmLabs user records to synthetic operator identities.
 * Usage: node --env-file=.env scripts/rename-ponks-farmlabs-users.mjs
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const RENAMES = [
  { id: "cmoiderbn00007w92fjux7yau", name: "Nova Signals", xHandle: "nova_signals_rh" },
  { id: "cmqpcph050000114xto0f3kl8", name: "Vault Caller", xHandle: "vault_caller_rh" },
  { id: "cmpsntso10000c3vste0m8lzg", name: "Pulse Alpha", xHandle: "pulse_alpha_rh" },
  { id: "cmoiekyqn0000x732380bq7vg", name: "Drift Gems", xHandle: "drift_gems_rh" },
  { id: "cmrgdqn070000nmp9ts01l18a", name: "Cipher Trade", xHandle: "cipher_trade_rh" },
];

for (const row of RENAMES) {
  const before = await prisma.user.findUnique({
    where: { id: row.id },
    select: { id: true, name: true, xHandle: true, wallet: true },
  });
  if (!before) {
    console.warn("skip missing user", row.id);
    continue;
  }

  const clash = await prisma.user.findFirst({
    where: {
      id: { not: row.id },
      OR: [{ name: row.name }, { xHandle: row.xHandle }],
    },
    select: { id: true, name: true, xHandle: true },
  });
  if (clash) {
    console.error("name/handle clash, aborting", row, clash);
    process.exit(1);
  }

  const after = await prisma.user.update({
    where: { id: row.id },
    data: { name: row.name, xHandle: row.xHandle },
    select: { id: true, name: true, xHandle: true, wallet: true },
  });

  console.log(`${before.name} (@${before.xHandle}) → ${after.name} (@${after.xHandle})`);
}

const remaining = await prisma.user.count({
  where: {
    OR: [
      { name: { contains: "ponk", mode: "insensitive" } },
      { xHandle: { contains: "ponk", mode: "insensitive" } },
      { name: { contains: "farm", mode: "insensitive" } },
      { xHandle: { contains: "farm", mode: "insensitive" } },
    ],
  },
});

console.log(`Remaining Ponks/FarmLabs users: ${remaining}`);
await prisma.$disconnect();
