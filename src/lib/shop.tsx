"use client";

import {
  createUserWithEmailAndPassword,
  deleteUser,
  EmailAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile as updateAuthProfile,
  type User,
} from "firebase/auth";
import type { Unsubscribe } from "firebase/firestore";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { sampleProducts } from "./catalog";
import { auth } from "./firebase";
import { compressPhoto } from "./photos";
import { cartLineId, isAdmin, normalizePhone, primary, sellerLabel } from "./product";
import * as repo from "./repo";
import type {
  Address,
  CartItem,
  ChatMessage,
  OrderChat,
  OrderLine,
  OrderQuery,
  PartnerApplication,
  Product,
  ProductVariant,
  UserProfile,
  WishlistItem,
} from "./types";

export type Tab = "home" | "trending" | "categories" | "account" | "cart";
export type AccountPage =
  | "hub"
  | "editProfile"
  | "addresses"
  | "sell"
  | "wishlist"
  | "partner"
  | "help"
  | "adminPartners"
  | "deleteAccount";

export type ListingInput = {
  name: string;
  brand: string;
  category: string;
  description: string;
  warranty: string;
  variants: ProductVariant[];
  cities: string[];
  photos: File[];
  colors: string[];
  modelName: string;
  motorWatt: number;
  chargerAmp: number;
  chargeHours: number;
  existingId?: string | null;
};

export type PartnerInput = {
  name: string;
  mobile: string;
  email: string;
  city: string;
  area: string;
  shopName: string;
  note: string;
};

type State = {
  ready: boolean;
  user: User | null;
  profile: UserProfile | null;
  tab: Tab;
  accountPage: AccountPage;
  products: Product[];
  catalogLive: boolean;
  cart: CartItem[];
  myOrders: OrderQuery[];
  sellerOrders: OrderQuery[];
  wishlist: WishlistItem[];
  addresses: Address[];
  buyerChats: OrderChat[];
  sellerChats: OrderChat[];
  partnerApplications: PartnerApplication[];
  openChat: OrderChat | null;
  chatMessages: ChatMessage[];
  openProductId: string | null;
  sellerShopId: string | null;
  sellerProductId: string | null;
  editingProductId: string | null;
  category: string | null;
  city: string;
  catalogQuery: string;
  authOpen: boolean;
  busy: boolean;
  error: string | null;
  message: string | null;
};

const initial: State = {
  ready: false,
  user: null,
  profile: null,
  tab: "home",
  accountPage: "hub",
  products: sampleProducts,
  catalogLive: false,
  cart: [],
  myOrders: [],
  sellerOrders: [],
  wishlist: [],
  addresses: [],
  buyerChats: [],
  sellerChats: [],
  partnerApplications: [],
  openChat: null,
  chatMessages: [],
  openProductId: null,
  sellerShopId: null,
  sellerProductId: null,
  editingProductId: null,
  category: null,
  city: "Dehradun",
  catalogQuery: "",
  authOpen: false,
  busy: false,
  error: null,
  message: null,
};

export function friendly(error: unknown): string {
  const code = (error as { code?: string })?.code ?? "";
  const map: Record<string, string> = {
    "auth/invalid-credential": "Email/mobile or password is wrong.",
    "auth/user-mismatch": "Confirm with the same Google account you signed in with.",
    "auth/requires-recent-login": "Please confirm your sign-in again, then retry.",
    "auth/wrong-password": "Email/mobile or password is wrong.",
    "auth/user-not-found": "No account found. Create one first.",
    "auth/email-already-in-use": "An account already exists with this email. Log in instead.",
    "auth/weak-password": "Use a password with at least 6 characters.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/popup-closed-by-user": "Google sign-in was cancelled.",
    "auth/cancelled-popup-request": "Google sign-in was cancelled.",
    "auth/popup-blocked": "Allow pop-ups for this site, then try Google sign-in again.",
    "auth/unauthorized-domain": "This website is not yet allowed for Google sign-in. Add it under Firebase Auth → Authorized domains.",
    "auth/network-request-failed": "Network problem. Check your internet and try again.",
    "auth/too-many-requests": "Too many attempts. Wait a minute and try again.",
    "permission-denied": "Permission denied. Publish the latest Firestore rules, then try again.",
    "storage/unauthorized": "Photo upload was blocked. Publish the latest Storage rules.",
    unavailable: "You appear to be offline. Changes will sync when you reconnect.",
  };
  if (map[code]) return map[code];
  const message = (error as Error)?.message;
  return message && !message.startsWith("Firebase:") ? message : "Something went wrong. Please try again.";
}

