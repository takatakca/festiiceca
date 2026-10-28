import { createFileRoute } from "@tanstack/react-router";
import { authorizeTicketEmailRecovery } from "@/lib/ticket-email-recovery";

/** Invoke only from an approved private scheduler; no public or auto cron. */
export const Route = createFileRoute("/api/cron/recover-tickets")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        if(process.env["FESTIICE_DELIVERY_RECOVERY_ENABLED"]!=="true")
          return new Response("Recovery disabled",{status:503});
        const secret=process.env["FESTIICE_DELIVERY_RECOVERY_SECRET"];
        if(!secret||secret.length<32)
          return new Response("Recovery not configured",{status:503});
        if(!authorizeTicketEmailRecovery(request.headers.get("authorization"),secret))
          return new Response("Unauthorized",{status:401});
        try {
          const { fulfillmentConfigured }=await import("@/lib/payment-readiness");
          if(!fulfillmentConfigured())
            return new Response("Delivery unavailable",{status:503});
          const { recoverPendingTicketEmails }=await import("@/lib/checkout.server");
          const result=await recoverPendingTicketEmails();
          return Response.json(result,{
            status:result.failures?503:200,
            headers:{"Cache-Control":"no-store","X-Content-Type-Options":"nosniff"},
          });
        } catch {
          console.error("[ticket-recovery] infrastructure unavailable");
          return new Response("Recovery unavailable",{status:503});
        }
      },
    },
  },
});
