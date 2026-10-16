/**
 * FESTI-ICE checkout. Secrets and service-role operations stay on the server.
 * Sales are closed unless all opt-in runtime settings and approved DB match.
 */
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";
import { paymentConfigured, fulfillmentConfigured, paymentProcessingConfigured } from "./payment-readiness";
export { paymentConfigured, fulfillmentConfigured, paymentProcessingConfigured } from "./payment-readiness";

type Cart = {
  slotId: string;
  items: { code: string; quantity: number }[];
  flex: boolean;
  familyAdults: number;
  customer: { name: string; email: string; phone: string };
};
type PriceLine = { code: string; name: string; quantity: number; unit_amount: number };
type Order = {
  order_id: string; total_cents: number; gst_cents: number; qst_cents: number;
  flex_cents: number; lines: PriceLine[];
};

/**
 * Fulfillment must remain on when sales are paused: Stripe can deliver paid
 * events long after the checkout button has been closed. Never couple the two.
 */

function database() {
  const url = process.env["SUPABASE_URL"]!;
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"]!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false, storage: undefined },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === "Bearer " + key)
        headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    }},
  });
}

async function postStripe(path: string, form: URLSearchParams, idem?: string): Promise<unknown> {
  const resp = await fetch("https://api.stripe.com/v1/" + path, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env["STRIPE_SECRET_KEY"]!,
      "Content-Type": "application/x-www-form-urlencoded",
      ...(idem ? { "Idempotency-Key": idem } : {}),
    },
    body: form.toString(),
    signal: AbortSignal.timeout(12000),
  });
  const data: unknown = await resp.json();
  if (!resp.ok) throw new Error("Stripe HTTP " + resp.status);
  return data;
}
function validOrder(raw: unknown): Order {
  if (!raw || typeof raw !== "object") throw new Error("Invalid order");
  const order = raw as Order;
  if (typeof order.order_id !== "string" || !Array.isArray(order.lines) ||
    ![order.total_cents,order.gst_cents,order.qst_cents,order.flex_cents].every(Number.isSafeInteger) ||
    order.total_cents < 50 || order.gst_cents < 0 || order.qst_cents < 0 || order.flex_cents < 0 ||
    !order.lines.every(line =>
      typeof line.name === "string" && Number.isSafeInteger(line.quantity) &&
      Number.isSafeInteger(line.unit_amount) && line.quantity > 0 && line.unit_amount >= 0) ||
    order.lines.reduce((sum,line) => sum + line.unit_amount * line.quantity, 0) +
      order.gst_cents + order.qst_cents + order.flex_cents !== order.total_cents)
    throw new Error("Order prices invalid");
  return order;
}