function useShopStore() {
  const [state, setState] = useState<State>(initial);
  const stateRef = useRef(state);
  stateRef.current = state;
  const set = useCallback((patch: Partial<State> | ((s: State) => Partial<State>)) => {
    setState((s) => ({ ...s, ...(typeof patch === "function" ? patch(s) : patch) }));
  }, []);
  const fail = useCallback((e: unknown) => set({ busy: false, error: friendly(e) }), [set]);
  const quiet = useCallback(
    (e: unknown) => {
      const code = (e as { code?: string })?.code;
      if (code !== "unavailable" && code !== "cancelled") set({ error: friendly(e) });
    },
    [set],
  );
  const chatUnsub = useRef<Unsubscribe | null>(null);
  const deleting = useRef(false);

  useEffect(() => {
    const saved = localStorage.getItem("city")?.trim();
    if (saved) set({ city: saved });
    const stopProducts = repo.listenProducts(
      (products) =>
        set(products.length ? { products, catalogLive: true } : { products: sampleProducts, catalogLive: false }),
      quiet,
    );
    const stopAuth = onAuthStateChanged(auth, (user) => {
      set(
        user
          ? { user, ready: true, authOpen: false }
          : {
              user: null,
              ready: true,
              profile: null,
              cart: [],
              addresses: [],
              wishlist: [],
              myOrders: [],
              sellerOrders: [],
              buyerChats: [],
              sellerChats: [],
              partnerApplications: [],
              openChat: null,
              chatMessages: [],
            },
      );
    });
    return () => {
      stopProducts();
      stopAuth();
      chatUnsub.current?.();
    };
  }, [set, quiet]);

  const uid = state.user?.uid;

  useEffect(() => {
    if (!uid) return;
    const user = auth.currentUser;
    const stops = [
      repo.listenProfile(
        uid,
        (profile) => {
          if (!profile) {
            if (!user || deleting.current) return;
            const fallback: UserProfile = {
              uid,
              name: user.displayName ?? "",
              email: user.email ?? "",
              mobile: "",
              role: "user",
              sellerMode: false,
              city: "",
              createdAt: 0,
            };
            set({ profile: fallback });
            repo.ensureUser(uid, fallback.name, fallback.email, "").catch(quiet);
            return;
          }
          const authName = auth.currentUser?.displayName ?? "";
          if (repo.isPlaceholderName(profile.name) && !repo.isPlaceholderName(authName)) {
            repo.ensureUser(uid, authName, profile.email, "").catch(quiet);
          }
          const chosen = localStorage.getItem("city_chosen") === "1";
          set((s) => ({ profile, city: profile.city && !chosen ? profile.city : s.city }));
        },
        quiet,
      ),
      repo.listenAddresses(uid, (addresses) => set({ addresses }), quiet),
      repo.listenCart(uid, (cart) => set({ cart }), quiet),
      repo.listenBuyerOrders(uid, (myOrders) => set({ myOrders }), quiet),
      repo.listenWishlist(uid, (wishlist) => set({ wishlist }), quiet),
      repo.listenChats("buyerId", uid, (buyerChats) => set({ buyerChats }), quiet),
    ];
    return () => stops.forEach((stop) => stop());
  }, [uid, set, quiet]);

  const sellerMode = state.profile?.sellerMode === true;
  useEffect(() => {
    if (!uid || !sellerMode) {
      set({ sellerOrders: [], sellerChats: [] });
      return;
    }
    const orders: Record<string, OrderQuery[]> = { own: [], showroom: [] };
    const chats: Record<string, OrderChat[]> = { own: [], showroom: [] };
    const mergeOrders = () =>
      set({
        sellerOrders: dedupe([...orders.own, ...orders.showroom]).sort((a, b) => b.createdAt - a.createdAt),
      });
    const mergeChats = () => set({ sellerChats: dedupe([...chats.own, ...chats.showroom]) });
    const stops = [
      repo.listenSellerOrders(uid, (o) => ((orders.own = o), mergeOrders()), quiet),
      repo.listenSellerOrders("showroom", (o) => ((orders.showroom = o), mergeOrders()), quiet),
      repo.listenChats("sellerId", uid, (c) => ((chats.own = c), mergeChats()), quiet),
      repo.listenChats("sellerId", "showroom", (c) => ((chats.showroom = c), mergeChats()), quiet),
    ];
    return () => stops.forEach((stop) => stop());
  }, [uid, sellerMode, set, quiet]);

  const admin = isAdmin(state.profile?.role);
  useEffect(() => {
    if (!admin) {
      set({ partnerApplications: [] });
      return;
    }
    return repo.listenPartnerApplications((partnerApplications) => set({ partnerApplications }), quiet);
  }, [admin, set, quiet]);

  const requireProfile = useCallback(
    (reason: string): UserProfile | null => {
      const s = stateRef.current;
      if (!s.user) {
        set({ authOpen: true, error: reason });
        return null;
      }
      return (
        s.profile ?? {
          uid: s.user.uid,
          name: s.user.displayName ?? "Rider",
          email: s.user.email ?? "",
          mobile: "",
          role: "user",
          sellerMode: false,
          city: "",
          createdAt: 0,
        }
      );
    },
    [set],
  );

  const run = useCallback(
    async (task: () => Promise<void>) => {
      set({ busy: true, error: null });
      try {
        await task();
        set({ busy: false });
      } catch (e) {
        fail(e);
      }
    },
    [set, fail],
  );

  const openChatSession = useCallback(
    (chat: OrderChat, seed?: string) => {
      chatUnsub.current?.();
      chatUnsub.current = null;
      set({ openChat: chat, chatMessages: [], error: null, busy: true });
      (async () => {
        try {
          await repo.ensureChat(chat);
          if (seed && !(await repo.hasMessages(chat.id))) await repo.sendMessage(chat.id, chat.buyerId, seed);
          chatUnsub.current = repo.listenMessages(chat.id, (chatMessages) => set({ chatMessages, busy: false }), (e) => fail(e));
          set({ busy: false });
        } catch (e) {
          fail(e);
        }
      })();
    },
    [set, fail],
  );

  const actions = useMemo(
    () => ({
      setTab: (tab: Tab) => set({ tab, error: null, openProductId: null, sellerShopId: null }),
      setQuery: (catalogQuery: string) => set({ catalogQuery }),
      selectCategory: (category: string | null) => set({ category }),
      dismissError: () => set({ error: null }),
      consumeMessage: () => set({ message: null }),
      showAuth: () => set({ authOpen: true, error: null }),
      hideAuth: () => set({ authOpen: false, error: null }),

      selectCity: (city: string) => {
        const clean = city.trim();
        if (!clean) return;
        localStorage.setItem("city", clean);
        localStorage.setItem("city_chosen", "1");
        set({ city: clean });
        const id = stateRef.current.user?.uid;
        if (id) repo.saveCity(id, clean).catch(quiet);
      },

      openProduct: (openProductId: string) => {
        set({ openProductId, error: null });
        window.scrollTo({ top: 0 });
      },
      closeProduct: () => set({ openProductId: null }),
      openSellerShop: (sellerId: string) => sellerId && set({ sellerShopId: sellerId, openProductId: null }),
      closeSellerShop: () => set({ sellerShopId: null }),
      openSellerProduct: (sellerProductId: string) => set({ sellerProductId, accountPage: "hub", error: null }),
      closeSellerProduct: () => set({ sellerProductId: null }),
      openAccountPage: (accountPage: AccountPage) => {
        if (accountPage !== "help" && !requireProfile("Sign in to continue.")) return;
        set({ accountPage, tab: "account", error: null, openProductId: null, sellerShopId: null });
      },
      closeAccountPage: () => set({ accountPage: "hub", editingProductId: null, error: null }),
      openSellerForm: (existingId: string | null = null) =>
        set({ accountPage: "sell", editingProductId: existingId, sellerProductId: null, tab: "account", error: null }),

      signIn: (identifier: string, password: string) => {
        if (!identifier.trim() || !password) return set({ error: "Enter your email or mobile and your password." });
        run(async () => {
          const email = await repo.emailForIdentifier(identifier);
          await signInWithEmailAndPassword(auth, email, password);
        });
      },

      signUp: (name: string, email: string, mobile: string, password: string, confirm: string) => {
        const cleanName = name.trim();
        const cleanEmail = email.trim().toLowerCase();
        const cleanMobile = mobile.trim();
        if (cleanName.length < 2) return set({ error: "Enter your name." });
        if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) return set({ error: "Enter a valid email address." });
        if (cleanMobile && normalizePhone(cleanMobile).length !== 10)
          return set({ error: "Mobile is optional. If you add it, use 10 digits." });
        if (password.length < 6) return set({ error: "Use a password with at least 6 characters." });
        if (password !== confirm) return set({ error: "Password and confirm password must match." });
        run(async () => {
          const { user } = await createUserWithEmailAndPassword(auth, cleanEmail, password);
          await updateAuthProfile(user, { displayName: cleanName });
          await repo.ensureUser(user.uid, cleanName, cleanEmail, cleanMobile);
        });
      },

      signInWithGoogle: () =>
        run(async () => {
          const { user } = await signInWithPopup(auth, new GoogleAuthProvider());
          if (!user.email) throw new Error("This Google account has no email address.");
          await repo.ensureUser(user.uid, user.displayName ?? "Rider", user.email, "");
        }),

      deleteAccount: (password: string) => {
        const user = auth.currentUser;
        if (!user) return set({ authOpen: true, error: "Sign in to delete your account." });
        const usesPassword = user.providerData.some((p) => p.providerId === "password");
        if (usesPassword && !password) return set({ error: "Enter your password to confirm." });
        const mobile = stateRef.current.profile?.mobile ?? "";
        run(async () => {
          if (usesPassword) {
            await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email ?? "", password));
          } else {
            await reauthenticateWithPopup(user, new GoogleAuthProvider());
          }
          deleting.current = true;
          try {
            chatUnsub.current?.();
            await repo.deleteAccountData(user.uid, mobile);
            await deleteUser(user);
          } finally {
            deleting.current = false;
          }
          set({
            tab: "home",
            accountPage: "hub",
            openProductId: null,
            sellerShopId: null,
            sellerProductId: null,
            editingProductId: null,
            message: "Your account and data have been deleted.",
          });
        });
      },

      signOut: async () => {
        chatUnsub.current?.();
        await firebaseSignOut(auth);
        set({
          tab: "home",
          accountPage: "hub",
          openProductId: null,
          sellerShopId: null,
          sellerProductId: null,
          editingProductId: null,
          error: null,
        });
      },

      addToCart: (product: Product, variant: ProductVariant = primary(product)) => {
        const lineId = cartLineId(product.id, variant.id);
        set((s) => {
          const existing = s.cart.find((i) => i.lineId === lineId);
          const cart = existing
            ? s.cart.map((i) => (i.lineId === lineId ? { ...i, qty: i.qty + 1 } : i))
            : [
                ...s.cart,
                {
                  lineId,
                  productId: product.id,
                  variantId: variant.id,
                  name: product.name,
                  variantLabel: variant.label,
                  offerPrice: variant.offerPrice,
                  mrp: variant.mrp,
                  imageKey: product.images[0] ?? "",
                  qty: 1,
                },
              ];
          return { cart, error: null, message: `${product.name} added to cart.` };
        });
        const id = stateRef.current.user?.uid;
        if (id) repo.addToCart(id, product, variant).catch(fail);
      },

      changeQuantity: (item: CartItem, delta: number) => {
        const next = item.qty + delta;
        const id = stateRef.current.user?.uid;
        if (!id) {
          set((s) => ({
            cart:
              next <= 0 ? s.cart.filter((i) => i.lineId !== item.lineId) : s.cart.map((i) => (i.lineId === item.lineId ? { ...i, qty: next } : i)),
          }));
          return;
        }
        repo.setQuantity(id, item, next).catch(fail);
      },

      saveProfile: (name: string, mobile: string, city: string) => {
        const cleanName = name.trim();
        const cleanMobile = mobile.trim();
        const cleanCity = city.trim();
        if (cleanName.length < 2) return set({ error: "Enter your name." });
        if (cleanMobile && normalizePhone(cleanMobile).length !== 10)
          return set({ error: "Enter a 10-digit mobile number, or leave it blank." });
        const profile = requireProfile("Sign in to edit your profile.");
        if (!profile) return;
        run(async () => {
          await repo.updateProfile(profile.uid, profile.email, cleanName, cleanMobile, profile.mobile, cleanCity);
          if (auth.currentUser) await updateAuthProfile(auth.currentUser, { displayName: cleanName });
          if (cleanCity) {
            localStorage.setItem("city", cleanCity);
            localStorage.setItem("city_chosen", "1");
          }
          set((s) => ({ accountPage: "hub", message: "Profile saved.", city: cleanCity || s.city }));
        });
      },

      addAddress: (input: Omit<Address, "id">) => {
        const address = {
          label: input.label.trim() || "Home",
          line1: input.line1.trim(),
          city: input.city.trim(),
          state: input.state.trim(),
          pincode: input.pincode.trim(),
          phone: input.phone.trim(),
        };
        if (!address.line1 || !address.city || address.pincode.length < 6)
          return set({ error: "Add a street, city, and 6-digit PIN code." });
        const profile = requireProfile("Sign in to save addresses.");
        if (!profile) return;
        run(async () => {
          await repo.addAddress(profile.uid, address);
          set({ message: "Address saved." });
        });
      },

      deleteAddress: (address: Address) => {
        const id = stateRef.current.user?.uid;
        if (id) repo.deleteAddress(id, address.id).catch(fail);
      },

      setSellerMode: (enabled: boolean) => {
        const profile = requireProfile("Sign in, then switch to seller.");
        if (!profile) return;
        run(async () => {
          await repo.setSellerMode(profile, enabled);
          set({ accountPage: "hub", sellerProductId: null, editingProductId: null });
        });
      },

      submitOrder: (note: string) => {
        const s = stateRef.current;
        const profile = requireProfile("Sign in before sending an order query.");
        if (!profile || !s.cart.length) return;
        const lines: OrderLine[] = s.cart.map((item) => ({
          productId: item.productId,
          sellerId: s.products.find((p) => p.id === item.productId)?.sellerId || "showroom",
          name: item.name,
          variantLabel: item.variantLabel,
          qty: item.qty,
          offerPrice: item.offerPrice,
          imageKey: item.imageKey,
        }));
        const order: OrderQuery = {
          id: crypto.randomUUID(),
          buyerId: profile.uid,
          buyerName: profile.name || "Rider",
          buyerEmail: profile.email,
          buyerMobile: profile.mobile,
          note: note.trim(),
          buyerCity: s.city,
          status: "query",
          sellerIds: Array.from(new Set(lines.map((l) => l.sellerId))),
          lines,
          total: lines.reduce((sum, l) => sum + l.offerPrice * l.qty, 0),
          createdAt: Date.now(),
        };
        run(async () => {
          await repo.placeOrder(order);
          await repo.clearCart(profile.uid);
          set({ cart: [], message: "Order query sent. The seller can see your details." });
        });
      },

      setStock: (product: Product, variantId: string, stock: number) => {
        const next = {
          ...product,
          variants: product.variants.map((v) => (v.id === variantId ? { ...v, stock: Math.max(0, stock) } : v)),
        };
        repo.saveProduct(next).catch(fail);
      },

      listProduct: (input: ListingInput) => {
        const s = stateRef.current;
        const cleanName = input.name.trim();
        if (cleanName.length < 2) return set({ error: "Enter the scooter name." });
        if (!input.variants.length || input.variants.some((v) => v.rangeKm <= 0 || v.offerPrice <= 0 || v.mrp < v.offerPrice))
          return set({ error: "Each range needs a distance, an MRP, and an offer price at or below MRP." });
        const profile = requireProfile("Sign in to list a scooter.");
        if (!profile) return;
        const colors = Array.from(new Set(input.colors.map((c) => c.trim()).filter(Boolean)));
        const existing = input.existingId ? s.products.find((p) => p.id === input.existingId) : undefined;
        const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        const model = input.modelName.trim() || input.category;
        const chargeLabel =
          input.chargeHours > 0 && input.chargerAmp > 0
            ? `${input.chargeHours} h · ${input.chargerAmp} A`
            : input.chargeHours > 0
              ? `${input.chargeHours} h`
              : "—";
        const product: Product = {
          id: existing?.id ?? `${slug}-${crypto.randomUUID().slice(0, 4)}`,
          name: cleanName,
          brand: input.brand.trim() || "Devbhoomi",
          category: input.category,
          description: input.description.trim() || "Listed by a Devbhoomi Electrics seller.",
          rating: existing?.rating ?? 0,
          reviewCount: existing?.reviewCount ?? 0,
          specifications: [
            { label: "Model", value: model || "—" },
            { label: "Motor", value: input.motorWatt > 0 ? `${input.motorWatt} W` : "—" },
            { label: "Charge time", value: chargeLabel },
            { label: "Charger", value: input.chargerAmp > 0 ? `${input.chargerAmp} A` : "—" },
            { label: "Battery", value: input.variants[0].battery || "—" },
            { label: "Warranty", value: input.warranty.trim() || "—" },
            { label: "Colors", value: colors.join(", ") || "—" },
          ],
          images: existing?.images ?? ["forest", "mint", "slate"],
          variants: input.variants,
          reviews: existing?.reviews ?? [],
          featured: existing?.featured ?? false,
          trending: existing?.trending ?? false,
          sellerId: existing?.sellerId || profile.uid,
          cities: input.cities.length ? input.cities : existing?.cities ?? [s.city],
          color: colors[0] ?? "",
          colors,
          modelName: model,
          motorWatt: input.motorWatt,
          chargerAmp: input.chargerAmp,
          chargeHours: input.chargeHours,
          trashed: false,
          trashedAt: 0,
          sellerName: existing?.sellerName || profile.name || "Seller",
          listedAt: existing?.listedAt || Date.now(),
        };
        run(async () => {
          let images = product.images;
          if (input.photos.length) {
            const blobs = await Promise.all(input.photos.slice(0, 3).map((f) => compressPhoto(f)));
            images = await repo.uploadProductPhotos(profile.uid, product.id, blobs);
          }
          await repo.saveProduct({ ...product, images });
          set({ accountPage: "hub", editingProductId: null, message: existing ? "Listing updated." : "Listing published." });
        });
      },

      moveToTrash: (product: Product) => {
        if (product.sellerId !== stateRef.current.user?.uid)
          return set({ error: "Only the seller who listed this scooter can delete it." });
        repo
          .setTrashed(product.id, true)
          .then(() => set({ sellerProductId: null, message: `${product.name} moved to trash.` }))
          .catch(fail);
      },

      restoreProduct: (product: Product) =>
        repo
          .setTrashed(product.id, false)
          .then(() => set({ message: `${product.name} restored.` }))
          .catch(fail),

      deleteForever: (product: Product) => {
        if (product.sellerId !== stateRef.current.user?.uid)
          return set({ error: "Only the seller who listed this scooter can delete it." });
        repo
          .deleteProduct(product.id)
          .then(() => set({ sellerProductId: null, message: `${product.name} deleted.` }))
          .catch(fail);
      },

      toggleWishlist: (product: Product) => {
        const profile = requireProfile("Sign in to save a wishlist.");
        if (!profile) return;
        const saved = stateRef.current.wishlist.some((w) => w.productId === product.id);
        const base = primary(product);
        const item: WishlistItem = {
          productId: product.id,
          name: product.name,
          brand: product.brand,
          imageKey: product.images[0] ?? "",
          offerPrice: base.offerPrice,
          mrp: base.mrp,
          color: product.color,
        };
        set((s) => ({ wishlist: saved ? s.wishlist.filter((w) => w.productId !== product.id) : [item, ...s.wishlist] }));
        (saved ? repo.removeWishlist(profile.uid, product.id) : repo.saveWishlist(profile.uid, item)).catch(fail);
      },

      publishCatalog: () => {
        if (!isAdmin(stateRef.current.profile?.role)) return set({ error: "Only an admin can publish the catalog." });
        run(async () => {
          await repo.publishCatalog();
          set({ message: "Showroom catalog published." });
        });
      },

      openOrderChat: (order: OrderQuery, sellerId: string) => {
        if (!requireProfile("Sign in to chat about this order.")) return;
        const product = stateRef.current.products.find((p) => p.sellerId === sellerId);
        openChatSession({
          id: `${order.id}_${sellerId}`,
          orderId: order.id,
          buyerId: order.buyerId,
          buyerName: order.buyerName || "Rider",
          sellerId,
          sellerName: product ? sellerLabel(product) : sellerId === "showroom" ? "Devbhoomi Electrics" : "Seller",
          productId: "",
          productName: "",
          topic: "order",
        });
      },

      openProductEnquiry: (product: Product) => {
        const profile = requireProfile("Sign in to enquire about this scooter.");
        if (!profile) return;
        openChatSession(
          {
            id: `enquiry_${product.id}_${profile.uid}`,
            orderId: "",
            buyerId: profile.uid,
            buyerName: profile.name || "Rider",
            sellerId: product.sellerId || "showroom",
            sellerName: sellerLabel(product),
            productId: product.id,
            productName: product.name,
            topic: "product",
          },
          `Hi, I have a query about ${product.name}.`,
        );
        set({ openProductId: null });
      },

      openExistingChat: (chat: OrderChat) => openChatSession(chat),

      closeChat: () => {
        chatUnsub.current?.();
        chatUnsub.current = null;
        set({ openChat: null, chatMessages: [] });
      },

      sendChat: (text: string) => {
        const s = stateRef.current;
        const chat = s.openChat;
        const sender = s.user?.uid;
        const clean = text.trim();
        if (!chat || !sender || !clean) return;
        const local: ChatMessage = { id: `local-${Date.now()}`, senderId: sender, text: clean, createdAt: Date.now() };
        set((st) => ({ chatMessages: [...st.chatMessages, local] }));
        (async () => {
          try {
            await repo.ensureChat(chat);
            await repo.sendMessage(chat.id, sender, clean);
          } catch (e) {
            set((st) => ({ error: friendly(e), chatMessages: st.chatMessages.filter((m) => m.id !== local.id) }));
          }
        })();
      },

      submitPartnerApplication: (input: PartnerInput) => {
        const profile = requireProfile("Sign in to apply as a retail partner.");
        if (!profile) return;
        if (input.name.trim().length < 2 || normalizePhone(input.mobile).length < 10 || !input.city.trim())
          return set({ error: "Enter your name, 10-digit mobile, and city." });
        run(async () => {
          await repo.submitPartnerApplication({
            uid: profile.uid,
            name: input.name.trim(),
            mobile: input.mobile.trim(),
            email: input.email.trim() || profile.email,
            city: input.city.trim(),
            area: input.area.trim(),
            shopName: input.shopName.trim(),
            note: input.note.trim(),
          });
          set({ accountPage: "hub", message: "Partner application sent to Devbhoomi Electrics admin." });
        });
      },
    }),
    [set, run, fail, quiet, requireProfile, openChatSession],
  );

  return { state, actions };
}

function dedupe<T extends { id: string }>(list: T[]) {
  const seen = new Set<string>();
  return list.filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)));
}

type Shop = ReturnType<typeof useShopStore>;
const ShopContext = createContext<Shop | null>(null);

export function ShopProvider({ children }: { children: ReactNode }) {
  const shop = useShopStore();
  return <ShopContext.Provider value={shop}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const shop = useContext(ShopContext);
  if (!shop) throw new Error("useShop must be used inside ShopProvider");
  return shop;
}
