#!/usr/bin/env node
/**
 * Verify AlphaHub contract on Robinhood Chain Blockscout.
 *
 * Usage:
 *   npm run contracts:verify
 *   npm run contracts:verify -- 0xYourContractAddress
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

const address =
  process.argv[2]?.trim() ||
  process.env.ESCROW_CONTRACT_ADDRESS?.trim() ||
  process.env.NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS?.trim();

if (!address || !/^0x[0-9a-fA-F]{40}$/.test(address)) {
  console.error("Missing contract address. Set ESCROW_CONTRACT_ADDRESS in .env or pass as argument.");
  process.exit(1);
}

const usdg =
  process.env.USDG_TOKEN_ADDRESS?.trim() || "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168";
const treasury = process.env.PLATFORM_TREASURY_WALLET?.trim();
const usdgFeeUnits = process.env.PLATFORM_FEE_USDG_UNITS?.trim() || "1500000";
const ethFeeWei =
  process.env.PLATFORM_FEE_ETH_WEI?.trim() || String(BigInt(Math.ceil((1.5 / 3000) * 1e18)));

if (!treasury) {
  console.error("Missing PLATFORM_TREASURY_WALLET");
  process.exit(1);
}

const rpc =
  process.env.ROBINHOOD_RPC_URL?.trim() ||
  process.env.NEXT_PUBLIC_ROBINHOOD_RPC?.trim() ||
  "https://rpc.mainnet.chain.robinhood.com";

const encode = spawnSync(
  "cast",
  [
    "abi-encode",
    "constructor(address,address,uint256,uint256)",
    usdg,
    treasury,
    usdgFeeUnits,
    ethFeeWei,
  ],
  { cwd: contracts, encoding: "utf8", shell: true },
);

if (encode.status !== 0) {
  console.error("Failed to encode constructor args");
  process.exit(encode.status ?? 1);
}

const constructorArgs = encode.stdout.trim();
console.log("Verifying AlphaHub at", address, "on Blockscout…");

const args = [
  "verify-contract",
  address,
  "src/AlphaHub.sol:AlphaHub",
  "--chain-id",
  "4663",
  "--verifier",
  "blockscout",
  "--verifier-url",
  "https://robinhoodchain.blockscout.com/api",
  "--constructor-args",
  constructorArgs,
  "--skip-is-verified-check",
  "--force",
  "--watch",
];

const res = spawnSync("forge", args, {
  cwd: contracts,
  stdio: "inherit",
  shell: true,
  env: { ...process.env, ETHERSCAN_API_KEY: process.env.ETHERSCAN_API_KEY || "verify" },
});

if (res.status !== 0) {
  process.exit(res.status ?? 1);
}

console.log("\nVerified:", `https://robinhoodchain.blockscout.com/address/${address}`);
