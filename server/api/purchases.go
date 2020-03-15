package api

import (
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/lassilaiho/expenditure-accounting/server/db"
)

func GetPurchases(w http.ResponseWriter, r *http.Request) {
	session, err := Config.DB.ValidateSession(r)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	var respData struct {
		Purchases []*db.Purchase `json:"purchases"`
	}
	respData.Purchases, err =
		Config.DB.GetPurchasesByAccount(r.Context(), session.AccountID)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}
	tagsByPurchase, err :=
		Config.DB.GetTagsByPurchaseForAccount(r.Context(), session.AccountID)
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

func UpdatePurchase(w http.ResponseWriter, r *http.Request) {
	session, err := Config.DB.ValidateSession(r)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
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
	err = Config.DB.UpdatePurchaseById(r.Context(), id, session.AccountID, &values)
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

func AddPurchase(w http.ResponseWriter, r *http.Request) {
	session, err := Config.DB.ValidateSession(r)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	var values db.PurchaseUpdate
	if err = json.NewDecoder(r.Body).Decode(&values); err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	var respData struct {
		ID int64 `json:"id"`
	}
	respData.ID, err = Config.DB.InsertPurchase(r.Context(), session.AccountID, &values)
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

func DeletePurchase(w http.ResponseWriter, r *http.Request) {
	session, err := Config.DB.ValidateSession(r)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	purchaseID, err := strconv.ParseInt(mux.Vars(r)["id"], 10, 64)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusNotFound)
		return
	}
	err = Config.DB.DeletePurchaseById(r.Context(), purchaseID, session.AccountID)
	if err != nil {
		if err == db.ErrNoRowsAffected {
			w.WriteHeader(http.StatusNotFound)
		} else {
			log.Print(err)
			w.WriteHeader(http.StatusInternalServerError)
		}
	}
}
