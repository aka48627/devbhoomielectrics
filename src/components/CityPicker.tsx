"use client";

import { matchingCities, popularCities } from "@/lib/cities";
import { useState } from "react";
import { CloseIcon } from "./Icons";

export default function CityPicker({
  selected,
  onSelect,
  onClose,
}: {
  selected: string;
  onSelect: (city: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const results = matchingCities(query);
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="flex max-h-[85vh] w-full max-w-md flex-col rounded-t-2xl bg-background p-5 sm:rounded-2xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Choose your city</h2>
          <button type="button" onClick={onClose} className="rounded-full p-2 hover:bg-surface-variant" aria-label="Close">
            <CloseIcon />
          </button>
        </div>
        <input autoFocus className="field" placeholder="Search city" value={query} onChange={(e) => setQuery(e.target.value)} />
        {!query && (
          <div className="mt-3 flex flex-wrap gap-2">
            {popularCities.map((c) => (
              <button type="button" key={c} className="chip" data-on={c === selected} onClick={() => onSelect(c)}>
                {c}
              </button>
            ))}
          </div>
        )}
        <div className="mt-3 flex-1 overflow-y-auto">
          {results.map((c) => (
            <button
              type="button"
              key={c}
              onClick={() => onSelect(c)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-variant ${c === selected ? "font-semibold text-primary" : ""}`}
            >
              {c}
            </button>
          ))}
          {results.length === 0 && query.trim() && (
            <button type="button" onClick={() => onSelect(query.trim())} className="block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-variant">
              Use “{query.trim()}”
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
