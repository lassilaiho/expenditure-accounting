package api

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/lassilaiho/expenditure-accounting/server/db"
)

func AddTags(w http.ResponseWriter, r *http.Request) {
	session, err := Config.DB.ValidateSession(r)
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
		Tags []*db.Tag `json:"tags"`
	}
	responseData.Tags, err = Config.DB.InsertTags(
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
