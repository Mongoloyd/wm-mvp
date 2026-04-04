ALTER TABLE analyses 
ADD COLUMN IF NOT EXISTS price_fairness TEXT,
ADD COLUMN IF NOT EXISTS markup_estimate TEXT,
ADD COLUMN IF NOT EXISTS negotiation_leverage TEXT;