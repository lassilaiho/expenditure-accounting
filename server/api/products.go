package api

import (
	"encoding/json"
	"log"
	"net/http"
)

func (api *API) AddProduct(w http.ResponseWriter, r *http.Request) {
	var requestData struct {
		Name string `json:"name"`
	}
	if err := json.NewDecoder(r.Body).Decode(&requestData); err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	product, err := api.DB.InsertProduct(r.Context(), getSession(r).AccountID, requestData.Name)
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
