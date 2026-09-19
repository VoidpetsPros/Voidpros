import React, { forwardRef, useImperativeHandle, useRef } from "react";
import Combobox from "./Combobox";
import { useTheme } from "../hooks/ThemeContext";

// onAdvance: fires when Enter is pressed in this level field — lets the
// auto-advance chain skip down into the next name field once a level is
// entered (or just accepted as-is, e.g. an Auto Fill-prefilled value).
const LevelInput = forwardRef(function LevelInput({ value, onChange, onAdvance }, ref) {
  const { LINE, CREAM, PANEL } = useTheme();
  return (
    <input
      ref={ref}
      type="number"
      min="1"
      value={value === "" || value === undefined || value === null ? "" : value}
      onChange={(e) => onChange(e.target.value ? parseInt(e.target.value, 10) : "")}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onAdvance?.();
        }
      }}
      placeholder="Lv"
      style={{ width: 52, boxSizing: "border-box", background: PANEL, border: `1px solid ${LINE}`, borderRadius: 7, padding: "7px 6px", color: CREAM, fontSize: 12.5, textAlign: "center", outline: "none", flexShrink: 0 }}
    />
  );
});

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

// autoFill: when on, selecting a pet/item auto-advances focus into that
// field's own level box next; pressing Enter in a level box then jumps
// down into the next field's name box. The full chain per slot is:
// pet name -> pet level -> hat name -> hat level -> scarf name ->
// scarf level -> accessory 1 name -> accessory 1 level -> accessory 2
// name -> accessory 2 level -> (onAdvanceOut) next slot's pet name.
// focusFirst (via ref) lets a parent (or the previous slot) jump into
// this slot's first field.
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
  const petLevelRef = useRef(null);
  const hatRef = useRef(null);
  const hatLevelRef = useRef(null);
  const scarfRef = useRef(null);
  const scarfLevelRef = useRef(null);
  const acc1Ref = useRef(null);
  const acc1LevelRef = useRef(null);
  const acc2Ref = useRef(null);
  const acc2LevelRef = useRef(null);

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
          onAutoAdvance={() => petLevelRef.current?.focus()}
        />
        <LevelInput ref={petLevelRef} value={slot.petLevel} onChange={(v) => update({ petLevel: v })} onAdvance={() => hatRef.current?.openAndFocus()} />
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
          onAutoAdvance={() => hatLevelRef.current?.focus()}
        />
        <LevelInput ref={hatLevelRef} value={slot.hat.level} onChange={(v) => updateNested("hat", { level: v })} onAdvance={() => scarfRef.current?.openAndFocus()} />
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
          onAutoAdvance={() => scarfLevelRef.current?.focus()}
        />
        <LevelInput ref={scarfLevelRef} value={slot.scarf.level} onChange={(v) => updateNested("scarf", { level: v })} onAdvance={() => acc1Ref.current?.openAndFocus()} />
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
          onAutoAdvance={() => acc1LevelRef.current?.focus()}
        />
        <LevelInput ref={acc1LevelRef} value={slot.accessories[0].level} onChange={(v) => updateAccessory(0, { level: v })} onAdvance={() => acc2Ref.current?.openAndFocus()} />
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
          onAutoAdvance={() => acc2LevelRef.current?.focus()}
        />
        <LevelInput ref={acc2LevelRef} value={slot.accessories[1].level} onChange={(v) => updateAccessory(1, { level: v })} onAdvance={() => onAdvanceOut?.()} />
      </FieldRow>
    </div>
  );
});

export default PetSlotEditor;
