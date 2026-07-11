import type { TwitterProfile } from "@auth/core/providers/twitter";
import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Twitter from "next-auth/providers/twitter";
import { cookies } from "next/headers";
import { isXHandleInAllowlist } from "@/lib/auth-x-allowlist";
import { isXBannedOrSuspendedResponse } from "@/lib/auth-error-copy";
import { reassignTwitterAccountToUser } from "@/lib/link-x-account";
import { prisma } from "@/lib/prisma";
import { X_LINK_FORCE_JWT_COOKIE, X_LINK_USER_COOKIE } from "@/lib/x-link-cookie";
import { findOrCreateUserForTelegramWidget } from "@/lib/telegram-signin-user";
import {
  consumeWalletChallenge,
  findOrCreateUserForWallet,
  parseNonceFromMessage,
  parseWalletFromMessage,
  verifyWalletSignature,
} from "@/lib/wallet-auth";

const providers = [
  Credentials({
    id: "wallet",
    name: "Wallet",
    credentials: {
      wallet: { label: "wallet", type: "text" },
      message: { label: "message", type: "text" },
      nonce: { label: "nonce", type: "text" },
      signature: { label: "signature", type: "text" },
    },
    async authorize(credentials) {
      const wallet = typeof credentials?.wallet === "string" ? credentials.wallet.trim() : "";
      const message = typeof credentials?.message === "string" ? credentials.message : "";
      const nonce = typeof credentials?.nonce === "string" ? credentials.nonce.trim() : "";
      const signature = typeof credentials?.signature === "string" ? credentials.signature.trim() : "";

      if (!wallet || !message || !nonce || !signature) return null;

      const walletFromMessage = parseWalletFromMessage(message);
      const nonceFromMessage = parseNonceFromMessage(message);
      if (walletFromMessage !== wallet || nonceFromMessage !== nonce) return null;

      if (!verifyWalletSignature(wallet, message, signature)) return null;

      const challengeOk = await consumeWalletChallenge(wallet, nonce);
      if (!challengeOk) return null;

      try {
        const user = await findOrCreateUserForWallet(wallet);
        return {
          id: user.id,
          name: user.name ?? wallet.slice(0, 8),
          email: user.email,
          image: user.image,
        };
      } catch (e) {
        console.error("[auth] wallet authorize error:", e);
        return null;
      }
    },
  }),
  Twitter({
    clientId: process.env.AUTH_TWITTER_ID ?? "UNSET",
    clientSecret: process.env.AUTH_TWITTER_SECRET ?? "UNSET",
    allowDangerousEmailAccountLinking: true,
    userinfo: "https://api.x.com/2/users/me?user.fields=profile_image_url,username",
  }),
  Credentials({
    id: "telegram",
    name: "Telegram",
    credentials: {
      payload: { label: "payload", type: "text" },
    },
    async authorize(credentials) {
      const p = credentials?.payload;
      if (typeof p !== "string" || p.length < 2) {
        return null;
      }
      const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
      if (!botToken) {
        return null;
      }
      let raw: Record<string, string | number | undefined>;
      try {
        raw = JSON.parse(p) as Record<string, string | number | undefined>;
      } catch {
        return null;
      }
      try {
        const user = await findOrCreateUserForTelegramWidget(prisma, botToken, raw);
        return {
          id: user.id,
          name: user.name ?? "Telegram",
          image: user.image,
          email: null,
        };
      } catch (e) {
        console.error("[auth] Telegram widget authorize error:", e);
        return null;
      }
    },
  }),
];

const authSecret =
  process.env.AUTH_SECRET ??
  process.env.NEXTAUTH_SECRET ??
  (process.env.NODE_ENV === "development"
    ? "dev-only-auth-secret-change-in-production"
    : undefined);

