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
    // Lust — sharp, heart-notched silhouette tapering to a point.
    5: (
      <g>
        <path d="M60 32 L34 14 L18 38 L60 128 L102 38 L86 14 Z" fill={color} />
        <circle cx="46" cy="58" r="6" fill="#2B2620" />
        <circle cx="74" cy="58" r="6" fill="#2B2620" />
        <path d="M50 80 L60 94 L70 80" stroke="#2B2620" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.3" />
      </g>
    ),
    // Down Bad — drooping ears, downturned frown.
    6: (
      <g>
        <path d="M26 32 Q8 55 24 76" stroke={color} strokeWidth="12" fill="none" strokeLinecap="round" />
        <path d="M94 32 Q112 55 96 76" stroke={color} strokeWidth="12" fill="none" strokeLinecap="round" />
        <ellipse cx="60" cy="78" rx="42" ry="44" fill={color} />
        <circle cx="46" cy="66" r="6" fill="#2B2620" />
        <circle cx="74" cy="66" r="6" fill="#2B2620" />
        <path d="M46 94 Q60 82 74 94" stroke="#2B2620" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.35" />
      </g>
    ),
    // Greed — faceted gem cut, like a cut jewel.
    7: (
      <g>
        <path d="M60 12 L98 44 L80 128 L40 128 L22 44 Z" fill={color} />
        <path d="M22 44 L98 44 M60 12 L60 128" stroke="#2B2620" strokeWidth="2" opacity="0.2" />
        <circle cx="47" cy="60" r="6" fill="#2B2620" />
        <circle cx="73" cy="60" r="6" fill="#2B2620" />
      </g>
    ),
    // Sloth — heavy, slumped shape, closed sleepy eyes, a little "z" drifting off.
    8: (
      <g>
        <ellipse cx="58" cy="82" rx="48" ry="40" fill={color} />
        <path d="M38 68 Q46 60 54 68" stroke="#2B2620" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M64 68 Q72 60 80 68" stroke="#2B2620" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M45 96 Q58 102 71 96" stroke="#2B2620" strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.35" />
        <path d="M92 24 L104 24 L92 36 L104 36" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
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
  if (pet.image_url) {
    return (
      <img
        src={pet.image_url}
        alt={pet.name}
        style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }}
      />
    );
  }
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
