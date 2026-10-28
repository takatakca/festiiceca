import { createHash, timingSafeEqual } from "node:crypto";

/** Leave a one-hour buffer below Resend's 24-hour idempotency expiry. */
const MAX_AGE_MS = 23*60*60*1000;
const MIN_RECOVERY_AGE_MS = 2*60*1000;
export function isWithinAutomaticEmailRetryWindow(paidAt:string|null|undefined,now=Date.now()):boolean {
  if(!paidAt) return false;
  const age=now-Date.parse(paidAt);
  return Number.isFinite(age)&&age>=0&&age<MAX_AGE_MS;
}
export function recoveryWindow(now=Date.now()){
  return {
    earliest:new Date(now-MAX_AGE_MS).toISOString(),
    latest:new Date(now-MIN_RECOVERY_AGE_MS).toISOString(),
  };
}
export function authorizeTicketEmailRecovery(header:string|null,secret:string|undefined):boolean {
  if(!secret||secret.length<32||secret.length>256||!header||header.length>320) return false;
  const token=/^Bearer ([^\s,]+)$/.exec(header)?.[1];
  if(!token) return false;
  const digest=(v:string)=>createHash("sha256").update(v).digest();
  return timingSafeEqual(digest(token),digest(secret));
}
