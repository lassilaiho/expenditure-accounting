package api

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"time"
)

type product struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}

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
