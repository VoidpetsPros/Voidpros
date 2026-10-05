import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const authHeader = req.headers.authorization || "";
  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ error: "Missing auth token" });
  }

  const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
  if (userError || !userData?.user) {
    return res.status(401).json({ error: "Invalid session" });
  }

  try {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_subscription_id")
      .eq("id", userData.user.id)
      .single();

    if (!profile?.stripe_subscription_id) {
      return res.status(400).json({ error: "No subscription found for this account" });
    }

    const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);

    // A fully-canceled subscription can't be un-canceled — Stripe only
    // allows updating cancellation_details/metadata on it. Also sync our
    // own record down to match, same as cancel-subscription.js does for
    // this same stale-id scenario.
    if (subscription.status === "canceled" || subscription.status === "incomplete_expired") {
      await supabaseAdmin.rpc("admin_set_subscription_status", {
        p_user_id: userData.user.id,
        p_customer_id: subscription.customer,
        p_subscription_id: subscription.id,
        p_is_subscribed: false,
        p_cancel_at_period_end: false,
        p_current_period_end: null,
      });
      return res.status(400).json({ error: "This subscription has already ended — you'll need to subscribe again to get Unlimited back." });
    }

    const updated = await stripe.subscriptions.update(profile.stripe_subscription_id, {
      cancel_at_period_end: false,
    });

    const currentPeriodEnd = updated.current_period_end
      ? new Date(updated.current_period_end * 1000).toISOString()
      : null;
    const isActive = updated.status === "active" || updated.status === "trialing";

    await supabaseAdmin.rpc("admin_set_subscription_status", {
      p_user_id: userData.user.id,
      p_customer_id: updated.customer,
      p_subscription_id: updated.id,
      p_is_subscribed: isActive,
      p_cancel_at_period_end: false,
      p_current_period_end: currentPeriodEnd,
    });

    return res.status(200).json({ is_subscribed: isActive, cancel_at_period_end: false, current_period_end: currentPeriodEnd });
  } catch (err) {
    console.error("resume-subscription failed:", err);
    return res.status(500).json({ error: err.message || "Failed to resume subscription" });
  }
}
