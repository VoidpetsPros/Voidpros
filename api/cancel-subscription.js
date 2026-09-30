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
      return res.status(400).json({ error: "No active subscription found for this account" });
    }

    const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);

    let updated;
    let isSubscribed;
    let cancelAtPeriodEnd;

    if (subscription.status === "trialing") {
      // Still in the free trial — cancelling ends access right away,
      // rather than letting the trial run out on its own.
      updated = await stripe.subscriptions.cancel(profile.stripe_subscription_id);
      isSubscribed = false;
      cancelAtPeriodEnd = false;
    } else {
      // Already paying — they've paid for this period, so keep access
      // until it actually ends instead of cutting them off immediately.
      updated = await stripe.subscriptions.update(profile.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
      isSubscribed = true;
      cancelAtPeriodEnd = true;
    }

    const currentPeriodEnd = updated.current_period_end
      ? new Date(updated.current_period_end * 1000).toISOString()
      : null;

    await supabaseAdmin.rpc("admin_set_subscription_status", {
      p_user_id: userData.user.id,
      p_customer_id: updated.customer,
      p_subscription_id: updated.id,
      p_is_subscribed: isSubscribed,
      p_cancel_at_period_end: cancelAtPeriodEnd,
      p_current_period_end: currentPeriodEnd,
    });

    return res.status(200).json({
      is_subscribed: isSubscribed,
      cancel_at_period_end: cancelAtPeriodEnd,
      current_period_end: currentPeriodEnd,
    });
  } catch (err) {
    console.error("cancel-subscription failed:", err);
    return res.status(500).json({ error: err.message || "Failed to cancel subscription" });
  }
}
