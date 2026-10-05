"use client";

import {
  activeFilterCount,
  LIGHT_TYPES,
  PRICE_BANDS,
  RANGE_BANDS,
  SORT_OPTIONS,
  type CatalogFilter,
  type LightKey,
  type PriceBandKey,
  type RangeBandKey,
  type SortKey,
} from "@/lib/filters";
import { useState } from "react";
import { CloseIcon } from "./Icons";

export default function CatalogFilterBar({
  filter,
  batteries,
  onChange,
}: {
  filter: CatalogFilter;
  batteries: string[];
  onChange: (f: CatalogFilter) => void;
}) {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState<PriceBandKey | null>(filter.price);
  const [battery, setBattery] = useState<string | null>(filter.battery);
  const [range, setRange] = useState<RangeBandKey | null>(filter.range);
  const [light, setLight] = useState<LightKey | null>(filter.light);
  const count = activeFilterCount(filter);
  const band = PRICE_BANDS.find((b) => b.key === filter.price);
  const kmBand = RANGE_BANDS.find((b) => b.key === filter.range);
  const lightLabel = LIGHT_TYPES.find((l) => l.key === filter.light)?.label;
  const openPanel = () => {
    setPrice(filter.price);
    setBattery(filter.battery);
    setRange(filter.range);
    setLight(filter.light);
    setOpen(true);
  };

  return (
    <>
      <div className="no-scrollbar flex items-center gap-2 overflow-x-auto">
        <label className="chip flex shrink-0 items-center gap-1.5" data-on>
          <SortIcon />
          <span className="sr-only">Sort by</span>
          <select
            value={filter.sort}
            onChange={(e) => onChange({ ...filter, sort: e.target.value as SortKey })}
            className="cursor-pointer bg-transparent pr-1 text-xs outline-none"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                Sort: {o.short}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="chip flex shrink-0 items-center gap-1.5" data-on={count > 0} onClick={openPanel}>
          <FilterIcon />
          {count > 0 ? `Filters (${count})` : "Filters"}
        </button>
        {band && (
          <button type="button" className="chip flex shrink-0 items-center gap-1" onClick={() => onChange({ ...filter, price: null })}>
            {band.label} <CloseIcon className="size-3.5" />
          </button>
        )}
        {filter.battery && (
          <button type="button" className="chip flex shrink-0 items-center gap-1" onClick={() => onChange({ ...filter, battery: null })}>
            {filter.battery} <CloseIcon className="size-3.5" />
          </button>
        )}
        {kmBand && (
          <button type="button" className="chip flex shrink-0 items-center gap-1" onClick={() => onChange({ ...filter, range: null })}>
            {kmBand.label} <CloseIcon className="size-3.5" />
          </button>
        )}
        {lightLabel && (
          <button type="button" className="chip flex shrink-0 items-center gap-1" onClick={() => onChange({ ...filter, light: null })}>
            {lightLabel} <CloseIcon className="size-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 md:items-center" onClick={() => setOpen(false)}>
          <div
            className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-t-2xl bg-background p-5 shadow-xl md:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="text-base font-semibold">Filters</p>
              <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1.5 hover:bg-surface-variant" aria-label="Close">
                <CloseIcon />
              </button>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Price</p>
              <div className="flex flex-wrap gap-2">
                {PRICE_BANDS.map((b) => (
                  <button
                    type="button"
                    key={b.key}
                    className="chip"
                    data-on={price === b.key}
                    onClick={() => setPrice(price === b.key ? null : b.key)}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Range</p>
              <div className="flex flex-wrap gap-2">
                {RANGE_BANDS.map((b) => (
                  <button type="button" key={b.key} className="chip" data-on={range === b.key} onClick={() => setRange(range === b.key ? null : b.key)}>
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Light</p>
              <div className="flex flex-wrap gap-2">
                {LIGHT_TYPES.map((l) => (
                  <button type="button" key={l.key} className="chip" data-on={light === l.key} onClick={() => setLight(light === l.key ? null : l.key)}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>
            {batteries.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Battery</p>
                <div className="flex flex-wrap gap-2">
                  {batteries.map((b) => {
                    const on = battery?.toLowerCase() === b.toLowerCase();
                    return (
                      <button type="button" key={b} className="chip" data-on={on} onClick={() => setBattery(on ? null : b)}>
                        {b}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                className="btn btn-outline flex-1"
                onClick={() => {
                  onChange({ ...filter, price: null, battery: null, range: null, light: null });
                  setOpen(false);
                }}
              >
                Clear all
              </button>
              <button
                type="button"
                className="btn btn-primary flex-1"
                onClick={() => {
                  onChange({ ...filter, price, battery, range, light });
                  setOpen(false);
                }}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const SortIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
    <path d="M3 6h18M6 12h12M10 18h4" />
  </svg>
);

const FilterIcon = () => (
  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M22 3H2l8 9.5V19l4 2v-8.5z" />
  </svg>
);
