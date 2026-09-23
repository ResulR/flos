ALTER TABLE orders
ADD COLUMN reservation_id bigint
  REFERENCES reservations(id);

CREATE UNIQUE INDEX idx_orders_unique_reservation
  ON orders (reservation_id)
  WHERE reservation_id IS NOT NULL;
