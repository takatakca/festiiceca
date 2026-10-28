/**
 * Do not release inventory if Stripe may have created a payable session.
 * Even a successful HTTP expiration request must return the correct object,
 * session ID and explicit 'expired' status before cancellation is allowed.
 */
export function isVerifiedStripeExpiration(result: unknown, sessionId: string): boolean {
  if (!result || typeof result !== "object" || !sessionId.startsWith("cs_"))
    return false;
  const value = result as { id?: unknown; status?: unknown };
  return value.id === sessionId && value.status === "expired";
}
export function canReleaseCheckoutHold(
  stripeCreateAttempted: boolean,
  stripeExpirationVerified: boolean,
): boolean {
  return !stripeCreateAttempted || stripeExpirationVerified;
}
