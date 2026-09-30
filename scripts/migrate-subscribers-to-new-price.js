// One-time script — run locally once, not part of the deployed app.
//
// Moves every currently-active/trialing subscriber's Stripe subscription
// onto the new price, effective at their NEXT renewal (proration_behavior:
// "none" — nobody gets charged the difference today, they just start
// paying the new amount next cycle, which is the standard, customer-fair
// way to raise a price on existing subscribers).
//
// Usage:
//   NEW_PRICE_ID=price_xxx node scripts/migrate-subscribers-to-new-price.js
//
// Requires these in your local .env (or exported in your shell) — the same
// values your Vercel project already uses:
//   STRIPE_SECRET_KEY
//   VITE_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//
// Safe to re-run: subscriptions already on the new price are skipped.

import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const NEW_PRICE_ID = process.env.NEW_PRICE_ID;
if (!NEW_PRICE_ID) {
  console.error("Set NEW_PRICE_ID to the new $6 Stripe Price ID before running this.");
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const { data: profiles, error } = await supabaseAdmin
    .from("profiles")
    .select("id, username, stripe_subscription_id")
    .eq("is_subscribed", true)
    .not("stripe_subscription_id", "is", null);

  if (error) {
    console.error("Failed to load subscribers:", error.message);
    process.exit(1);
  }

  console.log(`Found ${profiles.length} active subscriber(s) to check.`);

  let migrated = 0;
  let skipped = 0;
  let failed = 0;

  for (const profile of profiles) {
    try {
      const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id);
      const item = subscription.items.data[0];

      if (!item) {
        console.warn(`  [skip] ${profile.username} (${profile.id}) — subscription has no items`);
        skipped++;
        continue;
      }

      if (item.price.id === NEW_PRICE_ID) {
        skipped++;
        continue;
      }

      await stripe.subscriptions.update(profile.stripe_subscription_id, {
        items: [{ id: item.id, price: NEW_PRICE_ID }],
        proration_behavior: "none",
      });

      console.log(`  [ok] ${profile.username} (${profile.id}) — moved to new price, effective next renewal`);
      migrated++;
    } catch (err) {
      console.error(`  [FAILED] ${profile.username} (${profile.id}):`, err.message);
      failed++;
    }
  }

  console.log(`\nDone. Migrated: ${migrated}, already on new price: ${skipped}, failed: ${failed}.`);
  if (failed > 0) {
    console.log("Re-run this script to retry the failed ones — it's safe to run more than once.");
  }
}

main();
