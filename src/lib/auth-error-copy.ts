export type AuthErrorCopy = {
  title: string;
  lines: string[];
};

export const AUTH_ERROR_COPY = {
  XBanned: {
    title: "X account unavailable",
    lines: [
      "This X (Twitter) account cannot be used to sign in. It may be suspended, restricted, or banned by X.",
      "Try a different X account, or contact X support if you think this is a mistake.",
    ],
  },
  WalletRequired: {
    title: "Wallet sign-in required",
    lines: [
      "Connect and sign in with your Robinhood Chain wallet first.",
      "After that, you can link your X account from Dashboard to get the verified badge.",
    ],
  },
  AccessDenied: {
    title: "X connection not allowed",
    lines: [
      "Your X handle is not on the AlphaHub allowlist yet.",
      "Add your exact @handle to AUTH_X_ALLOWLIST in .env (no @, comma-separated), restart the dev server, then try again.",
      "If you cancelled on the X screen, try again and approve access.",
    ],
  },
  Unavailable: {
    title: "Sign in temporarily unavailable",
    lines: [
      "We could not complete sign in. Please try again in a few minutes.",
      "If it keeps failing, open a private window or try a different wallet.",
    ],
  },
  Default: {
    title: "Sign in failed",
    lines: ["Something went wrong while signing in. Please try again with your wallet."],
  },
} as const satisfies Record<string, AuthErrorCopy>;

/** Maps Auth.js error codes to short, user-facing copy (no env or dev details). */
export function resolveAuthErrorCopy(error?: string | null): AuthErrorCopy {
  if (error === "XBanned") {
    return AUTH_ERROR_COPY.XBanned;
  }
  if (error === "WalletRequired") {
    return AUTH_ERROR_COPY.WalletRequired;
  }
  if (error === "AccessDenied") {
    return AUTH_ERROR_COPY.AccessDenied;
  }
  if (
    error === "Configuration" ||
    error === "OAuthCallback" ||
    error === "OAuthSignin" ||
    error === "Callback" ||
    error === "Verification"
  ) {
    return AUTH_ERROR_COPY.Unavailable;
  }
  return AUTH_ERROR_COPY.Default;
}

export function isXBannedOrSuspendedResponse(status: number, body: string): boolean {
  if (status !== 403 && status !== 401) {
    return false;
  }
  const lower = body.toLowerCase();
  return (
    lower.includes("suspend") ||
    lower.includes("banned") ||
    lower.includes("locked") ||
    lower.includes("restricted") ||
    lower.includes("not active") ||
    lower.includes("user is not authorized")
  );
}
