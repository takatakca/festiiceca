import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verify the unmodified request body against Stripe's v1 HMAC signature.
 * A time bound reduces replay risk. Compare fixed-size binary digests in
 * constant time and ignore unrelated legacy signature versions.
 */
export function verifyStripeSignature(
  payload: string,
  header: string | null,
  secret: string,
  nowSeconds = Math.floor(Date.now() / 1000),
): boolean {
  if (!header || !secret || !secret.startsWith("whsec_") || payload.length > 65536)
    return false;
  const signatures: string[] = [];
  const timestamps: string[] = [];
  for (const part of header.split(",")) {
    const i = part.indexOf("=");
    if (i < 0) return false;
    const field = part.slice(0, i).trim();
    const value = part.slice(i + 1).trim();
    if (field === "t") timestamps.push(value);
    if (field === "v1") signatures.push(value);
  }
  if (timestamps.length !== 1 || signatures.length === 0 || signatures.length > 10)
    return false;
  const timestamp = timestamps[0]!;
  if (!/^[0-9]{1,12}$/.test(timestamp)) return false;
  const issued = Number(timestamp);
  if (!Number.isSafeInteger(issued) || Math.abs(nowSeconds - issued) > 300)
    return false;
  const expected = createHmac("sha256", secret)
    .update(timestamp + "." + payload)
    .digest();
  return signatures.some((signature) => {
    if (!/^[a-f0-9]{64}$/i.test(signature)) return false;
    const candidate = Buffer.from(signature, "hex");
    return candidate.length === expected.length && timingSafeEqual(candidate, expected);
  });
}
