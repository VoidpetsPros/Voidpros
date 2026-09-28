import React, { forwardRef, useImperativeHandle, useRef } from "react";
import Combobox from "./Combobox";
import { useTheme } from "../hooks/ThemeContext";

// advanceAfterDigits: when > 0, typing that many digits calls onAdvance
// right away (item levels use 2, so "45" jumps you to the next item's
// level). Enter also calls onAdvance, so a level that only needs one digit
// doesn't leave you stuck. Both are off when advanceAfterDigits is 0.
// Only real keystrokes trigger the digit jump — backspacing, pasting, or
// using the spinner arrows won't yank focus away mid-edit.
const LevelInput = forwardRef(function LevelInput({ value, onChange, onAdvance, advanceAfterDigits = 0 }, ref) {
  const { LINE, CREAM, PANEL } = useTheme();
  return (
    <input
      ref={ref}
      type="number"
      min="1"
      value={value === "" || value === undefined || value === null ? "" : value}
      onChange={(e) => {
        const raw = e.target.value;
        onChange(raw ? parseInt(raw, 10) : "");
        if (advanceAfterDigits > 0 && e.nativeEvent.inputType === "insertText" && raw.length >= advanceAfterDigits) {
          onAdvance?.();
        }
      }}
      onKeyDown={(e) => {
        if (advanceAfterDigits > 0 && e.key === "Enter") {
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

// autoFill: when on, this slot runs in two phases.
//
// Names phase: selecting a pet/item auto-advances focus straight into the
// next name field (pet -> hat -> scarf -> accessory 1 -> accessory 2);
// finishing accessory 2 calls onAdvanceOut so the parent can jump into
// the next slot (or, after the last slot, into the levels phase).
//
// Levels phase: starts at focusFirstLevel(). Typing 2 digits in an item
// level jumps to the next item's level (hat -> scarf -> accessory 1 ->
// accessory 2). Items with nothing selected are skipped, and after the
// last one onLevelAdvanceOut hands off to the next slot. Pet levels are
// left out of this chain on purpose — Auto Fill already sets those from
// the floor.
const PetSlotEditor = forwardRef(function PetSlotEditor(
  { index, slot, onChange, petOptions, hatOptions, scarfOptions, accessoryOptions, autoFill = false, onAdvanceOut, onLevelAdvanceOut },
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

  const hatLevelRef = useRef(null);
  const scarfLevelRef = useRef(null);
  const acc1LevelRef = useRef(null);
  const acc2LevelRef = useRef(null);
  const levelRefs = [hatLevelRef, scarfLevelRef, acc1LevelRef, acc2LevelRef];
  const levelItemIds = [slot.hat.id, slot.scarf.id, slot.accessories[0].id, slot.accessories[1].id];

  // Focuses the first item-level box at or after `start` that actually has
  // an item picked. If this slot has none left, hand off to the next slot.
  const focusLevelFrom = (start) => {
    for (let i = start; i < levelRefs.length; i++) {
      const el = levelRefs[i].current;
      if (levelItemIds[i] && el) {
        el.focus();
        el.select?.();
        return;
      }
    }
    onLevelAdvanceOut?.();
  };

  useImperativeHandle(ref, () => ({
    focusFirst: () => petRef.current?.openAndFocus(),
    focusFirstLevel: () => focusLevelFrom(0),
  }));

  const levelAdvanceDigits = autoFill ? 2 : 0;

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
        <LevelInput
          ref={hatLevelRef}
          value={slot.hat.level}
          onChange={(v) => updateNested("hat", { level: v })}
          advanceAfterDigits={levelAdvanceDigits}
          onAdvance={() => focusLevelFrom(1)}
        />
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
        <LevelInput
          ref={scarfLevelRef}
          value={slot.scarf.level}
          onChange={(v) => updateNested("scarf", { level: v })}
          advanceAfterDigits={levelAdvanceDigits}
          onAdvance={() => focusLevelFrom(2)}
        />
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
        <LevelInput
          ref={acc1LevelRef}
          value={slot.accessories[0].level}
          onChange={(v) => updateAccessory(0, { level: v })}
          advanceAfterDigits={levelAdvanceDigits}
          onAdvance={() => focusLevelFrom(3)}
        />
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
        <LevelInput
          ref={acc2LevelRef}
          value={slot.accessories[1].level}
          onChange={(v) => updateAccessory(1, { level: v })}
          advanceAfterDigits={levelAdvanceDigits}
          onAdvance={() => focusLevelFrom(4)}
        />
      </FieldRow>
    </div>
  );
});

export default PetSlotEditor;
