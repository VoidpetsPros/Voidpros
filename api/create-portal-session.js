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
      .select("stripe_customer_id")
      .eq("id", userData.user.id)
      .single();

    if (!profile?.stripe_customer_id) {
      return res.status(400).json({ error: "No billing account found for this user" });
    }

    let session;
    try {
      session = await stripe.billingPortal.sessions.create({
        customer: profile.stripe_customer_id,
        return_url: `${process.env.SITE_URL}/`,
      });
    } catch (err) {
      if (err.code === "resource_missing") {
        return res.status(400).json({
          error: "Your billing record is out of date and needs to be reset — contact support.",
        });
      }
      throw err;
    }

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("create-portal-session failed:", err);
    return res.status(500).json({ error: err.message || "Failed to open billing portal" });
  }
}
