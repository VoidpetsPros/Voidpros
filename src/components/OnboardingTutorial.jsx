import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { X, Sparkles, Users, Search, Trophy } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { PANEL, LINE, CREAM, MUTED, GOLD } from "../lib/theme";

const SEARCH_STEP_INDEX = 2;

const STEPS = [
  {
    icon: Sparkles,
    title: "Welcome to Voidpros!",
    body: "Quick tutorial, less than a minute — we'll get your collection set up and show you how to search for a build.",
    cta: "Let's go",
    to: null,
  },
  {
    icon: Users,
    title: "Add what you own",
    body: "Head to Collection and mark the pets and items you actually have — no typing, just tapping. This card will stay right here while you work.",
    cta: "Go to Collection",
    to: "/collection",
  },
  {
    icon: Search,
    title: "Search a floor",
    body: "Once your collection is set, open Floor Search and enter the floor giving you trouble. You've got a free search just for reaching this step — try floor 2000 if you just want to see how it works.",
    cta: "Go to Floor Search",
    to: "/search",
  },
  {
    icon: Trophy,
    title: "Earn karma",
    body: "You can also submit builds you've used to beat floors to get karma. Karma unlocks free bonus searches.",
    cta: "Got it",
    to: null,
  },
];

export default function OnboardingTutorial() {
  const navigate = useNavigate();
  const { markTutorialSeen, grantTutorialSearchBonus } = useAuth();
  const [step, setStep] = useState(0);

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  // Grants the one-time tutorial search bonus on reaching this step. Safe
  // to fire every time this step becomes active (Back/forward, remounts,
  // whatever) — the actual one-time check lives server-side, not here.
  useEffect(() => {
    if (step === SEARCH_STEP_INDEX) {
      grantTutorialSearchBonus();
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    markTutorialSeen();
  };

  // Steps with a page to visit (Collection, Floor Search) only navigate —
  // they do NOT advance the step. The card stays showing that step's guidance
  // while the person actually works on that page; they move on themselves
  // with "Next step" whenever they're ready.
  const handlePrimary = () => {
    if (current.to) {
      navigate(current.to);
      return;
    }
    if (isLast) {
      markTutorialSeen();
    } else {
      setStep((s) => s + 1);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 55,
        background: PANEL,
        border: `1px solid ${LINE}`,
        borderRadius: 14,
        padding: 20,
        width: 300,
        maxWidth: "calc(100vw - 40px)",
        boxShadow: "0 16px 40px -10px rgba(0,0,0,0.35)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
        <div style={{ display: "flex", gap: 5 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ width: 20, height: 4, borderRadius: 999, background: i === step ? GOLD : LINE }} />
          ))}
        </div>
        <button onClick={handleClose} aria-label="Dismiss tutorial" style={{ background: "none", border: "none", color: MUTED, cursor: "pointer", padding: 0 }}>
          <X size={16} />
        </button>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 9, background: "rgba(124,58,237,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Icon size={16} color={GOLD} />
        </div>
        <p style={{ fontFamily: "system-ui, sans-serif", fontWeight: 700, fontSize: 15.5, color: CREAM, margin: 0 }}>{current.title}</p>
      </div>

      <p style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.55, margin: "0 0 12px" }}>{current.body}</p>

      {current.to && !isLast && (
        <button
          onClick={() => setStep((s) => s + 1)}
          style={{ background: "none", border: "none", color: GOLD, fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 14, textDecoration: "underline" }}
        >
          I'm done here — next step
        </button>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        {step > 0 && (
          <button
            onClick={() => setStep((s) => s - 1)}
            style={{ background: "none", border: `1px solid ${LINE}`, color: CREAM, borderRadius: 8, padding: "9px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
          >
            Back
          </button>
        )}
        <button
          onClick={handlePrimary}
          style={{ flex: 1, background: GOLD, color: "#FFFFFF", border: "none", borderRadius: 8, padding: "9px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}
        >
          {current.cta}
        </button>
      </div>
    </div>
  );
}

