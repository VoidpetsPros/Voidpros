import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Uses inline price_data rather than pre-created Stripe Price objects —
// no manual setup needed in the Stripe Dashboard for these.
const BUNDLES = {
  item_search: { name: "25 Item Search Credits", amount_cents: 500 },
  request: { name: "25 Request Credits", amount_cents: 500 },
  suggested_build: { name: "25 Suggested Build Credits", amount_cents: 500 },
  all: { name: "25 of Every Credit Type", amount_cents: 1000 },
};

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

  const { bundle_type } = req.body || {};
  const bundle = BUNDLES[bundle_type];
  if (!bundle) {
    return res.status(400).json({ error: "Invalid bundle type" });
  }

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
      await supabaseAdmin.rpc("admin_set_subscription_status", {
        p_user_id: user.id,
        p_customer_id: customerId,
        p_subscription_id: null,
        p_is_subscribed: false,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: bundle.name },
            unit_amount: bundle.amount_cents,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.SITE_URL}/credits?purchased=1`,
      cancel_url: `${process.env.SITE_URL}/credits`,
      metadata: { supabase_user_id: user.id, bundle_type },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("create-credit-checkout-session failed:", err);
    return res.status(500).json({ error: err.message || "Failed to start checkout" });
  }
}
