package api

import (
	"context"
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
