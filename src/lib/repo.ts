import {
  type DocumentData,
  type DocumentSnapshot,
  type Unsubscribe,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "./firebase";
import { sampleProducts } from "./catalog";
import { cartLineId, colorList, normalizePhone, primary } from "./product";
import type {
  Address,
  CartItem,
  ChatMessage,
  OrderChat,
  OrderQuery,
  PartnerApplication,
  Product,
  ProductVariant,
  UserProfile,
  WishlistItem,
} from "./types";

type OnError = (e: Error) => void;

const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
const num = (v: unknown, fallback = 0) => (typeof v === "number" ? v : fallback);
const bool = (v: unknown) => v === true;
const strList = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
const millis = (v: unknown) => (v instanceof Timestamp ? v.toMillis() : num(v));

export function listenProducts(onChange: (p: Product[]) => void, onError: OnError): Unsubscribe {
  return onSnapshot(
    collection(db, "products"),
    (snap) => onChange(snap.docs.map(toProduct).filter((p): p is Product => p !== null)),
    onError,
  );
}

export function listenProfile(uid: string, onChange: (p: UserProfile | null) => void, onError: OnError): Unsubscribe {
  return onSnapshot(
    doc(db, "users", uid),
    (snap) => {
      if (!snap.exists()) return onChange(null);
      const d = snap.data();
      onChange({
        uid: snap.id,
        name: str(d.name),
        email: str(d.email),
        mobile: str(d.mobile),
        role: str(d.role, "user"),
        sellerMode: bool(d.sellerMode),
        city: str(d.city),
      });
    },
    onError,
  );
}

export function listenAddresses(uid: string, onChange: (a: Address[]) => void, onError: OnError): Unsubscribe {
  return onSnapshot(
    collection(db, "users", uid, "addresses"),
    (snap) =>
      onChange(
        snap.docs
          .filter((d) => typeof d.data().line1 === "string")
          .map((d) => {
            const x = d.data();
            return {
              id: d.id,
              label: str(x.label) || "Home",
              line1: str(x.line1),
              city: str(x.city),
              state: str(x.state),
              pincode: str(x.pincode),
              phone: str(x.phone),
            };
          })
          .sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase())),
      ),
    onError,
  );
}

export function listenCart(uid: string, onChange: (c: CartItem[]) => void, onError: OnError): Unsubscribe {
  return onSnapshot(
    collection(db, "carts", uid, "items"),
    (snap) =>
      onChange(
        snap.docs
          .filter((d) => typeof d.data().name === "string")
          .map((d) => {
            const x = d.data();
            const offer = num(x.offerPrice, num(x.price));
            return {
              lineId: d.id,
              productId: str(x.productId, d.id),
              variantId: str(x.variantId) || "standard",
              name: str(x.name),
              variantLabel: str(x.variantLabel),
              offerPrice: offer,
              mrp: num(x.mrp, offer),
              imageKey: str(x.imageKey) || "forest",
              qty: Math.max(1, num(x.qty, 1)),
            };
          })
          .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())),
      ),
    onError,
  );
}

export async function emailForIdentifier(identifier: string) {
  const value = identifier.trim();
  if (value.includes("@")) return value.toLowerCase();
  const phone = normalizePhone(value);
  if (phone.length !== 10) throw new Error("Enter a valid email or 10-digit mobile number.");
  const snap = await getDoc(doc(db, "phoneDirectory", phone));
  const email = snap.data()?.email;
  if (typeof email !== "string") throw new Error("No account found for this mobile number.");
  return email;
}

export async function ensureUser(uid: string, name: string, email: string, mobile: string) {
  const userRef = doc(db, "users", uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    await setDoc(userRef, {
      name: name.trim() || "Rider",
      email,
      mobile,
      role: "user",
      sellerMode: false,
      createdAt: serverTimestamp(),
    });
  } else if (!str(snap.data().name).trim() && name.trim()) {
    await updateDoc(userRef, { name });
  }
  if (mobile.trim()) {
    await savePhone(uid, email || str(snap.data()?.email), mobile, snap.data()?.mobile);
  }
}

export async function updateProfile(uid: string, email: string, name: string, mobile: string, previousMobile: string) {
  await ensureUser(uid, name, email, mobile);
  await setDoc(doc(db, "users", uid), { name, email, mobile }, { merge: true });
  if (mobile.trim()) await savePhone(uid, email, mobile, previousMobile);
  else if (previousMobile.trim()) await clearPhone(uid, previousMobile);
}

