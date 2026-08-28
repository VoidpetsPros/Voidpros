import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Send } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { useCatalog } from "../hooks/useCatalog";
import { supabase } from "../lib/supabaseClient";
import { uploadSubmissionImage } from "../lib/uploadImage";
import { containsProfanity } from "../lib/profanity";
import PetSlotEditor, { emptySlot } from "../components/PetSlotEditor";
import ImageUploadSlot from "../components/ImageUploadSlot";
import PetAvatar from "../components/PetAvatar";
import ItemAvatar from "../components/ItemAvatar";
import { PANEL, PANEL_2, LINE, CREAM, MUTED, GOLD, VIOLET, DANGER } from "../lib/theme";

export default function FulfillAttempt({ onRequireAuth }) {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { isAuthed, user } = useAuth();
  const { pets, items, loading: catalogLoading } = useCatalog();

  const [request, setRequest] = useState(null);
  const [loadingRequest, setLoadingRequest] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [team, setTeam] = useState([emptySlot(), emptySlot(), emptySlot(), emptySlot()]);
  const [showFulfiller, setShowFulfiller] = useState(true);
  const [note, setNote] = useState("");
  const [completionFiles, setCompletionFiles] = useState([]);
  const [petFiles, setPetFiles] = useState([]);
  const [itemFiles, setItemFiles] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!isAuthed) onRequireAuth();
  }, [isAuthed]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingRequest(true);
      const { data, error: fetchError } = await supabase
        .from("requests")
        .select("id, stage, fulfilled, pets:request_pets(pet_id), items:request_items(item_id, count)")
        .eq("id", requestId)
        .single();
      if (cancelled) return;
      if (fetchError) {
        setLoadError(fetchError.message);
      } else {
        setRequest({
          ...data,
          pets: (data.pets || []).map((p) => p.pet_id),
          items: Object.fromEntries((data.items || []).map((i) => [i.item_id, i.count])),
        });
      }
      setLoadingRequest(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [requestId]);

  if (!isAuthed) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: MUTED, fontSize: 14 }}>Sign in to attempt this floor.</p>
      </div>
    );
  }

  if (catalogLoading || loadingRequest) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: MUTED, fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  if (loadError || !request) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: MUTED, fontSize: 14 }}>{loadError || "Request not found."}</p>
      </div>
    );
  }

  if (request.fulfilled) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: MUTED, fontSize: 14 }}>This request has already been fulfilled.</p>
      </div>
    );
  }

  const allowedPets = pets.filter((p) => request.pets.includes(p.id));
  const allowedItemIds = Object.keys(request.items);
  const allowedHats = items.filter((i) => i.type === "hat" && allowedItemIds.includes(i.id));
  const allowedScarves = items.filter((i) => i.type === "scarf" && allowedItemIds.includes(i.id));
  const allowedAccessories = items.filter((i) => i.type === "accessory" && allowedItemIds.includes(i.id));

  const updateSlot = (i, newSlot) => setTeam((prev) => prev.map((s, idx) => (idx === i ? newSlot : s)));

  const addFiles = (currentFiles, setter, max) => (fileList) => {
    const room = max - currentFiles.length;
    const picked = Array.from(fileList).slice(0, room);
    const next = picked.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    setter([...currentFiles, ...next]);
    setError("");
  };
  const removeFile = (setter) => (idx) => setter((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async () => {
    setError("");
    const missing = [];

    // A pet is only "used" if the fulfiller actually picked one for that
    // slot — this is what makes partial teams possible when the requester
    // doesn't own enough for a full 4-pet setup.
    const usedSlots = team.filter((s) => s.petId);
    if (usedSlots.length === 0) missing.push("at least one pet");

    const inconsistentSlot = usedSlots.some((s) => {
      if (!s.petLevel) return true;
      const pairs = [s.hat, s.scarf, s.accessories[0], s.accessories[1]];
      return pairs.some((p) => !!p.id !== !!p.level); // an id needs a level and vice versa; both blank is fine
    });
    if (inconsistentSlot) missing.push("a level for every pet you've picked, and a level for any item you've picked");

    const petIds = usedSlots.map((s) => s.petId);
    if (new Set(petIds).size !== petIds.length) missing.push("distinct pets — you've repeated one");

    if (completionFiles.length === 0) missing.push("a screenshot showing the floor cleared");
    if (petFiles.length === 0) missing.push("a screenshot of the pets you used");
    if (itemFiles.length === 0) missing.push("at least one screenshot of the items you used");

    if (missing.length > 0) {
      setError(`Add ${missing.join(", ")}. Submissions without these are automatically denied.`);
      return;
    }
    if (containsProfanity(note)) {
      setError("Your notes contain language we don't allow. Please rephrase and try again.");
      return;
    }

    setSubmitting(true);
    try {
      const uploaded = [];
      for (const f of completionFiles) uploaded.push({ kind: "completion", storage_path: await uploadSubmissionImage(f.file, user.id) });
      for (const f of petFiles) uploaded.push({ kind: "pets", storage_path: await uploadSubmissionImage(f.file, user.id) });
      for (const f of itemFiles) uploaded.push({ kind: "items", storage_path: await uploadSubmissionImage(f.file, user.id) });

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

      const { error: rpcError } = await supabase.rpc("submit_fulfillment", {
        p_request_id: requestId,
        p_note: note,
        p_show_fulfiller: showFulfiller,
        p_team: teamPayload,
        p_images: uploaded,
      });

      if (rpcError) {
        setError(rpcError.message);
        setSubmitting(false);
        return;
      }
      setSuccess(true);
    } catch (err) {
      setError(err.message || "Something went wrong uploading your screenshots.");
    }
    setSubmitting(false);
  };

  if (success) {
    return (
      <div style={{ padding: "24px 24px 80px", maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
        <div style={{ background: PANEL, border: "1px solid rgba(196,121,31,0.35)", borderRadius: 12, padding: "32px 24px" }}>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 20, color: CREAM, margin: "0 0 8px" }}>Attempt submitted</p>
          <p style={{ fontSize: 13.5, color: MUTED, margin: "0 0 20px", lineHeight: 1.6 }}>
            It's in review — if it gets verified, you'll earn 10 karma and the requester's floor gets marked solved.
          </p>
          <button
            onClick={() => navigate("/fulfill")}
            style={{ background: GOLD, color: "#FFFFFF", border: "none", borderRadius: 9, padding: "11px 22px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
          >
            Back to requests
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 24px 80px", maxWidth: 560, margin: "0 auto" }}>
      <button
        onClick={() => navigate("/fulfill")}
        style={{ background: "none", border: "none", color: MUTED, fontSize: 13, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", padding: 0, marginBottom: 20 }}
      >
        <ArrowLeft size={14} /> Back
      </button>

      <p style={{ fontFamily: "Georgia, serif", fontSize: 24, color: CREAM, margin: "0 0 8px" }}>Attempt floor {request.stage}</p>
      <p style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.6, margin: "0 0 22px" }}>
        Use only pets and items from the requester's pool below. If they don't own enough
        for a full 4-pet team, use however many pets and however much gear they actually
        have — leave the rest blank. Get it verified and you'll earn 10 karma.
      </p>

      <div style={{ background: PANEL_2, border: `1px solid ${LINE}`, borderRadius: 10, padding: 14, marginBottom: 22 }}>
        <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 1, margin: "0 0 8px" }}>
          Must use only these
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {request.pets.map((pid) => {
            const p = pets.find((x) => x.id === pid);
            if (!p) return null;
            return (
              <span key={pid} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, padding: "3px 8px 3px 3px", borderRadius: 16, background: "rgba(108,86,201,0.1)", color: VIOLET, border: "1px solid rgba(108,86,201,0.3)" }}>
                <PetAvatar pet={p} size={18} /> {p.name}
              </span>
            );
          })}
          {Object.entries(request.items).map(([iid, count]) => {
            const it = items.find((x) => x.id === iid);
            if (!it) return null;
            return (
              <span key={iid} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, padding: "3px 8px 3px 3px", borderRadius: 16, background: "rgba(196,121,31,0.08)", color: GOLD, border: "1px solid rgba(196,121,31,0.3)" }}>
                <ItemAvatar item={it} size={18} /> {it.name} {count > 1 ? `×${count}` : ""}
              </span>
            );
          })}
        </div>
      </div>

      <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
        Your team <span style={{ color: DANGER }}>*</span>
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

      <label style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0 22px", cursor: "pointer" }}>
        <input type="checkbox" checked={showFulfiller} onChange={(e) => setShowFulfiller(e.target.checked)} style={{ width: 15, height: 15 }} />
        <span style={{ fontSize: 12.5, color: MUTED }}>
          Show my username on this attempt {showFulfiller ? "" : "(posting anonymously)"}
        </span>
      </label>

      <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 12, padding: 20 }}>
        <ImageUploadSlot
          label="Proof of completion"
          hint="Victory screen or the moment the floor cleared."
          files={completionFiles}
          onAdd={addFiles(completionFiles, setCompletionFiles, 1)}
          onRemove={removeFile(setCompletionFiles)}
          max={1}
          required
          error={!!error}
        />
        <ImageUploadSlot
          label="Pets used"
          hint="Screenshot of your team going into the fight."
          files={petFiles}
          onAdd={addFiles(petFiles, setPetFiles, 2)}
          onRemove={removeFile(setPetFiles)}
          max={2}
          required
          error={!!error}
        />
        <ImageUploadSlot
          label="Items used"
          hint="Screenshots of the items equipped or consumed — up to 4."
          files={itemFiles}
          onAdd={addFiles(itemFiles, setItemFiles, 4)}
          onRemove={removeFile(setItemFiles)}
          max={4}
          required
          error={!!error}
        />

        <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>Notes (optional)</p>
        <textarea
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            if (error) setError("");
          }}
          placeholder="Anything about timing or order that isn't obvious from the screenshots."
          rows={3}
          style={{ width: "100%", boxSizing: "border-box", background: PANEL_2, border: `1px solid ${LINE}`, borderRadius: 9, padding: 12, color: CREAM, fontSize: 13.5, resize: "none", marginBottom: error ? 8 : 4, fontFamily: "inherit" }}
        />
        {error && <p style={{ fontSize: 12.5, color: DANGER, margin: "10px 0 0", lineHeight: 1.5 }}>{error}</p>}
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        style={{ width: "100%", background: submitting ? PANEL_2 : GOLD, color: submitting ? MUTED : "#FFFFFF", border: "none", borderRadius: 10, padding: "13px 0", fontSize: 14.5, fontWeight: 600, cursor: submitting ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 20 }}
      >
        <Send size={14} /> {submitting ? "Uploading…" : "Submit attempt for review"}
      </button>
    </div>
  );
}
