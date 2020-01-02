START TRANSACTION;

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
VALUES (2, TRUE);

COMMIT
