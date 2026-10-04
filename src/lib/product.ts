import { coverageFor } from "./cities";
import type { Product, ProductVariant } from "./types";

export const savings = (v: ProductVariant) => Math.max(0, v.mrp - v.offerPrice);

export const discountPercent = (v: ProductVariant) =>
  v.mrp <= 0 || v.offerPrice >= v.mrp ? 0 : Math.round((savings(v) * 100) / v.mrp);

export const primary = (p: Product): ProductVariant =>
  p.variants.reduce((low, v) => (v.offerPrice < low.offerPrice ? v : low), p.variants[0]);

export const variantById = (p: Product, id?: string | null) => p.variants.find((v) => v.id === id) ?? primary(p);

export const hasRating = (p: Product) => p.rating > 0 && p.reviewCount > 0;

export const sellerLabel = (p: Product) => {
  if (p.sellerName.trim()) return p.sellerName;
  if (p.sellerId === "showroom" || !p.sellerId) return "Devbhoomi Electrics";
  return "Seller";
};

export const colorList = (p: Product) => (p.colors.length ? p.colors : [p.color].filter((c) => c.trim()));

export function availableIn(p: Product, city: string) {
  if (!city.trim()) return true;
  if (p.cities.some((c) => c.toLowerCase() === "all india")) return true;
  let covered: string[];
  if (p.cities.length) covered = p.cities;
  else if (p.sellerId === "showroom" || !p.sellerId) covered = coverageFor(p.category);
  else return true;
  return covered.some((c) => c.toLowerCase() === city.toLowerCase());
}

export function resolvedMotorWatt(p: Product) {
  if (p.motorWatt > 0) return p.motorWatt;
  const spec = p.specifications.find((s) => s.label.toLowerCase() === "motor")?.value ?? "";
  const n = parseFloat(spec.match(/(\d+(?:\.\d+)?)/)?.[1] ?? "");
  if (Number.isNaN(n)) return 0;
  return /kw/i.test(spec) ? Math.round(n * 1000) : Math.round(n);
}

export function resolvedChargeHours(p: Product) {
  if (p.chargeHours > 0) return p.chargeHours;
  const spec = p.specifications.find((s) => s.label.toLowerCase() === "charge time")?.value ?? "";
  const n = parseFloat(spec.match(/(\d+(?:\.\d+)?)/)?.[1] ?? "");
  return Number.isNaN(n) ? 0 : n;
}

export function cardMeta(p: Product) {
  const parts: string[] = [];
  const model = p.modelName || p.category;
  if (model) parts.push(model);
  const watt = resolvedMotorWatt(p);
  if (watt > 0) parts.push(`${watt} W`);
  if (p.chargerAmp > 0) parts.push(`${p.chargerAmp} A`);
  const shades = colorList(p);
  if (shades.length) parts.push(shades.join("/"));
  return parts.join(" · ");
}

export const greetingName = (name?: string) => (name ?? "").split(" ")[0] || "Rider";

export const isAdmin = (role?: string) => (role ?? "").toLowerCase() === "admin";

export function normalizePhone(raw: string) {
  const d = raw.replace(/\D/g, "");
  if (d.length === 12 && d.startsWith("91")) return d.slice(2);
  if (d.length === 11 && d.startsWith("0")) return d.slice(1);
  return d;
}

export const cartLineId = (productId: string, variantId: string) => `${productId}_${variantId}`;

const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
export const toInr = (n: number) => inr.format(n);

export const formatWhen = (t: number) =>
  new Date(t).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });

export const formatDate = (t: number) =>
  new Date(t).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
