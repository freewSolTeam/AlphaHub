"use client";

import type { ProjectForm } from "@/lib/project-schema";
import { PRICE_CURRENCIES } from "@/lib/payment-currency";

type Props = {
  value: ProjectForm["priceCurrency"];
  onChange: (c: ProjectForm["priceCurrency"]) => void;
  className?: string;
  id?: string;
};

export function PriceCurrencySelect({ value, onChange, className = "ui-form-input", id }: Props) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value as ProjectForm["priceCurrency"])}
      className={className}
    >
      {PRICE_CURRENCIES.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}
