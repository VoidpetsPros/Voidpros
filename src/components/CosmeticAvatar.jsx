import React from "react";

// Renders nothing if there's no cosmetic equipped — callers just drop this
// in next to a username and it either shows the icon or takes up no space.
export default function CosmeticAvatar({ url, size = 20 }) {
  if (!url) return null;
  return (
    <img
      src={url}
      alt=""
      style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
    />
  );
}
