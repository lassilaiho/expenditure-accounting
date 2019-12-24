package api

import (
	"context"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
)

var (
	errNoRowsUpdated = errors.New("no rows were updated")
)

type purchase struct {
	ID       int64     `json:"id"`
	Product  product   `json:"product"`
	Date     time.Time `json:"date"`
	Quantity float64   `json:"quantity"`
	Price    float64   `json:"price"`
	Tags     []*tag    `json:"tags"`
}

func getPurchasesByAccount(ctx context.Context, accountID int64) ([]*purchase, error) {
	rows, err := Config.DB.QueryContext(
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
ORDER BY purchases.date DESC, products.name ASC`,
		accountID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := []*purchase{}
	for rows.Next() {
		p := &purchase{}
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

func GetPurchases(w http.ResponseWriter, r *http.Request) {
	session, err := validateSession(r)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	var respData struct {
		Purchases []*purchase `json:"purchases"`
	}
	respData.Purchases, err =
		getPurchasesByAccount(r.Context(), session.AccountID)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	tagsByPurchase, err :=
		getTagsByPurchaseForAccount(r.Context(), session.AccountID)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	for _, p := range respData.Purchases {
		tags := tagsByPurchase[p.ID]
		if tags == nil {
			p.Tags = []*tag{}
		} else {
			p.Tags = tags
		}
	}
	if err = json.NewEncoder(w).Encode(&respData); err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}

func updatePurchaseById(ctx context.Context, purchaseID, accountID int64, update *purchaseUpdate) error {
	tx, err := Config.DB.BeginTx(ctx, nil)
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
			return errNoRowsUpdated
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

type purchaseUpdate struct {
	Product  *int64     `json:"product"`
	Date     *time.Time `json:"date"`
	Quantity *float64   `json:"quantity"`
	Price    *float64   `json:"price"`
	Tags     []int64    `json:"tags"`
}

func UpdatePurchase(w http.ResponseWriter, r *http.Request) {
	session, err := validateSession(r)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	vars := mux.Vars(r)
	idStr := vars["id"]
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusNotFound)
		return
	}
	var values purchaseUpdate
	if err = json.NewDecoder(r.Body).Decode(&values); err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	err = updatePurchaseById(r.Context(), id, session.AccountID, &values)
	if err != nil {
		if err == errNoRowsUpdated {
			w.WriteHeader(http.StatusNotFound)
		} else {
			log.Print(err)
			w.WriteHeader(http.StatusInternalServerError)
		}
		return
	}
}
