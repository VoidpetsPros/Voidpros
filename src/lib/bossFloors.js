// Boss + element per floor, for floors 10 through 1000 (every multiple of
// 10) — from the official boss rotation chart. Floors not listed here
// (everything not a multiple of 10 in this range, and everything above
// 1000) intentionally have no boss/element shown yet.
export const ELEMENT_COLORS = {
  fire: "#EF4444",
  water: "#3B82F6",
  wood: "#22C55E",
  metal: "#A855F7",
  earth: "#F59E0B",
};

const BOSS_FLOORS = {
  10: { name: "Harold", element: "fire" },
  20: { name: "Galax", element: "wood" },
  30: { name: "Krakoth", element: "earth" },
  40: { name: "Vulko", element: "metal" },
  50: { name: "Voidweaver", element: "water" },
  60: { name: "Shift", element: "fire" },
  70: { name: "Flint", element: "wood" },
  80: { name: "Death Quack", element: "earth" },
  90: { name: "Quasar", element: "metal" },
  100: { name: "Breakfast Club", element: "water" },

  110: { name: "Harold", element: "wood" },
  120: { name: "Galax", element: "earth" },
  130: { name: "Krakoth", element: "metal" },
  140: { name: "Vulko", element: "water" },
  150: { name: "Voidweaver", element: "fire" },
  160: { name: "Shift", element: "wood" },
  170: { name: "Flint", element: "earth" },
  180: { name: "Death Quack", element: "metal" },
  190: { name: "Quasar", element: "water" },
  200: { name: "Breakfast Club", element: "fire" },

  210: { name: "Harold", element: "earth" },
  220: { name: "Galax", element: "metal" },
  230: { name: "Krakoth", element: "water" },
  240: { name: "Vulko", element: "fire" },
  250: { name: "Voidweaver", element: "wood" },
  260: { name: "Shift", element: "earth" },
  270: { name: "Flint", element: "metal" },
  280: { name: "Death Quack", element: "water" },
  290: { name: "Quasar", element: "fire" },
  300: { name: "Breakfast Club", element: "wood" },

  310: { name: "Harold", element: "metal" },
  320: { name: "Galax", element: "water" },
  330: { name: "Krakoth", element: "fire" },
  340: { name: "Vulko", element: "wood" },
  350: { name: "Voidweaver", element: "earth" },
  360: { name: "Shift", element: "metal" },
  370: { name: "Flint", element: "water" },
  380: { name: "Death Quack", element: "fire" },
  390: { name: "Quasar", element: "wood" },
  400: { name: "Breakfast Club", element: "earth" },

  410: { name: "Harold", element: "water" },
  420: { name: "Galax", element: "fire" },
  430: { name: "Krakoth", element: "wood" },
  440: { name: "Vulko", element: "earth" },
  450: { name: "Voidweaver", element: "metal" },
  460: { name: "Shift", element: "water" },
  470: { name: "Flint", element: "fire" },
  480: { name: "Death Quack", element: "wood" },
  490: { name: "Quasar", element: "earth" },
  500: { name: "Breakfast Club", element: "metal" },

  510: { name: "Harold", element: "fire" },
  520: { name: "Galax", element: "wood" },
  530: { name: "Krakoth", element: "earth" },
  540: { name: "Vulko", element: "metal" },
  550: { name: "Voidweaver", element: "water" },
  560: { name: "Shift", element: "fire" },
  570: { name: "Flint", element: "wood" },
  580: { name: "Death Quack", element: "earth" },
  590: { name: "Quasar", element: "metal" },
  600: { name: "Breakfast Club", element: "water" },

  610: { name: "Harold", element: "wood" },
  620: { name: "Galax", element: "earth" },
  630: { name: "Krakoth", element: "metal" },
  640: { name: "Vulko", element: "water" },
  650: { name: "Voidweaver", element: "fire" },
  660: { name: "Shift", element: "wood" },
  670: { name: "Flint", element: "earth" },
  680: { name: "Death Quack", element: "metal" },
  690: { name: "Quasar", element: "water" },
  700: { name: "Breakfast Club", element: "fire" },

  710: { name: "Harold", element: "earth" },
  720: { name: "Galax", element: "metal" },
  730: { name: "Krakoth", element: "water" },
  740: { name: "Vulko", element: "fire" },
  750: { name: "Voidweaver", element: "wood" },
  760: { name: "Shift", element: "earth" },
  770: { name: "Flint", element: "metal" },
  780: { name: "Death Quack", element: "water" },
  790: { name: "Quasar", element: "fire" },
  800: { name: "Breakfast Club", element: "wood" },

  810: { name: "Harold", element: "metal" },
  820: { name: "Galax", element: "water" },
  830: { name: "Krakoth", element: "fire" },
  840: { name: "Vulko", element: "wood" },
  850: { name: "Voidweaver", element: "earth" },
  860: { name: "Shift", element: "metal" },
  870: { name: "Flint", element: "water" },
  880: { name: "Death Quack", element: "fire" },
  890: { name: "Quasar", element: "wood" },
  900: { name: "Breakfast Club", element: "earth" },

  910: { name: "Harold", element: "water" },
  920: { name: "Galax", element: "fire" },
  930: { name: "Krakoth", element: "wood" },
  940: { name: "Vulko", element: "earth" },
  950: { name: "Voidweaver", element: "metal" },
  960: { name: "Shift", element: "water" },
  970: { name: "Flint", element: "fire" },
  980: { name: "Death Quack", element: "wood" },
  990: { name: "Quasar", element: "earth" },
  1000: { name: "Breakfast Club", element: "metal" },
};

