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
  const user = userData.user;

  try {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id, trial_used, is_subscribed")
      .eq("id", user.id)
      .single();

    // Both checks matter: trial_used blocks anyone who's ever completed a
    // trial before (even if they've since cancelled), is_subscribed blocks
    // someone who's already got access right now (paid or mid-trial).
    if (profile?.trial_used) {
      return res.status(400).json({ error: "You've already used your free trial." });
    }
    if (profile?.is_subscribed) {
      return res.status(400).json({ error: "You already have Unlimited access." });
    }

    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabaseAdmin.rpc("admin_set_subscription_status", {
        p_user_id: user.id,
        p_customer_id: customerId,
        p_subscription_id: null,
        p_is_subscribed: false,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      subscription_data: { trial_period_days: 7 },
      success_url: `${process.env.SITE_URL}/billing/success`,
      cancel_url: `${process.env.SITE_URL}/billing/cancelled`,
      metadata: { supabase_user_id: user.id, is_trial: "true" },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("create-trial-checkout-session failed:", err);
    return res.status(500).json({ error: err.message || "Failed to start trial" });
  }
}
