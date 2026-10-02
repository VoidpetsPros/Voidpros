import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Runs daily via Vercel Cron (see vercel.json). Vercel automatically sends
// Authorization: Bearer <CRON_SECRET> on its own scheduled invocations
// when that env var is set — this check rejects anyone else hitting this
// URL directly.
export default async function handler(req, res) {
  const authHeader = req.headers.authorization || "";
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { data, error } = await supabaseAdmin.rpc("expire_comp_unlimited_grants");
    if (error) throw error;
    return res.status(200).json({ expired_count: data });
  } catch (err) {
    console.error("cron-expire-comp-grants failed:", err);
    return res.status(500).json({ error: err.message || "Failed to expire comp grants" });
  }
}
