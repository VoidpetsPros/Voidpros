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
        if (userId) {
          await supabaseAdmin.rpc("admin_set_subscription_status", {
            p_user_id: userId,
            p_customer_id: session.customer,
            p_subscription_id: session.subscription,
            p_is_subscribed: true,
          });
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
          await supabaseAdmin.rpc("admin_set_subscription_status", {
            p_user_id: profile.id,
            p_customer_id: subscription.customer,
            p_subscription_id: subscription.id,
            p_is_subscribed: isActive,
          });
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
