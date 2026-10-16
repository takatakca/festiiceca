/**
 * Filter stale slots from the public catalogue (server-authoritative checkout
 * independently validates the real instant with PostgreSQL's Montréal zone).
 * Input and cutoff are strictly lexically sortable local YYYY-MM-DD HH:mm:ss.
 */
export function isBookableSession(
  eventDate: string,
  slotTime: string,
  minimumLocal: string,
): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDate) ||
      !/^\d{2}:\d{2}:\d{2}/.test(slotTime) ||
      !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(minimumLocal))
    return false;
  return eventDate + " " + slotTime.slice(0, 8) > minimumLocal;
}
