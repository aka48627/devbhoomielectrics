"use client";

import { useState } from "react";
import { ScooterIcon } from "./Icons";

const palette: Record<string, [string, string]> = {
  mint: ["#d7f5e3", "#0f6b3c"],
  lime: ["#f3f8d8", "#4e6510"],
  gold: ["#fff1d0", "#8a5a00"],
  slate: ["#e6eef3", "#1e3a4c"],
};

export default function ProductThumb({
  imageKey,
  caption = "",
  className = "",
  fit = "cover",
}: {
  imageKey: string;
  caption?: string;
  className?: string;
  fit?: "cover" | "contain";
}) {
  const [broken, setBroken] = useState(false);
  const remote = /^(https?:|blob:|data:)/.test(imageKey);
  if (remote && !broken) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageKey}
        alt={caption || "Scooter photo"}
        onError={() => setBroken(true)}
        className={`${className} ${fit === "cover" ? "object-cover" : "object-contain"}`}
        loading="lazy"
      />
    );
  }
  const [bg, ink] = palette[imageKey.split("?")[0]] ?? ["#d5e6dc", "#083526"];
  return (
    <div
      className={`${className} flex flex-col items-center justify-center`}
      style={{ background: `linear-gradient(135deg, ${bg}, ${bg}8c)`, color: ink }}
    >
      <ScooterIcon className="size-14" />
      {caption && <span className="text-[11px] font-medium">{caption}</span>}
    </div>
  );
}
