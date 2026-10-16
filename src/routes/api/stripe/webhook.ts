import { createFileRoute } from "@tanstack/react-router";
import { verifyStripeSignature } from "@/lib/stripe-signature";


export const Route = createFileRoute("/api/stripe/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["STRIPE_WEBHOOK_SECRET"];
        // Turning off new purchases must NEVER discard payment notifications
        // for sessions that customers have already completed.
        const { fulfillmentConfigured } = await import("@/lib/checkout.server");
        if (!secret || !fulfillmentConfigured())
          return new Response("Not configured", { status: 503 });
        if (Number(request.headers.get("content-length") ?? "0") > 65536)
          return new Response("Too large", { status: 413 });
        const raw = await request.text();
        if (raw.length > 65536 ||
          !verifyStripeSignature(raw, request.headers.get("stripe-signature"), secret))
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
          // A full Stripe refund revokes all associated QR tickets. Partial
          // refunds require human assessment; do not void the entire order.
          if (event.type === "charge.refunded") {
            const charge = event.data?.object as (typeof event.data.object & {
              payment_intent?: string | null;
              amount?: number; amount_refunded?: number; refunded?: boolean;
              currency?: string;
            }) | undefined;
            if (!charge || typeof charge.payment_intent !== "string" ||
                charge.currency?.toLowerCase() !== "cad" ||
                !Number.isSafeInteger(charge.amount) ||
                !Number.isSafeInteger(charge.amount_refunded)) {
              console.error("[refund] unrecognized Stripe charge: manual review required");
              return Response.json({ received: true, manualReview: true });
            }
            if (!charge.refunded || charge.amount_refunded !== charge.amount) {
              console.error("[refund] partial refund: manual review required");
              return Response.json({ received: true, manualReview: true });
            }
            const { recordFullRefund } = await import("@/lib/checkout.server");
            await recordFullRefund(charge.payment_intent, event.id, charge.amount);
            return Response.json({ received: true });
          }
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
