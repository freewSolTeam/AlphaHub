"use client";

import { DecimalPriceInput } from "@/components/decimal-price-input";
import { ListingPayoutSetup } from "@/components/listing-payout-setup";
import { resolveOperatorPayoutAddress } from "@/components/operator-payout-display";
import { PriceCurrencySelect } from "@/components/price-currency-select";
import { formatAmountWithCurrency, resolvePriceCurrency } from "@/lib/payment-currency";
import { PlatformIcons } from "@/components/platform-icons";
import { PriceOptionsField } from "@/components/price-options-field";
import { ProjectDetailImagesField } from "@/components/project-detail-images-field";
import { TELEGRAM_GROUP_BOT_UI, TELEGRAM_GROUP_ID_FORM_UI } from "@/lib/feature-flags";
import { normalizeProjectForm, projectFormSchema, type ProjectForm } from "@/lib/project-schema";
import { uploadCommunityLogoFile } from "@/lib/upload-community-client";
import { shortWalletAddress } from "@/lib/wallet-display";
import { useRobinhoodWallet } from "@/hooks/use-robinhood-wallet";
import { useWalletConnect } from "@/hooks/use-wallet-connect";
import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo, useState, type ReactNode } from "react";

const initialValues: ProjectForm = {
  title: "",
  shortPitch: "",
  description: "",
  groupType: "PUBLIC",
  accessType: "FREE",
  priceAmount: undefined,
  priceCurrency: "USDG",
  category: "",
  rules: "",
  deliveryPolicy: "",
  communityImage: "",
  detailImages: [] as string[],
  telegram: "",
  discord: "",
  telegramGroupChatId: "",
  published: false,
  priceOptions: [] as NonNullable<import("@/lib/project-schema").ProjectForm["priceOptions"]>,
};

type Props = {
  creatorName: string | null;
  creatorImage: string | null;
  wallet: string | null;
  payoutWallet: string | null;
};

function FormSection({
  title,
  subtitle,
  children,
  step,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  step?: number;
}) {
  return (
    <section className="card-rh scroll-mt-24">
      <div className="flex items-start gap-3 border-b border-[var(--rh-border)] px-4 py-3.5 sm:px-5">
        {step != null ? (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded border border-brand/30 bg-brand/10 font-mono text-[11px] font-semibold text-brand">
            {step}
          </span>
        ) : null}
        <div className="min-w-0">
          <h2 className="ui-form-section-title">{title}</h2>
          {subtitle ? <p className="ui-form-hint mt-1">{subtitle}</p> : null}
        </div>
      </div>
      <div className="space-y-4 p-4 sm:p-5">{children}</div>
    </section>
  );
}

function FormField({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div>
      <label className="ui-form-label">{label}</label>
      {hint ? <p className="ui-form-hint mt-1 mb-2">{hint}</p> : <div className="mt-2" />}
      {children}
    </div>
  );
}

function formatPreviewPrice(v: ProjectForm) {
  if (v.groupType === "PUBLIC") return null;
  if (v.accessType !== "PAID") return "Free";
  const currency = resolvePriceCurrency(v.priceCurrency);
  const line = (amount: number) => formatAmountWithCurrency(amount, currency);
  const opts = (v.priceOptions ?? []).filter((o) => o.label.trim().length > 0 && o.priceAmount > 0);
  if (opts.length > 1) {
    const min = Math.min(...opts.map((o) => o.priceAmount));
    return `from ${line(min)}`;
  }
  if (opts.length === 1) return line(opts[0].priceAmount);
  return line(v.priceAmount ?? 0);
}


