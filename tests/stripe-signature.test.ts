import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { verifyStripeSignature } from "../src/lib/stripe-signature.ts";

const secret = "whsec_test_replay_secret";
const payload = JSON.stringify({ id: "evt_123", type: "checkout.session.completed" });
const now = 1792160000;
const sign = (body: string, timestamp: number) =>
  createHmac("sha256", secret).update(timestamp + "." + body).digest("hex");
const header = (body = payload, timestamp = now) =>
  "t=" + timestamp + ",v1=" + sign(body, timestamp);

test("accepts correctly signed raw payload and within tolerance", () => {
  assert.equal(verifyStripeSignature(payload, header(), secret, now), true);
  assert.equal(verifyStripeSignature(payload, header(payload, now - 300), secret, now), true);
  assert.equal(verifyStripeSignature(payload, header(payload, now + 300), secret, now), true);
});

test("refuses tampering and incorrect webhook secrets", () => {
  assert.equal(verifyStripeSignature(payload + " ", header(), secret, now), false);
  assert.equal(verifyStripeSignature(payload, header(), "whsec_different", now), false);
  assert.equal(verifyStripeSignature(payload, header(), "not-secret", now), false);
});

test("rejects future and expired events", () => {
  assert.equal(verifyStripeSignature(payload, header(payload, now - 301), secret, now), false);
  assert.equal(verifyStripeSignature(payload, header(payload, now + 301), secret, now), false);
});

test("ignores unrelated signature versions and accepts one correct v1 among several", () => {
  assert.equal(verifyStripeSignature(payload, "v0=wrong," + header(), secret, now), true);
  assert.equal(verifyStripeSignature(payload, header() + ",v1=" + "0".repeat(64), secret, now), true);
});

test("rejects malformed headers, duplicate timestamps and bad hashes", () => {
  for (const h of [
    null, "", "t=xx,v1=" + sign(payload, now),
    "t=" + now + ",t=" + now + ",v1=" + sign(payload, now),
    "t=" + now + ",v1=nothex",
    "t=" + now, "v1=" + sign(payload, now), "noequals",
  ]) {
    assert.equal(verifyStripeSignature(payload, h, secret, now), false);
  }
});

test("rejects oversized request body, no secret and too many v1 digests", () => {
  assert.equal(verifyStripeSignature("x".repeat(65537), header(), secret, now), false);
  assert.equal(verifyStripeSignature(payload, header(), "", now), false);
  assert.equal(verifyStripeSignature(
    payload, header() + (",v1=" + sign(payload, now)).repeat(11), secret, now,
  ), false);
});