async function savePhone(uid: string, email: string, mobile: string, previous?: unknown) {
  const phone = normalizePhone(mobile);
  if (phone.length !== 10) throw new Error("Enter a 10-digit mobile number.");
  const prev = typeof previous === "string" ? normalizePhone(previous) : "";
  if (prev.length === 10 && prev !== phone) await clearPhone(uid, prev);
  const phoneRef = doc(db, "phoneDirectory", phone);
  const existing = await getDoc(phoneRef);
  if (existing.exists() && existing.data().uid !== uid) {
    throw new Error("This mobile number is already used by another account.");
  }
  await setDoc(phoneRef, { uid, email });
}

async function clearPhone(uid: string, mobile: string) {
  const phone = normalizePhone(mobile);
  if (phone.length !== 10) return;
  const phoneRef = doc(db, "phoneDirectory", phone);
  const existing = await getDoc(phoneRef);
  if (existing.data()?.uid === uid) await deleteDoc(phoneRef);
}

export async function addAddress(uid: string, address: Omit<Address, "id">) {
  const target = doc(collection(db, "users", uid, "addresses"));
  await setDoc(target, address);
}

export const deleteAddress = (uid: string, id: string) => deleteDoc(doc(db, "users", uid, "addresses", id));

export const saveCity = (uid: string, city: string) => setDoc(doc(db, "users", uid), { city }, { merge: true });

export async function setSellerMode(profile: UserProfile, enabled: boolean) {
  await ensureUser(profile.uid, profile.name, profile.email, profile.mobile);
  await setDoc(doc(db, "users", profile.uid), { sellerMode: enabled }, { merge: true });
}

export const saveProduct = (product: Product) => setDoc(doc(db, "products", product.id), productToMap(product));

export const setTrashed = (id: string, trashed: boolean) =>
  setDoc(doc(db, "products", id), { trashed, trashedAt: trashed ? Date.now() : 0 }, { merge: true });

export const deleteProduct = (id: string) => deleteDoc(doc(db, "products", id));

export function listenWishlist(uid: string, onChange: (w: WishlistItem[]) => void, onError: OnError): Unsubscribe {
  return onSnapshot(
    collection(db, "users", uid, "wishlist"),
    (snap) =>
      onChange(
        snap.docs
          .filter((d) => typeof d.data().name === "string")
          .map((d) => {
            const x = d.data();
            return {
              productId: str(x.productId, d.id),
              name: str(x.name),
              brand: str(x.brand),
              imageKey: str(x.imageKey),
              offerPrice: num(x.offerPrice),
              mrp: num(x.mrp),
              color: str(x.color),
            };
          })
          .sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())),
      ),
    onError,
  );
}

export const saveWishlist = (uid: string, item: WishlistItem) =>
  setDoc(doc(db, "users", uid, "wishlist", item.productId), item);

export const removeWishlist = (uid: string, productId: string) => deleteDoc(doc(db, "users", uid, "wishlist", productId));

export async function uploadProductPhotos(uid: string, productId: string, photos: Blob[]) {
  return Promise.all(
    photos.map(async (blob, index) => {
      const target = ref(storage, `products/${uid}/${productId}/${index}.jpg`);
      await uploadBytes(target, blob, { contentType: "image/jpeg" });
      return getDownloadURL(target);
    }),
  );
}

export async function placeOrder(order: OrderQuery) {
  await setDoc(doc(db, "orders", order.id), {
    buyerId: order.buyerId,
    buyerName: order.buyerName,
    buyerEmail: order.buyerEmail,
    buyerMobile: order.buyerMobile,
    note: order.note,
    buyerCity: order.buyerCity,
    status: "query",
    sellerIds: order.sellerIds,
    total: order.total,
    createdAt: serverTimestamp(),
    lines: order.lines,
  });
}

export async function clearCart(uid: string) {
  const items = await getDocs(collection(db, "carts", uid, "items"));
  if (items.empty) return;
  const batch = writeBatch(db);
  items.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
}

export function listenBuyerOrders(uid: string, onChange: (o: OrderQuery[]) => void, onError: OnError): Unsubscribe {
  return onSnapshot(
    query(collection(db, "orders"), where("buyerId", "==", uid)),
    (snap) => onChange(sortOrders(snap.docs.map(toOrder))),
    onError,
  );
}

export function listenSellerOrders(sellerId: string, onChange: (o: OrderQuery[]) => void, onError: OnError): Unsubscribe {
  return onSnapshot(
    query(collection(db, "orders"), where("sellerIds", "array-contains", sellerId)),
    (snap) => onChange(sortOrders(snap.docs.map(toOrder))),
    onError,
  );
}

const sortOrders = (list: (OrderQuery | null)[]) =>
  list.filter((o): o is OrderQuery => o !== null).sort((a, b) => b.createdAt - a.createdAt);

export async function addToCart(uid: string, product: Product, variant: ProductVariant) {
  const line = doc(db, "carts", uid, "items", cartLineId(product.id, variant.id));
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(line);
    const qty = num(snap.data()?.qty) + 1;
    tx.set(line, {
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      variantLabel: variant.label,
      offerPrice: variant.offerPrice,
      mrp: variant.mrp,
      price: variant.offerPrice,
      imageKey: product.images[0] ?? "",
      qty,
    });
  });
}

