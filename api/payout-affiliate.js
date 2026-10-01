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

  const { data: callerProfile } = await supabaseAdmin
    .from("profiles")
    .select("is_admin")
    .eq("id", userData.user.id)
    .single();
  if (!callerProfile?.is_admin) {
    return res.status(403).json({ error: "Admin only" });
  }

  const { affiliate_user_id } = req.body || {};
  if (!affiliate_user_id) {
    return res.status(400).json({ error: "Missing affiliate_user_id" });
  }

  try {
    const { data: affiliate } = await supabaseAdmin
      .from("affiliates")
      .select("stripe_connect_account_id, stripe_connect_onboarded")
      .eq("user_id", affiliate_user_id)
      .single();

    if (!affiliate?.stripe_connect_account_id || !affiliate.stripe_connect_onboarded) {
      return res.status(400).json({ error: "This affiliate hasn't connected a bank account yet" });
    }

    const { data: commissions } = await supabaseAdmin
      .from("affiliate_commissions")
      .select("amount_cents")
      .eq("affiliate_user_id", affiliate_user_id)
      .is("paid_at", null);

    const pendingCents = (commissions || []).reduce((sum, c) => sum + c.amount_cents, 0);
    if (pendingCents <= 0) {
      return res.status(400).json({ error: "Nothing owed to this affiliate" });
    }

    const transfer = await stripe.transfers.create({
      amount: pendingCents,
      currency: "usd",
      destination: affiliate.stripe_connect_account_id,
      metadata: { affiliate_user_id },
    });

    const { error: recordError } = await supabaseAdmin.rpc("record_affiliate_stripe_payout", {
      p_affiliate_user_id: affiliate_user_id,
      p_amount_cents: pendingCents,
      p_transfer_id: transfer.id,
    });

    if (recordError) {
      // The transfer already succeeded on Stripe's side at this point — a
      // failure here means the DB fell out of sync with reality, not that
      // the money didn't move. Surface this clearly rather than silently
      // losing track of a real transfer.
      console.error("Transfer succeeded but recording it failed:", recordError, "transfer:", transfer.id);
      return res.status(500).json({
        error: `Transfer sent (${transfer.id}) but failed to record in the database — note this transfer ID and reconcile manually.`,
      });
    }

    return res.status(200).json({ amount_cents: pendingCents, transfer_id: transfer.id });
  } catch (err) {
    console.error("payout-affiliate failed:", err);
    return res.status(500).json({ error: err.message || "Failed to send payout" });
  }
}
