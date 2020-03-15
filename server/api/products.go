package api

import (
	"encoding/json"
	"log"
	"net/http"
)

func AddProduct(w http.ResponseWriter, r *http.Request) {
	session, err := Config.DB.ValidateSession(r)
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
	product, err := Config.DB.InsertProduct(r.Context(), session.AccountID, requestData.Name)
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
