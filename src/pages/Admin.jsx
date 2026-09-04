import React, { useState } from "react";
import { useAuth } from "../hooks/AuthContext";
import { useCatalog } from "../hooks/useCatalog";
import { useAdminBuilds } from "../hooks/useAdminBuilds";
import { useAdminFulfillments } from "../hooks/useAdminFulfillments";
import { supabase } from "../lib/supabaseClient";
import { imageUrl } from "../hooks/useBuilds";
import PetSlotEditor, { emptySlot, slotIsComplete } from "../components/PetSlotEditor";
import { PANEL, LINE, CREAM, MUTED, GOLD, DANGER } from "../lib/theme";

// Players now only submit screenshots — an admin looks at those screenshots
// and enters the team shown, right here, before approving. Rejecting still
// doesn't need any of this since there's nothing to throw away.
function PendingBuildReview({ build, pets, itemsByType, onApproved, onRejected }) {
  const [team, setTeam] = useState([emptySlot(), emptySlot(), emptySlot(), emptySlot()]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const updateSlot = (i, newSlot) => setTeam((prev) => prev.map((s, idx) => (idx === i ? newSlot : s)));

  const handleApprove = async () => {
    setError("");
    const incompleteCount = team.filter((s) => !slotIsComplete(s)).length;
    if (incompleteCount > 0) {
      setError(`Fill in all 4 team slots first (${incompleteCount} incomplete).`);
      return;
    }
    const petIds = team.map((s) => s.petId);
    if (new Set(petIds).size !== petIds.length) {
      setError("Each pet must be different — one is repeated.");
      return;
    }

    setBusy(true);
    const teamPayload = team.map((s, i) => ({
      slot_index: i,
      pet_id: s.petId,
      pet_level: s.petLevel,
      hat_id: s.hat.id,
      hat_level: s.hat.level,
      scarf_id: s.scarf.id,
      scarf_level: s.scarf.level,
      accessory1_id: s.accessories[0].id,
      accessory1_level: s.accessories[0].level,
      accessory2_id: s.accessories[1].id,
      accessory2_level: s.accessories[1].level,
    }));

    const { error: rpcError } = await supabase.rpc("admin_approve_build", {
      p_build_id: build.id,
      p_team: teamPayload,
    });
    setBusy(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    onApproved();
  };

  const handleReject = async () => {
    setBusy(true);
    const { error: updateError } = await supabase.from("builds").update({ status: "rejected" }).eq("id", build.id);
    setBusy(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    onRejected();
  };

  return (
    <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 12, padding: 18, marginBottom: 28 }}>
      <p style={{ fontSize: 12.5, color: MUTED, margin: "0 0 4px" }}>
        Floor {build.stage} · submitted {new Date(build.created_at).toLocaleString()} ·{" "}
        {build.show_author ? build.author?.username || "a player" : "Anonymous"}
      </p>
      {build.note && <p style={{ fontSize: 13, color: CREAM, margin: "8px 0 0", lineHeight: 1.5 }}>{build.note}</p>}

      <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 1, margin: "16px 0 8px" }}>
        Proof screenshots
      </p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
        {build.images.map((img, i) => (
          <a key={i} href={imageUrl(img.storage_path)} target="_blank" rel="noreferrer" title={img.kind}>
            <img src={imageUrl(img.storage_path)} alt={img.kind} style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8, border: `1px solid ${LINE}` }} />
          </a>
        ))}
        {build.images.length === 0 && <p style={{ fontSize: 12.5, color: DANGER }}>No images attached — should not be possible.</p>}
      </div>

      <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>
        Enter the team shown above
      </p>
      {team.map((slot, i) => (
        <PetSlotEditor
          key={i}
          index={i}
          slot={slot}
          onChange={(s) => updateSlot(i, s)}
          petOptions={pets}
          hatOptions={itemsByType.hat}
          scarfOptions={itemsByType.scarf}
          accessoryOptions={itemsByType.accessory}
        />
      ))}

      {error && <p style={{ fontSize: 12.5, color: DANGER, margin: "0 0 12px" }}>{error}</p>}

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={handleApprove}
          disabled={busy}
          style={{ background: GOLD, color: "#FFFFFF", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: busy ? "default" : "pointer" }}
        >
          {busy ? "Working…" : "Approve"}
        </button>
        <button
          onClick={handleReject}
          disabled={busy}
          style={{ background: "none", color: DANGER, border: `1px solid ${DANGER}`, borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: busy ? "default" : "pointer" }}
        >
          Reject
        </button>
      </div>
    </div>
  );
}