export function NewProjectSplit({ creatorName, creatorImage, wallet, payoutWallet: initialPayout }: Props) {
  const router = useRouter();
  const rhWallet = useRobinhoodWallet();
  const { connectWallet } = useWalletConnect();
  const [payoutWallet, setPayoutWallet] = useState(initialPayout);
  const [values, setValues] = useState<ProjectForm>(initialValues);
  const [submitting, setSubmitting] = useState(false);
  const [communityImageFile, setCommunityImageFile] = useState<File | null>(null);
  const [communityImagePreview, setCommunityImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof ProjectForm>(k: K, v: ProjectForm[K]) => {
    setValues((prev) => {
      const next = { ...prev, [k]: v } as ProjectForm;
      if (k === "groupType" && v === "PUBLIC") next.accessType = "FREE";
      return next;
    });
  };

  const showPrice = values.groupType === "PRIVATE" && values.accessType === "PAID";
  const activePayout = resolveOperatorPayoutAddress({ wallet, payoutWallet });
  const hasAccessTiers = showPrice && (values.priceOptions?.length ?? 0) > 0;
  const previewPrice = formatPreviewPrice(values);
  const communityImageSrc = communityImagePreview ?? values.communityImage ?? "";
  const titleInitial = useMemo(
    () => (values.title.trim().charAt(0) || "C").toUpperCase(),
    [values.title],
  );
  const isVip = values.accessType === "PAID";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (showPrice && values.published && !activePayout) {
      setError("Set your payout wallet before publishing a paid listing.");
      setSubmitting(false);
      return;
    }

    const parsed = projectFormSchema.safeParse({
      ...values,
      communityImage: values.communityImage || undefined,
      detailImages: values.detailImages ?? [],
      discord: values.discord || undefined,
    });

    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      setError(firstIssue?.message ?? "Please check your fields.");
      setSubmitting(false);
      return;
    }

    try {
      let payload = normalizeProjectForm(parsed.data);
      if (communityImageFile) {
        const imageUrl = await uploadCommunityLogoFile(communityImageFile);
        payload = { ...payload, communityImage: imageUrl };
      }
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const body = (await res.json().catch(() => ({}))) as { id?: string; error?: unknown };
      if (!res.ok) {
        throw new Error(typeof body.error === "string" ? body.error : "Failed to create project");
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setSubmitting(false);
    }
  }

  if (!rhWallet.isConnected) {
    return (
      <div className="card-rh border-brand/20 bg-brand/5 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-[var(--rh-foreground)]">Connect wallet first</h2>
        <p className="mt-2 max-w-lg text-sm leading-relaxed text-[var(--rh-muted)]">
          You must connect your Robinhood Chain wallet before creating a new listing.
        </p>
        {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void connectWallet()}
            disabled={rhWallet.isConnecting}
            className="btn-rh-primary"
          >
            {rhWallet.isConnecting ? "Connecting…" : "Connect wallet"}
          </button>
          <button type="button" onClick={() => router.push("/dashboard")} className="btn-rh-secondary">
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  const publishCheckbox = (
    <label className="flex cursor-pointer items-center gap-2.5 text-sm text-[var(--rh-muted)]">
      <input
        type="checkbox"
        checked={!!values.published}
        onChange={(e) => set("published", e.target.checked)}
        className="ui-form-checkbox"
      />
      Publish in directory
    </label>
  );

  const submitBar = (
    <div className="space-y-3 border-t border-[var(--rh-border)] pt-4">
      {publishCheckbox}
      {error ? (
        <div className="rounded border border-rose-500/30 bg-rose-950/20 px-3 py-2 text-sm text-rose-200">{error}</div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={submitting} className="btn-rh-primary">
          {submitting ? "Saving…" : "Create listing"}
        </button>
        <button type="button" onClick={() => router.push("/dashboard")} className="btn-rh-secondary">
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px] lg:items-start">
      <form onSubmit={onSubmit} className="space-y-5">
        <FormSection
          step={1}
          title="Call details"
          subtitle="Name, pitch, and visuals shown on explore cards."
        >
          <FormField label="Name">
            <input
              value={values.title}
              onChange={(e) => set("title", e.target.value)}
              className="ui-form-input"
              placeholder="e.g. Alpha Insider Club"
            />
          </FormField>

          <FormField label="Pitch">
            <textarea
              value={values.shortPitch}
              onChange={(e) => set("shortPitch", e.target.value)}
              className="ui-form-input min-h-[72px]"
              placeholder="One line pitch."
            />
          </FormField>

          <FormField label="Description" hint="Optional — longer context for your listing page.">
            <textarea
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
              className="ui-form-input min-h-[96px]"
              placeholder="What members get, your edge, etc."
            />
          </FormField>

          <FormField label="Degen logo" hint="PNG, JPEG, WebP, or GIF — max 2MB. Shown on explore cards.">
            <div className="flex flex-wrap items-center gap-3">
              {communityImageSrc ? (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded border border-[var(--rh-border)]">
                  <Image
                    src={communityImageSrc}
                    alt=""
                    width={56}
                    height={56}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : null}
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  e.currentTarget.value = "";
                  if (!f) return;
                  setError(null);
                  setCommunityImageFile(f);
                  setCommunityImagePreview(URL.createObjectURL(f));
                  set("communityImage", "");
                }}
                className="ui-form-file max-w-xs"
              />
              {communityImageSrc ? (
                <button
                  type="button"
                  onClick={() => {
                    setCommunityImageFile(null);
                    setCommunityImagePreview(null);
                    set("communityImage", "");
                  }}
                  className="btn-rh-ghost !px-2 !py-1 text-xs"
                >
                  Remove
                </button>
              ) : null}
            </div>
          </FormField>

          <ProjectDetailImagesField
            compact
            images={values.detailImages}
            onChange={(next) => set("detailImages", next)}
            helpText="Shots of your product or Degen. Shown on the listing page."
            labelClass="ui-form-label"
          />
        </FormSection>

        <FormSection step={2} title="Access & price" subtitle="Public calls are free. Private calls can be open or VIP.">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Call type">
              <select
                value={values.groupType}
                onChange={(e) => set("groupType", e.target.value as ProjectForm["groupType"])}
                className="ui-form-input"
              >
                <option value="PUBLIC">Public</option>
                <option value="PRIVATE">Private</option>
              </select>
            </FormField>
            <FormField label="Access">
              <select
                value={values.accessType}
                onChange={(e) => set("accessType", e.target.value as ProjectForm["accessType"])}
                className="ui-form-input disabled:cursor-not-allowed disabled:opacity-45"
                disabled={values.groupType === "PUBLIC"}
              >
                <option value="FREE">Open / free</option>
                <option value="PAID">Paid / VIP</option>
              </select>
            </FormField>
          </div>

          {values.groupType === "PUBLIC" ? (
            <p className="ui-form-hint">Public listings are free. Price applies to private paid calls only.</p>
          ) : null}

          {showPrice ? (
            <ListingPayoutSetup
              loginWallet={wallet}
              payoutWallet={payoutWallet}
              required
              onSaved={setPayoutWallet}
            />
          ) : null}

          {showPrice && (values.priceOptions?.length ?? 0) === 0 ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField label="Price">
                <DecimalPriceInput
                  value={values.priceAmount}
                  onValueChange={(n) => set("priceAmount", n)}
                  className="ui-form-input"
                  placeholder="e.g. 0.002, 1.5"
                />
              </FormField>
              <FormField label="Currency" hint="USDG stablecoin or native ETH on Robinhood Chain.">
                <PriceCurrencySelect value={values.priceCurrency} onChange={(c) => set("priceCurrency", c)} />
              </FormField>
            </div>
          ) : null}

          {showPrice && (values.priceOptions?.length ?? 0) > 0 ? (
            <FormField label="Currency (all tiers)">
              <PriceCurrencySelect
                className="ui-form-input max-w-xs"
                value={values.priceCurrency}
                onChange={(c) => set("priceCurrency", c)}
              />
            </FormField>
          ) : null}

          {showPrice ? (
            <FormField label="Access tiers" hint="Optional — multiple price tiers with different Telegram/Discord links.">
              <PriceOptionsField
                value={values.priceOptions ?? []}
                onChange={(rows) => set("priceOptions", rows)}
                priceCurrency={values.priceCurrency}
                onCurrencyChange={(c) => set("priceCurrency", c)}
                showCurrency={false}
              />
            </FormField>
          ) : null}

          {showPrice && !hasAccessTiers ? (
            <FormField
              label="Telegram invite"
              hint={
                TELEGRAM_GROUP_BOT_UI
                  ? "Create the listing, then on Edit use bot verification to auto-fill invite and group id."
                  : "t.me invite for buyers. You can set it here or on Edit after save."
              }
            >
              <input
                value={values.telegram ?? ""}
                onChange={(e) => set("telegram", e.target.value)}
                className="ui-form-input"
                placeholder={TELEGRAM_GROUP_BOT_UI ? "https://t.me/+…" : "https://t.me/+…"}
              />
            </FormField>
          ) : null}

          {showPrice && hasAccessTiers ? (
            <p className="ui-form-hint">
              With tiers: set <strong className="text-[var(--rh-foreground)]">Telegram (tier)</strong> on each row.
              {TELEGRAM_GROUP_BOT_UI
                ? " For default link + group id, create the listing, then use bot verification on Edit."
                : " Set the default invite and group id on Edit after you save."}
            </p>
          ) : null}

          {showPrice && TELEGRAM_GROUP_ID_FORM_UI ? (
            <FormField
              label="Telegram group id"
              hint={
                TELEGRAM_GROUP_BOT_UI
                  ? "From bot verification or paste manually (e.g. -100…, @RawDataBot)."
                  : "Supergroup id (e.g. -100…). Get it from a bot in the group."
              }
            >
              <input
                value={values.telegramGroupChatId ?? ""}
                onChange={(e) => set("telegramGroupChatId", e.target.value)}
                className="ui-form-input max-w-md font-mono"
                placeholder="-1001234567890"
                inputMode="numeric"
              />
            </FormField>
          ) : null}

          <FormField label="Category">
            <input
              value={values.category ?? ""}
              onChange={(e) => set("category", e.target.value)}
              className="ui-form-input"
              placeholder="e.g. Alpha"
            />
          </FormField>

          <FormField label="Rules">
            <textarea
              value={values.rules}
              onChange={(e) => set("rules", e.target.value)}
              className="ui-form-input min-h-[96px]"
              placeholder="House rules for the room."
            />
          </FormField>

          <FormField label="How access is delivered">
            <textarea
              value={values.deliveryPolicy}
              onChange={(e) => set("deliveryPolicy", e.target.value)}
              className="ui-form-input min-h-[72px]"
              placeholder="What happens after payment, response time, etc."
            />
          </FormField>

          {hasAccessTiers ? submitBar : null}
        </FormSection>

        {!hasAccessTiers ? (
          <FormSection
            step={3}
            title="Links & publish"
            subtitle={
              showPrice
                ? "Use Discord here. For Telegram, use the paid / VIP block above."
                : "At least one: Telegram or Discord."
            }
          >
            {!showPrice ? (
              <FormField label="Telegram">
                <input
                  value={values.telegram}
                  onChange={(e) => set("telegram", e.target.value)}
                  className="ui-form-input"
                  placeholder="https://t.me/…"
                />
              </FormField>
            ) : null}
            <FormField label="Discord">
              <input
                value={values.discord ?? ""}
                onChange={(e) => set("discord", e.target.value)}
                className="ui-form-input"
                placeholder="https://discord.gg/…"
              />
            </FormField>
            {submitBar}
          </FormSection>
        ) : null}
      </form>

      <aside className="listing-form-preview">
        <div className="card-rh">
          <div className="border-b border-[var(--rh-border)] px-4 py-3 sm:px-5">
            <p className="ui-form-label !tracking-[0.14em]">Live preview</p>
            <p className="ui-form-hint mt-1">How your card appears in explore.</p>
          </div>
          <div className="space-y-4 p-4 sm:p-5">
            <div className="flex items-center gap-2.5 rounded border border-[var(--rh-border)] bg-[var(--rh-surface-elevated)] px-3 py-2.5">
              {creatorImage ? (
                <Image
                  src={creatorImage}
                  alt={creatorName || "Operator"}
                  width={28}
                  height={28}
                  className="h-7 w-7 rounded-full border border-[var(--rh-border)] object-cover"
                />
              ) : (
                <div className="h-7 w-7 rounded-full border border-[var(--rh-border)] bg-[var(--rh-surface)]" />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-[var(--rh-foreground)]">{creatorName || "Operator"}</p>
                <p className="font-mono text-[10px] text-[var(--rh-muted)]">
                  {activePayout ? shortWalletAddress(activePayout, 6, 4) : "No payout wallet"}
                </p>
              </div>
            </div>

            <div className="explore-listing-card pointer-events-none">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  {communityImageSrc ? (
                    <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded border border-[var(--rh-border)]">
                      <Image
                        src={communityImageSrc}
                        alt=""
                        width={48}
                        height={48}
                        unoptimized
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded border border-[var(--rh-border)] bg-[var(--rh-surface-elevated)] font-brand text-sm font-bold text-brand">
                      {titleInitial}
                    </div>
                  )}
                  <div className="min-w-0 pt-0.5">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-[var(--rh-foreground)]">
                      {values.title || "Untitled"}
                    </p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--rh-muted)]">
                      {values.groupType} · {isVip ? "VIP" : "Open"}
                    </p>
                  </div>
                </div>
                {isVip && values.groupType === "PRIVATE" ? (
                  <span className="badge-rh shrink-0 !px-2 !py-0.5 !text-[9px]">VIP</span>
                ) : null}
              </div>

              <p className="mt-4 line-clamp-2 text-sm leading-relaxed text-[var(--rh-muted)]">
                {values.shortPitch || "Your pitch preview will appear here…"}
              </p>

              {values.detailImages.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {values.detailImages.map((src, i) => (
                    <div
                      key={`${src}-${i}`}
                      className="relative h-10 w-10 shrink-0 overflow-hidden rounded border border-[var(--rh-border)]"
                    >
                      <Image src={src} alt="" width={40} height={40} unoptimized className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="mt-5 space-y-3 border-t border-[var(--rh-border)] pt-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="truncate text-xs text-[var(--rh-muted)]">{creatorName || "Operator"}</span>
                  {previewPrice ? (
                    <span className="text-xs font-medium tabular-nums text-[var(--rh-foreground)]">{previewPrice}</span>
                  ) : (
                    <span className="text-xs text-[var(--rh-muted)]">Free</span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <PlatformIcons
                    telegram={values.telegram ?? null}
                    discord={values.discord ?? null}
                    iconClassName="h-3.5 w-3.5 text-[var(--rh-muted)]"
                    hideIfEmpty
                    boxed
                  />
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.08em] text-brand opacity-70">
                    View <ArrowUpRight className="h-3 w-3" />
                  </span>
                </div>
              </div>
            </div>

            {values.category ? (
              <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--rh-muted)]">
                Category: <span className="text-[var(--rh-foreground)]">{values.category}</span>
              </p>
            ) : null}
          </div>
        </div>
      </aside>
    </div>
  );
}
