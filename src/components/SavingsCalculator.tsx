"use client";

import { primary, toInr } from "@/lib/product";
import { DEFAULT_DAILY_KM, petrolSaving } from "@/lib/savings";
import type { Product } from "@/lib/types";
import { useState } from "react";

export default function SavingsCalculator({ product }: { product: Product }) {
  const [kmText, setKmText] = useState(String(DEFAULT_DAILY_KM));
  const km = Math.min(400, Math.max(1, parseInt(kmText, 10) || DEFAULT_DAILY_KM));
  const [daily, monthly] = petrolSaving(product, primary(product), km);
  return (
    <div className="space-y-2 rounded-xl bg-primary-container p-4 text-on-primary-container">
      <p className="text-sm font-semibold">Petrol saving calculator</p>
      <p className="text-[11px]">
        Uses motor watt, charger amp, and charge time. Default is {DEFAULT_DAILY_KM} km a day. Petrol assumed at 40 km/l and
        ₹100/litre.
      </p>
      <label className="block max-w-xs text-xs">
        Daily running (km)
        <input
          className="field mt-1 text-foreground"
          inputMode="numeric"
          value={kmText}
          onChange={(e) => setKmText(e.target.value.replace(/\D/g, "").slice(0, 3))}
        />
      </label>
      <p className="text-[13px] font-medium">Daily saving {toInr(daily)}</p>
      <p className="text-base font-bold text-saving">Saves {toInr(monthly)} petrol per month</p>
    </div>
  );
}
