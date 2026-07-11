import { CreatorAvatar } from "@/components/creator-avatar";
import { XUsername } from "@/components/x-username";
import type { Project, User } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

type T = Project & {
  user: Pick<User, "name" | "image" | "wallet" | "xHandle"> & {
    accounts?: { providerAccountId: string }[];
  };
  priceOptions?: { priceAmount: number; telegramUrl?: string | null; discordUrl?: string | null }[];
};

type Props = {
  project: T;
  featured?: boolean;
};

export function ProjectCard({ project, featured = false }: Props) {
  return (
    <Link
      href={`/p/${project.slug}`}
      className={`group flex h-full flex-col rounded-2xl border border-white/8 bg-rh-elevated/80 transition hover:border-brand/25 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] ${
        featured ? "p-6 sm:p-8" : "p-3.5 sm:p-4"
      }`}
    >
      <div className={`flex min-w-0 items-start gap-3 ${featured ? "flex-col sm:flex-row" : ""}`}>
        {project.communityImage ? (
          <div
            className={`relative shrink-0 overflow-hidden rounded-xl border border-white/8 ${
              featured ? "h-16 w-16 sm:h-20 sm:w-20" : "mt-0.5 h-10 w-10"
            }`}
          >
            <Image
              src={project.communityImage}
              alt=""
              width={featured ? 80 : 40}
              height={featured ? 80 : 40}
              unoptimized
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div
            className={`flex shrink-0 items-center justify-center rounded-xl border border-brand/15 bg-brand/5 font-bold text-brand ${
              featured ? "h-16 w-16 text-xl sm:h-20 sm:w-20" : "mt-0.5 h-10 w-10 text-xs"
            }`}
          >
            {project.title.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          {featured ? (
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-brand">Featured</p>
          ) : null}
          <h3
            className={`font-semibold leading-snug tracking-tight text-white ${
              featured ? "text-xl sm:text-2xl" : "text-sm"
            }`}
          >
            {project.title}
          </h3>
        </div>
      </div>

      <p
        className={`leading-relaxed text-stone-500 ${
          featured ? "mt-4 line-clamp-3 text-sm sm:line-clamp-4" : "mt-2 line-clamp-2 text-[11px]"
        }`}
      >
        {project.shortPitch}
      </p>

      <div
        className={`mt-auto flex items-center gap-1.5 border-t border-white/6 text-xs text-stone-500 ${
          featured ? "pt-4" : "mt-3 pt-2.5"
        }`}
      >
        <CreatorAvatar
          src={project.user.image}
          width={16}
          height={16}
          className="h-4 w-4 shrink-0 rounded-full border border-white/8 object-cover"
          alt={project.user.name || "Creator"}
        />
        <span className="min-w-0">
          <span className="inline-flex min-w-0 items-center gap-1 leading-none">
            <span className="text-stone-600">by</span>
            <XUsername
              name={project.user.name || "Anonymous creator"}
              xHandle={project.user.xHandle}
              xUserId={project.user.accounts?.[0]?.providerAccountId}
              className="truncate text-stone-400"
              asNestedInLink
            />
            {project.user.wallet ? (
              <Image
                src="/verified-badge.png"
                alt="Verified"
                width={12}
                height={12}
                className="h-3 w-3 shrink-0"
              />
            ) : null}
          </span>
        </span>
        {featured ? (
          <span className="ml-auto text-xs font-medium text-brand transition group-hover:underline">View →</span>
        ) : null}
      </div>
    </Link>
  );
}
