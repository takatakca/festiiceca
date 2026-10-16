/**
 * Strictly server-side readiness policy. Turning off new checkout must not
 * disable webhooks for customers who have already paid.
 *
 * This has no I/O and is tested independently of Stripe and Supabase.
 */
export type CheckoutEnvironment = Record<string, string | undefined>;

export function paymentProcessingConfigured(env: CheckoutEnvironment = process.env): boolean {
  const ref = env["FESTIICE_APPROVED_SUPABASE_PROJECT_REF"];
  const origin = env["FESTIICE_CANONICAL_ORIGIN"];
  const mode = env["FESTIICE_PAYMENT_MODE"];
  const key = env["STRIPE_SECRET_KEY"];
  if (!ref || !/^[a-z0-9]{20}$/.test(ref) ||
      env["SUPABASE_URL"] !== "https://" + ref + ".supabase.co" ||
      !origin || !/^https:\/\/[^/?#]+$/.test(origin) ||
      !["test", "live"].includes(mode ?? "") ||
      !key || !key.startsWith(mode === "live" ? "sk_live_" : "sk_test_") ||
      !env["SUPABASE_SERVICE_ROLE_KEY"] ||
      !env["SUPABASE_PUBLISHABLE_KEY"] ||
      !env["STRIPE_WEBHOOK_SECRET"]?.startsWith("whsec_")) {
    return false;
  }
  return true;
}

export function fulfillmentConfigured(env: CheckoutEnvironment = process.env): boolean {
  return paymentProcessingConfigured(env) &&
    !!env["RESEND_API_KEY"] && !!env["FESTIICE_TICKET_FROM_EMAIL"] &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env["FESTIICE_TICKET_FROM_EMAIL"]);
}

export function paymentConfigured(env: CheckoutEnvironment = process.env): boolean {
  return env["FESTIICE_CHECKOUT_ENABLED"] === "true" && fulfillmentConfigured(env);
}
