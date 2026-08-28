import React from "react";
import Combobox from "./Combobox";
import { LINE, CREAM, MUTED, PANEL, PANEL_2 } from "../lib/theme";

function LevelInput({ value, onChange }) {
  return (
    <input
      type="number"
      min="1"
      value={value === "" || value === undefined || value === null ? "" : value}
      onChange={(e) => onChange(e.target.value ? parseInt(e.target.value, 10) : "")}
      placeholder="Lv"
      style={{ width: 52, boxSizing: "border-box", background: PANEL, border: `1px solid ${LINE}`, borderRadius: 7, padding: "7px 6px", color: CREAM, fontSize: 12.5, textAlign: "center", outline: "none", flexShrink: 0 }}
    />
  );
}

function FieldRow({ label, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      <span style={{ fontSize: 11.5, color: MUTED, width: 76, flexShrink: 0 }}>{label}</span>
      {children}
    </div>
  );
}

export function emptySlot() {
  return { petId: null, petLevel: "", hat: { id: null, level: "" }, scarf: { id: null, level: "" }, accessories: [{ id: null, level: "" }, { id: null, level: "" }] };
}

export function slotIsComplete(slot) {
  return (
    slot.petId &&
    slot.petLevel &&
    slot.hat.id &&
    slot.hat.level &&
    slot.scarf.id &&
    slot.scarf.level &&
    slot.accessories[0].id &&
    slot.accessories[0].level &&
    slot.accessories[1].id &&
    slot.accessories[1].level
  );
}

export default function PetSlotEditor({ index, slot, onChange, petOptions, hatOptions, scarfOptions, accessoryOptions }) {
  const update = (patch) => onChange({ ...slot, ...patch });
  const updateNested = (key, patch) => onChange({ ...slot, [key]: { ...slot[key], ...patch } });
  const updateAccessory = (i, patch) => {
    const accessories = [...slot.accessories];
    accessories[i] = { ...accessories[i], ...patch };
    onChange({ ...slot, accessories });
  };

  return (
    <div style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: 14, marginBottom: 12, background: PANEL_2 }}>
      <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>Pet {index + 1}</p>
      <FieldRow label="Pet">
        <Combobox value={slot.petId} onSelect={(id) => update({ petId: id })} options={petOptions} placeholder="Select pet" kind="pet" />
        <LevelInput value={slot.petLevel} onChange={(v) => update({ petLevel: v })} />
      </FieldRow>
      <FieldRow label="Hat">
        <Combobox value={slot.hat.id} onSelect={(id) => updateNested("hat", { id })} options={hatOptions} placeholder="Select hat" kind="item" />
        <LevelInput value={slot.hat.level} onChange={(v) => updateNested("hat", { level: v })} />
      </FieldRow>
      <FieldRow label="Scarf">
        <Combobox value={slot.scarf.id} onSelect={(id) => updateNested("scarf", { id })} options={scarfOptions} placeholder="Select scarf" kind="item" />
        <LevelInput value={slot.scarf.level} onChange={(v) => updateNested("scarf", { level: v })} />
      </FieldRow>
      <FieldRow label="Accessory 1">
        <Combobox value={slot.accessories[0].id} onSelect={(id) => updateAccessory(0, { id })} options={accessoryOptions} placeholder="Select accessory" kind="item" />
        <LevelInput value={slot.accessories[0].level} onChange={(v) => updateAccessory(0, { level: v })} />
      </FieldRow>
      <FieldRow label="Accessory 2">
        <Combobox value={slot.accessories[1].id} onSelect={(id) => updateAccessory(1, { id })} options={accessoryOptions} placeholder="Select accessory" kind="item" />
        <LevelInput value={slot.accessories[1].level} onChange={(v) => updateAccessory(1, { level: v })} />
      </FieldRow>
    </div>
  );
}
