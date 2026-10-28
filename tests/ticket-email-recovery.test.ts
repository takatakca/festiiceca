import assert from "node:assert/strict";
import test from "node:test";
import {authorizeTicketEmailRecovery,isWithinAutomaticEmailRetryWindow,recoveryWindow} from "../src/lib/ticket-email-recovery.ts";
const now=Date.parse("2026-10-28T17:00:00Z");
const age=(hours:number)=>new Date(now-hours*3600000).toISOString();
test("only paid orders under 23h can be automatically retried",()=>{
  assert.equal(isWithinAutomaticEmailRetryWindow(age(0.1),now),true);
  assert.equal(isWithinAutomaticEmailRetryWindow(age(22.9),now),true);
  assert.equal(isWithinAutomaticEmailRetryWindow(age(23),now),false);
  assert.equal(isWithinAutomaticEmailRetryWindow(age(24),now),false);
  assert.equal(isWithinAutomaticEmailRetryWindow(new Date(now+1000).toISOString(),now),false);
  assert.equal(isWithinAutomaticEmailRetryWindow(null,now),false);
  assert.equal(isWithinAutomaticEmailRetryWindow("invalid",now),false);
});
test("cron waits two minutes and rejects orders older than 23h",()=>{
  assert.deepEqual(recoveryWindow(now),{
    earliest:age(23),latest:new Date(now-120000).toISOString(),
  });
});
test("private recovery secret requires valid 32+ character bearer token",()=>{
  const secret="k".repeat(40);
  assert.equal(authorizeTicketEmailRecovery("Bearer "+secret,secret),true);
  assert.equal(authorizeTicketEmailRecovery("Bearer "+"a".repeat(40),secret),false);
  assert.equal(authorizeTicketEmailRecovery("Basic "+secret,secret),false);
  assert.equal(authorizeTicketEmailRecovery(null,secret),false);
  assert.equal(authorizeTicketEmailRecovery("Bearer "+secret,"short"),false);
  assert.equal(authorizeTicketEmailRecovery("Bearer "+"a".repeat(400),secret),false);
});
