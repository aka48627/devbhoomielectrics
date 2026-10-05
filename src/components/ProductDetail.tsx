"use client";

import { rangeLabel } from "@/lib/filters";
import { colorList, formatDate, hasRating, sellerLabel, toInr, variantById } from "@/lib/product";
import { useShop } from "@/lib/shop";
import type { Product } from "@/lib/types";
import { useEffect, useState } from "react";
import { BackIcon, ChatIcon, ChevronLeft, ChevronRight, CloseIcon, HeartIcon, StarIcon, VerifiedIcon } from "./Icons";
import { MonthlySaving } from "./ProductCards";
import ProductThumb from "./ProductThumb";

export default function ProductDetail({ product }: { product: Product }) {
  const { state, actions } = useShop();
  const [variantId, setVariantId] = useState(product.variants[0]?.id);
  const [photo, setPhoto] = useState(0);
  const [zoom, setZoom] = useState<number | null>(null);
  const variant = variantById(product, variantId);
  const wished = state.wishlist.some((w) => w.productId === product.id);
  const images = product.images.length ? product.images : ["forest"];

  useEffect(() => {
    setVariantId(variantById(product, null).id);
    setPhoto(0);
  }, [product]);

  return (
    <div className="pb-24 md:pb-6">
      <div className="mb-3 flex items-center gap-2">
        <button type="button" onClick={actions.closeProduct} className="rounded-full p-2 hover:bg-surface-variant" aria-label="Back">
          <BackIcon />
        </button>
        <span className="flex-1 text-sm text-muted">{product.brand}</span>
        <button
          type="button"
          onClick={() => actions.toggleWishlist(product)}
          className="rounded-full p-2 hover:bg-surface-variant"
          aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
        >
          <HeartIcon filled={wished} className={`size-6 ${wished ? "text-[#c62828]" : ""}`} />
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <button type="button" onClick={() => setZoom(photo)} className="block w-full overflow-hidden rounded-xl" aria-label="Zoom photo">
            <ProductThumb imageKey={images[photo]} caption={`Photo ${photo + 1}`} className="h-72 w-full md:h-96" />
          </button>
          <div className="no-scrollbar flex gap-2 overflow-x-auto">
            {images.map((key, i) => (
              <button
                type="button"
                key={`${key}-${i}`}
                onClick={() => setPhoto(i)}
                className={`shrink-0 overflow-hidden rounded-lg ring-2 ${i === photo ? "ring-primary" : "ring-transparent"}`}
              >
                <ProductThumb imageKey={key} className="h-16 w-20" />
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl leading-tight">{product.name}</h1>
          <p className="text-xs text-muted">
            {[product.modelName || product.category, product.brand, colorList(product).join("/")].filter(Boolean).join("  ·  ")}
          </p>
          {hasRating(product) && (
            <p className="flex items-center gap-1 text-xs">
              <StarIcon className="size-3.5 text-saving" /> {product.rating.toFixed(1)} · {product.reviewCount} ratings
            </p>
          )}
          <button type="button" onClick={() => actions.openSellerShop(product.sellerId || "showroom")} className="flex items-center gap-1 text-left text-sm text-primary hover:underline">
            Sold by {sellerLabel(product)}
            <VerifiedIcon className="size-4 shrink-0 text-[#1a73e8]" />
          </button>
          {product.listedAt > 0 && <p className="text-xs text-muted">Posted {formatDate(product.listedAt)}</p>}
          <p className="text-[13px] leading-relaxed text-muted">{product.description}</p>

          <div>
            <p className="text-2xl font-bold">{toInr(variant.offerPrice)}</p>
            {variant.mrp > variant.offerPrice && <p className="text-sm text-muted line-through">{toInr(variant.mrp)}</p>}
          </div>
          <MonthlySaving product={product} variant={variant} className="text-[15px]" />

          <div className="space-y-1.5">
            <p className="text-[13px]">Range options</p>
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {product.variants.map((v) => (
                <button type="button" key={v.id} className="chip" data-on={v.id === variant.id} onClick={() => setVariantId(v.id)}>
                  {v.label} · {v.battery}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted">
              {variant.topSpeedKmh} km/h · {variant.battery} · {variant.stock} in stock
            </p>
          </div>

          <div className="hidden gap-2 md:flex">
            <button type="button" className="btn btn-outline flex-1" onClick={() => actions.openProductEnquiry(product)}>
              <ChatIcon className="size-4" /> Enquire now
            </button>
            <button type="button" className="btn btn-primary flex-1" onClick={() => actions.addToCart(product, variant)}>
              Add to cart
            </button>
          </div>

          <hr className="border-surface-variant" />
          <h2 className="text-sm font-medium">Specifications</h2>
          <dl className="space-y-1">
            {[
              ...(rangeLabel(product) && !product.specifications.some((s) => s.label.toLowerCase() === "range")
                ? [{ label: "Range", value: rangeLabel(product) }]
                : []),
              ...product.specifications,
            ].map((s) => (
              <div key={s.label} className="grid grid-cols-2 gap-2 text-xs">
                <dt className="text-muted">{s.label}</dt>
                <dd>{s.value}</dd>
              </div>
            ))}
          </dl>

          {hasRating(product) && (
            <>
              <hr className="border-surface-variant" />
              <h2 className="text-sm font-medium">Ratings & reviews</h2>
              {product.reviews.length === 0 && <p className="text-xs text-muted">No written reviews yet.</p>}
              {product.reviews.map((r) => (
                <div key={r.id} className="space-y-0.5">
                  <p className="text-xs">
                    {r.author} · {r.rating.toFixed(1)}
                  </p>
                  <p className="text-xs text-muted">{r.comment}</p>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-2 bg-surface p-3 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] md:hidden">
        <button type="button" className="btn btn-outline flex-1" onClick={() => actions.openProductEnquiry(product)}>
          Enquire now
        </button>
        <button type="button" className="btn btn-primary flex-1" onClick={() => actions.addToCart(product, variant)}>
          Add to cart
        </button>
      </div>

      {zoom !== null && <ZoomGallery images={images} start={zoom} onClose={() => setZoom(null)} />}
    </div>
  );
}

function ZoomGallery({ images, start, onClose }: { images: string[]; start: number; onClose: () => void }) {
  const [index, setIndex] = useState(start);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setIndex((i) => Math.min(images.length - 1, i + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length, onClose]);
  useEffect(() => setScale(1), [index]);
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      <div className="flex items-center gap-2 p-2 text-white">
        <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-white/10" aria-label="Close">
          <CloseIcon />
        </button>
        <span className="text-sm">
          Photo {index + 1} of {images.length}
        </span>
        <span className="ml-auto text-xs text-white/70">Scroll or double-click to zoom</span>
      </div>
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden"
        onWheel={(e) => setScale((s) => Math.min(5, Math.max(1, s - e.deltaY * 0.002)))}
        onDoubleClick={() => setScale((s) => (s > 1 ? 1 : 2.5))}
      >
        <div style={{ transform: `scale(${scale})` }} className="h-[72vh] w-full transition-transform">
          <ProductThumb imageKey={images[index]} fit="contain" className="h-full w-full" />
        </div>
        {index > 0 && (
          <button type="button" onClick={() => setIndex(index - 1)} className="absolute left-2 rounded-full bg-white/10 p-2 text-white" aria-label="Previous photo">
            <ChevronLeft className="size-7" />
          </button>
        )}
        {index < images.length - 1 && (
          <button type="button" onClick={() => setIndex(index + 1)} className="absolute right-2 rounded-full bg-white/10 p-2 text-white" aria-label="Next photo">
            <ChevronRight className="size-7" />
          </button>
        )}
      </div>
    </div>
  );
}
