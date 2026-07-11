import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isValidWalletAddress } from "@/lib/validate";
import { NextResponse } from "next/server";
import { z } from "zod";

const body = z
  .object({
    wallet: z.string().max(100).nullable().optional(),
    payoutWallet: z.string().max(100).nullable().optional(),
  })
  .refine((v) => v.wallet !== undefined || v.payoutWallet !== undefined, {
    message: "Provide wallet and/or payoutWallet",
  });

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json();
  const parsed = body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const userId = session.user.id;

  if (parsed.data.wallet !== undefined) {
    const { wallet } = parsed.data;
    if (wallet !== null && !isValidWalletAddress(wallet)) {
      return NextResponse.json({ error: "Invalid Robinhood Chain wallet address" }, { status: 400 });
    }
    await prisma.user.update({
      where: { id: userId },
      data: { wallet: wallet ? wallet.toLowerCase() : null },
    });
  }

  if (parsed.data.payoutWallet !== undefined) {
    const { payoutWallet } = parsed.data;
    if (payoutWallet !== null && !isValidWalletAddress(payoutWallet)) {
      return NextResponse.json({ error: "Invalid payout wallet address" }, { status: 400 });
    }
    await prisma.$executeRawUnsafe(
      `UPDATE "User" SET "payoutWallet" = $1 WHERE "id" = $2`,
      payoutWallet ? payoutWallet.toLowerCase() : null,
      userId,
    );
  }

  const updated = await prisma.user.findUnique({
    where: { id: userId },
    select: { wallet: true },
  });

  let payoutWallet: string | null = null;
  try {
    const rows = await prisma.$queryRawUnsafe<Array<{ payoutWallet: string | null }>>(
      `SELECT "payoutWallet" FROM "User" WHERE "id" = $1 LIMIT 1`,
      userId,
    );
    payoutWallet = rows[0]?.payoutWallet ?? null;
  } catch {
    payoutWallet = null;
  }

  return NextResponse.json({ wallet: updated?.wallet ?? null, payoutWallet });
}
