import React from "react";

function VoidCreature({ style, variant = 1, color = "#D9CDF0" }) {
  const shapes = {
    1: (
      <g>
        <ellipse cx="60" cy="70" rx="46" ry="40" fill={color} />
        <circle cx="44" cy="62" r="7" fill="#2B2620" />
        <circle cx="76" cy="62" r="7" fill="#2B2620" />
        <path d="M40 40 Q60 20 80 40" stroke={color} strokeWidth="10" fill="none" strokeLinecap="round" />
        <path d="M30 95 Q60 115 90 95" stroke="#2B2620" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.3" />
      </g>
    ),
    2: (
      <g>
        <path d="M60 15 L100 70 L60 125 L20 70 Z" fill={color} />
        <circle cx="48" cy="65" r="6" fill="#2B2620" />
        <circle cx="72" cy="65" r="6" fill="#2B2620" />
        <path d="M40 88 Q60 100 80 88" stroke="#2B2620" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.3" />
      </g>
    ),
    3: (
      <g>
        <circle cx="60" cy="65" r="45" fill={color} />
        <path d="M25 40 Q15 15 35 20" stroke={color} strokeWidth="12" fill="none" strokeLinecap="round" />
        <path d="M95 40 Q105 15 85 20" stroke={color} strokeWidth="12" fill="none" strokeLinecap="round" />
        <circle cx="46" cy="60" r="6" fill="#2B2620" />
        <circle cx="74" cy="60" r="6" fill="#2B2620" />
        <path d="M46 84 Q60 92 74 84" stroke="#2B2620" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.3" />
      </g>
    ),
  };
  return (
    <svg viewBox="0 0 120 140" width="120" height="140" style={style}>
      {shapes[variant] || shapes[1]}
    </svg>
  );
}

export default function PetAvatar({ pet, size = 40 }) {
  if (!pet) return null;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: pet.color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <VoidCreature
        variant={pet.variant}
        color={pet.color}
        style={{ width: size * 1.35, height: size * 1.35, marginTop: size * 0.18 }}
      />
    </div>
  );
}
