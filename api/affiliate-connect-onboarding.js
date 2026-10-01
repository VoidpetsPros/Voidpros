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
    const { data: affiliate } = await supabaseAdmin
      .from("affiliates")
      .select("stripe_connect_account_id")
      .eq("user_id", userData.user.id)
      .single();

    if (!affiliate) {
      return res.status(400).json({ error: "You need to join the affiliate program before connecting a bank account" });
    }

    let accountId = affiliate.stripe_connect_account_id;

    if (!accountId) {
      const account = await stripe.accounts.create({
        type: "express",
        email: userData.user.email,
        capabilities: { transfers: { requested: true } },
        metadata: { supabase_user_id: userData.user.id },
      });
      accountId = account.id;
      await supabaseAdmin.from("affiliates").update({ stripe_connect_account_id: accountId }).eq("user_id", userData.user.id);
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${process.env.SITE_URL}/affiliate`,
      return_url: `${process.env.SITE_URL}/affiliate`,
      type: "account_onboarding",
    });

    return res.status(200).json({ url: accountLink.url });
  } catch (err) {
    console.error("affiliate-connect-onboarding failed:", err);
    return res.status(500).json({ error: err.message || "Failed to start bank account setup" });
  }
}
