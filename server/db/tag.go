package db

import "context"

type Tag struct {
	ID   int64  `json:"id"`
	Name string `json:"name"`
}

func (api *API) GetTagsByPurchaseForAccount(ctx context.Context, accountID int64) (map[int64][]*Tag, error) {
	rows, err := api.DB.QueryContext(
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
	AND purchases.account_id = $1
	AND NOT purchases.deleted
	AND NOT tags.deleted
	AND NOT purchase_tag.deleted`,
		accountID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	allTags := map[int64]*Tag{}
	purchaseTags := map[int64][]*Tag{}
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
			t = &Tag{tagID, tagName}
			allTags[tagID] = t
		}
		tags := purchaseTags[purchaseID]
		if tags == nil {
			tags = make([]*Tag, 0, 1)
		}
		purchaseTags[purchaseID] = append(tags, t)
	}
	if err = rows.Err(); err != nil {
		return nil, err
	}
	return purchaseTags, nil
}

func (api *API) InsertTags(ctx context.Context, accountID int64, newTags []string) ([]*Tag, error) {
	builder := insertQuery("tags", "name", "account_id")
	for _, tag := range newTags {
		builder.Values(tag, accountID)
	}
	query, params := builder.Returning("id").Build()
	rows, err := api.DB.QueryContext(ctx, query, params...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	tags := []*Tag{}
	for i := 0; rows.Next(); i++ {
		tag := &Tag{Name: newTags[i]}
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
