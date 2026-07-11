import { auth } from "@/auth";
import {
  escrowContractEnabled,
  getEscrowContractAddress,
  orderRefFromId,
} from "@/lib/alphahub-checkout";
import { quoteCheckout } from "@/lib/checkout-quote";
import { resolveCheckoutFeeOverrides } from "@/lib/checkout-fee-resolve";
import { formatAmountWithCurrency, resolvePriceCurrency } from "@/lib/payment-currency";
import { findProjectPriceOptionsByProjectId, prisma } from "@/lib/prisma";
import { ALPHA_HUB_CONTRACT_NAME } from "@/lib/robinhood-public-client";
import { resolveSellerPayoutWallet } from "@/lib/seller-payout-wallet";
import { NextResponse } from "next/server";
import { z } from "zod";

const buySchema = z.object({
  projectId: z.string().min(1),
  /** Required when the listing has multiple `ProjectPriceOption` rows. */
  priceOptionId: z.string().min(1).optional().nullable(),
  /** Buyer may pay in USDG or ETH even when the listing is priced in the other currency. */
  paymentCurrency: z.enum(["USDG", "ETH"]).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.wallet) {
    return NextResponse.json({ error: "Please connect your wallet first." }, { status: 403 });
  }

  const raw = await request.json().catch(() => null);
  const parsed = buySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
  }

  const listing = await prisma.project.findUnique({
    where: { id: parsed.data.projectId },
    include: { user: { select: { id: true, wallet: true, payoutWallet: true } } },
  });
  if (!listing || !listing.published) {
    return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  }
  if (listing.userId === session.user.id) {
    return NextResponse.json({ error: "You cannot buy your own group." }, { status: 400 });
  }
  if (listing.accessType !== "PAID" || listing.groupType !== "PRIVATE") {
    return NextResponse.json({ error: "On-chain checkout only applies to paid private groups." }, { status: 400 });
  }

  const sellerPayoutAddress = resolveSellerPayoutWallet(listing.user);
  if (!sellerPayoutAddress) {
    return NextResponse.json(
      { error: "The operator has not set a Robinhood Chain payout wallet yet. Ask them to sign in with a wallet first." },
      { status: 400 },
    );
  }

  const priceOptions = await findProjectPriceOptionsByProjectId(listing.id);
  const opts = priceOptions.filter((o) => o.priceAmount > 0);
  let payAmount: number;
  let chosenOptionId: string | null = null;
  let chosenLabel: string | null = null;

  if (opts.length > 0) {
    const want = parsed.data.priceOptionId?.trim() || null;
    if (!want) {
      return NextResponse.json(
        { error: "Choose an access option (price tier) for this listing." },
        { status: 400 },
      );
    }
    const found = opts.find((o) => o.id === want);
    if (!found) {
      return NextResponse.json({ error: "Invalid price option for this listing." }, { status: 400 });
    }
    payAmount = found.priceAmount;
    chosenOptionId = found.id;
    chosenLabel = found.label;
  } else {
    if (!listing.priceAmount || listing.priceAmount <= 0) {
      return NextResponse.json({ error: "Invalid listing price." }, { status: 400 });
    }
    payAmount = listing.priceAmount;
  }

  const listingCurrency = resolvePriceCurrency(listing.priceCurrency);
  const paymentCurrency = resolvePriceCurrency(parsed.data.paymentCurrency ?? listingCurrency);
  const feeOverrides = await resolveCheckoutFeeOverrides();
  const quote = quoteCheckout(payAmount, listingCurrency, paymentCurrency, feeOverrides);
  const contractAddress = getEscrowContractAddress();
  const useContract = escrowContractEnabled() && contractAddress != null;
  const depositAddress = useContract ? contractAddress : sellerPayoutAddress;

  const order = await prisma.escrowOrder.create({
    // Matches `prisma/schema.prisma` — if TypeScript flags unknown fields, sync client: `npm run db:regen`.
    data: {
      projectId: listing.id,
      buyerId: session.user.id,
      sellerId: listing.userId,
      amount: quote.paymentAmount,
      currency: quote.paymentCurrency,
      status: "AWAITING_DEPOSIT",
      escrowPublicKey: depositAddress,
      escrowPrivateKey: null,
      priceOptionId: chosenOptionId,
      priceOptionLabel: chosenLabel,
      note: useContract
        ? "Awaiting payment via AlphaHub checkout contract on Robinhood Chain."
        : "Awaiting on-chain payment to the operator on Robinhood Chain.",
    } as Parameters<typeof prisma.escrowOrder.create>[0]["data"],
  });

  return NextResponse.json({
    ok: true,
    orderId: order.id,
    depositAddress,
    listingCurrency,
    listingAmount: payAmount,
    amount: quote.paymentAmount,
    currency: quote.paymentCurrency,
    amountLabel: formatAmountWithCurrency(quote.paymentAmount, quote.paymentCurrency),
    priceOptionId: chosenOptionId,
    priceOptionLabel: chosenLabel,
    platformFee: quote.platformFee,
    platformFeeCurrency: quote.platformFeeCurrency,
    sellerReceives: quote.sellerReceives,
    feeSource: feeOverrides ? "contract" : "env",
    contractName: useContract ? ALPHA_HUB_CONTRACT_NAME : null,
    useContract,
    sellerAddress: sellerPayoutAddress,
    orderRef: useContract ? orderRefFromId(order.id) : null,
    contractAddress: useContract ? contractAddress : null,
  });
}
