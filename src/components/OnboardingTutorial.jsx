import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Users, Search, Trophy } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { PANEL, LINE, CREAM, MUTED, GOLD } from "../lib/theme";

const STEPS = [
  {
    icon: Users,
    title: "Add what you own",
    body: "Head to Collection and mark the pets and items you actually have. This is what everything else is built on — no typing, just tapping.",
    cta: "Go to Collection",
    to: "/collection",
  },
  {
    icon: Search,
    title: "Search a floor",
    body: "Once your collection is set, hit Builds and enter the floor giving you trouble. You'll only see builds you can actually make.",
    cta: "Go to Builds",
    to: "/search",
  },
  {
    icon: Trophy,
    title: "Earn karma",
    body: "Submit a Completion (the team that beat a floor) for 5 karma, or take on a Challenge for 10. Hit 100 karma and you'll unlock 5 bonus free searches.",
    cta: "Got it",
    to: null,
  },
];

export default function OnboardingTutorial() {
  const navigate = useNavigate();
  const { markTutorialSeen } = useAuth();
  const [step, setStep] = useState(0);

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  const handleClose = () => {
    markTutorialSeen();
  };

  const handlePrimary = () => {
    if (current.to) navigate(current.to);
    if (isLast) {
      markTutorialSeen();
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 65, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: PANEL, border: `1px solid ${LINE}`, borderRadius: 16, padding: 28, maxWidth: 380, width: "100%", boxShadow: "0 20px 50px -12px rgba(0,0,0,0.4)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <div style={{ display: "flex", gap: 5 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{ width: 22, height: 4, borderRadius: 999, background: i === step ? GOLD : LINE }} />
            ))}
          </div>
          <button onClick={handleClose} aria-label="Skip tutorial" style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", padding: 0 }}>
            <X size={18} />
          </button>
        </div>

        <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(124,58,237,0.1)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
          <Icon size={20} color={GOLD} />
        </div>

        <p style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 19, color: CREAM, margin: "0 0 8px" }}>{current.title}</p>
        <p style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.6, margin: "0 0 22px" }}>{current.body}</p>

        <div style={{ display: "flex", gap: 10 }}>
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              style={{ background: "none", border: `1px solid ${LINE}`, color: CREAM, borderRadius: 9, padding: "10px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
            >
              Back
            </button>
          )}
          <button
            onClick={handlePrimary}
            style={{ flex: 1, background: GOLD, color: "#FFFFFF", border: "none", borderRadius: 9, padding: "10px 16px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}
          >
            {current.cta}
          </button>
        </div>
      </div>
    </div>
  );
}
