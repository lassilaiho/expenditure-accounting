package api

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/lassilaiho/expenditure-accounting/server/db"
)

func (api *API) GetPurchases(w http.ResponseWriter, r *http.Request) {
	session := getSession(r)
	var err error
	var respData struct {
		Purchases []*db.Purchase `json:"purchases"`
	}
	respData.Purchases, err =
		api.DB.GetPurchasesByAccount(r.Context(), session.AccountID)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	tagsByPurchase, err :=
		api.DB.GetTagsByPurchaseForAccount(r.Context(), session.AccountID)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	for _, p := range respData.Purchases {
		tags := tagsByPurchase[p.ID]
		if tags == nil {
			p.Tags = []*db.Tag{}
		} else {
			p.Tags = tags
		}
	}
	if err = json.NewEncoder(w).Encode(&respData); err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
}

func (api *API) UpdatePurchase(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	idStr := vars["id"]
	id, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusNotFound)
		return
	}
	var values db.PurchaseUpdate
	if err = json.NewDecoder(r.Body).Decode(&values); err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	err = api.DB.UpdatePurchaseById(r.Context(), id, getSession(r).AccountID, &values)
	if err != nil {
		if err == db.ErrNoRowsAffected {
			w.WriteHeader(http.StatusNotFound)
		} else {
			log.Print(err)
			w.WriteHeader(http.StatusInternalServerError)
		}
		return
	}
}

func (api *API) AddPurchase(w http.ResponseWriter, r *http.Request) {
	var values db.PurchaseUpdate
	if err := json.NewDecoder(r.Body).Decode(&values); err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	var err error
	var respData struct {
		ID int64 `json:"id"`
	}
	respData.ID, err = api.DB.InsertPurchase(r.Context(), getSession(r).AccountID, &values)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	if err = json.NewEncoder(w).Encode(&respData); err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusInternalServerError)
	}
}

func (api *API) DeletePurchase(w http.ResponseWriter, r *http.Request) {
	purchaseID, err := strconv.ParseInt(mux.Vars(r)["id"], 10, 64)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusNotFound)
		return
	}
	err = api.DB.DeletePurchaseById(r.Context(), purchaseID, getSession(r).AccountID)
	if err != nil {
		if err == db.ErrNoRowsAffected {
			w.WriteHeader(http.StatusNotFound)
		} else {
			log.Print(err)
			w.WriteHeader(http.StatusInternalServerError)
		}
	}
	w.WriteHeader(http.StatusOK)
}

func (api *API) RestorePurchase(w http.ResponseWriter, r *http.Request) {
	purchaseID, err := strconv.ParseInt(mux.Vars(r)["id"], 10, 64)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusNotFound)
		return
	}
	purchase, err := api.DB.RestorePurchaseById(
		r.Context(), purchaseID, getSession(r).AccountID)
	if err != nil {
		if errors.Is(err, db.ErrNoRowsAffected) {
			w.WriteHeader(http.StatusNotFound)
		} else {
			log.Print(err)
			w.WriteHeader(http.StatusInternalServerError)
		}
		return
	}
	err = json.NewEncoder(w).Encode(struct {
		Purchase *db.Purchase `json:"purchase"`
	}{Purchase: purchase})
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusInternalServerError)
	}
}
