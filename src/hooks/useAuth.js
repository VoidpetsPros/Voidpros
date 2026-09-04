import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";

// Wraps Supabase auth + the matching row in `profiles` (karma, subscription
// status, trial usage). Any component can call useAuth() and get the same
// live session — this hook subscribes once and shares state via React context
// in App.jsx, so it should only be instantiated at the top of the tree.
export function useAuthState() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasNewActivity, setHasNewActivity] = useState(false);

  const fetchProfile = useCallback(async (userId) => {
    if (!userId) {
      setProfile(null);
      setHasNewActivity(false);
      return;
    }
    const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
    if (error) {
      console.error("Failed to load profile:", error.message);
      return;
    }
    setProfile(data);
    checkActivity(userId);
  }, []);

  const checkActivity = useCallback(async (userId) => {
    if (!userId) return;
    const { data, error } = await supabase.rpc("has_new_activity", { p_user_id: userId });
    if (error) {
      console.error("has_new_activity check failed:", error.message);
      return;
    }
    setHasNewActivity(!!data);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user?.id) fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user?.id) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [fetchProfile]);

  const signUp = async (email, password, username) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    return { data, error };
  };

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    return { data, error };
  };

  const signInWithGoogle = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google" });
    return { data, error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const refreshProfile = () => fetchProfile(session?.user?.id);

  // Clears the notification badge — call this when the person opens the
  // Community tab. Optimistic: hides the badge immediately rather than
  // waiting on the round trip.
  const markActivitySeen = async () => {
    setHasNewActivity(false);
    const { error } = await supabase.rpc("mark_activity_seen");
    if (error) console.error(error.message);
  };

  // Dismisses the first-time onboarding tutorial for good — called whether
  // the person finishes it or clicks the X to skip.
  const markTutorialSeen = async () => {
    setProfile((p) => (p ? { ...p, tutorial_completed: true } : p));
    const { error } = await supabase.rpc("complete_tutorial");
    if (error) console.error(error.message);
  };

  // One-time +1 free lookup for reaching the tutorial's search step. The
  // grant is idempotent server-side (checked against a flag on the profile
  // row), so calling this more than once — e.g. the person goes Back and
  // forward through the tutorial repeatedly — never grants more than once.
  const grantTutorialSearchBonus = async () => {
    const { error } = await supabase.rpc("grant_tutorial_search_bonus");
    if (error) {
      console.error(error.message);
      return;
    }
    refreshProfile();
  };

  // Only call this once a search has actually returned a full match — per
  // the product rule, searches with no result don't cost a free lookup.
  // Runs through a database function (see migrations/0004) rather than a
  // direct table update, so it can't be gamed from the browser.
  const consumeTrialLookup = async () => {
    if (!session?.user?.id) return;
    const { data, error } = await supabase.rpc("increment_trial_lookup");
    if (error) {
      console.error(error.message);
      return;
    }
    if (data !== null) {
      setProfile((p) => ({ ...p, trial_lookups_used: data }));
    }
  };

  return {
    session,
    user: session?.user ?? null,
    profile,
    loading,
    isAuthed: !!session,
    hasNewActivity,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    refreshProfile,
    consumeTrialLookup,
    markActivitySeen,
    markTutorialSeen,
    grantTutorialSearchBonus,
  };
}
