package api

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/lassilaiho/expenditure-accounting/server/db"
)

func (api *API) AddTags(w http.ResponseWriter, r *http.Request) {
	var requestData struct {
		Tags []string `json:"tags"`
	}
	if err := json.NewDecoder(r.Body).Decode(&requestData); err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	var err error
	var responseData struct {
		Tags []*db.Tag `json:"tags"`
	}
	responseData.Tags, err = api.DB.InsertTags(
		r.Context(), getSession(r).AccountID, requestData.Tags)
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
