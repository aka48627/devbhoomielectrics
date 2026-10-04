"use client";

import { useShop, type Tab } from "@/lib/shop";
import { HEAD_OFFICE } from "@/lib/types";
import { useEffect, useState, type ComponentType } from "react";
import {
  AccountHub,
  AddressesScreen,
  AdminPartnersScreen,
  EditProfileScreen,
  HelpScreen,
  PartnerScreen,
  WishlistScreen,
} from "./AccountScreens";
import AuthDialog from "./AuthDialog";
import ChatView from "./ChatView";
import CityPicker from "./CityPicker";
import { BoltIcon, CartIcon, CloseIcon, FireIcon, GridIcon, HomeIcon, PinIcon, ScooterIcon, SearchIcon, UserIcon } from "./Icons";
import ProductDetail from "./ProductDetail";
import { SellerDashboard, SellerListingForm, SellerProductPage } from "./SellerScreens";
import { CartScreen, CategoriesScreen, HomeScreen, SellerShopScreen, TrendingScreen } from "./ShopScreens";

const tabs: { id: Tab; label: string; icon: ComponentType<{ className?: string }> }[] = [
  { id: "home", label: "Home", icon: HomeIcon },
  { id: "trending", label: "Trending", icon: FireIcon },
  { id: "categories", label: "Categories", icon: GridIcon },
  { id: "account", label: "Account", icon: UserIcon },
  { id: "cart", label: "Cart", icon: CartIcon },
];

