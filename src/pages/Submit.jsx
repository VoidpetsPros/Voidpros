import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Send, Trophy } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { uploadSubmissionImage } from "../lib/uploadImage";
import { containsProfanity } from "../lib/profanity";
import ImageUploadSlot from "../components/ImageUploadSlot";
import { PANEL, PANEL_2, LINE, CREAM, MUTED, GOLD, DANGER } from "../lib/theme";

export default function Submit({ onRequireAuth }) {
  const { isAuthed, user } = useAuth();
  const navigate = useNavigate();

  const [floor, setFloor] = useState("");
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

      const { error: rpcError } = await supabase.rpc("submit_build", {
        p_stage: floorNum,
        p_note: note,
        p_show_author: showAuthor,
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
        <div style={{ background: PANEL, border: "1px solid rgba(139,92,246,0.35)", borderRadius: 16, padding: "32px 24px" }}>
          <p style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: -0.4, fontSize: 20, color: CREAM, margin: "0 0 8px" }}>Build submitted</p>
          <p style={{ fontSize: 13.5, color: MUTED, margin: "0 0 20px", lineHeight: 1.6 }}>
            It's in review — once approved, it'll show up as verified in search and you'll
            earn a free lookup.
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

      <p style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, letterSpacing: -0.4, fontSize: 24, color: CREAM, margin: "0 0 8px" }}>Submit your build</p>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.25)", borderRadius: 999, padding: "4px 11px", marginBottom: 14 }}>
        <Trophy size={12} color={GOLD} />
        <span style={{ fontSize: 11.5, fontWeight: 600, color: GOLD }}>Completion · +5 karma when verified</span>
      </div>
      <p style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.6, margin: "0 0 24px" }}>
        Just the screenshots — no need to type out your team. We'll review them and add
        it to search once approved, and you'll earn a free lookup.
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
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          placeholder="Enter a floor number"
          style={{ width: "100%", boxSizing: "border-box", background: PANEL, border: `1px solid ${LINE}`, borderRadius: 10, padding: "12px 12px 12px 36px", color: CREAM, fontSize: 16, outline: "none" }}
        />
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 8, margin: "6px 0 22px", cursor: "pointer" }}>
        <input type="checkbox" checked={showAuthor} onChange={(e) => setShowAuthor(e.target.checked)} style={{ width: 15, height: 15 }} />
        <span style={{ fontSize: 12.5, color: MUTED }}>
          Show my username on this submission {showAuthor ? "" : "(posting anonymously)"}
        </span>
      </label>

      <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 16, padding: 20 }}>
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
          hint="Screenshot of your team going into the fight — make sure names/icons are visible."
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