/** Redirect URL is returned only after a DB hold and a persisted Stripe session. */
export async function startCheckout(cart: Cart): Promise<string> {
  if (!paymentConfigured()) throw new Error("Billetterie non activée");
  const db = database();
  const { data, error } = await db.rpc("create_checkout_order", {
    _slot_id: cart.slotId, _items: cart.items, _flex: cart.flex,
    _customer_email: cart.customer.email, _customer_name: cart.customer.name,
    _customer_phone: cart.customer.phone, _family_adults: cart.familyAdults,
  });
  if (error) throw new Error("Sélection indisponible");
  const order = validOrder(data);
  let sessionId: string | null = null;
  try {
    const base = process.env["FESTIICE_CANONICAL_ORIGIN"]!;
    const form = new URLSearchParams();
    form.set("mode", "payment");
    form.set("payment_method_types[0]", "card");
    form.set("client_reference_id", order.order_id);
    form.set("customer_email", cart.customer.email);
    form.set("metadata[order_id]", order.order_id);
    form.set("success_url", base + "/billets?checkout=return");
    form.set("cancel_url", base + "/billets?checkout=cancelled");
    // Stripe requires at least 30 minutes at request receipt; use 35 minutes.
    // Database holds capacity for 45 minutes to cover webhook delivery.
    form.set("expires_at", String(Math.floor(Date.now()/1000) + 35*60));
    let i = 0;
    const add = (name: string, amount: number, quantity = 1) => {
      if (amount <= 0) return;
      const p = "line_items[" + i++ + "]";
      form.set(p + "[price_data][currency]", "cad");
      form.set(p + "[price_data][unit_amount]", String(amount));
      form.set(p + "[price_data][product_data][name]", name);
      form.set(p + "[quantity]", String(quantity));
    };
    for (const line of order.lines) add(line.name, line.unit_amount, line.quantity);
    add("Option Flex Météo", order.flex_cents);
    add("TPS (5 %)", order.gst_cents);
    add("TVQ (9,975 %)", order.qst_cents);
    const raw = await postStripe("checkout/sessions", form, "festiice-" + order.order_id);
    const session = raw as { id?: unknown; url?: unknown };
    if (typeof session.id !== "string" || typeof session.url !== "string" ||
      !session.url.startsWith("https://checkout.stripe.com/"))
      throw new Error("Invalid Stripe Checkout session");
    sessionId = session.id;
    const result = await db.from("orders")
      .update({ stripe_checkout_session_id: sessionId })
      .eq("id", order.order_id).eq("status","PENDING_PAYMENT")
      .select("id").maybeSingle();
    if (result.error || !result.data) throw new Error("Could not persist Checkout session");
    return session.url;
  } catch (reason) {
    console.error("[checkout] session error", reason instanceof Error ? reason.message : "unknown");
    if (sessionId) {
      // Never free capacity while a live Stripe session might still charge.
      try { await postStripe("checkout/sessions/" + encodeURIComponent(sessionId) + "/expire", new URLSearchParams()); }
      catch { throw new Error("Paiement indisponible; contactez le soutien."); }
    }
    await db.rpc("cancel_checkout_order", { _order_id: order.order_id, _stripe_session: sessionId });
    throw new Error("Impossible de préparer le paiement.");
  }
}
type StripeSession = {
  id: string; client_reference_id: string | null;
  metadata?: { order_id?: string };
  payment_intent?: string | null; amount_total?: number | null;
  currency?: string | null; payment_status?: string;
};
export async function settleCheckout(
  kind: "paid" | "cancel", session: StripeSession, eventId: string,
): Promise<void> {
  if (!fulfillmentConfigured()) throw new Error("Fulfillment unavailable");
  const orderId = session.metadata?.order_id;
  if (!orderId || orderId !== session.client_reference_id) throw new Error("Order mismatch");
  const db = database();
  if (kind === "cancel") {
    const { error } = await db.rpc("cancel_checkout_order", {
      _order_id: orderId, _stripe_session: session.id,
    });
    if (error) throw error;
    return;
  }
  if (session.payment_status !== "paid" || session.currency?.toLowerCase() !== "cad" ||
    !Number.isSafeInteger(session.amount_total) || !session.payment_intent)
    throw new Error("Payment not settled");
  const { error } = await db.rpc("finalize_checkout_order", {
    _order_id: orderId, _stripe_session: session.id,
    _payment_intent: session.payment_intent,
    _stripe_event: eventId, _paid_amount: session.amount_total,
  });
  if (error) {
    console.error("[checkout] fulfillment failed", error.code);
    throw new Error("Fulfillment failed");
  }
}


