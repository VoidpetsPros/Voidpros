import React from "react";
import { useAuth } from "../hooks/AuthContext";
import { useCatalog } from "../hooks/useCatalog";
import { useAdminBuilds } from "../hooks/useAdminBuilds";
import { useAdminFulfillments } from "../hooks/useAdminFulfillments";
import { supabase } from "../lib/supabaseClient";
import { imageUrl } from "../hooks/useBuilds";
import BuildCard from "../components/BuildCard";
import PetAvatar from "../components/PetAvatar";
import ItemAvatar from "../components/ItemAvatar";
import { PANEL, LINE, CREAM, MUTED, GOLD, DANGER } from "../lib/theme";

function TeamPreview({ team, pets, items }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {team.map((slot) => {
        const pet = pets.find((p) => p.id === slot.pet_id);
        const hat = items.find((i) => i.id === slot.hat_id);
        const scarf = items.find((i) => i.id === slot.scarf_id);
        const acc1 = items.find((i) => i.id === slot.accessory1_id);
        const acc2 = items.find((i) => i.id === slot.accessory2_id);
        if (!pet) return null;
        return (
          <div key={slot.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 108 }}>
              <PetAvatar pet={pet} size={26} />
              <span style={{ fontSize: 12.5, color: CREAM }}>{pet.name} <span style={{ color: MUTED }}>Lv{slot.pet_level}</span></span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {[
                { item: hat, level: slot.hat_level },
                { item: scarf, level: slot.scarf_level },
                { item: acc1, level: slot.accessory1_level },
                { item: acc2, level: slot.accessory2_level },
              ].map(
                ({ item, level }, i) =>
                  item && (
                    <span key={i} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11.5, padding: "2px 8px 2px 2px", borderRadius: 16, background: PANEL, color: MUTED, border: `1px solid ${LINE}` }}>
                      <ItemAvatar item={item} size={18} /> {item.name} Lv{level}
                    </span>
                  )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Admin() {
  const { profile, loading: authLoading } = useAuth();
  const { pets, items, loading: catalogLoading } = useCatalog();
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

  // All pets/items count as "owned" here on purpose — admin review isn't
  // about whether YOU personally have the pets, so this just prevents the
  // build card from showing everything as red/missing.
  const allPetIds = pets.map((p) => p.id);
  const allItemCounts = Object.fromEntries(items.map((i) => [i.id, 99]));

  const decide = async (buildId, status) => {
    const { error } = await supabase.from("builds").update({ status }).eq("id", buildId);
    if (error) {
      alert(error.message);
      return;
    }
    refresh();
  };

  const decideFulfillment = async (fulfillmentId, status) => {
    const { error } = await supabase.rpc("admin_decide_fulfillment", { p_fulfillment_id: fulfillmentId, p_status: status });
    if (error) {
      alert(error.message);
      return;
    }
    refreshFulfillments();
  };

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
        <div style={{ background: PANEL, border: `1px solid rgba(179,69,59,0.4)`, borderRadius: 12, padding: "20px", marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: CREAM, margin: "0 0 6px", fontWeight: 600 }}>Failed to load pending builds</p>
          <p style={{ fontSize: 12.5, color: MUTED, fontFamily: "monospace", margin: 0, wordBreak: "break-word" }}>{buildsError}</p>
        </div>
      ) : builds.length === 0 ? (
        <p style={{ color: MUTED, fontSize: 14, marginBottom: 28 }}>Nothing waiting on review.</p>
      ) : (
        builds.map((b) => (
          <div key={b.id} style={{ marginBottom: 28 }}>
            <p style={{ fontSize: 12.5, color: MUTED, margin: "0 0 8px" }}>
              Floor {b.stage} · submitted {new Date(b.created_at).toLocaleString()}
            </p>
            <BuildCard build={b} pets={pets} items={items} ownedPets={allPetIds} ownedItemCounts={allItemCounts} fullMatch={true} />

            <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 8px" }}>
              Proof screenshots
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
              {b.images.map((img, i) => (
                <a key={i} href={imageUrl(img.storage_path)} target="_blank" rel="noreferrer" title={img.kind}>
                  <img
                    src={imageUrl(img.storage_path)}
                    alt={img.kind}
                    style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 8, border: `1px solid ${LINE}` }}
                  />
                </a>
              ))}
              {b.images.length === 0 && <p style={{ fontSize: 12.5, color: DANGER }}>No images attached — should not be possible.</p>}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => decide(b.id, "verified")}
                style={{ background: GOLD, color: "#FFFFFF", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                Approve
              </button>
              <button
                onClick={() => decide(b.id, "rejected")}
                style={{ background: "none", color: DANGER, border: `1px solid ${DANGER}`, borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}

      <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 1, margin: "28px 0 12px" }}>Fulfillment attempts</p>

      {fulfillmentsLoading ? (
        <p style={{ color: MUTED, fontSize: 14 }}>Loading…</p>
      ) : fulfillmentsError ? (
        <div style={{ background: PANEL, border: `1px solid rgba(179,69,59,0.4)`, borderRadius: 12, padding: "20px" }}>
          <p style={{ fontSize: 13, color: CREAM, margin: "0 0 6px", fontWeight: 600 }}>Failed to load pending fulfillments</p>
          <p style={{ fontSize: 12.5, color: MUTED, fontFamily: "monospace", margin: 0, wordBreak: "break-word" }}>{fulfillmentsError}</p>
        </div>
      ) : fulfillments.length === 0 ? (
        <p style={{ color: MUTED, fontSize: 14 }}>Nothing waiting on review.</p>
      ) : (
        fulfillments.map((f) => (
          <div key={f.id} style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 12, padding: 18, marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
              <p style={{ fontFamily: "Georgia, serif", fontSize: 16, color: CREAM, margin: 0 }}>Floor {f.request?.stage}</p>
              <span style={{ fontSize: 12, color: MUTED }}>
                {f.show_fulfiller ? f.fulfiller?.username || "a player" : "Anonymous"} · submitted {new Date(f.created_at).toLocaleString()}
              </span>
            </div>

            <TeamPreview team={f.team} pets={pets} items={items} />

            {f.note && <p style={{ fontSize: 13, color: CREAM, margin: "0 0 12px", lineHeight: 1.5 }}>{f.note}</p>}

            <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 8px" }}>Proof screenshots</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 14 }}>
              {f.images.map((img, i) => (
                <a key={i} href={imageUrl(img.storage_path)} target="_blank" rel="noreferrer" title={img.kind}>
                  <img src={imageUrl(img.storage_path)} alt={img.kind} style={{ width: 96, height: 96, objectFit: "cover", borderRadius: 8, border: `1px solid ${LINE}` }} />
                </a>
              ))}
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => decideFulfillment(f.id, "verified")}
                style={{ background: GOLD, color: "#FFFFFF", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                Approve (+10 karma)
              </button>
              <button
                onClick={() => decideFulfillment(f.id, "rejected")}
                style={{ background: "none", color: DANGER, border: `1px solid ${DANGER}`, borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