export function getBossForFloor(stage) {
  const n = Number(stage);
  if (!n) return null;
  if (n <= 1000) return BOSS_FLOORS[n] || null;
  // Above 1000, the boss rotation repeats every 1000 floors — same boss
  // and element for e.g. 3120 and 4120, both ending in "120".
  const mod = n % 1000;
  return BOSS_FLOORS_REPEATING[mod] || null;
}

// Floors above 1000: looked up by (floor mod 1000) — a completely
// different, repeating set of bosses from the 1-1000 chart above. 0 here
// represents floors ending in "000" (2000, 3000, ...).
const BOSS_FLOORS_REPEATING = {
  20: { name: "Rosetti", element: "fire" },
  120: { name: "Gronk", element: "fire" },
  40: { name: "Tyrant", element: "wood" },
  140: { name: "Juglaw", element: "wood" },
  60: { name: "Smokano", element: "earth" },
  160: { name: "Kartharok", element: "earth" },
  80: { name: "Tauron", element: "metal" },
  180: { name: "Scylinder Trio", element: "metal" },
  100: { name: "Meihua", element: "water" },
  200: { name: "Umbros", element: "water" },

  220: { name: "Rosetti", element: "wood" },
  320: { name: "Gronk", element: "wood" },
  240: { name: "Tyrant", element: "earth" },
  340: { name: "Juglaw", element: "earth" },
  260: { name: "Smokano", element: "metal" },
  360: { name: "Kartharok", element: "metal" },
  280: { name: "Tauron", element: "water" },
  380: { name: "Scylinder Trio", element: "water" },
  300: { name: "Meihua", element: "fire" },
  400: { name: "Umbros", element: "fire" },

  420: { name: "Rosetti", element: "earth" },
  520: { name: "Gronk", element: "earth" },
  440: { name: "Tyrant", element: "metal" },
  540: { name: "Juglaw", element: "metal" },
  460: { name: "Smokano", element: "water" },
  560: { name: "Kartharok", element: "water" },
  480: { name: "Tauron", element: "fire" },
  580: { name: "Scylinder Trio", element: "fire" },
  500: { name: "Meihua", element: "wood" },
  600: { name: "Umbros", element: "wood" },

  620: { name: "Rosetti", element: "metal" },
  720: { name: "Gronk", element: "metal" },
  640: { name: "Tyrant", element: "water" },
  740: { name: "Juglaw", element: "water" },
  660: { name: "Smokano", element: "fire" },
  760: { name: "Kartharok", element: "fire" },
  680: { name: "Tauron", element: "wood" },
  780: { name: "Scylinder Trio", element: "wood" },
  700: { name: "Meihua", element: "earth" },
  800: { name: "Umbros", element: "earth" },

  820: { name: "Rosetti", element: "water" },
  920: { name: "Gronk", element: "water" },
  840: { name: "Tyrant", element: "fire" },
  940: { name: "Juglaw", element: "fire" },
  860: { name: "Smokano", element: "wood" },
  960: { name: "Kartharok", element: "wood" },
  880: { name: "Tauron", element: "earth" },
  980: { name: "Scylinder Trio", element: "earth" },
  900: { name: "Meihua", element: "metal" },
  0: { name: "Umbros", element: "metal" },
};
