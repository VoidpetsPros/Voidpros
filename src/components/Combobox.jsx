import React, { useState } from "react";
import { ChevronDown } from "lucide-react";
import PetAvatar from "./PetAvatar";
import ItemAvatar from "./ItemAvatar";
import { useTheme } from "../hooks/ThemeContext";

export default function Combobox({ value, onSelect, options, placeholder, kind }) {
  const { PANEL, PANEL_2, LINE, CREAM, MUTED } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const selected = options.find((o) => o.id === value);
  const filtered = options.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div
      style={{ position: "relative", flex: 1, minWidth: 0 }}
      onBlur={(e) => {
        // Only close when focus leaves the whole picker (including its
        // dropdown) — not when it just moves from the toggle button to the
        // search input inside it, which is an internal focus change, not
        // a "click away." The old version closed on every internal focus
        // shift, which meant the autoFocus search box closed the dropdown
        // the instant it opened.
        if (!e.currentTarget.contains(e.relatedTarget)) setOpen(false);
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        type="button"
        style={{
          width: "100%",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: PANEL,
          border: `1px solid ${LINE}`,
          borderRadius: 8,
          padding: "6px 8px",
          fontSize: 12.5,
          color: selected ? CREAM : MUTED,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        {selected ? (kind === "pet" ? <PetAvatar pet={selected} size={20} /> : <ItemAvatar item={selected} size={20} />) : null}
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {selected ? selected.name : placeholder}
        </span>
        <ChevronDown size={13} color={MUTED} style={{ flexShrink: 0 }} />
      </button>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            zIndex: 30,
            width: 220,
            maxHeight: 240,
            overflowY: "auto",
            background: PANEL,
            border: `1px solid ${LINE}`,
            borderRadius: 9,
            boxShadow: "0 12px 28px -10px rgba(0,0,0,0.5)",
          }}
        >
          <div style={{ position: "sticky", top: 0, background: PANEL, padding: 6, borderBottom: `1px solid ${LINE}` }}>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              style={{ width: "100%", boxSizing: "border-box", background: PANEL_2, border: `1px solid ${LINE}`, borderRadius: 6, padding: "6px 8px", fontSize: 12.5, color: CREAM, outline: "none" }}
            />
          </div>
          {filtered.length === 0 && <p style={{ fontSize: 12, color: MUTED, padding: "10px 10px" }}>No matches</p>}
          {filtered.map((o) => (
            <button
              key={o.id}
              type="button"
              onMouseDown={() => {
                onSelect(o.id);
                setOpen(false);
                setQuery("");
              }}
              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", boxSizing: "border-box", padding: "7px 10px", background: "none", border: "none", cursor: "pointer", fontSize: 12.5, color: CREAM, textAlign: "left" }}
            >
              {kind === "pet" ? <PetAvatar pet={o} size={20} /> : <ItemAvatar item={o} size={20} />}
              {o.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
