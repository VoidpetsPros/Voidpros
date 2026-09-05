import React, { useRef } from "react";
import { X, ImagePlus } from "lucide-react";
import { useTheme } from "../hooks/ThemeContext";

export default function ImageUploadSlot({ label, hint, files, onAdd, onRemove, max, required, error }) {
  const { LINE, MUTED, PANEL_2, DANGER } = useTheme();
  const inputRef = useRef(null);

  return (
    <div style={{ marginBottom: 16 }}>
      <p style={{ fontSize: 11, color: MUTED, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
        {label} {required && <span style={{ color: DANGER }}>*</span>}
      </p>
      {hint && <p style={{ fontSize: 11.5, color: MUTED, margin: "0 0 8px" }}>{hint}</p>}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {files.map((f, i) => (
          <div key={f.previewUrl} style={{ position: "relative", width: 84, height: 84, borderRadius: 9, overflow: "hidden", border: `1px solid ${LINE}`, flexShrink: 0 }}>
            <img src={f.previewUrl} alt={f.file.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <button
              onClick={() => onRemove(i)}
              type="button"
              aria-label="Remove image"
              style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", background: "rgba(43,38,32,0.75)", border: "none", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}
            >
              <X size={12} />
            </button>
          </div>
        ))}
        {files.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current && inputRef.current.click()}
            style={{ width: 84, height: 84, flexShrink: 0, borderRadius: 9, border: `1px dashed ${error ? DANGER : LINE}`, background: PANEL_2, color: MUTED, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer" }}
          >
            <ImagePlus size={18} />
            <span style={{ fontSize: 10.5 }}>Add photo</span>
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={max > 1}
        onChange={(e) => {
          if (e.target.files) onAdd(e.target.files);
          e.target.value = "";
        }}
        style={{ display: "none" }}
      />
    </div>
  );
}
