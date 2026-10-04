"use client";

import { popularCities } from "@/lib/cities";
import { colorList, formatWhen, isAdmin, toInr } from "@/lib/product";
import { useShop } from "@/lib/shop";
import { listingCategories, scooterColors, type Product, type ProductVariant } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "./AccountScreens";
import { MinusIcon, PlusIcon, TrashIcon } from "./Icons";
import { DiscountLine, ProductGridCard } from "./ProductCards";
import ProductThumb from "./ProductThumb";

type Section = "products" | "orders" | "chats" | "trash";

export function SellerDashboard() {
  const { state, actions } = useShop();
  const profile = state.profile;
  const [section, setSection] = useState<Section>("products");
  const mine = state.products.filter((p) => p.sellerId === profile?.uid && !p.trashed);
  const trash = state.products.filter((p) => p.sellerId === profile?.uid && p.trashed);
  const tabs: [Section, string][] = [
    ["products", `Products ${mine.length}`],
    ["orders", `Orders ${state.sellerOrders.length}`],
    ["chats", `Chats ${state.sellerChats.length}`],
    ["trash", `Trash ${trash.length}`],
  ];
  return (
    <section className="space-y-3">
      <h1 className="text-lg font-semibold">Seller dashboard</h1>
      <div className="space-y-0.5 rounded-xl bg-primary p-4 text-on-primary">
        <p className="font-semibold">{profile?.name || "Seller"}</p>
        <p className="text-xs opacity-90">{profile?.email || "No email on this account"}</p>
        <p className="text-xs opacity-90">{profile?.mobile || "Mobile not added"}</p>
      </div>
      <div className="flex gap-2">
        <button type="button" className="btn btn-outline flex-1" onClick={() => actions.openAccountPage("editProfile")}>
          Edit details
        </button>
        <button type="button" className="btn btn-primary flex-1" onClick={() => actions.openSellerForm()}>
          Add product
        </button>
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {tabs.map(([key, label]) => (
          <button type="button" key={key} className="chip" data-on={section === key} onClick={() => setSection(key)}>
            {label}
          </button>
        ))}
      </div>

      {section === "orders" && (
        <div className="grid gap-2 md:grid-cols-2">
          {state.sellerOrders.length === 0 && <p className="text-xs text-muted">No queries yet.</p>}
          {state.sellerOrders.map((order) => (
            <div key={order.id} className="space-y-0.5 rounded-lg bg-surface p-3 text-xs ring-1 ring-black/5">
              <p className="text-sm font-medium">{order.buyerName || "Customer"}</p>
              {order.buyerEmail && <p>{order.buyerEmail}</p>}
              {order.buyerMobile && <p>{order.buyerMobile}</p>}
              {order.buyerCity && <p>{order.buyerCity}</p>}
              {order.createdAt > 0 && <p className="text-[11px] text-muted">{formatWhen(order.createdAt)}</p>}
              {order.lines.map((l, i) => (
                <p key={i}>
                  {l.name} · {l.variantLabel} · qty {l.qty}
                </p>
              ))}
              {order.note && <p className="text-muted">“{order.note}”</p>}
              <p className="text-[13px] font-semibold">{toInr(order.total)}</p>
              <button
                type="button"
                className="pt-1 text-primary hover:underline"
                onClick={() => {
                  const key = profile && order.sellerIds.includes(profile.uid) ? profile.uid : order.sellerIds[0] ?? "showroom";
                  actions.openOrderChat(order, key);
                }}
              >
                Chat about this order
              </button>
            </div>
          ))}
        </div>
      )}

      {section === "chats" && (
        <div className="grid gap-2 md:grid-cols-2">
          {state.sellerChats.length === 0 && <p className="text-xs text-muted">No chats yet. Product enquiries and order chats appear here.</p>}
          {state.sellerChats.map((chat) => (
            <button
              type="button"
              key={chat.id}
              onClick={() => actions.openExistingChat(chat)}
              className="rounded-lg bg-surface p-3 text-left ring-1 ring-black/5 hover:shadow-md"
            >
              <p className="text-sm font-medium">{chat.buyerName || "Customer"}</p>
              <p className="text-xs text-muted">{chat.productName || (chat.orderId ? "Order query" : "Chat")}</p>
            </button>
          ))}
        </div>
      )}

      {(section === "products" || section === "trash") && (
        <>
          {section === "products" && mine.length === 0 && (
            <p className="text-xs text-muted">No live listings. Add a product to start receiving queries.</p>
          )}
          {section === "trash" && trash.length === 0 && (
            <p className="text-xs text-muted">Trash is empty. Deleted listings stay here until you restore or remove them.</p>
          )}
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {(section === "products" ? mine : trash).map((p) => (
              <ProductGridCard key={p.id} product={p} onOpen={() => actions.openSellerProduct(p.id)} />
            ))}
          </div>
        </>
      )}

      <div className="grid gap-2 pt-2 sm:grid-cols-2">
        <button type="button" className="btn btn-outline" onClick={() => actions.openAccountPage("partner")}>
          Become a retail partner
        </button>
        <button type="button" className="btn btn-outline" onClick={() => actions.openAccountPage("help")}>
          Help & support
        </button>
        {isAdmin(profile?.role) && (
          <button type="button" className="btn btn-outline" onClick={() => actions.openAccountPage("adminPartners")}>
            Partner applications
          </button>
        )}
        <button type="button" className="btn btn-outline" onClick={() => actions.setSellerMode(false)}>
          Switch to customer
        </button>
        <button type="button" className="btn btn-outline" onClick={actions.signOut}>
          Sign out
        </button>
      </div>
    </section>
  );
}

