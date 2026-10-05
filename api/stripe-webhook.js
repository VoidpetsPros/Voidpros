import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Stripe requires the RAW request body to verify a webhook's signature —
// Vercel's default body parsing would get in the way, so it's disabled here.
export const config = {
  api: { bodyParser: false },
};

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).end();
  }

  const rawBody = await readRawBody(req);
  const signature = req.headers["stripe-signature"];

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const userId = session.metadata?.supabase_user_id;
        const isTrial = session.metadata?.is_trial === "true";
        if (userId) {
          const { error: rpcError } = await supabaseAdmin.rpc("admin_set_subscription_status", {
            p_user_id: userId,
            p_customer_id: session.customer,
            p_subscription_id: session.subscription,
            p_is_subscribed: true,
            p_grant_trial: isTrial,
          });
          // The Supabase client doesn't throw on a failed RPC — it returns
          // an error field that has to be checked explicitly. Without this,
          // a failure here (bad params, a Postgres exception, anything)
          // would silently leave is_subscribed unset while this handler
          // still reports 200 to Stripe, so the real payment goes through
          // but nobody ever finds out the database write never happened.
          // Throwing surfaces it in logs and tells Stripe to retry.
          if (rpcError) {
            console.error("admin_set_subscription_status failed for checkout.session.completed:", rpcError, "userId:", userId);
            throw rpcError;
          }
        }
        break;
      }

      // Covers renewals, cancellations, and payment failures — Stripe sends
      // this whenever a subscription's status changes for any reason.
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", subscription.customer)
          .single();

        if (profile) {
          const isActive = subscription.status === "active" || subscription.status === "trialing";
          const currentPeriodEnd = subscription.current_period_end
            ? new Date(subscription.current_period_end * 1000).toISOString()
            : null;
          const { error: rpcError } = await supabaseAdmin.rpc("admin_set_subscription_status", {
            p_user_id: profile.id,
            p_customer_id: subscription.customer,
            p_subscription_id: subscription.id,
            p_is_subscribed: isActive,
            p_cancel_at_period_end: subscription.cancel_at_period_end || false,
            p_current_period_end: currentPeriodEnd,
          });
          if (rpcError) {
            console.error("admin_set_subscription_status failed for subscription update:", rpcError, "customer:", subscription.customer);
            throw rpcError;
          }
        }
        break;
      }

      // Fires for every successful subscription charge — the initial one
      // and every renewal. Feeds the affiliate commission system: 20% of
      // whatever was actually paid, capped at 3 lifetime months per
      // referred person (enforced inside credit_affiliate_commission, not
      // here — this just reports the fact of payment).
      case "invoice.paid": {
        const invoice = event.data.object;
        if (invoice.customer) {
          const { error: rpcError } = await supabaseAdmin.rpc("credit_affiliate_commission", {
            p_customer_id: invoice.customer,
            p_invoice_id: invoice.id,
            p_amount_cents: invoice.amount_paid,
          });
          // Logged, not thrown — a missed commission credit shouldn't make
          // Stripe retry the whole event (which also re-runs subscription
          // status logic elsewhere); it just needs to be visible so it can
          // be credited manually if it happens.
          if (rpcError) {
            console.error("credit_affiliate_commission failed:", rpcError, "customer:", invoice.customer, "invoice:", invoice.id);
          }
        }
        break;
      }

      default:
        // Other event types are ignored on purpose — we only act on the ones above.
        break;
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook handler failed:", err);
    return res.status(500).json({ error: "Webhook handler failed" });
  }
}
