package db

import (
	"context"
	"fmt"
	"strconv"
)

const SchemaVersion = 2

var schemaVersionStr = strconv.Itoa(SchemaVersion)

var initDBScript = `
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
    account_id integer NOT NULL REFERENCES accounts ON DELETE CASCADE,
    deleted boolean NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name text NOT NULL,
    account_id integer NOT NULL REFERENCES accounts ON DELETE CASCADE,
    deleted boolean NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS purchases (
    id SERIAL PRIMARY KEY,
    date date NOT NULL,
    product_id integer NOT NULL REFERENCES products,
    quantity numeric NOT NULL CHECK (quantity > 0),
    price numeric NOT NULL CHECK (price > 0),
    total_price numeric GENERATED ALWAYS AS (quantity * price) STORED,
    account_id integer NOT NULL REFERENCES accounts ON DELETE CASCADE,
    deleted boolean NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS purchase_tag (
    id SERIAL PRIMARY KEY,
    purchase_id integer NOT NULL REFERENCES purchases ON DELETE CASCADE,
    tag_id integer NOT NULL REFERENCES tags ON DELETE CASCADE,
    deleted boolean NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS metadata (
    id SERIAL PRIMARY KEY,
    version integer NOT NULL,
    is_current boolean NOT NULL
);

INSERT INTO metadata (version, is_current)
VALUES (` + schemaVersionStr + `, TRUE);`

type migration struct {
	From, To int
}

var migrationScripts = map[migration]string{
	{From: 1, To: 2}: `
ALTER TABLE products
ADD COLUMN deleted boolean NOT NULL DEFAULT FALSE;

ALTER TABLE tags
ADD COLUMN deleted boolean NOT NULL DEFAULT FALSE;

ALTER TABLE purchases
ADD COLUMN deleted boolean NOT NULL DEFAULT FALSE;

ALTER TABLE purchase_tag
ADD COLUMN deleted boolean NOT NULL DEFAULT FALSE;

UPDATE metadata SET is_current = FALSE;
INSERT INTO metadata (version, is_current)
VALUES (` + schemaVersionStr + `, TRUE);`,
}

func (api *API) GetSchemaVersion(ctx context.Context) (version int, err error) {
	query := "SELECT version FROM metadata WHERE is_current = TRUE"
	err = api.DB.QueryRowContext(ctx, query).Scan(&version)
	return
}

func (api *API) InitDB(ctx context.Context) error {
	tx, err := api.DB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	if _, err = tx.ExecContext(ctx, initDBScript); err != nil {
		tx.Rollback()
		return err
	}
	return tx.Commit()
}

func errUnsupportedMigration(from, to int) error {
	return fmt.Errorf(
		"migration from version %d to version %d is not supported",
		from, to)
}

func (api *API) Migrate(ctx context.Context, to int) error {
	from, err := api.GetSchemaVersion(ctx)
	if err != nil {
		return err
	}
	return api.migrate(ctx, from, to)
}

func (api *API) migrate(ctx context.Context, from, to int) error {
	if from == to {
		return nil
	}
	migrations := []string{}
	if from < to {
		for i := from; i < to; i++ {
			migration, ok := migrationScripts[migration{From: i, To: i + 1}]
			if !ok {
				return errUnsupportedMigration(from, to)
			}
			migrations = append(migrations, migration)
		}
	} else {
		for i := from; i > to; i-- {
			migration, ok := migrationScripts[migration{From: i, To: i - 1}]
			if !ok {
				return errUnsupportedMigration(from, to)
			}
			migrations = append(migrations, migration)
		}
	}
	tx, err := api.DB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	for _, migration := range migrations {
		if _, err := tx.ExecContext(ctx, migration); err != nil {
			tx.Rollback()
			return err
		}
	}
	return tx.Commit()
}

func (api *API) AutoMigrate(ctx context.Context, targetVersion int) error {
	currentVersion, err := api.GetSchemaVersion(ctx)
	if err != nil {
		return api.InitDB(ctx)
	}
	if currentVersion == targetVersion {
		return nil
	}
	return api.migrate(ctx, currentVersion, targetVersion)
}
