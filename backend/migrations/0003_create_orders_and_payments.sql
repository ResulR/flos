CREATE TABLE orders (
  id bigserial PRIMARY KEY,
  customer_first_name text NOT NULL,
  customer_last_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  fulfillment_method text NOT NULL
    CHECK (fulfillment_method IN ('delivery', 'pickup')),
  delivery_address_line1 text,
  delivery_address_line2 text,
  delivery_postal_code text,
  delivery_city text,
  delivery_country text,
  status text NOT NULL DEFAULT 'pending_payment'
    CHECK (
      status IN (
        'pending_payment',
        'payment_failed',
        'payment_expired',
        'confirmed',
        'preparing',
        'shipped',
        'completed',
        'ready',
        'picked_up',
        'cancelled'
      )
    ),
  payment_status text NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'paid', 'failed', 'expired')),
  subtotal_cents bigint NOT NULL CHECK (subtotal_cents >= 0),
  delivery_fee_cents bigint NOT NULL DEFAULT 0
    CHECK (delivery_fee_cents >= 0),
  total_cents bigint NOT NULL CHECK (total_cents >= 0),
  currency text NOT NULL DEFAULT 'EUR'
    CHECK (currency = 'EUR'),
  public_tracking_token_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (total_cents = subtotal_cents + delivery_fee_cents),
  CHECK (
    fulfillment_method <> 'delivery'
    OR (
      delivery_address_line1 IS NOT NULL
      AND delivery_postal_code IS NOT NULL
      AND delivery_city IS NOT NULL
      AND delivery_country IS NOT NULL
    )
  )
);

CREATE TABLE order_items (
  id bigserial PRIMARY KEY,
  order_id bigint NOT NULL REFERENCES orders(id),
  product_id bigint NOT NULL REFERENCES products(id),
  product_name text NOT NULL,
  unit_price_cents bigint NOT NULL CHECK (unit_price_cents >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, product_id)
);

CREATE TABLE payments (
  id bigserial PRIMARY KEY,
  order_id bigint NOT NULL REFERENCES orders(id),
  provider text NOT NULL DEFAULT 'stripe'
    CHECK (provider = 'stripe'),
  stripe_checkout_session_id text NOT NULL UNIQUE,
  stripe_payment_intent_id text UNIQUE,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'failed', 'expired')),
  amount_cents bigint NOT NULL CHECK (amount_cents >= 0),
  currency text NOT NULL DEFAULT 'EUR'
    CHECK (currency = 'EUR'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE stripe_webhook_events (
  id bigserial PRIMARY KEY,
  stripe_event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_orders_status
  ON orders (status);

CREATE INDEX idx_order_items_order_id
  ON order_items (order_id);

CREATE INDEX idx_payments_order_id
  ON payments (order_id);