// Fulfillers only submit screenshots too, same as PendingBuildReview above —
// but here the team must also be checked against THIS request's actual
// pool, and partial teams are allowed (the requester may not own enough
// for a full 4-pet setup), so slots don't all need to be filled.
function PendingFulfillmentReview({ fulfillment, pets, items, onApproved, onRejected }) {
  const [team, setTeam] = useState([emptySlot(), emptySlot(), emptySlot(), emptySlot()]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const allowedPets = pets.filter((p) => fulfillment.allowedPetIds.includes(p.id));
  const allowedItemIds = Object.keys(fulfillment.allowedItems);
  const allowedHats = items.filter((i) => i.type === "hat" && allowedItemIds.includes(i.id));
  const allowedScarves = items.filter((i) => i.type === "scarf" && allowedItemIds.includes(i.id));
  const allowedAccessories = items.filter((i) => i.type === "accessory" && allowedItemIds.includes(i.id));

  const updateSlot = (i, newSlot) => setTeam((prev) => prev.map((s, idx) => (idx === i ? newSlot : s)));

  const handleApprove = async () => {
    setError("");
    const usedSlots = team.filter((s) => s.petId);
    if (usedSlots.length === 0) {
      setError("Enter at least one pet.");
      return;
    }
    const petIds = usedSlots.map((s) => s.petId);
    if (new Set(petIds).size !== petIds.length) {
      setError("Each pet must be different — one is repeated.");
      return;
    }
    const inconsistentSlot = usedSlots.some((s) => {
      if (!s.petLevel) return true;
      const pairs = [s.hat, s.scarf, s.accessories[0], s.accessories[1]];
      return pairs.some((p) => !!p.id !== !!p.level);
    });
    if (inconsistentSlot) {
      setError("Every pet used needs a level, and any item used needs a level.");
      return;
    }

    setBusy(true);
    const teamPayload = usedSlots.map((s, i) => ({
      slot_index: i,
      pet_id: s.petId,
      pet_level: s.petLevel,
      hat_id: s.hat.id || "",
      hat_level: s.hat.level || "",
      scarf_id: s.scarf.id || "",
      scarf_level: s.scarf.level || "",
      accessory1_id: s.accessories[0].id || "",
      accessory1_level: s.accessories[0].level || "",
      accessory2_id: s.accessories[1].id || "",
      accessory2_level: s.accessories[1].level || "",
    }));

    const { error: rpcError } = await supabase.rpc("admin_approve_fulfillment", {
      p_fulfillment_id: fulfillment.id,
      p_team: teamPayload,
    });
    setBusy(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    onApproved();
  };

  const handleReject = async () => {
    setBusy(true);
    const { error: rpcError } = await supabase.rpc("admin_reject_fulfillment", { p_fulfillment_id: fulfillment.id });
    setBusy(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    onRejected();
  };

  return (
    <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 12, padding: 18, marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
        <p style={{ fontFamily: "Georgia, serif", fontSize: 16, color: CREAM, margin: 0 }}>Floor {fulfillment.request?.stage}</p>
        <span style={{ fontSize: 12, color: MUTED }}>
          {fulfillment.show_fulfiller ? fulfillment.fulfiller?.username || "a player" : "Anonymous"} · submitted{" "}
          {new Date(fulfillment.created_at).toLocaleString()}
        </span>
      </div>

      {fulfillment.note && <p style={{ fontSize: 13, color: CREAM, margin: "0 0 12px", lineHeight: 1.5 }}>{fulfillment.note}</p>}

      <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 8px" }}>Proof screenshots</p>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 18 }}>
        {fulfillment.images.map((img, i) => (
          <a key={i} href={imageUrl(img.storage_path)} target="_blank" rel="noreferrer" title={img.kind}>
            <img src={imageUrl(img.storage_path)} alt={img.kind} style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8, border: `1px solid ${LINE}` }} />
          </a>
        ))}
        {fulfillment.images.length === 0 && <p style={{ fontSize: 12.5, color: DANGER }}>No images attached — should not be possible.</p>}
      </div>

      <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 10px" }}>
        Enter the team shown above — must come from this requester's pool, 1 to 4 pets
      </p>
      {team.map((slot, i) => (
        <PetSlotEditor
          key={i}
          index={i}
          slot={slot}
          onChange={(s) => updateSlot(i, s)}
          petOptions={allowedPets}
          hatOptions={allowedHats}
          scarfOptions={allowedScarves}
          accessoryOptions={allowedAccessories}
        />
      ))}

      {error && <p style={{ fontSize: 12.5, color: DANGER, margin: "0 0 12px" }}>{error}</p>}

      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={handleApprove}
          disabled={busy}
          style={{ background: GOLD, color: "#FFFFFF", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: busy ? "default" : "pointer" }}
        >
          {busy ? "Working…" : "Approve (+10 karma)"}
        </button>
        <button
          onClick={handleReject}
          disabled={busy}
          style={{ background: "none", color: DANGER, border: `1px solid ${DANGER}`, borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: busy ? "default" : "pointer" }}
        >
          Reject
        </button>
      </div>
    </div>
  );
}

export default function Admin() {
  const { profile, loading: authLoading } = useAuth();
  const { pets, items, itemsByType, loading: catalogLoading } = useCatalog();
  const { builds, loading: buildsLoading, error: buildsError, refresh } = useAdminBuilds();
  const { fulfillments, loading: fulfillmentsLoading, error: fulfillmentsError, refresh: refreshFulfillments } = useAdminFulfillments();

  if (authLoading || catalogLoading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: MUTED, fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  if (!profile?.is_admin) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: MUTED, fontSize: 14 }}>You don't have access to this page.</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 24px 60px", maxWidth: 700, margin: "0 auto" }}>
      <p style={{ fontFamily: "Georgia, serif", fontSize: 24, color: CREAM, margin: "0 0 8px" }}>Review queue</p>
      <p style={{ fontSize: 13.5, color: MUTED, margin: "0 0 24px" }}>
        {builds.length} pending submission{builds.length !== 1 ? "s" : ""} · {fulfillments.length} pending fulfillment{fulfillments.length !== 1 ? "s" : ""}
      </p>

      <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Build submissions</p>

      {buildsLoading ? (
        <p style={{ color: MUTED, fontSize: 14 }}>Loading…</p>
      ) : buildsError ? (
        <div style={{ background: PANEL, border: `1px solid rgba(248,113,113,0.4)`, borderRadius: 12, padding: "20px", marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: CREAM, margin: "0 0 6px", fontWeight: 600 }}>Failed to load pending builds</p>
          <p style={{ fontSize: 12.5, color: MUTED, fontFamily: "monospace", margin: 0, wordBreak: "break-word" }}>{buildsError}</p>
        </div>
      ) : builds.length === 0 ? (
        <p style={{ color: MUTED, fontSize: 14, marginBottom: 28 }}>Nothing waiting on review.</p>
      ) : (
        builds.map((b) => (
          <PendingBuildReview
            key={b.id}
            build={b}
            pets={pets}
            itemsByType={itemsByType}
            onApproved={refresh}
            onRejected={refresh}
          />
        ))
      )}

      <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 1, margin: "28px 0 12px" }}>Fulfillment attempts</p>

      {fulfillmentsLoading ? (
        <p style={{ color: MUTED, fontSize: 14 }}>Loading…</p>
      ) : fulfillmentsError ? (
        <div style={{ background: PANEL, border: `1px solid rgba(248,113,113,0.4)`, borderRadius: 12, padding: "20px" }}>
          <p style={{ fontSize: 13, color: CREAM, margin: "0 0 6px", fontWeight: 600 }}>Failed to load pending fulfillments</p>
          <p style={{ fontSize: 12.5, color: MUTED, fontFamily: "monospace", margin: 0, wordBreak: "break-word" }}>{fulfillmentsError}</p>
        </div>
      ) : fulfillments.length === 0 ? (
        <p style={{ color: MUTED, fontSize: 14 }}>Nothing waiting on review.</p>
      ) : (
        fulfillments.map((f) => (
          <PendingFulfillmentReview
            key={f.id}
            fulfillment={f}
            pets={pets}
            items={items}
            onApproved={refreshFulfillments}
            onRejected={refreshFulfillments}
          />
        ))
      )}
    </div>
  );
}
