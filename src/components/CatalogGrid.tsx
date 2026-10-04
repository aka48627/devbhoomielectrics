"use client";

import type { Product } from "@/lib/types";
import { Fragment, useState, type ReactNode } from "react";
import { GridIcon, ListIcon } from "./Icons";
import { ProductGridCard, ProductListCard } from "./ProductCards";
import SavingsCalculator from "./SavingsCalculator";

function calculatorAfter(count: number) {
  if (count === 0) return 0;
  if (count < 5) return count;
  return Math.min(5 + (count % 3), count);
}

export default function CatalogGrid({
  title,
  subtitle,
  products,
  onOpen,
  onWishlist,
  wished,
  emptyText = "No scooters here yet.",
  showCalculator = true,
  toolbar,
}: {
  title: string;
  subtitle?: string;
  products: Product[];
  onOpen: (id: string) => void;
  onWishlist?: (p: Product) => void;
  wished?: (p: Product) => boolean;
  emptyText?: string;
  showCalculator?: boolean;
  toolbar?: ReactNode;
}) {
  const [listMode, setListMode] = useState(false);
  const after = showCalculator ? calculatorAfter(products.length) : 0;
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">{title}</h1>
          {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={() => setListMode((v) => !v)}
          className="rounded-lg p-2 text-muted hover:bg-surface-variant"
          aria-label={listMode ? "Show as grid" : "Show as list"}
        >
          {listMode ? <GridIcon /> : <ListIcon />}
        </button>
      </div>
      {toolbar}
      {products.length === 0 ? (
        <p className="py-6 text-sm text-muted">{emptyText}</p>
      ) : (
        <div className={listMode ? "grid gap-3 md:grid-cols-2" : "grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"}>
          {products.map((p, i) => (
            <Fragment key={p.id}>
              {listMode ? (
                <ProductListCard
                  product={p}
                  onOpen={() => onOpen(p.id)}
                  wished={wished?.(p)}
                  onWishlist={onWishlist && (() => onWishlist(p))}
                />
              ) : (
                <ProductGridCard
                  product={p}
                  onOpen={() => onOpen(p.id)}
                  wished={wished?.(p)}
                  onWishlist={onWishlist && (() => onWishlist(p))}
                />
              )}
              {after > 0 && i + 1 === after && (
                <div className="col-span-full">
                  <SavingsCalculator product={p} />
                </div>
              )}
            </Fragment>
          ))}
        </div>
      )}
    </section>
  );
}
