import { prisma } from "@/lib/prisma";

/**
 * After OAuth, Auth.js may attach the Twitter account to a throwaway user when the
 * wallet JWT session was not detected. Reassign the account to the wallet user.
 */
export async function reassignTwitterAccountToUser(oauthUserId: string, walletUserId: string) {
  if (oauthUserId === walletUserId) return;

  await prisma.$transaction(async (tx) => {
    const twitterAcc = await tx.account.findFirst({
      where: { userId: oauthUserId, provider: "twitter" },
    });
    if (!twitterAcc) return;

    const existingForWallet = await tx.account.findFirst({
      where: { userId: walletUserId, provider: "twitter" },
    });

    if (existingForWallet) {
      await tx.account.delete({ where: { id: twitterAcc.id } });
    } else {
      await tx.account.update({
        where: { id: twitterAcc.id },
        data: { userId: walletUserId },
      });
    }

    const remainingAccounts = await tx.account.count({ where: { userId: oauthUserId } });
    const projectCount = await tx.project.count({ where: { userId: oauthUserId } });
    if (remainingAccounts === 0 && projectCount === 0) {
      await tx.user.delete({ where: { id: oauthUserId } }).catch(() => {});
    }
  });
}
