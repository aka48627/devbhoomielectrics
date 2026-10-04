"use client";

import { isAdmin, toInr } from "@/lib/product";
import { useShop } from "@/lib/shop";
import { HEAD_OFFICE } from "@/lib/types";
import { useState, type ReactNode } from "react";
import { BackIcon, HeartIcon, PinIcon } from "./Icons";
import ProductThumb from "./ProductThumb";

export function PageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={onBack} className="rounded-full p-2 hover:bg-surface-variant" aria-label="Back">
        <BackIcon />
      </button>
      <h1 className="text-lg font-semibold">{title}</h1>
    </div>
  );
}

function Action({ title, subtitle, onClick }: { title: string; subtitle: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="w-full rounded-2xl bg-surface p-4 text-left ring-1 ring-black/5 transition hover:shadow-md">
      <p className="font-semibold">{title}</p>
      <p className="text-sm text-muted">{subtitle}</p>
    </button>
  );
}

function Page({ children }: { children: ReactNode }) {
  return <section className="mx-auto max-w-2xl space-y-3">{children}</section>;
}

export function AccountHub() {
  const { state, actions } = useShop();
  const profile = state.profile;
  const roleLabel = [isAdmin(profile?.role) && "Admin", profile?.sellerMode && "Seller"].filter(Boolean).join(" · ") || "User";

  if (!state.user) {
    return (
      <Page>
        <h1 className="text-xl font-semibold">Account</h1>
        <div className="space-y-3 rounded-3xl bg-primary p-5 text-on-primary">
          <p className="text-lg font-semibold">Sign in to Devbhoomi Electrics</p>
          <p className="text-sm opacity-90">Save your cart and wishlist, chat with sellers, and send order queries.</p>
          <button type="button" className="btn bg-on-primary text-primary" onClick={actions.showAuth}>
            Log in or sign up
          </button>
        </div>
        <Action title="Help & support" subtitle="Head office address, map, and how we can help" onClick={() => actions.openAccountPage("help")} />
      </Page>
    );
  }

  return (
    <Page>
      <div>
        <h1 className="text-xl font-semibold">Account</h1>
        <p className="text-sm text-muted">Your profile, saved addresses, and showroom role.</p>
      </div>
      <div className="space-y-1.5 rounded-3xl bg-primary p-5 text-on-primary">
        <p className="text-2xl font-semibold">{profile?.name || "Rider"}</p>
        <p className="text-sm opacity-85">{profile?.email}</p>
        {profile?.mobile && <p className="text-sm opacity-85">{profile.mobile}</p>}
        <span className="mt-1.5 inline-block rounded-full bg-white/15 px-2.5 py-1 text-xs">{roleLabel}</span>
      </div>
      <Action title="Edit profile" subtitle="Name, email is fixed from sign-in, mobile can be updated" onClick={() => actions.openAccountPage("editProfile")} />
      <Action title="Saved addresses" subtitle="Home and delivery addresses" onClick={() => actions.openAccountPage("addresses")} />
      <Action
        title="Wishlist"
        subtitle={`${state.wishlist.length} saved scooter${state.wishlist.length === 1 ? "" : "s"}`}
        onClick={() => actions.openAccountPage("wishlist")}
      />
      <Action title="Become a retail partner" subtitle="Apply to sell Devbhoomi Electrics scooters in your area" onClick={() => actions.openAccountPage("partner")} />
      <Action title="Help & support" subtitle="Head office address, map, and how we can help" onClick={() => actions.openAccountPage("help")} />
      {isAdmin(profile?.role) && (
        <Action
          title="Partner applications"
          subtitle={`${state.partnerApplications.length} application${state.partnerApplications.length === 1 ? "" : "s"} for admin review`}
          onClick={() => actions.openAccountPage("adminPartners")}
        />
      )}

      {state.buyerChats.length > 0 && (
        <>
          <h2 className="pt-1 text-sm font-semibold">Your chats</h2>
          {state.buyerChats.slice(0, 8).map((chat) => (
            <button
              type="button"
              key={chat.id}
              onClick={() => actions.openExistingChat(chat)}
              className="w-full rounded-xl bg-surface p-3 text-left ring-1 ring-black/5 hover:shadow-md"
            >
              <p className="text-[13px] font-medium">{chat.sellerName || "Seller"}</p>
              <p className="text-xs text-muted">{chat.productName || (chat.orderId ? "Order query" : "Chat")}</p>
            </button>
          ))}
        </>
      )}

      {state.myOrders.length > 0 && (
        <>
          <h2 className="pt-1 text-sm font-semibold">Your order queries</h2>
          {state.myOrders.slice(0, 5).map((order) => (
            <div key={order.id} className="space-y-1 rounded-xl bg-surface p-3 ring-1 ring-black/5">
              <p className="text-[13px] font-medium">
                {order.lines.length} item(s) · {toInr(order.total)}
              </p>
              {Array.from(new Set(order.sellerIds)).map((sellerId) => {
                const listed = state.products.find((p) => p.sellerId === sellerId);
                const label = listed?.sellerName || (sellerId === "showroom" ? "Devbhoomi Electrics" : "Seller");
                return (
                  <button type="button" key={sellerId} className="block text-xs text-primary hover:underline" onClick={() => actions.openOrderChat(order, sellerId)}>
                    Chat with {label}
                  </button>
                );
              })}
            </div>
          ))}
        </>
      )}

      <Action
        title={profile?.sellerMode ? "Switch to customer" : "Switch to seller"}
        subtitle={profile?.sellerMode ? "Seller tools stay available until you switch back." : "List scooters with price, discount, and range options."}
        onClick={() => actions.setSellerMode(!profile?.sellerMode)}
      />
      {isAdmin(profile?.role) && (
        <button type="button" className="btn btn-primary w-full rounded-2xl" disabled={state.busy} onClick={actions.publishCatalog}>
          {state.catalogLive ? "Update showroom catalog" : "Publish showroom catalog"}
        </button>
      )}
      <button type="button" className="btn btn-outline w-full rounded-2xl" onClick={actions.signOut}>
        Sign out
      </button>
    </Page>
  );
}

