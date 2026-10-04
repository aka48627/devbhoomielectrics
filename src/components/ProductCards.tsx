"use client";

import { cardMeta, discountPercent, hasRating, primary, savings, toInr } from "@/lib/product";
import { DEFAULT_DAILY_KM, petrolSaving } from "@/lib/savings";
import type { Product, ProductVariant } from "@/lib/types";
import { HeartIcon, StarIcon } from "./Icons";
import ProductThumb from "./ProductThumb";

type CardProps = {
  product: Product;
  onOpen: () => void;
  wished?: boolean;
  onWishlist?: () => void;
};

export function MonthlySaving({ product, variant, className = "text-xs" }: { product: Product; variant?: ProductVariant; className?: string }) {
  const monthly = petrolSaving(product, variant ?? primary(product), DEFAULT_DAILY_KM)[1];
  return <p className={`${className} font-bold text-saving`}>{toInr(monthly)}/mo vs petrol</p>;
}

export function DiscountLine({ variant }: { variant: ProductVariant }) {
  if (savings(variant) <= 0) return <p className="text-[11px] text-muted">No discount on this range</p>;
  return (
    <p className="text-[11px]">
      <span className="text-muted line-through">{toInr(variant.mrp)}</span>
      <span className="ml-1.5 font-medium text-saving">
        {toInr(savings(variant))} off · {discountPercent(variant)}%
      </span>
    </p>
  );
}

function WishButton({ wished, onWishlist, onImage }: { wished?: boolean; onWishlist: () => void; onImage?: boolean }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onWishlist();
      }}
      aria-label={wished ? "Remove from wishlist" : "Save to wishlist"}
      className={`absolute right-1.5 top-1.5 rounded-full p-1.5 ${onImage ? "bg-black/25" : ""}`}
    >
      <HeartIcon filled={wished} className={`size-5 ${wished ? "text-[#c62828]" : "text-white"}`} />
    </button>
  );
}

export function ProductGridCard({ product, onOpen, wished, onWishlist }: CardProps) {
  const variant = primary(product);
  const meta = cardMeta(product);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className="cursor-pointer overflow-hidden rounded-lg bg-surface shadow-sm ring-1 ring-black/5 transition hover:shadow-md"
    >
      <div className="relative">
        <ProductThumb imageKey={product.images[0] ?? ""} className="h-32 w-full sm:h-40" />
        {onWishlist && <WishButton wished={wished} onWishlist={onWishlist} onImage />}
      </div>
      <div className="space-y-0.5 px-2.5 py-2">
        <p className="truncate text-[13px] font-medium">{product.name}</p>
        {meta && <p className="truncate text-[10px] text-muted">{meta}</p>}
        {hasRating(product) && (
          <p className="flex items-center gap-1 text-[10px] text-muted">
            <StarIcon className="size-3 text-saving" /> {product.rating.toFixed(1)} ({product.reviewCount})
          </p>
        )}
        <p className="text-sm font-bold">{toInr(variant.offerPrice)}</p>
        <p className={`truncate text-[10px] ${savings(variant) > 0 ? "text-saving" : "text-muted"}`}>
          {savings(variant) > 0
            ? `${toInr(variant.mrp)}  ${toInr(savings(variant))} off · ${discountPercent(variant)}%`
            : "No discount"}
        </p>
        <MonthlySaving product={product} className="text-[11px]" />
      </div>
    </div>
  );
}

export function ProductListCard({ product, onOpen, wished, onWishlist }: CardProps) {
  const variant = primary(product);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      className="flex cursor-pointer gap-3 rounded-xl bg-surface p-2 shadow-sm ring-1 ring-black/5 transition hover:shadow-md"
    >
      <div className="relative shrink-0">
        <ProductThumb imageKey={product.images[0] ?? ""} className="size-32 rounded-lg" />
        {onWishlist && <WishButton wished={wished} onWishlist={onWishlist} onImage />}
      </div>
      <div className="min-w-0 flex-1 space-y-0.5">
        <p className="line-clamp-2 text-[15px] font-semibold">{product.name}</p>
        <p className="line-clamp-2 text-[11px] text-muted">{cardMeta(product)}</p>
        {hasRating(product) && (
          <p className="text-[11px] text-saving">
            {product.rating.toFixed(1)} · {product.reviewCount} ratings
          </p>
        )}
        <p className="text-base font-bold">{toInr(variant.offerPrice)}</p>
        <DiscountLine variant={variant} />
        <MonthlySaving product={product} />
      </div>
    </div>
  );
}
