ALTER TABLE trade_ins
ADD COLUMN desired_price_cents bigint
  CHECK (
    desired_price_cents IS NULL
    OR desired_price_cents >= 0
  );