export function EditProfileScreen() {
  const { state, actions } = useShop();
  const [name, setName] = useState(state.profile?.name ?? "");
  const [mobile, setMobile] = useState(state.profile?.mobile ?? "");
  return (
    <Page>
      <PageHeader title="Edit profile" onBack={actions.closeAccountPage} />
      <label className="block text-xs">
        Name
        <input className="field mt-1" value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="block text-xs">
        Email
        <input className="field mt-1 opacity-60" value={state.profile?.email ?? ""} disabled />
      </label>
      <label className="block text-xs">
        Mobile (optional)
        <input className="field mt-1" type="tel" value={mobile} onChange={(e) => setMobile(e.target.value)} />
      </label>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <button type="button" className="btn btn-primary w-full rounded-2xl" disabled={state.busy} onClick={() => actions.saveProfile(name, mobile)}>
        Save profile
      </button>
    </Page>
  );
}

export function AddressesScreen() {
  const { state, actions } = useShop();
  const [form, setForm] = useState({ label: "Home", line1: "", city: "", state: "Uttarakhand", pincode: "", phone: state.profile?.mobile ?? "" });
  const field = (key: keyof typeof form, label: string, type = "text") => (
    <label className="block text-xs">
      {label}
      <input className="field mt-1" type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
    </label>
  );
  return (
    <Page>
      <PageHeader title="Saved addresses" onBack={actions.closeAccountPage} />
      {state.addresses.length === 0 && <p className="text-sm text-muted">No saved addresses yet.</p>}
      {state.addresses.map((a) => (
        <div key={a.id} className="flex items-start justify-between gap-3 rounded-xl bg-surface p-3 ring-1 ring-black/5">
          <div className="text-sm">
            <p className="font-medium">{a.label}</p>
            <p className="text-muted">
              {a.line1}, {a.city}, {a.state} {a.pincode}
            </p>
            {a.phone && <p className="text-muted">{a.phone}</p>}
          </div>
          <button type="button" className="text-xs text-danger" onClick={() => actions.deleteAddress(a)}>
            Delete
          </button>
        </div>
      ))}
      <h2 className="pt-2 text-sm font-semibold">Add an address</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {field("label", "Label")}
        {field("phone", "Phone", "tel")}
        <div className="sm:col-span-2">{field("line1", "House, street, area")}</div>
        {field("city", "City")}
        {field("state", "State")}
        {field("pincode", "PIN code")}
      </div>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <button
        type="button"
        className="btn btn-primary w-full rounded-2xl"
        disabled={state.busy}
        onClick={() => {
          actions.addAddress(form);
          setForm({ ...form, line1: "", pincode: "" });
        }}
      >
        Save address
      </button>
    </Page>
  );
}

