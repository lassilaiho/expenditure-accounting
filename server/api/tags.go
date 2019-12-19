package api

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
)

type tag struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}

func getTagsByProductForAccount(ctx context.Context, accountID int64) (map[int64][]*tag, error) {
	rows, err := Config.DB.QueryContext(
		ctx,
		`
SELECT
	tags.id,
	tags.name,
	products.id
FROM tags, products, product_tag
WHERE
	tags.id = product_tag.tag_id
	AND products.id = product_tag.product_id
	AND tags.account_id = $1
	AND products.account_id = $1`,
		accountID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	allTags := map[int64]*tag{}
	productTags := map[int64][]*tag{}
	for rows.Next() {
		var (
			tagID     int64
			tagName   string
			productID int64
		)
		if err = rows.Scan(&tagID, &tagName, &productID); err != nil {
			return nil, err
		}
		t := allTags[tagID]
		if t == nil {
			t = &tag{tagID, tagName}
			allTags[tagID] = t
		}
		tags := productTags[productID]
		if tags == nil {
			tags = make([]*tag, 0, 1)
		}
		productTags[productID] = append(tags, t)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}
	return productTags, nil
}

func GetTagsByProduct(w http.ResponseWriter, r *http.Request) {
	accountID, err := checkAuthentication(r)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	var respData struct {
		TagsByProduct map[int64][]*tag `json:"tagsByProduct"`
	}
	respData.TagsByProduct, err =
		getTagsByProductForAccount(r.Context(), accountID)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	if err = json.NewEncoder(w).Encode(&respData); err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}
