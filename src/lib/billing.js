import { supabase } from "./supabaseClient";

async function callBillingEndpoint(path) {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error("Not signed in");

  const res = await fetch(path, {
    method: "POST",
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Something went wrong");
  return data;
}

export async function startCheckout() {
  const { url } = await callBillingEndpoint("/api/create-checkout-session");
  window.location.href = url;
}

export async function openBillingPortal() {
  const { url } = await callBillingEndpoint("/api/create-portal-session");
  window.location.href = url;
}
