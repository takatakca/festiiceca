import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const CheckoutPayload = z.object({
  slotId: z.string().uuid(),
  items: z.array(z.object({
    code: z.string().min(1).max(40),
    quantity: z.number().int().min(1).max(60),
  }).strict()).min(1).max(12),
  flex: z.boolean(),
  familyAdults: z.number().int().min(0).max(2),
  customer: z.object({
    name: z.string().trim().min(2).max(160),
    email: z.string().trim().email().max(254),
    phone: z.string().max(40),
  }).strict(),
}).strict();

export const Route = createFileRoute("/api/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { paymentConfigured, startCheckout } = await import("@/lib/checkout.server");
        if (!paymentConfigured())
          return Response.json({ error: "La billetterie n'est pas ouverte." }, { status: 503 });
        const allowedOrigin = process.env["FESTIICE_CANONICAL_ORIGIN"];
        if (request.headers.get("origin") !== allowedOrigin ||
          !(request.headers.get("content-type") ?? "").toLowerCase().startsWith("application/json"))
          return Response.json({ error: "Requête invalide" }, { status: 403 });
        if (Number(request.headers.get("content-length") ?? "0") > 8192)
          return Response.json({ error: "Requête trop grande" }, { status: 413 });
        try {
          const body = await request.text();
          if (body.length > 8192)
            return Response.json({ error: "Requête trop grande" }, { status: 413 });
          const parsed = CheckoutPayload.safeParse(JSON.parse(body));
          if (!parsed.success)
            return Response.json({ error: "Choix ou coordonnées invalides" }, { status: 400 });
          const url = await startCheckout(parsed.data);
          return Response.json({ url }, { headers: { "Cache-Control": "no-store" } });
        } catch (error) {
          console.error("[checkout] rejected:", error instanceof Error ? error.message : "unknown");
          return Response.json({ error: "Le paiement est momentanément indisponible." }, { status: 503 });
        }
      },
    },
  },
});
