CREATE TABLE IF NOT EXISTS accounts (
    id SERIAL PRIMARY KEY,
    email text NOT NULL,
    password_hash text NOT NULL,
    role varchar(5) NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
    id SERIAL PRIMARY KEY,
    token varchar(64) NOT NULL UNIQUE,
    expiry_time timestamp NOT NULL,
    account_id integer NOT NULL REFERENCES accounts ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name text NOT NULL,
    account_id integer NOT NULL REFERENCES accounts ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name text NOT NULL,
    account_id integer NOT NULL REFERENCES accounts ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS purchases (
    id SERIAL PRIMARY KEY,
    date date NOT NULL,
    product_id integer NOT NULL REFERENCES products,
    quantity numeric NOT NULL CHECK (quantity > 0),
    price numeric NOT NULL CHECK (price > 0),
    total_price numeric GENERATED ALWAYS AS (quantity * price) STORED,
    account_id integer NOT NULL REFERENCES accounts ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS purchase_tag (
    id SERIAL PRIMARY KEY,
    purchase_id integer NOT NULL REFERENCES purchases ON DELETE CASCADE,
    tag_id integer NOT NULL REFERENCES tags ON DELETE CASCADE
);
