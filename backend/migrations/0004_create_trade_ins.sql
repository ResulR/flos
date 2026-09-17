CREATE TABLE trade_ins (
  id bigserial PRIMARY KEY,
  customer_first_name text NOT NULL,
  customer_last_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  bike_brand text,
  bike_model text,
  bike_year integer,
  description text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (
      status IN (
        'pending',
        'reviewing',
        'accepted',
        'rejected',
        'closed'
      )
    ),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE trade_in_media (
  id bigserial PRIMARY KEY,
  trade_in_id bigint NOT NULL REFERENCES trade_ins(id),
  file_path text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_trade_ins_status
  ON trade_ins (status);

CREATE INDEX idx_trade_in_media_trade_in_order
  ON trade_in_media (trade_in_id, display_order);