export async function setQuantity(uid: string, item: CartItem, qty: number) {
  const line = doc(db, "carts", uid, "items", item.lineId);
  if (qty <= 0) return deleteDoc(line);
  await setDoc(line, {
    productId: item.productId,
    variantId: item.variantId,
    name: item.name,
    variantLabel: item.variantLabel,
    offerPrice: item.offerPrice,
    mrp: item.mrp,
    price: item.offerPrice,
    imageKey: item.imageKey,
    qty,
  });
}

export async function publishCatalog() {
  const batch = writeBatch(db);
  sampleProducts.forEach((p) => batch.set(doc(db, "products", p.id), productToMap(p)));
  await batch.commit();
}

export async function ensureChat(chat: OrderChat) {
  await setDoc(
    doc(db, "chats", chat.id),
    {
      orderId: chat.orderId,
      buyerId: chat.buyerId,
      buyerName: chat.buyerName,
      sellerId: chat.sellerId,
      sellerName: chat.sellerName,
      productId: chat.productId,
      productName: chat.productName,
      topic: chat.topic,
      updatedAt: Date.now(),
    },
    { merge: true },
  );
}

export function listenChats(field: "sellerId" | "buyerId", id: string, onChange: (c: OrderChat[]) => void, onError: OnError) {
  return onSnapshot(
    query(collection(db, "chats"), where(field, "==", id)),
    (snap) =>
      onChange(
        snap.docs
          .map((d) => ({ chat: toChat(d), updated: num(d.data().updatedAt) }))
          .filter((x): x is { chat: OrderChat; updated: number } => x.chat !== null)
          .sort((a, b) => b.updated - a.updated)
          .map((x) => x.chat),
      ),
    onError,
  );
}

export function listenMessages(chatId: string, onChange: (m: ChatMessage[]) => void, onError: OnError): Unsubscribe {
  return onSnapshot(
    collection(db, "chats", chatId, "messages"),
    (snap) =>
      onChange(
        snap.docs
          .filter((d) => typeof d.data().text === "string")
          .map((d) => ({
            id: d.id,
            senderId: str(d.data().senderId),
            text: str(d.data().text),
            createdAt: num(d.data().createdAt),
          }))
          .sort((a, b) => a.createdAt - b.createdAt),
      ),
    onError,
  );
}

export async function sendMessage(chatId: string, senderId: string, text: string) {
  const clean = text.trim();
  if (!clean) return;
  const message = doc(collection(db, "chats", chatId, "messages"));
  await setDoc(message, { senderId, text: clean, createdAt: Date.now() });
  await setDoc(doc(db, "chats", chatId), { updatedAt: Date.now() }, { merge: true });
}

export async function hasMessages(chatId: string) {
  const snap = await getDocs(query(collection(db, "chats", chatId, "messages"), limit(1)));
  return !snap.empty;
}

export async function submitPartnerApplication(app: Omit<PartnerApplication, "id" | "status" | "createdAt">) {
  await setDoc(doc(collection(db, "partnerApplications")), { ...app, status: "new", createdAt: Date.now() });
}

export function listenPartnerApplications(onChange: (a: PartnerApplication[]) => void, onError: OnError): Unsubscribe {
  return onSnapshot(
    collection(db, "partnerApplications"),
    (snap) =>
      onChange(
        snap.docs
          .map((d) => {
            const x = d.data();
            return {
              id: d.id,
              uid: str(x.uid),
              name: str(x.name),
              mobile: str(x.mobile),
              email: str(x.email),
              city: str(x.city),
              area: str(x.area),
              shopName: str(x.shopName),
              note: str(x.note),
              status: str(x.status, "new"),
              createdAt: num(x.createdAt),
            };
          })
          .sort((a, b) => b.createdAt - a.createdAt),
      ),
    onError,
  );
}

function toChat(d: DocumentSnapshot<DocumentData>): OrderChat | null {
  const x = d.data();
  if (!x || typeof x.buyerId !== "string") return null;
  return {
    id: d.id,
    orderId: str(x.orderId),
    buyerId: x.buyerId,
    buyerName: str(x.buyerName),
    sellerId: str(x.sellerId),
    sellerName: str(x.sellerName),
    productId: str(x.productId),
    productName: str(x.productName),
    topic: str(x.topic) || (str(x.productId) ? "product" : "order"),
  };
}

