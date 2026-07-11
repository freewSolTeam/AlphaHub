#!/usr/bin/env node
/**
 * Reassign FarmLabs bulk listings to random synthetic operators.
 * Usage: node --env-file=.env scripts/diversify-listing-operators.mjs
 *        node --env-file=.env scripts/diversify-listing-operators.mjs --dry-run
 */
import { createHash, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");

const FARM_USER_IDS = [
  "cmoiekyqn0000x732380bq7vg", // FarmLabs (92 projects)
  "cmqpcph050000114xto0f3kl8", // Farmlabs duplicate (1 project)
];

const OPERATORS = [
  { name: "Zorin", xHandle: "zorin_calls" },
  { name: "MadApes", xHandle: "madapes_alpha" },
  { name: "Stonky", xHandle: "stonky_degen" },
  { name: "Aeon Gems", xHandle: "aeon_gems" },
  { name: "Skull Trader", xHandle: "skull100x" },
  { name: "Tsa Moon", xHandle: "tsa_moon" },
  { name: "BSC Degen", xHandle: "bsc_degens" },
  { name: "KOL Signal", xHandle: "kol_signalx" },
  { name: "Alpha Kingdom", xHandle: "alpha_kingdom" },
  { name: "Gem Hunter", xHandle: "gem_hunter_rh" },
  { name: "Whale Club", xHandle: "whale_club_rh" },
  { name: "Moon Caller", xHandle: "moon_caller" },
  { name: "Degen Oil", xHandle: "degenoilape" },
  { name: "Crypto Ser", xHandle: "cryptoser_rh" },
  { name: "T0bi", xHandle: "T0biCalls" },
  { name: "Ponks", xHandle: "ponkssol" },
  { name: "Orbitrex", xHandle: "Orbitrexomni" },
  { name: "Cavion", xHandle: "CavionCode" },
  { name: "Liqilong", xHandle: "liqilong7" },
  { name: "NXE Trader", xHandle: "duytin2013" },
  { name: "Med Alpha", xHandle: "mohamed_ouazri" },
  { name: "Sotoy Calls", xHandle: "sotoy_calls" },
  { name: "Investergram", xHandle: "investergram" },
  { name: "SuperEOT", xHandle: "supereot_cn" },
  { name: "Ihzan", xHandle: "ihzan_whale" },
  { name: "Rhythm Alpha", xHandle: "rhythm_alpha" },
  { name: "Chain Caller", xHandle: "chain_caller" },
  { name: "VIP Signals", xHandle: "vip_signals_rh" },
  { name: "Robin Degen", xHandle: "robin_degen" },
  { name: "Alpha Hub Ops", xHandle: "alphahub_ops" },
];

function pseudoWallet(seed) {
  const h = createHash("sha256").update(seed).digest("hex").slice(0, 40);
  return `0x${h}`;
}

function pickOperator() {
  return OPERATORS[Math.floor(Math.random() * OPERATORS.length)];
}

async function ensureOperator(op) {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        op.xHandle ? { xHandle: op.xHandle } : undefined,
        { name: op.name },
      ].filter(Boolean),
    },
  });
  if (existing) {
    if (!existing.wallet) {
      const wallet = pseudoWallet(`wallet:${existing.id}`);
      if (!dryRun) {
        await prisma.user.update({ where: { id: existing.id }, data: { wallet } });
      }
      return { ...existing, wallet };
    }
    return existing;
  }

  const wallet = pseudoWallet(`wallet:${op.name}:${op.xHandle ?? ""}`);
  if (dryRun) {
    return { id: `dry-${op.xHandle ?? op.name}`, name: op.name, xHandle: op.xHandle, wallet };
  }

  return prisma.user.create({
    data: {
      name: op.name,
      xHandle: op.xHandle ?? null,
      wallet,
      blueCheckmark: Math.random() < 0.15,
    },
  });
}

const projects = await prisma.project.findMany({
  where: { userId: { in: FARM_USER_IDS } },
  select: { id: true, title: true, userId: true, accessType: true },
  orderBy: { createdAt: "asc" },
});

if (projects.length === 0) {
  console.log("No FarmLabs listings found — nothing to do.");
  await prisma.$disconnect();
  process.exit(0);
}

console.log(`Found ${projects.length} FarmLabs listings to diversify.`);
if (dryRun) console.log("(dry-run — no DB writes)");

const operatorCache = new Map();
const distribution = new Map();

for (const project of projects) {
  let assigned;
  // Spread listings — prefer a new random operator each time
  for (let i = 0; i < 8; i++) {
    const op = pickOperator();
    const key = op.xHandle ?? op.name;
    const count = distribution.get(key) ?? 0;
    if (count < Math.ceil(projects.length / OPERATORS.length) + 2) {
      assigned = op;
      break;
    }
  }
  assigned ??= pickOperator();

  const cacheKey = assigned.xHandle ?? assigned.name;
  let user = operatorCache.get(cacheKey);
  if (!user) {
    user = await ensureOperator(assigned);
    operatorCache.set(cacheKey, user);
  }

  distribution.set(cacheKey, (distribution.get(cacheKey) ?? 0) + 1);

  if (!dryRun) {
    await prisma.project.update({
      where: { id: project.id },
      data: { userId: user.id },
    });

    if (project.accessType === "PAID") {
      await prisma.escrowOrder.updateMany({
        where: { projectId: project.id },
        data: { sellerId: user.id },
      });
    }
  }
}

const summary = [...distribution.entries()]
  .sort((a, b) => b[1] - a[1])
  .map(([k, n]) => ({ operator: k, listings: n }));

console.log(`Reassigned ${projects.length} listings across ${operatorCache.size} operators.`);
console.log(JSON.stringify(summary, null, 2));

if (!dryRun) {
  const remaining = await prisma.project.count({
    where: { userId: { in: FARM_USER_IDS } },
  });
  console.log(`Remaining on FarmLabs accounts: ${remaining}`);
}

await prisma.$disconnect();