async function resolveXHandle(accessToken: string | null | undefined, profile: unknown) {
  let handle: string | undefined;

  if (accessToken) {
    const res = await fetch("https://api.x.com/2/users/me?user.fields=username", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) {
      const body = await res.text();
      if (isXBannedOrSuspendedResponse(res.status, body)) {
        return { error: "XBanned" as const };
      }
    } else {
      const j = (await res.json()) as { data?: { username?: string } };
      handle = j.data?.username?.trim() ?? undefined;
    }
  }

  if (!handle && profile) {
    const data = (profile as TwitterProfile).data;
    handle = data?.username?.trim() ?? undefined;
  }

  return { handle };
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  trustHost: true,
  secret: authSecret,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login", error: "/auth/error" },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      const cookieStore = await cookies();
      const forcedSub = cookieStore.get(X_LINK_FORCE_JWT_COOKIE)?.value?.trim();
      if (forcedSub) {
        token.sub = forcedSub;
        cookieStore.delete(X_LINK_FORCE_JWT_COOKIE);
      } else if (user?.id) {
        token.sub = user.id;
      }
      return token;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === "wallet" || account?.provider === "telegram") {
        return true;
      }

      if (account?.provider !== "twitter") {
        return true;
      }

      try {
        const cookieStore = await cookies();
        const linkUserId = cookieStore.get(X_LINK_USER_COOKIE)?.value?.trim() ?? null;

        if (!user?.id && !linkUserId) {
          return true;
        }

        const targetUserId = linkUserId ?? user!.id;

        const dbUser = await prisma.user.findUnique({
          where: { id: targetUserId },
          select: { wallet: true },
        });

        if (!dbUser?.wallet?.trim()) {
          console.warn("[auth][x] rejected — wallet sign-in required before linking X", {
            targetUserId,
            oauthUserId: user.id,
            hadLinkCookie: Boolean(linkUserId),
          });
          if (linkUserId) cookieStore.delete(X_LINK_USER_COOKIE);
          return "/auth/error?error=WalletRequired";
        }

        const acc = account as { access_token?: string | null };
        const resolved = await resolveXHandle(acc.access_token, profile);
        if ("error" in resolved && resolved.error === "XBanned") {
          if (linkUserId) cookieStore.delete(X_LINK_USER_COOKIE);
          return "/auth/error?error=XBanned";
        }

        const handle = resolved.handle;
        if (handle) {
          if (!isXHandleInAllowlist(handle)) {
            console.warn("[auth][x] handle rejected by allowlist:", handle);
            if (linkUserId) cookieStore.delete(X_LINK_USER_COOKIE);
            return "/auth/error?error=AccessDenied";
          }

          const twitterProfile = profile as TwitterProfile | undefined;
          const profileName =
            twitterProfile?.data?.name?.trim() ||
            (typeof twitterProfile?.name === "string" ? twitterProfile.name.trim() : undefined);
          const profileImage =
            twitterProfile?.data?.profile_image_url?.trim() ||
            (typeof twitterProfile?.picture === "string" ? twitterProfile.picture.trim() : undefined);

          await prisma.user.update({
            where: { id: targetUserId },
            data: {
              xHandle: handle,
              blueCheckmark: true,
              ...(profileName ? { name: profileName } : {}),
              ...(profileImage ? { image: profileImage } : {}),
            },
          });
        } else {
          await prisma.user.update({
            where: { id: targetUserId },
            data: { blueCheckmark: true },
          });
        }

        if (linkUserId) {
          cookieStore.set(X_LINK_FORCE_JWT_COOKIE, linkUserId, {
            httpOnly: true,
            sameSite: "lax",
            secure: process.env.NODE_ENV === "production",
            maxAge: 120,
            path: "/",
          });
        }
      } catch (e) {
        console.error("[auth] signIn x link failed:", e);
        return "/auth/error?error=Unavailable";
      }

      return true;
    },
    async session({ session, token }) {
      if (!session.user || !token.sub) return session;

      const dbUser = await prisma.user.findUnique({
        where: { id: token.sub },
        select: {
          wallet: true,
          blueCheckmark: true,
          xHandle: true,
          name: true,
          image: true,
          email: true,
        },
      });

      let payoutWallet: string | null = null;
      try {
        const rows = await prisma.$queryRawUnsafe<Array<{ payoutWallet: string | null }>>(
          `SELECT "payoutWallet" FROM "User" WHERE "id" = $1 LIMIT 1`,
          token.sub,
        );
        payoutWallet = rows[0]?.payoutWallet ?? null;
      } catch {
        payoutWallet = null;
      }

      session.user.id = token.sub;
      session.user.wallet = dbUser?.wallet ?? null;
      session.user.payoutWallet = payoutWallet;
      session.user.blueCheckmark = dbUser?.blueCheckmark ?? false;
      session.user.xHandle = dbUser?.xHandle ?? null;
      if (dbUser?.name) session.user.name = dbUser.name;
      if (dbUser?.image) session.user.image = dbUser.image;
      if (dbUser?.email) session.user.email = dbUser.email;

      return session;
    },
  },
  events: {
    async signIn({ user, account }) {
      if (account?.provider !== "twitter" || !user?.id) return;

      const cookieStore = await cookies();
      const linkUserId = cookieStore.get(X_LINK_USER_COOKIE)?.value?.trim() ?? null;
      cookieStore.delete(X_LINK_USER_COOKIE);

      if (!linkUserId || linkUserId === user.id) return;

      try {
        await reassignTwitterAccountToUser(user.id, linkUserId);
      } catch (e) {
        console.error("[auth][x] account reassignment failed:", e);
      }
    },
  },
});
