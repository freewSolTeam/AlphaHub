import { auth } from "@/auth";
import {
  getEscrowContractAddress,
  orderRefFromId,
  readContractPaymentFromReceipt,
} from "@/lib/alphahub-checkout";
import { verifyRobinhoodPayment } from "@/lib/escrow-payment-verify";
import { resolvePriceCurrency, toPaymentUnits } from "@/lib/payment-currency";
import { createRobinhoodPublicClient } from "@/lib/robinhood-public-client";
import { prisma } from "@/lib/prisma";
import { resolveSellerPayoutWallet } from "@/lib/seller-payout-wallet";
import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const bodySchema = z.object({
  /** Robinhood Chain (EVM) transaction hash of the buyer → operator payment. */
  signature: z.string().min(10).max(200),
});

type RouteParams = { orderId: string };

function strOrNull(s: string | null | undefined): string | null {
  if (s == null) return null;
  const t = s.trim();
  return t.length > 0 ? t : null;
}

export async function POST(request: NextRequest, context: { params: Promise<RouteParams> }) {
  try {
    return await postConfirmHandler(request, context);
  } catch (e) {
    console.error("[escrow/confirm] unhandled", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Internal server error" },
      { status: 500 },
    );
  }
}

async function postConfirmHandler(request: NextRequest, context: { params: Promise<RouteParams> }) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { orderId } = await context.params;
  const raw = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body: need { signature: string }" }, { status: 400 });
  }
  const txHash = parsed.data.signature.trim();
  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
    return NextResponse.json({ error: "Paste a valid Robinhood Chain transaction hash." }, { status: 400 });
  }

  const order = await prisma.escrowOrder.findUnique({
    where: { id: orderId },
    include: { project: true, buyer: true, seller: true, priceOption: true },
  });
  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (order.buyerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let tier = order.priceOption;
  if (!tier && order.priceOptionId) {
    tier = await prisma.projectPriceOption.findUnique({ where: { id: order.priceOptionId } });
  }
  if (order.status === "SETTLED" || order.status === "RELEASED") {
    return NextResponse.json({ error: "Order already completed" }, { status: 400 });
  }
  if (order.status !== "AWAITING_DEPOSIT" && order.status !== "SETTLEMENT_FAILED") {
    return NextResponse.json(
      { error: `Order is not waiting for a payment (status: ${order.status})` },
      { status: 400 },
    );
  }

  const expectedTo = strOrNull(order.escrowPublicKey);
  if (!expectedTo) {
    return NextResponse.json({ error: "Order has no payout address." }, { status: 500 });
  }

  const currency = resolvePriceCurrency(order.currency);
  const client = createRobinhoodPublicClient();
  const contract = getEscrowContractAddress();
  const paidViaContract =
    contract != null && expectedTo.toLowerCase() === contract.toLowerCase();

  if (paidViaContract) {
    const sellerWallet = resolveSellerPayoutWallet(order.seller);
    if (!sellerWallet) {
      return NextResponse.json({ error: "Operator payout wallet is not configured." }, { status: 500 });
    }
    const verified = await readContractPaymentFromReceipt(client, {
      txHash: txHash as `0x${string}`,
      contract,
      expectedOrderRef: orderRefFromId(order.id),
      expectedSeller: sellerWallet as `0x${string}`,
      expectedGross: toPaymentUnits(order.amount, currency),
      expectedCurrency: currency,
    });
    if (!verified.ok) {
      return NextResponse.json({ error: verified.error }, { status: 400 });
    }
  } else {
    const verified = await verifyRobinhoodPayment(client, {
      txHash: txHash as `0x${string}`,
      currency,
      expectedTo: expectedTo as `0x${string}`,
      expectedAmount: order.amount,
    });
    if (!verified.ok) {
      return NextResponse.json({ error: verified.error }, { status: 400 });
    }
  }

  const proj = order.project;
  let accessExpiresAt: Date | null = null;
  let grantedTelegramUrl: string | null = null;
  let grantedDiscordUrl: string | null = null;
  let grantedDiscordRoleId: string | null = null;
  if (tier) {
    const d = tier.accessDurationDays;
    if (d != null && d > 0) {
      accessExpiresAt = new Date(Date.now() + d * 86_400_000);
    }
    grantedTelegramUrl = strOrNull(tier.telegramUrl) ?? strOrNull(proj.telegram);
    grantedDiscordUrl = strOrNull(tier.discordUrl) ?? strOrNull(proj.discord);
    grantedDiscordRoleId = strOrNull(tier.discordRoleId);
  } else {
    grantedTelegramUrl = strOrNull(proj.telegram);
    grantedDiscordUrl = strOrNull(proj.discord);
  }

  await prisma.escrowOrder.update({
    where: { id: orderId },
    data: {
      buyerPaymentSignature: txHash,
      settlementSignature: null,
      status: "SETTLED",
      releasedAt: new Date(),
      accessExpiresAt,
      grantedTelegramUrl,
      grantedDiscordUrl,
      grantedDiscordRoleId,
      note: paidViaContract
        ? `AlphaHub checkout contract verified (${currency}); access granted.`
        : `Payment verified on Robinhood Chain (${currency}); access granted.`,
    },
  });

  revalidatePath(`/p/${order.project.slug}`);
  revalidatePath("/dashboard");

  return NextResponse.json({
    ok: true,
    buyerTx: txHash,
    settlementTx: null,
    grantedTelegramUrl,
    grantedDiscordUrl,
  });
}
