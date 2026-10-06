import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Runs daily via Vercel Cron (see vercel.json). Vercel automatically sends
// Authorization: Bearer <CRON_SECRET> on its own scheduled invocations
// when that env var is set — this check rejects anyone else hitting this
// URL directly.
//
// Was api/cron-expire-comp-grants.js — renamed once it started handling
// more than one daily cleanup task.
export default async function handler(req, res) {
  const authHeader = req.headers.authorization || "";
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const results = {};

  try {
    const { data, error } = await supabaseAdmin.rpc("expire_comp_unlimited_grants");
    if (error) throw error;
    results.expired_comp_grants = data;
  } catch (err) {
    console.error("cron-daily-cleanup: expire_comp_unlimited_grants failed:", err);
    results.expire_comp_grants_error = err.message || "failed";
  }

  try {
    const { data, error } = await supabaseAdmin.rpc("delete_stale_challenges");
    if (error) throw error;
    results.deleted_stale_challenges = data;
  } catch (err) {
    console.error("cron-daily-cleanup: delete_stale_challenges failed:", err);
    results.delete_stale_challenges_error = err.message || "failed";
  }

  try {
    const { data, error } = await supabaseAdmin.rpc("grant_monthly_credits");
    if (error) throw error;
    results.granted_monthly_credits_to = data;
  } catch (err) {
    console.error("cron-daily-cleanup: grant_monthly_credits failed:", err);
    results.grant_monthly_credits_error = err.message || "failed";
  }

  return res.status(200).json(results);
}
