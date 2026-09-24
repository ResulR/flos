ALTER TABLE trade_ins
ADD COLUMN offered_price_cents bigint
  CHECK (
    offered_price_cents IS NULL
    OR offered_price_cents >= 0
  );
