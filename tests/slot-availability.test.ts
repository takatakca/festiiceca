import assert from "node:assert/strict";
import test from "node:test";
import { isBookableSession } from "../src/lib/slot-availability.ts";

const cutoff = "2026-10-16 15:35:00";
test("rejects elapsed and imminent Montréal sessions", () => {
  assert.equal(isBookableSession("2026-10-16","13:00:00",cutoff),false);
  assert.equal(isBookableSession("2026-10-16","15:34:59",cutoff),false);
  assert.equal(isBookableSession("2026-10-16","15:35:00",cutoff),false);
});
test("keeps future slots in correct ISO date order", () => {
  assert.equal(isBookableSession("2026-10-16","15:35:01",cutoff),true);
  assert.equal(isBookableSession("2026-10-16","18:00:00",cutoff),true);
  assert.equal(isBookableSession("2026-10-17","00:00:00",cutoff),true);
  assert.equal(isBookableSession("2026-10-15","23:59:59",cutoff),false);
});
test("fails closed on malformed or missing dates and time", () => {
  assert.equal(isBookableSession("Oct-16-2026","18:00:00",cutoff),false);
  assert.equal(isBookableSession("2026-10-16","18:00",cutoff),false);
  assert.equal(isBookableSession("2026-10-16","18:00:00","10/16/2026"),false);
});
