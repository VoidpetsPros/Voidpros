import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Sparkles, Users, Search, Trophy, Home } from "lucide-react";
import { useAuth } from "../hooks/AuthContext";
import { useTheme } from "../hooks/ThemeContext";

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
    body: "Once your collection is set, open Floor Search and enter the floor giving you trouble. Search is unlimited — try floor 2000 if you just want to see how it works.",
    cta: "Go to Floor Search",
    to: "/search",
  },
  {
    icon: Trophy,
    title: "Climb the Leaderboards",
    body: "Every verified Completion and Challenge counts toward the Leaderboards — check them out anytime from the header. Top 3 in each category every month win a free month of Unlimited.",
    cta: "Take Me To Leaderboards",
    to: "/leaderboards",
  },
  {
    icon: Home,
    title: "You're all set",
    body: "That's the tour — Collection, Search, and the Leaderboards. Jump back in whenever you're ready.",
    cta: "Take Me Home",
    to: "/",
  },
];

export default function OnboardingTutorial() {
  const navigate = useNavigate();
  const { markTutorialSeen } = useAuth();
  const { PANEL, LINE, CREAM, MUTED, GOLD } = useTheme();
  const [step, setStep] = useState(0);

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  const handleClose = () => {
    markTutorialSeen();
  };

  // Steps with a page to visit (Collection, Floor Search, Leaderboards) just
  // navigate — they do NOT advance the step, so the card stays showing that
  // step's guidance while the person actually works on that page; they move
  // on themselves with "Next step" whenever they're ready. The final step
  // is the one exception: it both navigates home AND closes the tutorial,
  // since there's nothing left to come back to it for.
  const handlePrimary = () => {
    if (isLast) {
      markTutorialSeen();
      if (current.to) navigate(current.to);
      return;
    }
    if (current.to) {
      navigate(current.to);
      return;
    }
    setStep((s) => s + 1);
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

