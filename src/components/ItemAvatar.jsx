import React from "react";
import { HardHat, Waves, ShoppingBag, Sparkles } from "lucide-react";
import { RARITY_COLORS } from "../lib/theme";

// Icon is now standardized by item type — every hat looks like a hat,
// every scarf a scarf, every accessory a bag — rather than each item
// picking its own icon. Background is standardized by rarity too
// (Common/Rare/Epic/Legendary/Uber), same colors used everywhere else
// rarity shows up on the site.
const TYPE_ICONS = { hat: HardHat, scarf: Waves, accessory: ShoppingBag };

export default function ItemAvatar({ item, size = 40 }) {
  if (!item) return null;
  if (item.image_url) {
    return (
      <img
        src={item.image_url}
        alt={item.name}
        style={{ width: size, height: size, borderRadius: 10, objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
  const Icon = TYPE_ICONS[item.type] || Sparkles;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        background: RARITY_COLORS[item.rarity] || item.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon size={size * 0.5} color="#2B2620" strokeWidth={1.6} />
    </div>
  );
}
