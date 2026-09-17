CREATE TABLE site_settings (
  id smallint PRIMARY KEY DEFAULT 1
    CHECK (id = 1),
  contact_phone text,
  contact_email text,
  contact_address text,
  delivery_fee_cents bigint NOT NULL DEFAULT 0
    CHECK (delivery_fee_cents >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO site_settings (
  id,
  contact_phone,
  contact_email,
  contact_address,
  delivery_fee_cents
)
VALUES (
  1,
  NULL,
  NULL,
  NULL,
  0
);
