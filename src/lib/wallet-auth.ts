import { randomUUID } from "node:crypto";
import { isAddress, verifyMessage } from "viem";
import { prisma } from "@/lib/prisma";
import { shortWalletAddress } from "@/lib/wallet-display";

const CHALLENGE_TTL_MS = 5 * 60 * 1000;

export function isValidWalletAddress(s: string) {
  return isAddress(s);
}

export function normalizeWalletAddress(s: string) {
  return isAddress(s) ? s.toLowerCase() : s;
}

export function buildWalletSignInMessage(wallet: string, nonce: string) {
  return [
    "Sign in to AlphaHub with your Robinhood Chain wallet.",
    "",
    `Wallet: ${wallet}`,
    `Nonce: ${nonce}`,
  ].join("\n");
}

export function verifyWalletSignature(wallet: string, message: string, signature: string) {
  if (!isAddress(wallet)) return false;
  try {
    return verifyMessage({
      address: wallet as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });
  } catch {
    return false;
  }
}

export function parseNonceFromMessage(message: string): string | null {
  const match = message.match(/^Nonce:\s*(\S+)\s*$/m);
  return match?.[1]?.trim() ?? null;
}

export function parseWalletFromMessage(message: string): string | null {
  const match = message.match(/^Wallet:\s*(\S+)\s*$/m);
  const raw = match?.[1]?.trim() ?? null;
  return raw && isAddress(raw) ? raw : null;
}

export async function createWalletChallenge(wallet: string) {
  if (!isAddress(wallet)) {
    throw new Error("Invalid wallet address");
  }

  const normalized = wallet.toLowerCase();
  const nonce = randomUUID();
  const expires = new Date(Date.now() + CHALLENGE_TTL_MS);

  await prisma.verificationToken.deleteMany({ where: { identifier: normalized } });
  await prisma.verificationToken.create({
    data: {
      identifier: normalized,
      token: nonce,
      expires,
    },
  });

  return {
    message: buildWalletSignInMessage(wallet, nonce),
    nonce,
    expiresAt: expires.toISOString(),
  };
}

export async function consumeWalletChallenge(wallet: string, nonce: string) {
  const normalized = wallet.toLowerCase();
  const row = await prisma.verificationToken.findFirst({
    where: { identifier: normalized, token: nonce },
  });
  if (!row || row.expires.getTime() < Date.now()) {
    return false;
  }
  await prisma.verificationToken.deleteMany({ where: { identifier: normalized, token: nonce } });
  return true;
}

export async function findOrCreateUserForWallet(wallet: string) {
  const normalized = wallet.toLowerCase();
  const existing = await prisma.user.findFirst({
    where: { wallet: { equals: normalized, mode: "insensitive" } },
    select: { id: true, name: true, image: true, email: true },
  });
  if (existing) return existing;

  return prisma.user.create({
    data: {
      wallet: normalized,
      name: shortWalletAddress(normalized, 6, 4),
    },
    select: { id: true, name: true, image: true, email: true },
  });
}
