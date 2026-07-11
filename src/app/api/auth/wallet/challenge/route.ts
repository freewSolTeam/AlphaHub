import { createWalletChallenge } from "@/lib/wallet-auth";
import { isValidWalletAddress } from "@/lib/validate";
import { NextResponse } from "next/server";
import { z } from "zod";

const query = z.object({
  wallet: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = query.safeParse({ wallet: searchParams.get("wallet") ?? "" });
  if (!parsed.success || !isValidWalletAddress(parsed.data.wallet)) {
    return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
  }

  try {
    const challenge = await createWalletChallenge(parsed.data.wallet);
    return NextResponse.json(challenge);
  } catch (e) {
    console.error("[wallet/challenge]", e);
    return NextResponse.json({ error: "Could not create sign-in challenge" }, { status: 500 });
  }
}
