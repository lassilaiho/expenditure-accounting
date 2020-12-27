package db

import (
	"context"
	"database/sql"
	"errors"
	"time"
)

type Purchase struct {
	ID       int64     `json:"id"`
	Product  Product   `json:"product"`
	Date     time.Time `json:"date"`
	Quantity string    `json:"quantity"`
	Price    string    `json:"price"`
	Tags     []*Tag    `json:"tags"`
}

func (api *API) GetPurchasesByAccount(ctx context.Context, accountID int64) ([]*Purchase, error) {
	rows, err := api.DB.QueryContext(
		ctx,
		`
SELECT
	purchases.id,
	purchases.date,
	purchases.quantity,
	purchases.price,
	products.id,
	products.name
FROM purchases, products
WHERE
	purchases.account_id = $1
	AND products.account_id = $1
	AND purchases.product_id = products.id
	AND NOT purchases.deleted
	AND NOT products.deleted
ORDER BY purchases.date DESC, products.name ASC`,
		accountID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := []*Purchase{}
	for rows.Next() {
		p := &Purchase{}
		err = rows.Scan(
			&p.ID,
			&p.Date,
			&p.Quantity,
			&p.Price,
			&p.Product.ID,
			&p.Product.Name,
		)
		if err != nil {
			return nil, err
		}
		result = append(result, p)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}
	return result, nil
}

func (api *API) UpdatePurchaseById(ctx context.Context, purchaseID, accountID int64, update *PurchaseUpdate) error {
	tx, err := api.DB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	builder := updateQuery("purchases")
	if update.Product != nil {
		builder.Set("product_id", *update.Product)
	}
	if update.Date != nil {
		builder.Set("date", *update.Date)
	}
	if update.Quantity != nil {
		builder.Set("quantity", *update.Quantity)
	}
	if update.Price != nil {
		builder.Set("price", *update.Price)
	}
	if builder.HasParams() {
		query, params := builder.Where().
			Column("id", purchaseID).
			And().Column("account_id", accountID).
			Build()
		result, err := tx.ExecContext(ctx, query, params...)
		if err != nil {
			tx.Rollback()
			return err
		}
		count, err := result.RowsAffected()
		if err != nil {
			tx.Rollback()
			return err
		}
		if count == 0 {
			tx.Rollback()
			return ErrNoRowsAffected
		}
	}
	if update.Tags != nil && len(update.Tags) > 0 {
		query := `
DELETE FROM purchase_tag
USING purchases
WHERE purchase_tag.purchase_id = $1
AND purchases.account_id = $2
AND purchases.id = purchase_tag.purchase_id`
		_, err := tx.ExecContext(ctx, query, purchaseID, accountID)
		if err != nil {
			tx.Rollback()
			return err
		}
		builder := insertQuery("purchase_tag", "purchase_id", "tag_id")
		for _, tagID := range update.Tags {
			builder.Values(purchaseID, tagID)
		}
		query, params := builder.Build()
		_, err = tx.ExecContext(ctx, query, params...)
		if err != nil {
			tx.Rollback()
			return err
		}
	}
	if err = tx.Commit(); err != nil {
		tx.Rollback()
		return err
	}
	return nil
}

func (api *API) InsertPurchase(ctx context.Context, accountID int64, value *PurchaseUpdate) (int64, error) {
	tx, err := api.DB.BeginTx(ctx, nil)
	if err != nil {
		return -1, err
	}
	query := `
INSERT INTO purchases (product_id, date, quantity, price, account_id)
VALUES ($1, $2, $3, $4, $5)
RETURNING id`
	row := tx.QueryRowContext(
		ctx,
		query,
		value.Product,
		value.Date,
		value.Quantity,
		value.Price,
		accountID)
	var purchaseID int64
	if err := row.Scan(&purchaseID); err != nil {
		tx.Rollback()
		return -1, err
	}
	if len(value.Tags) > 0 {
		builder := insertQuery("purchase_tag", "purchase_id", "tag_id")
		for _, tagID := range value.Tags {
			builder.Values(purchaseID, tagID)
		}
		query, params := builder.Build()
		if _, err := tx.ExecContext(ctx, query, params...); err != nil {
			tx.Rollback()
			return -1, err
		}
	}
	if err = tx.Commit(); err != nil {
		tx.Rollback()
		return -1, err
	}
	return purchaseID, nil
}

type PurchaseRelatedIDs struct {
	ProductID int64
	TagIDs    []int64
}

func (api *API) GetProductAndTagsForPurchase(
	ctx context.Context, tx *sql.Tx, purchaseID, accountID int64,
) (*PurchaseRelatedIDs, error) {
	query := `
SELECT products.id
FROM purchases, products
WHERE
	purchases.account_id = $1
	AND products.account_id = $1
	AND purchases.product_id = products.id
	AND purchases.id = $2
	AND NOT purchases.deleted
	AND NOT products.deleted`
	result := &PurchaseRelatedIDs{-1, []int64{}}
	err := tx.QueryRow(query, accountID, purchaseID).Scan(&result.ProductID)
	if err != nil && err != sql.ErrNoRows {
		return nil, err
	}
	query = `
SELECT tags.id
FROM purchases, tags, purchase_tag
WHERE
	purchases.account_id = $1
	AND tags.account_id = $1
	AND purchases.id = purchase_tag.purchase_id
	AND tags.id = purchase_tag.tag_id
	AND purchases.id = $2
	AND NOT purchases.deleted
	AND NOT tags.deleted
	AND NOT purchase_tag.deleted`
	rows, err := tx.QueryContext(ctx, query, accountID, purchaseID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	for rows.Next() {
		var tagID int64
		if err = rows.Scan(&tagID); err != nil {
			return nil, err
		}
		result.TagIDs = append(result.TagIDs, tagID)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}
	return result, nil
}

func (api *API) DeletePurchaseById(ctx context.Context, purchaseID, accountID int64) error {
	tx, err := api.DB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	ids, err := api.GetProductAndTagsForPurchase(ctx, tx, purchaseID, accountID)
	if err != nil {
		tx.Rollback()
		return err
	}
	query := "UPDATE purchases SET deleted = TRUE WHERE id = $1 AND account_id = $2"
	result, err := tx.ExecContext(ctx, query, purchaseID, accountID)
	if err != nil {
		tx.Rollback()
		return err
	}
	deleteCount, err := result.RowsAffected()
	if err != nil {
		tx.Rollback()
		return err
	}
	if deleteCount == 0 {
		tx.Rollback()
		return ErrNoRowsAffected
	}
	query = `
UPDATE products
SET deleted = TRUE
FROM purchases
WHERE
	products.account_id = $1
	AND purchases.account_id = $1
	AND purchases.product_id = products.id
	AND purchases.id = $2
	AND (
		SELECT COUNT(*) FROM products, purchases
		WHERE
			purchases.product_id = products.id
			AND NOT purchases.deleted
			AND products.id = $3
	) = 0`
	_, err = tx.ExecContext(ctx, query, accountID, purchaseID, ids.ProductID)
	if err != nil {
		tx.Rollback()
		return err
	}
	query = `
UPDATE tags
SET deleted = true
FROM purchase_tag
WHERE
	tags.account_id = $1
	AND tags.id = $2
	AND (
		SELECT count(*) FROM tags, purchase_tag
		WHERE
			purchase_tag.tag_id = tags.id
			AND NOT purchase_tag.deleted
			AND tags.id = $2
	) <= 1`
	for _, tagID := range ids.TagIDs {
		_, err = tx.ExecContext(ctx, query, accountID, tagID)
		if err != nil {
			tx.Rollback()
			return err
		}
	}
	query = `
UPDATE purchase_tag
SET deleted = TRUE
FROM purchases
WHERE
	purchases.id = purchase_tag.purchase_id
	AND purchases.account_id = $1
	AND purchases.id = $2`
	_, err = tx.ExecContext(ctx, query, accountID, purchaseID)
	if err != nil {
		tx.Rollback()
		return err
	}
	if err = tx.Commit(); err != nil {
		tx.Rollback()
		return err
	}
	return nil
}

func (api *API) RestorePurchaseById(ctx context.Context, purchaseID, accountID int64) (*Purchase, error) {
	tx, err := api.DB.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	purchase := &Purchase{ID: purchaseID}
	query := `
UPDATE purchases
SET deleted = FALSE
WHERE id = $1 AND account_id = $2
RETURNING date, product_id, quantity, price`
	err = tx.QueryRowContext(ctx, query, purchaseID, accountID).
		Scan(&purchase.Date, &purchase.Product.ID, &purchase.Quantity, &purchase.Price)
	if err != nil {
		tx.Rollback()
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNoRowsAffected
		}
		return nil, err
	}
	query = `
UPDATE products
SET deleted = FALSE
WHERE account_id = $1 AND id = $2
RETURNING name`
	err = tx.QueryRowContext(ctx, query, accountID, purchase.Product.ID).
		Scan(&purchase.Product.Name)
	if err != nil {
		tx.Rollback()
		return nil, err
	}
	query = `
UPDATE purchase_tag
SET deleted = FALSE
FROM purchases
WHERE
	purchases.id = purchase_tag.purchase_id
	AND purchases.account_id = $1
	AND purchases.id = $2
RETURNING purchase_tag.tag_id`
	rows, err := tx.QueryContext(ctx, query, accountID, purchaseID)
	if err != nil {
		tx.Rollback()
		return nil, err
	}
	defer rows.Close()
	tagIDs := []interface{}{}
	for rows.Next() {
		var tagID int64
		if err = rows.Scan(&tagID); err != nil {
			tx.Rollback()
			return nil, err
		}
		tagIDs = append(tagIDs, tagID)
	}
	if err := rows.Err(); err != nil {
		tx.Rollback()
		return nil, err
	}
	purchase.Tags = make([]*Tag, len(tagIDs))
	if len(tagIDs) > 0 {
		query, args := updateQuery("tags").
			Set("deleted", false).
			Where().
			Column("account_id", accountID).
			And().In("id", tagIDs).
			Returning("name").
			Build()
		rows, err := tx.QueryContext(ctx, query, args...)
		if err != nil {
			tx.Rollback()
			return nil, err
		}
		defer rows.Close()
		for i := 0; rows.Next(); i++ {
			tag := &Tag{ID: tagIDs[i].(int64)}
			if err = rows.Scan(&tag.Name); err != nil {
				tx.Rollback()
				return nil, err
			}
			purchase.Tags[i] = tag
		}
		if err = rows.Err(); err != nil {
			tx.Rollback()
			return nil, err
		}
	}
	if err = tx.Commit(); err != nil {
		tx.Rollback()
		return nil, err
	}
	return purchase, nil
}

type PurchaseUpdate struct {
	Product  *int64     `json:"product"`
	Date     *time.Time `json:"date"`
	Quantity *string    `json:"quantity"`
	Price    *string    `json:"price"`
	Tags     []int64    `json:"tags"`
}
