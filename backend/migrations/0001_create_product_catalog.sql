CREATE TABLE product_brands (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE bike_types (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE bike_conditions (
  id bigserial PRIMARY KEY,
  name text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE products (
  id bigserial PRIMARY KEY,
  brand_id bigint NOT NULL REFERENCES product_brands(id),
  bike_type_id bigint NOT NULL REFERENCES bike_types(id),
  condition_id bigint NOT NULL REFERENCES bike_conditions(id),
  model text NOT NULL,
  year integer,
  description text NOT NULL,
  price_cents bigint NOT NULL CHECK (price_cents >= 0),
  status text NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'reserved', 'sold', 'hidden')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE TABLE product_specs (
  id bigserial PRIMARY KEY,
  product_id bigint NOT NULL REFERENCES products(id),
  label text NOT NULL,
  value text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  UNIQUE (product_id, label)
);

CREATE TABLE product_media (
  id bigserial PRIMARY KEY,
  product_id bigint NOT NULL REFERENCES products(id),
  file_path text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_products_brand_id
  ON products (brand_id);

CREATE INDEX idx_products_bike_type_id
  ON products (bike_type_id);

CREATE INDEX idx_products_condition_id
  ON products (condition_id);

CREATE INDEX idx_products_catalog_state
  ON products (status, is_active, deleted_at);

CREATE INDEX idx_product_specs_product_order
  ON product_specs (product_id, display_order);

CREATE INDEX idx_product_media_product_order
  ON product_media (product_id, display_order);
