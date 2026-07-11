import Link from "next/link";
import { CreatorAvatar } from "@/components/creator-avatar";
import { ListingCoverImage } from "@/components/listing-cover-image";
import { formatListingPrice } from "@/lib/listing-price";
import { PlatformIcons } from "@/components/platform-icons";
import { XUsername } from "@/components/x-username";
import type { Project, User } from "@prisma/client";

type PriceOption = {
  priceAmount: number;
  id: string;
  label: string;
  telegramUrl: string | null;
  discordUrl: string | null;
};

type UserFields = Pick<User, "name" | "image"> & {
  xHandle?: string | null;
  blueCheckmark?: boolean;
  accounts?: { providerAccountId: string }[];
};

type Props = {
  project: Pick<
    Project,
    | "id"
    | "slug"
    | "title"
    | "shortPitch"
    | "communityImage"
    | "accessType"
    | "groupType"
    | "priceAmount"
    | "priceCurrency"
    | "telegram"
    | "discord"
  > & {
    user: UserFields;
    priceOptions: PriceOption[];
  };
  showOperatorHandle?: boolean;
  compact?: boolean;
};

function ListingThumb({
  slug,
  title,
  communityImage,
}: {
  slug: string;
  title: string;
  communityImage: string | null;
}) {
  return (
    <ListingCoverImage slug={slug} communityImage={communityImage} alt={title} fill className="object-cover" />
  );
}

function explorePriceLabel(p: Props["project"], priceOptions: PriceOption[]) {
  const raw = formatListingPrice(p, priceOptions);
  if (raw === "—") return "Open";
  return raw;
}

export function CommunityListingCard({ project: p, showOperatorHandle = false, compact = false }: Props) {
  const isVip = p.accessType === "PAID";
  const typeLabel = p.groupType === "PUBLIC" ? "Public" : "Private";
  const accessLabel = isVip ? "VIP" : "Open";
  const priceLabel = explorePriceLabel(p, p.priceOptions);
  const isPaidPrice = isVip && p.groupType !== "PUBLIC" && priceLabel !== "Free";
  const pitch = p.shortPitch?.trim();

  if (compact) {
    return (
      <Link href={`/p/${p.slug}`} className="explore-tile-card group">
        <div className="explore-tile-media">
          <ListingThumb slug={p.slug} title={p.title} communityImage={p.communityImage} />
          {isVip ? <span className="explore-tile-badge">VIP</span> : null}
        </div>

        <div className="explore-tile-body">
          <p className="line-clamp-2 text-xs font-semibold leading-snug text-[var(--rh-foreground)]">{p.title}</p>
          <p className="text-[9px] uppercase tracking-[0.1em] text-[var(--rh-muted)]">
            {typeLabel}
            <span className="mx-1 text-[var(--rh-border)]">·</span>
            {accessLabel}
          </p>
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-1">
              <CreatorAvatar
                src={p.user.image}
                alt={p.user.name || "Operator"}
                width={14}
                height={14}
                className="h-3.5 w-3.5 shrink-0 border border-[var(--rh-border)] object-cover"
              />
              {showOperatorHandle ? (
                <XUsername
                  name={p.user.name || "Anonymous"}
                  xHandle={p.user.xHandle}
                  xUserId={p.user.accounts?.[0]?.providerAccountId}
                  asNestedInLink
                  className="truncate text-[9px] text-[var(--rh-subtle)]"
                />
              ) : (
                <span className="truncate text-[9px] text-[var(--rh-subtle)]">{p.user.name || "Operator"}</span>
              )}
            </div>
            <span className={`explore-price-tag shrink-0 !px-1 !py-px !text-[9px] ${isPaidPrice ? "explore-price-tag--paid" : ""}`}>
              {priceLabel}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/p/${p.slug}`} className="explore-listing-card group p-3">
      <div className="flex items-start gap-2.5">
        <div className="explore-directory-thumb">
          <ListingCoverImage
            slug={p.slug}
            communityImage={p.communityImage}
            alt={p.title}
            width={40}
            height={40}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate text-sm font-semibold text-[var(--rh-foreground)]">{p.title}</p>
            {isVip ? <span className="explore-meta-tag explore-meta-tag--vip">VIP</span> : null}
          </div>
          <p className="mt-0.5 text-[11px] text-[var(--rh-muted)]">
            {typeLabel} · {accessLabel}
          </p>
        </div>
      </div>

      <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[var(--rh-muted)]">{pitch}</p>

      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-[var(--rh-border)] pt-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <CreatorAvatar
            src={p.user.image}
            alt={p.user.name || "Operator"}
            width={18}
            height={18}
            className="h-[18px] w-[18px] shrink-0 border border-[var(--rh-border)] object-cover"
          />
          {showOperatorHandle ? (
            <XUsername
              name={p.user.name || "Anonymous"}
              xHandle={p.user.xHandle}
              xUserId={p.user.accounts?.[0]?.providerAccountId}
              asNestedInLink
              className="truncate text-[11px] text-[var(--rh-muted)]"
            />
          ) : (
            <span className="truncate text-[11px] text-[var(--rh-muted)]">{p.user.name || "Operator"}</span>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <PlatformIcons telegram={p.telegram} discord={p.discord} iconClassName="h-3 w-3 text-[var(--rh-muted)]" hideIfEmpty boxed />
          <span className={`explore-price-tag ${isPaidPrice ? "explore-price-tag--paid" : ""}`}>{priceLabel}</span>
        </div>
      </div>
    </Link>
  );
}
