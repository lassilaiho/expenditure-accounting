package db

import "context"

type Product struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}

func (api *API) InsertProduct(ctx context.Context, accountID int64, name string) (*Product, error) {
	query := `
INSERT INTO products (name, account_id)
VALUES ($1, $2)
RETURNING id`
	product := &Product{Name: name}
	err := api.DB.QueryRowContext(ctx, query, name, accountID).
		Scan(&product.ID)
	if err != nil {
		return nil, err
	}
	return product, nil
}
