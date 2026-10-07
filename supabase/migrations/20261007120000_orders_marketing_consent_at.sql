-- CASL / Québec Law 25: proof of consent for FESTI-ICE news and offers.
-- The checkout opt-in box is unticked by default; store the date it was ticked with the order.
-- NULL = no consent. Additive only: no existing column or row is changed.
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS marketing_consent_at timestamptz;

COMMENT ON COLUMN public.orders.marketing_consent_at IS
  'When the buyer ticked "Je souhaite recevoir les nouvelles et offres FESTI-ICE" (NULL = no consent).';
