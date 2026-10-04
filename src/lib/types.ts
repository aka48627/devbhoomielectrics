export type ProductVariant = {
  id: string;
  label: string;
  rangeKm: number;
  topSpeedKmh: number;
  battery: string;
  mrp: number;
  offerPrice: number;
  stock: number;
};

export type Spec = { label: string; value: string };

export type Review = { id: string; author: string; rating: number; comment: string };

export type Product = {
  id: string;
  name: string;
  brand: string;
  category: string;
  description: string;
  rating: number;
  reviewCount: number;
  specifications: Spec[];
  images: string[];
  variants: ProductVariant[];
  reviews: Review[];
  featured: boolean;
  trending: boolean;
  sellerId: string;
  cities: string[];
  color: string;
  colors: string[];
  modelName: string;
  motorWatt: number;
  chargerAmp: number;
  chargeHours: number;
  trashed: boolean;
  trashedAt: number;
  sellerName: string;
  listedAt: number;
};

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  mobile: string;
  role: string;
  sellerMode: boolean;
  city: string;
  createdAt: number;
};

export type Address = {
  id: string;
  label: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
};

export type OrderLine = {
  productId: string;
  sellerId: string;
  name: string;
  variantLabel: string;
  qty: number;
  offerPrice: number;
  imageKey: string;
};

export type OrderQuery = {
  id: string;
  buyerId: string;
  buyerName: string;
  buyerEmail: string;
  buyerMobile: string;
  note: string;
  buyerCity: string;
  status: string;
  sellerIds: string[];
  lines: OrderLine[];
  total: number;
  createdAt: number;
};

export type CartItem = {
  lineId: string;
  productId: string;
  variantId: string;
  name: string;
  variantLabel: string;
  offerPrice: number;
  mrp: number;
  imageKey: string;
  qty: number;
};

export type ChatMessage = { id: string; senderId: string; text: string; createdAt: number };

export type OrderChat = {
  id: string;
  orderId: string;
  buyerId: string;
  buyerName: string;
  sellerId: string;
  sellerName: string;
  productId: string;
  productName: string;
  topic: string;
};

export type PartnerApplication = {
  id: string;
  uid: string;
  name: string;
  mobile: string;
  email: string;
  city: string;
  area: string;
  shopName: string;
  note: string;
  status: string;
  createdAt: number;
};

export type WishlistItem = {
  productId: string;
  name: string;
  brand: string;
  imageKey: string;
  offerPrice: number;
  mrp: number;
  color: string;
};

export const scooterColors = ["White", "Black", "Silver", "Grey", "Red", "Blue", "Green", "Yellow", "Orange", "Maroon"];

export const listingCategories = [
  "Activa style",
  "Ola style",
  "Single light",
  "Double light",
  "City",
  "Family",
  "Sport",
  "Cargo",
  "Premium",
];

export const HEAD_OFFICE = {
  name: "Devbhoomi Electrics",
  address: "Mohanpur, Prem Nagar, Dehradun, Uttarakhand 248007",
  mapUrl: "https://maps.app.goo.gl/Z8iRJdxqtRVr89ac8",
  email: "support@devbhoomielectrics.com",
};
