import assert from "node:assert/strict";
import test from "node:test";
import {canReleaseCheckoutHold,isVerifiedStripeExpiration} from "../src/lib/checkout-compensation.ts";
test("before Stripe create attempt, abandoned hold may be released",()=>{
  assert.equal(canReleaseCheckoutHold(false,false),true);
});
test("ambiguous Stripe create response retains the hold",()=>{
  assert.equal(canReleaseCheckoutHold(true,false),false);
});
test("verified Stripe expiration permits compensation",()=>{
  const id="cs_test_123";
  assert.equal(isVerifiedStripeExpiration({id,status:"expired"},id),true);
  assert.equal(canReleaseCheckoutHold(true,isVerifiedStripeExpiration({id,status:"expired"},id)),true);
});
test("never release after a 2xx response with wrong status/session",()=>{
  const id="cs_test_123";
  assert.equal(isVerifiedStripeExpiration({id,status:"open"},id),false);
  assert.equal(isVerifiedStripeExpiration({id:"cs_other",status:"expired"},id),false);
  assert.equal(isVerifiedStripeExpiration({status:"expired"},id),false);
  assert.equal(isVerifiedStripeExpiration(null,id),false);
  assert.equal(isVerifiedStripeExpiration({id,status:"expired"},"bad"),false);
});
