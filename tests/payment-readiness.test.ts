import assert from "node:assert/strict";
import test from "node:test";
import {
  fulfillmentConfigured,
  paymentConfigured,
  type CheckoutEnvironment,
} from "../src/lib/payment-readiness.ts";

const base: CheckoutEnvironment = {
  FESTIICE_APPROVED_SUPABASE_PROJECT_REF: "abcdefghijklmnopqrst",
  SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-only",
  SUPABASE_PUBLISHABLE_KEY: "publishable",
  FESTIICE_CANONICAL_ORIGIN: "https://festiice.ca",
  STRIPE_SECRET_KEY: "sk_test_example",
  STRIPE_WEBHOOK_SECRET: "whsec_example",
  FESTIICE_PAYMENT_MODE: "test",
  RESEND_API_KEY: "re_example",
  FESTIICE_TICKET_FROM_EMAIL: "billets@festiice.ca",
  FESTIICE_CHECKOUT_ENABLED: "true",
};

test("valid approved test environment enables checkout and fulfillment", () => {
  assert.equal(paymentConfigured(base), true);
  assert.equal(fulfillmentConfigured(base), true);
});

test("paused sales still process paid-session notifications", () => {
  const env = { ...base, FESTIICE_CHECKOUT_ENABLED: "false" };
  assert.equal(paymentConfigured(env), false);
  assert.equal(fulfillmentConfigured(env), true);
});

test("unapproved and wrong Supabase project fail closed", () => {
  assert.equal(fulfillmentConfigured({ ...base, FESTIICE_APPROVED_SUPABASE_PROJECT_REF: undefined }), false);
  assert.equal(fulfillmentConfigured({ ...base, SUPABASE_URL: "https://other.supabase.co" }), false);
});

test("missing webhook or ticket email service fails closed", () => {
  assert.equal(fulfillmentConfigured({ ...base, STRIPE_WEBHOOK_SECRET: undefined }), false);
  assert.equal(fulfillmentConfigured({ ...base, RESEND_API_KEY: undefined }), false);
  assert.equal(fulfillmentConfigured({ ...base, FESTIICE_TICKET_FROM_EMAIL: "not-email" }), false);
});

test("Stripe test/live mismatch fails closed", () => {
  assert.equal(fulfillmentConfigured({ ...base, FESTIICE_PAYMENT_MODE: "live" }), false);
  assert.equal(fulfillmentConfigured({ ...base, STRIPE_SECRET_KEY: "sk_live_example" }), false);
  const live = { ...base, STRIPE_SECRET_KEY: "sk_live_example", FESTIICE_PAYMENT_MODE: "live" };
  assert.equal(fulfillmentConfigured(live), true);
});

test("invalid origins cannot activate checkout", () => {
  assert.equal(paymentConfigured({ ...base, FESTIICE_CANONICAL_ORIGIN: "http://festiice.ca" }), false);
  assert.equal(paymentConfigured({ ...base, FESTIICE_CANONICAL_ORIGIN: "https://festiice.ca/path" }), false);
  assert.equal(paymentConfigured({ ...base, FESTIICE_CANONICAL_ORIGIN: "https://festiice.ca?x=1" }), false);
});
