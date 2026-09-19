import React, { forwardRef, useImperativeHandle, useRef } from "react";
import Combobox from "./Combobox";
import { useTheme } from "../hooks/ThemeContext";

function LevelInput({ value, onChange }) {
  const { LINE, CREAM, PANEL } = useTheme();
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
  const { MUTED } = useTheme();
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

// autoFill: when on, selecting a pet/item auto-advances focus straight into
// the next field in this slot (pet -> hat -> scarf -> accessory 1 ->
// accessory 2); finishing accessory 2 calls onAdvanceOut so the parent can
// jump into the next slot entirely. focusFirst (via ref) lets a parent
// (or the previous slot) jump into this slot's first field.
const PetSlotEditor = forwardRef(function PetSlotEditor(
  { index, slot, onChange, petOptions, hatOptions, scarfOptions, accessoryOptions, autoFill = false, onAdvanceOut },
  ref
) {
  const { LINE, MUTED, PANEL_2 } = useTheme();
  const update = (patch) => onChange({ ...slot, ...patch });
  const updateNested = (key, patch) => onChange({ ...slot, [key]: { ...slot[key], ...patch } });
  const updateAccessory = (i, patch) => {
    const accessories = [...slot.accessories];
    accessories[i] = { ...accessories[i], ...patch };
    onChange({ ...slot, accessories });
  };

  const petRef = useRef(null);
  const hatRef = useRef(null);
  const scarfRef = useRef(null);
  const acc1Ref = useRef(null);
  const acc2Ref = useRef(null);

  useImperativeHandle(ref, () => ({
    focusFirst: () => petRef.current?.openAndFocus(),
  }));

  return (
    <div style={{ border: `1px solid ${LINE}`, borderRadius: 10, padding: 14, marginBottom: 12, background: PANEL_2 }}>
      <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>Pet {index + 1}</p>
      <FieldRow label="Pet">
        <Combobox
          ref={petRef}
          value={slot.petId}
          onSelect={(id) => update({ petId: id })}
          options={petOptions}
          placeholder="Select pet"
          kind="pet"
          autoFill={autoFill}
          onAutoAdvance={() => hatRef.current?.openAndFocus()}
        />
        <LevelInput value={slot.petLevel} onChange={(v) => update({ petLevel: v })} />
      </FieldRow>
      <FieldRow label="Hat">
        <Combobox
          ref={hatRef}
          value={slot.hat.id}
          onSelect={(id) => updateNested("hat", { id })}
          options={hatOptions}
          placeholder="Select hat"
          kind="item"
          autoFill={autoFill}
          onAutoAdvance={() => scarfRef.current?.openAndFocus()}
        />
        <LevelInput value={slot.hat.level} onChange={(v) => updateNested("hat", { level: v })} />
      </FieldRow>
      <FieldRow label="Scarf">
        <Combobox
          ref={scarfRef}
          value={slot.scarf.id}
          onSelect={(id) => updateNested("scarf", { id })}
          options={scarfOptions}
          placeholder="Select scarf"
          kind="item"
          autoFill={autoFill}
          onAutoAdvance={() => acc1Ref.current?.openAndFocus()}
        />
        <LevelInput value={slot.scarf.level} onChange={(v) => updateNested("scarf", { level: v })} />
      </FieldRow>
      <FieldRow label="Accessory 1">
        <Combobox
          ref={acc1Ref}
          value={slot.accessories[0].id}
          onSelect={(id) => updateAccessory(0, { id })}
          options={accessoryOptions}
          placeholder="Select accessory"
          kind="item"
          autoFill={autoFill}
          onAutoAdvance={() => acc2Ref.current?.openAndFocus()}
        />
        <LevelInput value={slot.accessories[0].level} onChange={(v) => updateAccessory(0, { level: v })} />
      </FieldRow>
      <FieldRow label="Accessory 2">
        <Combobox
          ref={acc2Ref}
          value={slot.accessories[1].id}
          onSelect={(id) => updateAccessory(1, { id })}
          options={accessoryOptions}
          placeholder="Select accessory"
          kind="item"
          autoFill={autoFill}
          onAutoAdvance={() => onAdvanceOut?.()}
        />
        <LevelInput value={slot.accessories[1].level} onChange={(v) => updateAccessory(1, { level: v })} />
      </FieldRow>
    </div>
  );
});

export default PetSlotEditor;
