import { supabase } from "./supabaseClient";

async function callBillingEndpoint(path, body) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not signed in");

  const res = await fetch(path, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || "Something went wrong");
    // Some endpoints (e.g. affiliate bank setup) attach a direct link to
    // fix a specific known issue — callers can check for this and act on
    // it instead of just showing the error text.
    if (data.action_url) err.action_url = data.action_url;
    throw err;
  }
  return data;
}

export async function startCheckout() {
  const { url } = await callBillingEndpoint("/api/create-checkout-session");
  window.location.href = url;
}

export async function startTrialCheckout() {
  const { url } = await callBillingEndpoint("/api/create-trial-checkout-session");
  window.location.href = url;
}

export async function openBillingPortal() {
  const { url } = await callBillingEndpoint("/api/create-portal-session");
  window.location.href = url;
}

// Unlike the other endpoints above, these don't redirect anywhere — they
// return the updated subscription state directly so the caller (Settings)
// can update the UI immediately without waiting for the webhook.
export async function cancelSubscription() {
  return callBillingEndpoint("/api/cancel-subscription");
}

export async function resumeSubscription() {
  return callBillingEndpoint("/api/resume-subscription");
}

export async function startAffiliateConnectOnboarding() {
  const { url } = await callBillingEndpoint("/api/affiliate-connect-onboarding");
  window.location.href = url;
}

export async function startCreditCheckout(bundleType) {
  const { url } = await callBillingEndpoint("/api/create-credit-checkout-session", { bundle_type: bundleType });
  window.location.href = url;
}
