import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// A stored customer ID can go stale — deleted in the Stripe dashboard,
// left over from a different mode, etc. Verify it actually still exists
// before reusing it; if not, treat it the same as never having had one.
async function getValidCustomerId(storedId) {
  if (!storedId) return null;
  try {
    const customer = await stripe.customers.retrieve(storedId);
    if (customer.deleted) return null;
    return storedId;
  } catch (err) {
    return null;
  }
}

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
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    let customerId = await getValidCustomerId(profile?.stripe_customer_id);
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      // Save it now so we don't create a duplicate Stripe customer if they
      // start checkout again before finishing this one.
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
      success_url: `${process.env.SITE_URL}/billing/success`,
      cancel_url: `${process.env.SITE_URL}/billing/cancelled`,
      metadata: { supabase_user_id: user.id },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("create-checkout-session failed:", err);
    return res.status(500).json({ error: err.message || "Failed to start checkout" });
  }
}
