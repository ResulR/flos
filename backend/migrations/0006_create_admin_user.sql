CREATE TABLE admin_users (
  id smallint PRIMARY KEY DEFAULT 1
    CHECK (id = 1),
  email text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  session_version integer NOT NULL DEFAULT 1
    CHECK (session_version >= 1),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