function productToMap(p: Product) {
  const base = primary(p);
  return {
    name: p.name,
    brand: p.brand,
    category: p.category,
    description: p.description,
    rating: p.rating,
    reviewCount: p.reviewCount,
    price: base.offerPrice,
    mrp: base.mrp,
    offerPrice: base.offerPrice,
    rangeKm: base.rangeKm,
    topSpeedKmh: base.topSpeedKmh,
    battery: base.battery,
    featured: p.featured,
    trending: p.trending,
    sellerId: p.sellerId,
    cities: p.cities,
    color: p.color,
    colors: colorList(p),
    modelName: p.modelName,
    motorWatt: p.motorWatt,
    chargerAmp: p.chargerAmp,
    chargeHours: p.chargeHours,
    trashed: p.trashed,
    trashedAt: p.trashedAt,
    sellerName: p.sellerName,
    listedAt: p.listedAt,
    images: p.images,
    specifications: Object.fromEntries(p.specifications.map((s) => [s.label, s.value])),
    variants: p.variants,
    reviews: p.reviews,
  };
}

function toProduct(d: DocumentSnapshot<DocumentData>): Product | null {
  const x = d.data();
  if (!x || typeof x.name !== "string") return null;
  let variants: ProductVariant[] = (Array.isArray(x.variants) ? x.variants : [])
    .filter((v: unknown): v is Record<string, unknown> => !!v && typeof (v as Record<string, unknown>).id === "string")
    .map((v: Record<string, unknown>) => ({
      id: v.id as string,
      label: str(v.label),
      rangeKm: num(v.rangeKm),
      topSpeedKmh: num(v.topSpeedKmh),
      battery: str(v.battery),
      mrp: num(v.mrp),
      offerPrice: num(v.offerPrice),
      stock: num(v.stock),
    }));
  if (!variants.length) {
    const offer = num(x.offerPrice, num(x.price));
    variants = [
      {
        id: "standard",
        label: `${num(x.rangeKm)} km`,
        rangeKm: num(x.rangeKm),
        topSpeedKmh: num(x.topSpeedKmh),
        battery: str(x.battery),
        mrp: num(x.mrp, offer),
        offerPrice: offer,
        stock: 4,
      },
    ];
  }
  const images = strList(x.images);
  const colors = strList(x.colors);
  const specs = x.specifications && typeof x.specifications === "object" ? x.specifications : {};
  return {
    id: d.id,
    name: x.name,
    brand: str(x.brand) || "Devbhoomi",
    category: str(x.category, "City"),
    description: str(x.description),
    rating: num(x.rating),
    reviewCount: num(x.reviewCount),
    specifications: Object.entries(specs).map(([label, value]) => ({ label, value: String(value ?? "") })),
    images: images.length ? images : ["forest", "mint", "slate"],
    variants,
    reviews: (Array.isArray(x.reviews) ? x.reviews : [])
      .filter((r: unknown): r is Record<string, unknown> => !!r && typeof (r as Record<string, unknown>).id === "string")
      .map((r: Record<string, unknown>) => ({
        id: r.id as string,
        author: str(r.author, "Rider"),
        rating: num(r.rating),
        comment: str(r.comment),
      })),
    featured: bool(x.featured),
    trending: bool(x.trending),
    sellerId: str(x.sellerId),
    cities: strList(x.cities),
    color: str(x.color),
    colors: colors.length ? colors : [str(x.color)].filter((c) => c.trim()),
    modelName: str(x.modelName),
    motorWatt: num(x.motorWatt),
    chargerAmp: num(x.chargerAmp),
    chargeHours: num(x.chargeHours),
    trashed: bool(x.trashed),
    trashedAt: num(x.trashedAt),
    sellerName: str(x.sellerName),
    listedAt: num(x.listedAt),
  };
}

function toOrder(d: DocumentSnapshot<DocumentData>): OrderQuery | null {
  const x = d.data();
  if (!x || typeof x.buyerId !== "string") return null;
  const lines = (Array.isArray(x.lines) ? x.lines : [])
    .filter((l: unknown): l is Record<string, unknown> => !!l && typeof l === "object")
    .map((l: Record<string, unknown>) => ({
      productId: str(l.productId),
      sellerId: str(l.sellerId, "showroom"),
      name: str(l.name),
      variantLabel: str(l.variantLabel),
      qty: num(l.qty, 1),
      offerPrice: num(l.offerPrice),
      imageKey: str(l.imageKey, "forest"),
    }));
  return {
    id: d.id,
    buyerId: x.buyerId,
    buyerName: str(x.buyerName),
    buyerEmail: str(x.buyerEmail),
    buyerMobile: str(x.buyerMobile),
    note: str(x.note),
    buyerCity: str(x.buyerCity),
    status: str(x.status, "query"),
    sellerIds: strList(x.sellerIds),
    lines,
    total: num(x.total, lines.reduce((s: number, l: { offerPrice: number; qty: number }) => s + l.offerPrice * l.qty, 0)),
    createdAt: millis(x.createdAt),
  };
}
