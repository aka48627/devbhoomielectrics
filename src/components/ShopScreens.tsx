"use client";

import { availableIn, greetingName, sellerLabel, toInr } from "@/lib/product";
import { useShop } from "@/lib/shop";
import type { CartItem, Product } from "@/lib/types";
import { useState } from "react";
import { MyList, YourChats, YourOrderQueries } from "./AccountScreens";
import { activeFilterCount, applyFilter, batteryOptions } from "@/lib/filters";
import CatalogFilterBar from "./CatalogFilterBar";
import CatalogGrid from "./CatalogGrid";
import { BackIcon, MinusIcon, PlusIcon } from "./Icons";
import ProductThumb from "./ProductThumb";

function useCatalogHelpers() {
  const { state, actions } = useShop();
  const inCity = state.products.filter((p) => !p.trashed && availableIn(p, state.city));
  const wished = (p: Product) => state.wishlist.some((w) => w.productId === p.id);
  return { state, actions, inCity, wished };
}

function matches(p: Product, q: string) {
  const needle = q.toLowerCase();
  return [p.name, p.brand, p.category, p.modelName, p.color, p.colors.join(" "), p.description].some((f) =>
    f.toLowerCase().includes(needle),
  );
}

export function HomeScreen() {
  const { state, actions, inCity, wished } = useCatalogHelpers();
  const q = state.catalogQuery.trim();
  const featured = inCity.filter((p) => p.featured);
  const filtering = activeFilterCount(state.catalogFilter) > 0;
  const visible = applyFilter(q ? inCity.filter((p) => matches(p, q)) : featured.length ? featured : inCity, state.catalogFilter);
  return (
    <CatalogGrid
      title={`Hello, ${greetingName(state.profile?.name)}`}
      subtitle={q ? `${visible.length} result${visible.length === 1 ? "" : "s"} in ${state.city}` : `Featured scooters in ${state.city}`}
      products={visible}
      emptyText={
        filtering ? "No scooters match these filters." : q ? `Nothing matches "${q}" in ${state.city}.` : `No scooters listed in ${state.city} yet.`
      }
      onOpen={actions.openProduct}
      onWishlist={actions.toggleWishlist}
      wished={wished}
      toolbar={<CatalogFilterBar filter={state.catalogFilter} batteries={batteryOptions(inCity)} onChange={actions.setCatalogFilter} />}
    />
  );
}

export function TrendingScreen() {
  const { state, actions, inCity, wished } = useCatalogHelpers();
  const trending = inCity.filter((p) => p.trending);
  return (
    <CatalogGrid
      title="Trending"
      subtitle={`Scooters riders are asking about in ${state.city}`}
      products={applyFilter(trending.length ? trending : inCity, state.catalogFilter)}
      emptyText={activeFilterCount(state.catalogFilter) > 0 ? "No scooters match these filters." : undefined}
      onOpen={actions.openProduct}
      onWishlist={actions.toggleWishlist}
      wished={wished}
      toolbar={<CatalogFilterBar filter={state.catalogFilter} batteries={batteryOptions(inCity)} onChange={actions.setCatalogFilter} />}
    />
  );
}

export function CategoriesScreen() {
  const { state, actions, inCity, wished } = useCatalogHelpers();
  const categories = Array.from(new Set(inCity.map((p) => p.category)));
  const visible = inCity.filter((p) => !state.category || p.category === state.category);
  return (
    <CatalogGrid
      title="Categories"
      subtitle={`Scooters available in ${state.city}.`}
      products={visible}
      onOpen={actions.openProduct}
      onWishlist={actions.toggleWishlist}
      wished={wished}
      toolbar={
        <div className="no-scrollbar flex gap-2 overflow-x-auto">
          <button type="button" className="chip" data-on={!state.category} onClick={() => actions.selectCategory(null)}>
            All
          </button>
          {categories.map((c) => (
            <button type="button" key={c} className="chip" data-on={state.category === c} onClick={() => actions.selectCategory(c)}>
              {c}
            </button>
          ))}
        </div>
      }
    />
  );
}