export function WishlistScreen() {
  const { state, actions } = useShop();
  return (
    <Page>
      <PageHeader title="Wishlist" onBack={actions.closeAccountPage} />
      {state.wishlist.length === 0 && <p className="text-xs text-muted">Tap the heart on a scooter to save it here.</p>}
      {state.wishlist.map((item) => {
        const live = state.products.find((p) => p.id === item.productId && !p.trashed);
        return (
          <div
            key={item.productId}
            role="button"
            tabIndex={0}
            onClick={() => live && actions.openProduct(live.id)}
            className="flex cursor-pointer items-center gap-3 rounded-xl bg-surface p-3 ring-1 ring-black/5"
          >
            <ProductThumb imageKey={item.imageKey} className="size-16 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{item.name}</p>
              <p className="text-[11px] text-muted">{[item.brand, item.color].filter(Boolean).join("  ·  ")}</p>
              <p className="text-[13px] font-bold">{toInr(item.offerPrice)}</p>
              {!live && <p className="text-[11px] text-danger">No longer listed</p>}
            </div>
            <button
              type="button"
              aria-label="Remove from wishlist"
              onClick={(e) => {
                e.stopPropagation();
                const product = state.products.find((p) => p.id === item.productId);
                if (product) actions.toggleWishlist(product);
              }}
            >
              <HeartIcon filled className="size-6 text-[#c62828]" />
            </button>
          </div>
        );
      })}
    </Page>
  );
}

export function PartnerScreen() {
  const { state, actions } = useShop();
  const p = state.profile;
  const [form, setForm] = useState({
    name: p?.name ?? "",
    mobile: p?.mobile ?? "",
    email: p?.email ?? "",
    city: state.city || p?.city || "",
    area: "",
    shopName: "",
    note: "",
  });
  const field = (key: keyof typeof form, label: string, type = "text") => (
    <label className="block text-xs">
      {label}
      <input className="field mt-1" type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
    </label>
  );
  return (
    <Page>
      <PageHeader title="Retail partner" onBack={actions.closeAccountPage} />
      <p className="text-[13px] text-muted">
        Apply to become an authorised retail partner for Devbhoomi Electrics in your area. Our admin team will review and contact you.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {field("name", "Full name")}
        {field("mobile", "Mobile", "tel")}
        {field("email", "Email", "email")}
        {field("city", "City")}
        {field("area", "Area / locality")}
        {field("shopName", "Shop / business name (optional)")}
      </div>
      <label className="block text-xs">
        Tell us about your area and experience
        <textarea className="field mt-1" rows={3} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
      </label>
      {state.error && <p className="text-xs text-danger">{state.error}</p>}
      <button type="button" className="btn btn-primary w-full rounded-2xl" disabled={state.busy} onClick={() => actions.submitPartnerApplication(form)}>
        Submit application
      </button>
    </Page>
  );
}

export function HelpScreen() {
  const { actions } = useShop();
  return (
    <Page>
      <PageHeader title="Help & support" onBack={actions.closeAccountPage} />
      <p className="text-[13px] text-muted">
        For product queries, use Enquire now on any scooter to chat with the seller. For partnership or showroom help, reach our head office.
      </p>
      <div className="space-y-2 rounded-2xl bg-surface p-4 ring-1 ring-black/5">
        <p className="text-sm font-semibold">Head office</p>
        <p className="font-medium">{HEAD_OFFICE.name}</p>
        <p className="flex items-start gap-1.5 text-[13px] text-muted">
          <PinIcon className="mt-0.5 size-4 shrink-0" /> {HEAD_OFFICE.address}
        </p>
        <a href={HEAD_OFFICE.mapUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline">
          Open in Google Maps
        </a>
      </div>
    </Page>
  );
}

export function AdminPartnersScreen() {
  const { state, actions } = useShop();
  return (
    <Page>
      <PageHeader title="Partner applications" onBack={actions.closeAccountPage} />
      {state.partnerApplications.length === 0 && <p className="text-xs text-muted">No applications yet.</p>}
      {state.partnerApplications.map((app) => (
        <div key={app.id} className="space-y-0.5 rounded-xl bg-surface p-3.5 ring-1 ring-black/5">
          <p className="font-semibold">{app.name || "Applicant"}</p>
          {app.shopName && <p className="text-[13px]">{app.shopName}</p>}
          <p className="text-xs">{[app.mobile, app.email].filter(Boolean).join("  ·  ")}</p>
          <p className="text-xs text-muted">{[app.area, app.city].filter(Boolean).join(", ")}</p>
          {app.note && <p className="text-xs text-muted">{app.note}</p>}
          <p className="text-[11px] text-muted">Status: {app.status}</p>
        </div>
      ))}
    </Page>
  );
}
