CREATE TABLE reservations (
  id bigserial PRIMARY KEY,
  product_id bigint NOT NULL REFERENCES products(id),
  customer_first_name text NOT NULL,
  customer_last_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'cancelled', 'expired', 'converted')),
  cancel_token_hash text NOT NULL UNIQUE,
  purchase_token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  cancelled_at timestamptz,
  converted_at timestamptz,
  CHECK (cancel_token_hash <> purchase_token_hash),
  CHECK (expires_at >= starts_at + interval '1 day'),
  CHECK (expires_at <= starts_at + interval '3 days')
);

CREATE UNIQUE INDEX idx_reservations_one_active_per_product
  ON reservations (product_id)
  WHERE status = 'active';

CREATE INDEX idx_reservations_status
  ON reservations (status);

CREATE INDEX idx_reservations_active_expires_at
  ON reservations (expires_at)
  WHERE status = 'active';
