import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Send } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { useCatalog } from "../hooks/useCatalog";
import { supabase } from "../lib/supabaseClient";
import { uploadSubmissionImage } from "../lib/uploadImage";
import { containsProfanity } from "../lib/profanity";
import PetSlotEditor, { emptySlot, slotIsComplete } from "../components/PetSlotEditor";
import ImageUploadSlot from "../components/ImageUploadSlot";
import { PANEL, PANEL_2, LINE, CREAM, MUTED, GOLD, DANGER } from "../lib/theme";

export default function Submit({ onRequireAuth }) {
  const { isAuthed, user } = useAuth();
  const { pets, itemsByType, loading: catalogLoading } = useCatalog();
  const navigate = useNavigate();

  const [floor, setFloor] = useState("");
  const [team, setTeam] = useState([emptySlot(), emptySlot(), emptySlot(), emptySlot()]);
  const [showAuthor, setShowAuthor] = useState(true);
  const [note, setNote] = useState("");
  const [completionFiles, setCompletionFiles] = useState([]);
  const [petFiles, setPetFiles] = useState([]);
  const [itemFiles, setItemFiles] = useState([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isAuthed) {
    onRequireAuth();
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: MUTED, fontSize: 14 }}>Sign in to submit a build.</p>
      </div>
    );
  }

  if (catalogLoading) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: MUTED, fontSize: 14 }}>Loading…</p>
      </div>
    );
  }

  const updateSlot = (i, newSlot) => setTeam((prev) => prev.map((s, idx) => (idx === i ? newSlot : s)));

  // Compute the picked files and their preview URLs OUTSIDE the state
  // updater. Doing this work (URL.createObjectURL is a real side effect)
  // inside a setState updater is unsafe — React can invoke updaters more
  // than once per update in development, which was causing images to
  // sometimes not appear and to get stuck after the first upload.
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
    const floorNum = parseInt(floor, 10);
    if (!floorNum || floorNum < 1) missing.push("which floor this is for");

    const incompleteCount = team.filter((s) => !slotIsComplete(s)).length;
    if (incompleteCount > 0) missing.push(`the pet, level, and full loadout for all 4 team slots (${incompleteCount} incomplete)`);
    const petIds = team.map((s) => s.petId).filter(Boolean);
    if (new Set(petIds).size !== petIds.length && petIds.length > 0) missing.push("4 distinct pets — you've repeated one");

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
      // Upload every image first — Storage isn't part of the DB transaction,
      // so this happens before we call the function that writes everything else.
      const uploaded = [];
      for (const f of completionFiles) {
        const path = await uploadSubmissionImage(f.file, user.id);
        uploaded.push({ kind: "completion", storage_path: path });
      }
      for (const f of petFiles) {
        const path = await uploadSubmissionImage(f.file, user.id);
        uploaded.push({ kind: "pets", storage_path: path });
      }
      for (const f of itemFiles) {
        const path = await uploadSubmissionImage(f.file, user.id);
        uploaded.push({ kind: "items", storage_path: path });
      }

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

      const { error: rpcError } = await supabase.rpc("submit_build", {
        p_stage: floorNum,
        p_note: note,
        p_show_author: showAuthor,
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
        <div style={{ background: PANEL, border: `1px solid rgba(196,121,31,0.35)`, borderRadius: 12, padding: "32px 24px" }}>
          <p style={{ fontFamily: "Georgia, serif", fontSize: 20, color: CREAM, margin: "0 0 8px" }}>Build submitted</p>
          <p style={{ fontSize: 13.5, color: MUTED, margin: "0 0 20px", lineHeight: 1.6 }}>
            It's in review — once two other players confirm it worked, it'll show up as verified in search.
          </p>
          <button
            onClick={() => navigate(`/results/${floor}`)}
            style={{ background: GOLD, color: "#FFFFFF", border: "none", borderRadius: 9, padding: "11px 22px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
          >
            View floor {floor}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px 24px 80px", maxWidth: 560, margin: "0 auto" }}>
      <button
        onClick={() => navigate(-1)}
        style={{ background: "none", border: "none", color: MUTED, fontSize: 13, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", padding: 0, marginBottom: 20 }}
      >
        <ArrowLeft size={14} /> Back
      </button>

      <p style={{ fontFamily: "Georgia, serif", fontSize: 24, color: CREAM, margin: "0 0 8px" }}>Submit your build</p>
      <p style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.6, margin: "0 0 24px" }}>
        Once two other players confirm it worked, you'll earn a free lookup. Tell us
        exactly which pet wore what — including levels — plus the required screenshots.
      </p>

      <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
        Which floor <span style={{ color: DANGER }}>*</span>
      </p>
      <div style={{ position: "relative", marginBottom: 22 }}>
        <Search size={15} color={MUTED} style={{ position: "absolute", left: 12, top: 13 }} />
        <input
          value={floor}
          onChange={(e) => {
            setFloor(e.target.value);
            if (error) setError("");
          }}
          type="number"
          min="1"
          placeholder="Enter a floor number"
          style={{ width: "100%", boxSizing: "border-box", background: PANEL, border: `1px solid ${LINE}`, borderRadius: 10, padding: "12px 12px 12px 36px", color: CREAM, fontSize: 16, outline: "none" }}
        />
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
          petOptions={pets}
          hatOptions={itemsByType.hat}
          scarfOptions={itemsByType.scarf}
          accessoryOptions={itemsByType.accessory}
        />
      ))}

      <label style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0 22px", cursor: "pointer" }}>
        <input type="checkbox" checked={showAuthor} onChange={(e) => setShowAuthor(e.target.checked)} style={{ width: 15, height: 15 }} />
        <span style={{ fontSize: 12.5, color: MUTED }}>
          Show my username on this submission {showAuthor ? "" : "(posting anonymously)"}
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
        <Send size={14} /> {submitting ? "Uploading…" : "Submit for review"}
      </button>
    </div>
  );
}