export function CartScreen() {
  const { state, actions } = useShop();
  const [note, setNote] = useState("");
  const total = state.cart.reduce((s, i) => s + i.offerPrice * i.qty, 0);
  const saved = state.cart.reduce((s, i) => s + Math.max(0, i.mrp - i.offerPrice) * i.qty, 0);
  return (
    <section className="mx-auto max-w-3xl space-y-3">
      <div>
        <h1 className="text-xl font-semibold">Your cart</h1>
        <p className="text-sm text-muted">{state.user ? "Saved to your account." : "Saved in this browser. Sign in to keep it."}</p>
      </div>
      {state.cart.length === 0 ? (
        <p className="text-[13px] text-muted">Your cart is empty. Open a scooter and add a range.</p>
      ) : (
        <>
          {state.cart.map((item) => (
            <CartRow key={item.lineId} item={item} onChange={(d) => actions.changeQuantity(item, d)} />
          ))}
          <div className="space-y-2 rounded-lg bg-surface p-3 ring-1 ring-black/10">
            <div className="flex justify-between">
              <span className="text-[13px]">Offer total</span>
              <span className="text-base font-bold">{toInr(total)}</span>
            </div>
            {saved > 0 && <p className="text-xs text-saving">You save {toInr(saved)}</p>}
            <p className="text-xs text-muted">
              No online payment. Send this cart as an order query and the seller gets your name, email, and mobile.
            </p>
            <textarea className="field" rows={2} placeholder="Message for the seller" value={note} onChange={(e) => setNote(e.target.value)} />
            <button
              type="button"
              className="btn btn-primary w-full"
              disabled={state.busy}
              onClick={() => {
                actions.submitOrder(note);
                setNote("");
              }}
            >
              Submit order query
            </button>
          </div>
        </>
      )}
      {state.user && (
        <>
          <YourOrderQueries />
          <YourChats />
          <MyList />
        </>
      )}
    </section>
  );
}

function CartRow({ item, onChange }: { item: CartItem; onChange: (delta: number) => void }) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-surface p-2.5 ring-1 ring-black/10">
      <ProductThumb imageKey={item.imageKey} className="size-16 shrink-0 rounded-md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium">{item.name}</p>
        {item.variantLabel && <p className="text-[11px] text-muted">{item.variantLabel}</p>}
        <p className="text-[13px] font-bold">
          {toInr(item.offerPrice * item.qty)}
          {item.mrp > item.offerPrice && <span className="ml-2 text-[11px] font-normal text-muted line-through">{toInr(item.mrp)}</span>}
        </p>
      </div>
      <div className="flex items-center">
        <button type="button" onClick={() => onChange(-1)} className="rounded-full p-2 hover:bg-surface-variant" aria-label="Decrease quantity">
          <MinusIcon className="size-4" />
        </button>
        <span className="w-6 text-center text-[13px]">{item.qty}</span>
        <button type="button" onClick={() => onChange(1)} className="rounded-full p-2 hover:bg-surface-variant" aria-label="Increase quantity">
          <PlusIcon className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function SellerShopScreen() {
  const { state, actions, wished } = useCatalogHelpers();
  const sellerId = state.sellerShopId ?? "";
  const listings = state.products.filter((p) => (p.sellerId || "showroom") === sellerId && !p.trashed);
  const name = listings[0] ? sellerLabel(listings[0]) : "Seller";
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <button type="button" onClick={actions.closeSellerShop} className="rounded-full p-2 hover:bg-surface-variant" aria-label="Back">
          <BackIcon />
        </button>
        <div>
          <p className="font-semibold">{name}</p>
          <p className="text-xs text-muted">
            {listings.length} scooter{listings.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>
      <CatalogGrid
        title="Listings"
        subtitle={`Scooters from ${name}`}
        products={listings}
        onOpen={actions.openProduct}
        onWishlist={actions.toggleWishlist}
        wished={wished}
        showCalculator={listings.length >= 5}
        emptyText="No other listings from this seller."
      />
    </div>
  );
}
