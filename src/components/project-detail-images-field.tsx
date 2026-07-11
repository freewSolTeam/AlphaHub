"use client";

import { uploadCommunityLogoFile } from "@/lib/upload-community-client";
import Image from "next/image";
import { useState } from "react";

const MAX = 3;

type Props = {
  images: string[];
  onChange: (next: string[]) => void;
  helpText: string;
  labelClass: string;
  /** Smaller type + spacing (new-listing split form) */
  compact?: boolean;
};

export function ProjectDetailImagesField({ images, onChange, helpText, labelClass, compact }: Props) {
  const [uploading, setUploading] = useState(false);

  async function addFile(file: File) {
    if (images.length >= MAX) return;
    setUploading(true);
    try {
      const url = await uploadCommunityLogoFile(file);
      onChange([...images, url].slice(0, MAX));
    } finally {
      setUploading(false);
    }
  }

  const remove = (i: number) => {
    onChange(images.filter((_, idx) => idx !== i));
  };

  return (
    <div>
      <label className={`block ${labelClass}`}>Degen &amp; product images (optional)</label>
      <p className={compact ? "ui-form-hint mb-2" : "ui-form-hint mt-1"}>
        {helpText} Max {MAX} — same image rules as the logo (PNG, JPEG, WebP, GIF; 2MB).
      </p>
      <div className={compact ? "space-y-3" : "mt-2 space-y-3"}>
        <div className="flex flex-wrap items-start gap-2">
          {images.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className={
                compact
                  ? "relative h-16 w-20 shrink-0 overflow-hidden rounded border border-[var(--rh-border)] bg-[var(--rh-surface-elevated)]"
                  : "relative h-[72px] w-[90px] shrink-0 overflow-hidden rounded border border-[var(--rh-border)] bg-[var(--rh-surface-elevated)]"
              }
            >
              <Image
                src={url}
                alt=""
                width={90}
                height={72}
                unoptimized
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => remove(i)}
                className="absolute end-0.5 top-0.5 rounded bg-black/70 px-1 text-xs text-[var(--rh-foreground)] transition hover:bg-black/90"
                aria-label={`Remove image ${i + 1}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        {images.length < MAX && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              disabled={uploading}
              onChange={async (e) => {
                const f = e.currentTarget.files?.[0];
                e.currentTarget.value = "";
                if (f) await addFile(f);
              }}
              className={compact ? "ui-form-file max-w-xs" : "ui-form-file max-w-xs"}
            />
            {uploading ? <span className="ui-form-hint">Uploading…</span> : null}
          </div>
        )}
        {images.length > 0 && !compact ? (
          <p className="ui-form-hint">
            {images.length}/{MAX} image{images.length === 1 ? "" : "s"}.
          </p>
        ) : null}
      </div>
    </div>
  );
}
