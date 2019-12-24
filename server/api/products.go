package api

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
)

type product struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}

func insertProduct(ctx context.Context, accountID int64, name string) (*product, error) {
	query := `
INSERT INTO products (name, account_id)
VALUES ($1, $2)
RETURNING id`
	product := &product{Name: name}
	err := Config.DB.QueryRowContext(ctx, query, name, accountID).
		Scan(&product.ID)
	if err != nil {
		return nil, err
	}
	return product, nil
}

func AddProduct(w http.ResponseWriter, r *http.Request) {
	session, err := validateSession(r)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	var requestData struct {
		Name string `json:"name"`
	}
	if err = json.NewDecoder(r.Body).Decode(&requestData); err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	product, err := insertProduct(r.Context(), session.AccountID, requestData.Name)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	if err = json.NewEncoder(w).Encode(product); err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}
