// Voidpros palette — light "bone" theme (default) and a dark violet
// alternative, both centered on the same violet accent from the crystal
// logo. LIGHT_THEME/DARK_THEME feed the live theme toggle (ThemeContext);
// the plain named exports below stay pinned to the light palette for
// admin-only tooling, which doesn't participate in the toggle.
export const LIGHT_THEME = {
  INK: "#FAF7F1",
  PANEL: "#FFFFFF",
  PANEL_2: "#F3EEE3",
  LINE: "#E5DDCB",
  CREAM: "#1c1530",
  MUTED: "#7d7690",
  GOLD: "#7c3aed",
  GOLD_DIM: "#6d28d9",
  VIOLET: "#8b5cf6",
  DANGER: "#dc2626",
};

export const DARK_THEME = {
  INK: "#120b1f",
  PANEL: "#1c1530",
  PANEL_2: "#251c3d",
  LINE: "#352a52",
  CREAM: "#f2eefb",
  MUTED: "#a99cc9",
  GOLD: "#8b5cf6",
  GOLD_DIM: "#7c3aed",
  VIOLET: "#c4b5fd",
  DANGER: "#f87171",
};

export const INK = LIGHT_THEME.INK;
export const PANEL = LIGHT_THEME.PANEL;
export const PANEL_2 = LIGHT_THEME.PANEL_2;
export const LINE = LIGHT_THEME.LINE;
export const CREAM = LIGHT_THEME.CREAM;
export const MUTED = LIGHT_THEME.MUTED;
export const GOLD = LIGHT_THEME.GOLD;
export const GOLD_DIM = LIGHT_THEME.GOLD_DIM;
export const VIOLET = LIGHT_THEME.VIOLET;
export const DANGER = LIGHT_THEME.DANGER;

// Shared across Collection (rarity filters) and Admin (catalog list) so
// a pet/item's rarity always reads the same color everywhere.
export const RARITY_COLORS = {
  Common: "#7FC97F",
  Rare: "#6FA8DC",
  Epic: "#A98FE0",
  Legendary: "#E8B33D",
  Uber: "#D9534F",
};

// Same idea, but for a pet's element/typing — matches the color values
// already used on the pet rows themselves (see migration 0015).
export const ELEMENT_COLORS = {
  Metal: "#B8B8C4",
  Wood: "#A8C97F",
  Fire: "#E89B7D",
  Earth: "#C9A876",
  Water: "#8FC1E0",
};