/** Email only issued QR tickets. Webhook retries recover a failed send. */
export async function deliverOrderTickets(orderId: string): Promise<void> {
  if (!fulfillmentConfigured()) throw new Error("Ticket email not configured");
  const db = database();
  const { data: order, error: orderError } = await db.from("orders")
    .select("order_number,customer_email,status,tickets_emailed_at")
    .eq("id", orderId).maybeSingle();
  if (orderError || !order || order.status !== "PAID") throw new Error("Order not paid");
  if (order.tickets_emailed_at) return;
  const { data: tickets, error: ticketError } = await db.from("tickets")
    .select("id,qr_token,name_snapshot,ticket_type_code")
    .eq("order_id", orderId).order("id");
  if (ticketError || !tickets || tickets.length === 0) throw new Error("Missing tickets");

  const escaped = (raw: string) => raw.replace(/[&<>"']/g, ch => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[ch] ?? ch));
  const attachments: { filename: string; content: string }[] = [];
  const rows: string[] = [];
  for (const [index,ticket] of tickets.entries()) {
    const encoded = await QRCode.toDataURL(ticket.qr_token, { width: 320, margin: 2 });
    const base64 = encoded.split(",")[1];
    if (!base64) throw new Error("QR rendering failed");
    const filename = "festiice-billet-" + (index+1) + ".png";
    attachments.push({ filename, content: base64 });
    rows.push("<li>" + escaped(ticket.name_snapshot) + " — QR en pièce jointe " +
      String(index + 1) + "<br/><code>" + escaped(ticket.qr_token) + "</code></li>");
  }
  const html = "<html><body><h1>Vos billets FESTI-ICE</h1>" +
    "<p>Votre paiement est confirmé. Numéro de commande : <strong>" +
    escaped(order.order_number) + "</strong>.</p>" +
    "<p>Présentez chaque code QR à l'entrée (une seule entrée par billet). " +
    "Gardez ces codes confidentiels.</p><ol>" + rows.join("") + "</ol>" +
    "<p>Renseignements : info@festi-ice.ca</p></body></html>";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + process.env["RESEND_API_KEY"]!,
      "Content-Type": "application/json",
      "Idempotency-Key": "festiice-tickets-" + orderId,
    },
    body: JSON.stringify({
      from: process.env["FESTIICE_TICKET_FROM_EMAIL"],
      to: [order.customer_email],
      subject: "Vos billets FESTI-ICE — " + order.order_number,
      html, attachments,
    }),
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    console.error("[checkout] email delivery rejected", response.status);
    throw new Error("Ticket delivery failed");
  }
  const { error: updateError } = await db.from("orders")
    .update({ tickets_emailed_at: new Date().toISOString() })
    .eq("id", orderId).eq("status", "PAID");
  if (updateError) throw new Error("Email delivery receipt not persisted");
}


/** One privileged query for publicly published sessions; no customer data. */
export async function getPublishedRemainingCapacity(): Promise<Map<string, number>> {
  const env = process.env;
  const ref = env["FESTIICE_APPROVED_SUPABASE_PROJECT_REF"];
  if (!ref || env["SUPABASE_URL"] !== "https://" + ref + ".supabase.co" ||
    !env["SUPABASE_SERVICE_ROLE_KEY"]) return new Map();
  try {
    const { data, error } = await database().rpc("published_slot_capacity");
    if (error || !Array.isArray(data)) {
      console.error("[ticketing] capacity query unavailable", error?.code);
      return new Map();
    }
    const result = new Map<string, number>();
    for (const row of data) {
      if (row && typeof row.slot_id === "string" && Number.isSafeInteger(row.remaining))
        result.set(row.slot_id, Math.max(0,row.remaining));
    }
    return result;
  } catch {
    return new Map();
  }
}

/**
 * Reflect ONLY a full Stripe refund that has already occurred. This never
 * initiates a refund; the DB transaction revokes tickets and preserves audit.
 */
export async function recordFullRefund(
  paymentIntent: string, eventId: string, amountCents: number,
): Promise<void> {
  if (!paymentProcessingConfigured()) throw new Error("Refund reconciliation unavailable");
  if (!paymentIntent.startsWith("pi_") || !eventId.startsWith("evt_") ||
      !Number.isSafeInteger(amountCents) || amountCents <= 0)
    throw new Error("Invalid refund event");
  const { error } = await database().rpc("record_full_refund", {
    _payment_intent: paymentIntent,
    _stripe_event: eventId,
    _refunded_amount: amountCents,
  });
  if (error) {
    console.error("[refund] DB reconciliation failed", error.code);
    throw new Error("Refund reconciliation pending");
  }
}
