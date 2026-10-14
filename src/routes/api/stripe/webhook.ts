import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "node:crypto";

function validStripeSignature(payload: string, header: string | null, secret: string): boolean {
  if (!header || !secret) return false;
  const fields = header.split(",").map(piece => piece.trim().split("="));
  const timestamp = fields.find(([key]) => key === "t")?.[1];
  const signatures = fields.filter(([key]) => key === "v1").map(([,value]) => value);
  if (!timestamp || !/^[0-9]+$/.test(timestamp) || signatures.length === 0 ||
    Math.abs(Date.now()/1000 - Number(timestamp)) > 300) return false;
  const expected = Buffer.from(
    createHmac("sha256", secret).update(timestamp + "." + payload).digest("hex"), "hex",
  );
  return signatures.some(signature => {
    if (!signature || !/^[a-f0-9]{64}$/i.test(signature)) return false;
    const provided = Buffer.from(signature, "hex");
    return provided.length === expected.length && timingSafeEqual(provided, expected);
  });
}

export const Route = createFileRoute("/api/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["STRIPE_WEBHOOK_SECRET"];
        if (!secret || process.env["FESTIICE_CHECKOUT_ENABLED"] !== "true")
          return new Response("Not configured", { status: 503 });
        if (Number(request.headers.get("content-length") ?? "0") > 65536)
          return new Response("Too large", { status: 413 });
        const raw = await request.text();
        if (raw.length > 65536 ||
          !validStripeSignature(raw, request.headers.get("stripe-signature"), secret))
          return new Response("Invalid signature", { status: 400 });
        try {
          const event = JSON.parse(raw) as {
            id?: string; type?: string;
            data?: { object?: {
              id?: string; client_reference_id?: string | null;
              metadata?: { order_id?: string };
              payment_intent?: string | null; amount_total?: number | null;
              currency?: string | null; payment_status?: string;
            }};
          };
          if (!event.id || !event.type) return new Response("Invalid event", { status: 400 });
          const types: Record<string, "paid" | "cancel"> = {
            "checkout.session.completed": "paid",
            "checkout.session.async_payment_succeeded": "paid",
            "checkout.session.expired": "cancel",
            "checkout.session.async_payment_failed": "cancel",
          };
          const kind = types[event.type];
          if (!kind) return Response.json({ received: true });
          const obj = event.data?.object;
          if (!obj?.id || !obj.client_reference_id)
            return new Response("Invalid checkout session", { status: 400 });
          if (kind === "paid" && obj.payment_status !== "paid")
            return Response.json({ received: true });
          const { settleCheckout, deliverOrderTickets } = await import("@/lib/checkout.server");
          await settleCheckout(kind, {
            id: obj.id, client_reference_id: obj.client_reference_id,
            metadata: obj.metadata, payment_intent: obj.payment_intent,
            amount_total: obj.amount_total, currency: obj.currency,
            payment_status: obj.payment_status,
          }, event.id);
          if (kind === "paid") {
            if (!obj.metadata?.order_id) throw new Error("Order ID missing");
            await deliverOrderTickets(obj.metadata.order_id);
          }
          return Response.json({ received: true });
        } catch (error) {
          console.error("[stripe-webhook] retry required", error instanceof Error ? error.message : "unknown");
          return new Response("Fulfillment pending", { status: 500 });
        }
      },
    },
  },
});
