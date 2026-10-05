import { discountPercent, primary } from "./product";
import type { Product } from "./types";

export type SortKey = "priceLow" | "priceHigh" | "newest" | "discount" | "range";

export const SORT_OPTIONS: { key: SortKey; label: string; short: string }[] = [
  { key: "priceLow", label: "Price: Low to High", short: "Low to High" },
  { key: "priceHigh", label: "Price: High to Low", short: "High to Low" },
  { key: "newest", label: "Newest first", short: "Newest" },
  { key: "discount", label: "Biggest discount", short: "Discount" },
  { key: "range", label: "Longest range", short: "Range" },
];

export type PriceBandKey = "under50" | "50to80" | "80to100" | "above100";

export const PRICE_BANDS: { key: PriceBandKey; label: string; min: number; max: number }[] = [
  { key: "under50", label: "Under ₹50,000", min: 0, max: 50_000 },
  { key: "50to80", label: "₹50,000 – ₹80,000", min: 50_000, max: 80_000 },
  { key: "80to100", label: "₹80,000 – ₹1 lakh", min: 80_000, max: 100_000 },
  { key: "above100", label: "Above ₹1 lakh", min: 100_000, max: Infinity },
];

export type RangeBandKey = "upto60" | "60to80" | "80to100" | "100to120" | "120to140";

export const RANGE_BANDS: { key: RangeBandKey; label: string; min: number; max: number }[] = [
  { key: "upto60", label: "Up to 60 km", min: 0, max: 60 },
  { key: "60to80", label: "60 – 80 km", min: 61, max: 80 },
  { key: "80to100", label: "80 – 100 km", min: 81, max: 100 },
  { key: "100to120", label: "100 – 120 km", min: 101, max: 120 },
  { key: "120to140", label: "120 – 140 km", min: 121, max: 140 },
];

export type LightKey = "single" | "double" | "other";

export const LIGHT_TYPES: { key: LightKey; label: string }[] = [
  { key: "single", label: "Single light" },
  { key: "double", label: "Double light" },
  { key: "other", label: "Other" },
];

const SINGLE_LIGHT = /\b(single|singal|sinle|singel)\s*light/i;
const DOUBLE_LIGHT = /\b(double|duble|dubble|dual)\s*light/i;

export function lightType(p: Product): LightKey {
  const text = `${p.name} ${p.modelName} ${p.category}`;
  if (DOUBLE_LIGHT.test(text)) return "double";
  if (SINGLE_LIGHT.test(text)) return "single";
  return "other";
}

export const rangeLabel = (p: Product) =>
  [...new Set(p.variants.map((v) => v.rangeKm).filter((km) => km > 0))]
    .sort((a, b) => a - b)
    .map((km) => `${km} km`)
    .join(" / ");

export type CatalogFilter = {
  sort: SortKey;
  price: PriceBandKey | null;
  battery: string | null;
  range: RangeBandKey | null;
  light: LightKey | null;
};

export const DEFAULT_FILTER: CatalogFilter = { sort: "priceLow", price: null, battery: null, range: null, light: null };

export const activeFilterCount = (f: CatalogFilter) => [f.price, f.battery, f.range, f.light].filter(Boolean).length;

export function applyFilter(products: Product[], f: CatalogFilter): Product[] {
  const band = PRICE_BANDS.find((b) => b.key === f.price);
  const km = RANGE_BANDS.find((b) => b.key === f.range);
  const battery = f.battery?.toLowerCase();
  const matching = products.filter(
    (p) =>
      (!f.light || lightType(p) === f.light) &&
      p.variants.some(
        (v) =>
          (!band || (v.offerPrice >= band.min && v.offerPrice < band.max)) &&
          (!battery || v.battery.trim().toLowerCase() === battery) &&
          (!km || (v.rangeKm >= km.min && v.rangeKm <= km.max)),
      ),
  );
  const best = (p: Product, pick: (v: Product["variants"][number]) => number) => Math.max(0, ...p.variants.map(pick));
  const sorted = [...matching];
  switch (f.sort) {
    case "priceLow":
      return sorted.sort((a, b) => primary(a).offerPrice - primary(b).offerPrice);
    case "priceHigh":
      return sorted.sort((a, b) => primary(b).offerPrice - primary(a).offerPrice);
    case "newest":
      return sorted.sort((a, b) => b.listedAt - a.listedAt);
    case "discount":
      return sorted.sort((a, b) => best(b, discountPercent) - best(a, discountPercent));
    case "range":
      return sorted.sort((a, b) => best(b, (v) => v.rangeKm) - best(a, (v) => v.rangeKm));
  }
}

export function batteryOptions(products: Product[]) {
  const seen = new Map<string, string>();
  products.forEach((p) =>
    p.variants.forEach((v) => {
      const b = v.battery.trim();
      if (b && !seen.has(b.toLowerCase())) seen.set(b.toLowerCase(), b);
    }),
  );
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}