export function SellerProductPage({ product }: { product: Product }) {
  const { actions } = useShop();
  const [confirm, setConfirm] = useState<"trash" | "delete" | null>(null);
  return (
    <section className="mx-auto max-w-2xl space-y-3">
      <PageHeader title={product.trashed ? "In trash" : "Your listing"} onBack={actions.closeSellerProduct} />
      <ProductThumb imageKey={product.images[0] ?? ""} className="h-48 w-full rounded-xl" />
      <h2 className="text-lg font-semibold">{product.name}</h2>
      <p className="text-xs text-muted">{[product.brand, product.category, product.color].filter(Boolean).join("  ·  ")}</p>
      <p className="text-[13px]">{product.description}</p>
      {product.variants.map((v) => (
        <div key={v.id} className="space-y-1 rounded-lg bg-surface p-3 ring-1 ring-black/5">
          <p className="text-sm font-medium">{v.label}</p>
          <p className="text-base font-bold">{toInr(v.offerPrice)}</p>
          <DiscountLine variant={v} />
          <div className="flex items-center">
            <span className="flex-1 text-xs">Stock {v.stock}</span>
            {!product.trashed && (
              <>
                <button type="button" onClick={() => actions.setStock(product, v.id, v.stock - 1)} className="rounded-full p-2 hover:bg-surface-variant" aria-label="Decrease stock">
                  <MinusIcon className="size-4" />
                </button>
                <button type="button" onClick={() => actions.setStock(product, v.id, v.stock + 1)} className="rounded-full p-2 hover:bg-surface-variant" aria-label="Increase stock">
                  <PlusIcon className="size-4" />
                </button>
              </>
            )}
          </div>
        </div>
      ))}
      {product.trashed ? (
        <>
          <button type="button" className="btn btn-primary w-full" onClick={() => actions.restoreProduct(product)}>
            Restore listing
          </button>
          <button type="button" className="btn btn-outline w-full" onClick={() => setConfirm("delete")}>
            <TrashIcon className="size-4" /> Delete forever
          </button>
        </>
      ) : (
        <>
          <button type="button" className="btn btn-primary w-full" onClick={() => actions.openSellerForm(product.id)}>
            Edit product
          </button>
          <button type="button" className="btn btn-outline w-full" onClick={() => setConfirm("trash")}>
            <TrashIcon className="size-4" /> Move to trash
          </button>
        </>
      )}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirm(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-sm space-y-3 rounded-2xl bg-background p-5">
            <p className="text-lg font-semibold">{confirm === "trash" ? "Move to trash?" : "Delete forever?"}</p>
            <p className="text-sm text-muted">
              {confirm === "trash"
                ? `${product.name} will leave the shop. You can restore it from Trash.`
                : `${product.name} will be removed from trash and cannot be restored.`}
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn btn-outline" onClick={() => setConfirm(null)}>
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  if (confirm === "trash") actions.moveToTrash(product);
                  else actions.deleteForever(product);
                  setConfirm(null);
                }}
              >
                {confirm === "trash" ? "Move to trash" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

type RangeDraft = { id: string; km: string; speed: string; battery: string; mrp: string; offer: string; stock: string };

const blankRange = (id: string): RangeDraft => ({ id, km: "", speed: "", battery: "", mrp: "", offer: "", stock: "5" });

function toVariant(d: RangeDraft): ProductVariant | null {
  const km = parseInt(d.km, 10);
  const mrp = parseInt(d.mrp.replace(/\D/g, ""), 10);
  const offer = parseInt(d.offer.replace(/\D/g, ""), 10);
  if (!(km > 0) || !(mrp > 0) || !(offer > 0) || offer > mrp) return null;
  return {
    id: d.id,
    label: `${km} km`,
    rangeKm: km,
    topSpeedKmh: parseInt(d.speed, 10) || 0,
    battery: d.battery.trim(),
    mrp,
    offerPrice: offer,
    stock: Math.max(0, parseInt(d.stock, 10) || 0),
  };
}

function discountPreview(mrpText: string, offerText: string) {
  const mrp = parseInt(mrpText.replace(/\D/g, ""), 10);
  const offer = parseInt(offerText.replace(/\D/g, ""), 10);
  if (!(mrp > 0) || !(offer > 0)) return "Enter MRP and offer price to see the real discount.";
  if (offer > mrp) return "Offer price cannot be higher than MRP.";
  if (offer === mrp) return "No discount. Offer price matches MRP.";
  return `Real discount ${toInr(mrp - offer)} off · ${Math.round(((mrp - offer) * 100) / mrp)}%`;
}

const specValue = (p: Product | undefined, label: string) => {
  const v = p?.specifications.find((s) => s.label.toLowerCase() === label.toLowerCase())?.value ?? "";
  return v === "—" ? "" : v;
};

export function SellerListingForm() {
  const { state, actions } = useShop();
  const editing = state.products.find((p) => p.id === state.editingProductId);
  const [name, setName] = useState(editing?.name ?? "");
  const [brand, setBrand] = useState(editing?.brand ?? "Devbhoomi");
  const [category, setCategory] = useState(editing?.category ?? "Activa style");
  const [modelName, setModelName] = useState(editing?.modelName || editing?.category || "Activa style");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [photos, setPhotos] = useState<File[]>([]);
  const [colors, setColors] = useState<string[]>(editing ? colorList(editing) : ["White"]);
  const [motorWatt, setMotorWatt] = useState(editing?.motorWatt ? String(editing.motorWatt) : specValue(editing, "Motor").replace(/\D/g, ""));
  const [chargeHours, setChargeHours] = useState(
    editing?.chargeHours ? String(editing.chargeHours) : specValue(editing, "Charge time").match(/(\d+(?:\.\d+)?)/)?.[1] ?? "",
  );
  const [chargerAmp, setChargerAmp] = useState(editing?.chargerAmp ? String(editing.chargerAmp) : "");
  const [warranty, setWarranty] = useState(specValue(editing, "Warranty") || "3 years");
  const [ranges, setRanges] = useState<RangeDraft[]>(
    editing?.variants.map((v) => ({
      id: v.id,
      km: String(v.rangeKm),
      speed: String(v.topSpeedKmh),
      battery: v.battery,
      mrp: String(v.mrp),
      offer: String(v.offerPrice),
      stock: String(v.stock),
    })) ?? [blankRange("a")],
  );
  const [allIndia, setAllIndia] = useState(editing?.cities.some((c) => c.toLowerCase() === "all india") ?? false);
  const [cities, setCities] = useState<string[]>(
    editing?.cities.filter((c) => c.toLowerCase() !== "all india").length
      ? editing.cities.filter((c) => c.toLowerCase() !== "all india")
      : [state.city],
  );

  const previews = useMemo(() => photos.map((f) => URL.createObjectURL(f)), [photos]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);
  const shown = previews.length ? previews : editing?.images ?? [];

  const toggle = (list: string[], item: string) =>
    list.some((x) => x.toLowerCase() === item.toLowerCase()) ? list.filter((x) => x.toLowerCase() !== item.toLowerCase()) : [...list, item];
  const updateRange = (i: number, patch: Partial<RangeDraft>) => setRanges(ranges.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const digits = (v: string, max: number) => v.replace(/\D/g, "").slice(0, max);
  const decimal = (v: string) => v.replace(/[^\d.]/g, "").slice(0, 4);

  const submit = () => {
    const variants = ranges.map(toVariant);
    actions.listProduct({
      name,
      brand,
      category,
      description,
      warranty,
      variants: variants.every(Boolean) ? (variants as ProductVariant[]) : [],
      cities: allIndia ? ["All India"] : cities.length ? cities : [state.city],
      photos,
      colors: colors.length ? colors : ["White"],
      modelName: modelName || category,
      motorWatt: parseInt(motorWatt, 10) || 0,
      chargerAmp: parseFloat(chargerAmp) || 0,
      chargeHours: parseFloat(chargeHours) || 0,
      existingId: editing?.id,
    });
  };

  const input = (value: string, onChange: (v: string) => void, label: string, inputMode?: "numeric" | "decimal") => (
    <label className="block text-xs">
      {label}
      <input className="field mt-1" value={value} inputMode={inputMode} onChange={(e) => onChange(e.target.value)} />
    </label>
  );

  return (
    <section className="mx-auto max-w-2xl space-y-3">
      <PageHeader title={editing ? "Edit scooter" : "List a scooter"} onBack={actions.closeAccountPage} />
      <p className="text-xs text-muted">Add photos, model style, colors, motor watt, and charger amp so buyers see clear savings.</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {input(name, setName, "Name")}
        {input(brand, setBrand, "Brand")}
      </div>
      <p className="text-xs">Model / category</p>
      <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
        {listingCategories.map((c) => (
          <button
            type="button"
            key={c}
            className="chip"
            data-on={category === c}
            onClick={() => {
              setCategory(c);
              setModelName(c);
            }}
          >
            {c}
          </button>
        ))}
      </div>
      {input(modelName, setModelName, "Model name")}
      <label className="block text-xs">
        Description
        <textarea className="field mt-1" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>

      <p className="text-xs">Photos (up to 3)</p>
      {shown.length > 0 && (
        <div className="flex gap-2">
          {shown.map((src, i) => (
            <ProductThumb key={`${src}-${i}`} imageKey={src} className="size-22 rounded-lg" />
          ))}
        </div>
      )}
      <label className="btn btn-outline cursor-pointer">
        {photos.length ? "Change photos" : "Choose photos"}
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => setPhotos(Array.from(e.target.files ?? []).slice(0, 3))}
        />
      </label>

      <p className="text-xs">Colors</p>
      <div className="flex flex-wrap gap-1.5">
        {scooterColors.map((c) => (
          <button type="button" key={c} className="chip" data-on={colors.some((x) => x.toLowerCase() === c.toLowerCase())} onClick={() => setColors(toggle(colors, c))}>
            {c}
          </button>
        ))}
      </div>

      <p className="text-[13px] font-medium">Specifications</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {input(motorWatt, (v) => setMotorWatt(digits(v, 5)), "Motor watt (W)", "numeric")}
        {input(chargeHours, (v) => setChargeHours(decimal(v)), "Charge time (hours)", "decimal")}
        {input(chargerAmp, (v) => setChargerAmp(decimal(v)), "Charger ampere (A)", "decimal")}
        {input(warranty, setWarranty, "Warranty")}
      </div>

      <p className="text-[13px] font-medium">Range options</p>
      {ranges.map((r, i) => (
        <div key={r.id} className="space-y-2 rounded-lg bg-surface p-3 ring-1 ring-black/5">
          <p className="text-xs font-medium">Range {i + 1}</p>
          <div className="grid gap-2 sm:grid-cols-3">
            {input(r.km, (v) => updateRange(i, { km: digits(v, 4) }), "Range (km)", "numeric")}
            {input(r.speed, (v) => updateRange(i, { speed: digits(v, 3) }), "Top speed (km/h)", "numeric")}
            {input(r.battery, (v) => updateRange(i, { battery: v }), "Battery")}
            {input(r.mrp, (v) => updateRange(i, { mrp: digits(v, 8) }), "MRP (₹)", "numeric")}
            {input(r.offer, (v) => updateRange(i, { offer: digits(v, 8) }), "Offer price (₹)", "numeric")}
            {input(r.stock, (v) => updateRange(i, { stock: digits(v, 4) }), "Stock", "numeric")}
          </div>
          <p className="text-xs text-primary">{discountPreview(r.mrp, r.offer)}</p>
          {ranges.length > 1 && (
            <button type="button" className="text-xs text-danger" onClick={() => setRanges(ranges.filter((_, j) => j !== i))}>
              Remove this range
            </button>
          )}
        </div>
      ))}
      <button type="button" className="btn btn-outline" onClick={() => setRanges([...ranges, blankRange(`r${Date.now().toString(36)}`)])}>
        Add another range
      </button>

      <p className="text-[13px] font-medium">Available in</p>
      <button type="button" className="chip" data-on={allIndia} onClick={() => setAllIndia(!allIndia)}>
        All India
      </button>
      {!allIndia && (
        <div className="flex flex-wrap gap-1.5">
          {Array.from(new Set([state.city, ...popularCities])).map((c) => (
            <button type="button" key={c} className="chip" data-on={cities.some((x) => x.toLowerCase() === c.toLowerCase())} onClick={() => setCities(toggle(cities, c))}>
              {c}
            </button>
          ))}
        </div>
      )}

      {state.error && <p className="text-xs text-danger">{state.error}</p>}
      <button type="button" className="btn btn-primary w-full" disabled={state.busy} onClick={submit}>
        {state.busy ? "Uploading…" : editing ? "Save changes" : "Publish listing"}
      </button>
    </section>
  );
}
