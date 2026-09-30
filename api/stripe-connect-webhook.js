import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabaseAdmin = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

// Separate endpoint from api/stripe-webhook.js on purpose — Stripe doesn't
// allow changing an existing webhook destination's "Events from" scope
// after creation, so events on Connected accounts (like account.updated)
// need their own destination with its own signing secret.
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
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_CONNECT_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Connect webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
  }

  try {
    switch (event.type) {
      // payouts_enabled is the real signal Stripe will actually let money
      // move to their bank — details_submitted alone can be true before
      // payouts are turned on.
      case "account.updated": {
        const account = event.data.object;
        await supabaseAdmin
          .from("affiliates")
          .update({ stripe_connect_onboarded: !!account.payouts_enabled })
          .eq("stripe_connect_account_id", account.id);
        break;
      }

      default:
        break;
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Connect webhook handler failed:", err);
    return res.status(500).json({ error: "Webhook handler failed" });
  }
}