export default function ShopApp() {
  const { state, actions } = useShop();
  const [cityOpen, setCityOpen] = useState(false);
  const cartCount = state.cart.reduce((s, i) => s + i.qty, 0);

  useEffect(() => {
    if (!state.message) return;
    const t = setTimeout(actions.consumeMessage, 3000);
    return () => clearTimeout(t);
  }, [state.message, actions]);

  const search = (
    <div className="relative flex-1">
      <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
      <input
        className="field rounded-full pl-9 pr-9"
        placeholder="Search scooters, models, colors"
        value={state.catalogQuery}
        onChange={(e) => {
          if (state.tab !== "home" || state.openProductId || state.sellerShopId) actions.setTab("home");
          actions.setQuery(e.target.value);
        }}
      />
      {state.catalogQuery && (
        <button type="button" onClick={() => actions.setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted" aria-label="Clear search">
          <CloseIcon className="size-4" />
        </button>
      )}
    </div>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b border-surface-variant bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2.5">
          <button type="button" onClick={() => actions.setTab("home")} className="flex shrink-0 items-center gap-2">
            <span className="relative flex size-9 items-center justify-center rounded-full bg-primary text-on-primary">
              <ScooterIcon className="size-5" />
              <BoltIcon className="absolute -right-0.5 -top-0.5 size-3.5 text-lime" />
            </span>
            <span className="hidden text-left leading-tight sm:block">
              <span className="block font-semibold">Devbhoomi Electrics</span>
              <span className="block text-[11px] text-muted">Electric scooter showroom</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setCityOpen(true)}
            className="flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-sm hover:bg-surface-variant"
          >
            <PinIcon className="size-4 text-primary" />
            <span className="max-w-28 truncate">{state.city}</span>
          </button>
          <div className="hidden flex-1 md:flex">{search}</div>
          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                type="button"
                key={id}
                onClick={() => actions.setTab(id)}
                className={`relative flex items-center gap-1.5 rounded-full px-3 py-2 text-sm ${
                  state.tab === id && !state.openProductId && !state.sellerShopId ? "bg-primary-container text-on-primary-container" : "hover:bg-surface-variant"
                }`}
              >
                <Icon className="size-4" />
                {label}
                {id === "cart" && cartCount > 0 && (
                  <span className="rounded-full bg-primary px-1.5 text-[10px] text-on-primary">{Math.min(cartCount, 99)}</span>
                )}
              </button>
            ))}
          </nav>
          {!state.user && state.ready && (
            <button type="button" className="btn btn-primary ml-auto shrink-0 md:ml-1" onClick={actions.showAuth}>
              Sign in
            </button>
          )}
        </div>
        <div className="px-4 pb-2.5 md:hidden">{search}</div>
      </header>

      {state.error && !state.authOpen && (
        <div className="bg-[#fde7e4] text-[#7a1810]">
          <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-2 text-xs">
            <p className="flex-1">{state.error}</p>
            <button type="button" className="font-medium" onClick={actions.dismissError}>
              Dismiss
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-4 md:pb-10">
        <Content />
      </main>

      <footer className="hidden border-t border-surface-variant bg-surface md:block">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-5 text-sm">
          <div>
            <p className="font-semibold">{HEAD_OFFICE.name}</p>
            <p className="text-muted">{HEAD_OFFICE.address}</p>
          </div>
          <div className="flex gap-4">
            <a href={HEAD_OFFICE.mapUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Find us on Google Maps
            </a>
            <button type="button" className="text-primary hover:underline" onClick={() => actions.openAccountPage("help")}>
              Help & support
            </button>
            <button type="button" className="text-primary hover:underline" onClick={() => actions.openAccountPage("partner")}>
              Become a retail partner
            </button>
            <a href="/privacy" className="text-primary hover:underline">
              Privacy policy
            </a>
          </div>
        </div>
      </footer>

      {!state.openProductId && (
        <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-surface-variant bg-surface md:hidden">
          {tabs.map(({ id, label, icon: Icon }) => {
            const on = state.tab === id && !state.sellerShopId;
            return (
              <button type="button" key={id} onClick={() => actions.setTab(id)} className="flex flex-col items-center gap-0.5 py-2 text-[11px]">
                <span className={`relative rounded-full px-4 py-1 ${on ? "bg-primary-container text-on-primary-container" : "text-muted"}`}>
                  <Icon className="size-5" />
                  {id === "cart" && cartCount > 0 && (
                    <span className="absolute -right-0.5 -top-1 rounded-full bg-primary px-1.5 text-[10px] text-on-primary">{Math.min(cartCount, 99)}</span>
                  )}
                </span>
                <span className={on ? "font-medium" : "text-muted"}>{label}</span>
              </button>
            );
          })}
        </nav>
      )}

      {state.message && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-foreground px-4 py-2.5 text-sm text-background shadow-lg md:bottom-6">
          {state.message}
        </div>
      )}

      {cityOpen && (
        <CityPicker
          selected={state.city}
          onClose={() => setCityOpen(false)}
          onSelect={(c) => {
            actions.selectCity(c);
            setCityOpen(false);
          }}
        />
      )}
      {state.openChat && <ChatView />}
      <AuthDialog />
    </div>
  );
}

function Content() {
  const { state } = useShop();
  if (state.sellerShopId) return <SellerShopScreen />;
  const product = state.openProductId ? state.products.find((p) => p.id === state.openProductId) : undefined;
  if (product) return <ProductDetail product={product} />;
  switch (state.tab) {
    case "trending":
      return <TrendingScreen />;
    case "categories":
      return <CategoriesScreen />;
    case "cart":
      return <CartScreen />;
    case "account":
      return <Account />;
    default:
      return <HomeScreen />;
  }
}

function Account() {
  const { state } = useShop();
  const sellerMode = state.profile?.sellerMode === true;
  const managed = state.sellerProductId ? state.products.find((p) => p.id === state.sellerProductId) : undefined;
  if (state.accountPage === "hub" && sellerMode && managed) return <SellerProductPage product={managed} />;
  switch (state.accountPage) {
    case "editProfile":
      return <EditProfileScreen />;
    case "addresses":
      return <AddressesScreen />;
    case "sell":
      return <SellerListingForm key={state.editingProductId ?? "new"} />;
    case "wishlist":
      return <WishlistScreen />;
    case "partner":
      return <PartnerScreen />;
    case "help":
      return <HelpScreen />;
    case "adminPartners":
      return <AdminPartnersScreen />;
    default:
      return sellerMode && state.user ? <SellerDashboard /> : <AccountHub />;
  }
}
