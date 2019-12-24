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

func getTagsByPurchaseForAccount(ctx context.Context, accountID int64) (map[int64][]*tag, error) {
	rows, err := Config.DB.QueryContext(
		ctx,
		`
SELECT
	tags.id,
	tags.name,
	purchases.id
FROM tags, purchases, purchase_tag
WHERE
	tags.id = purchase_tag.tag_id
	AND purchases.id = purchase_tag.purchase_id
	AND tags.account_id = $1
	AND purchases.account_id = $1`,
		accountID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	allTags := map[int64]*tag{}
	purchaseTags := map[int64][]*tag{}
	for rows.Next() {
		var (
			tagID      int64
			tagName    string
			purchaseID int64
		)
		if err = rows.Scan(&tagID, &tagName, &purchaseID); err != nil {
			return nil, err
		}
		t := allTags[tagID]
		if t == nil {
			t = &tag{tagID, tagName}
			allTags[tagID] = t
		}
		tags := purchaseTags[purchaseID]
		if tags == nil {
			tags = make([]*tag, 0, 1)
		}
		purchaseTags[purchaseID] = append(tags, t)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}
	return purchaseTags, nil
}

func insertTags(ctx context.Context, accountID int64, newTags []string) ([]*tag, error) {
	builder := insertQuery("tags", "name", "account_id")
	for _, tag := range newTags {
		builder.Values(tag, accountID)
	}
	query, params := builder.Returning("id").Build()
	rows, err := Config.DB.QueryContext(ctx, query, params...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	tags := []*tag{}
	for i := 0; rows.Next(); i++ {
		tag := &tag{Name: newTags[i]}
		if err = rows.Scan(&tag.ID); err != nil {
			return nil, err
		}
		tags = append(tags, tag)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}
	return tags, nil
}

func AddTags(w http.ResponseWriter, r *http.Request) {
	session, err := validateSession(r)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	var requestData struct {
		Tags []string `json:"tags"`
	}
	if err = json.NewDecoder(r.Body).Decode(&requestData); err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	var responseData struct {
		Tags []*tag `json:"tags"`
	}
	responseData.Tags, err = insertTags(
		r.Context(), session.AccountID, requestData.Tags)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	if err = json.NewEncoder(w).Encode(&responseData); err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}
