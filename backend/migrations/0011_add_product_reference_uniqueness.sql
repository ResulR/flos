CREATE UNIQUE INDEX product_brands_name_ci_unique
  ON product_brands (lower(name));

CREATE UNIQUE INDEX bike_types_name_ci_unique
  ON bike_types (lower(name));

CREATE UNIQUE INDEX bike_conditions_name_ci_unique
  ON bike_conditions (lower(name));
