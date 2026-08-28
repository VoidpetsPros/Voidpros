import React from "react";
import { Lamp, TestTube2, Coins, Sprout, Wind, Flame, Feather, Bell, Crown, Gem, Sparkles } from "lucide-react";

const ITEM_ICONS = { lamp: Lamp, testtube: TestTube2, coins: Coins, sprout: Sprout, wind: Wind, flame: Flame, feather: Feather, bell: Bell, crown: Crown, gem: Gem };

export default function ItemAvatar({ item, size = 40 }) {
  if (!item) return null;
  const Icon = ITEM_ICONS[item.icon] || Sparkles;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        background: item.color,
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
