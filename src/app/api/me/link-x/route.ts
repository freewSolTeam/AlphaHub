import { auth, signIn } from "@/auth";
import { X_LINK_COOKIE_MAX_AGE, X_LINK_USER_COOKIE } from "@/lib/x-link-cookie";
import { NextResponse } from "next/server";

/**
 * Start X OAuth while preserving the signed-in wallet user id (cookie fallback for linking).
 */
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.wallet?.trim()) {
    return NextResponse.redirect(new URL("/auth/error?error=WalletRequired", request.url));
  }

  const reqUrl = new URL(request.url);
  const callbackUrl = reqUrl.searchParams.get("callbackUrl") ?? "/dashboard?activity=settings";

  const oauthUrl = await signIn("twitter", { redirectTo: callbackUrl, redirect: false });

  const response = NextResponse.redirect(oauthUrl);
  response.cookies.set(X_LINK_USER_COOKIE, session.user.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: X_LINK_COOKIE_MAX_AGE,
    path: "/",
  });
  return response;
}
