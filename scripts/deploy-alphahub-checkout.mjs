#!/usr/bin/env node
/**
 * Deploy AlphaHub checkout contract to Robinhood Chain.
 *
 * Required: DEPLOYER_PRIVATE_KEY, PLATFORM_TREASURY_WALLET (root .env or contracts/.env)
 * After deploy: set ESCROW_CONTRACT_ADDRESS in root .env, then npm run contracts:verify
 */
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const contracts = join(root, "contracts");

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 0) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (process.env[key] == null || process.env[key] === "") process.env[key] = val;
  }
}

loadEnvFile(join(root, ".env"));
loadEnvFile(join(contracts, ".env"));

function resolveUsdgFeeUnits() {
  const units = process.env.PLATFORM_FEE_USDG_UNITS?.trim();
  if (units && /^\d+$/.test(units)) return units;
  const human = Number(process.env.PLATFORM_FEE_USDG?.trim() || "1.5");
  if (!Number.isFinite(human) || human < 0) return "1500000";
  return String(Math.round(human * 1e6));
}

function resolveEthFeeWei() {
  const wei = process.env.PLATFORM_FEE_ETH_WEI?.trim();
  if (wei && /^\d+$/.test(wei)) return wei;
  const ethHuman = process.env.PLATFORM_FEE_ETH?.trim();
  if (ethHuman) {
    const n = Number(ethHuman);
    if (Number.isFinite(n) && n >= 0) {
      return BigInt(Math.ceil(n * 1e18)).toString();
    }
  }
  const usdgFee = Number(process.env.PLATFORM_FEE_USDG?.trim() || "1.5");
  const rate = Number(
    process.env.CHECKOUT_ETH_USDG_RATE?.trim() ||
      process.env.NEXT_PUBLIC_CHECKOUT_ETH_USDG_RATE?.trim() ||
      "3000",
  );
  if (!Number.isFinite(rate) || rate <= 0) return "0";
  const eth = usdgFee / rate;
  return BigInt(Math.ceil(eth * 1e18)).toString();
}

process.env.PLATFORM_FEE_USDG_UNITS = resolveUsdgFeeUnits();
process.env.PLATFORM_FEE_ETH_WEI = resolveEthFeeWei();

console.log("On-chain fees at deploy:");
console.log("  usdgFee units:", process.env.PLATFORM_FEE_USDG_UNITS);
console.log("  ethFeeWei:", process.env.PLATFORM_FEE_ETH_WEI);
console.log("  treasury:", process.env.PLATFORM_TREASURY_WALLET);

const rpc =
  process.env.ROBINHOOD_RPC_URL?.trim() ||
  process.env.NEXT_PUBLIC_ROBINHOOD_RPC?.trim() ||
  "https://rpc.mainnet.chain.robinhood.com";

if (!process.env.DEPLOYER_PRIVATE_KEY?.trim()) {
  console.error("Missing DEPLOYER_PRIVATE_KEY in .env");
  process.exit(1);
}
if (!process.env.PLATFORM_TREASURY_WALLET?.trim()) {
  console.error("Missing PLATFORM_TREASURY_WALLET in .env");
  process.exit(1);
}

process.env.ROBINHOOD_RPC_URL = rpc;

const args = [
  "script",
  "script/Deploy.s.sol:DeployAlphaHub",
  "--rpc-url",
  rpc,
  "--broadcast",
  "-vvvv",
];

console.log("Deploying AlphaHub to Robinhood Chain…");
const res = spawnSync("forge", args, { cwd: contracts, stdio: "inherit", shell: true, env: process.env });

if (res.status !== 0) {
  process.exit(res.status ?? 1);
}

console.log("\nNext:");
console.log("  1. Set ESCROW_CONTRACT_ADDRESS + NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS in .env");
console.log("  2. npm run contracts:verify");
