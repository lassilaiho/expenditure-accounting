package api

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/lassilaiho/expenditure-accounting/server/db"
)

func Login(w http.ResponseWriter, r *http.Request) {
	var creds struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	err := json.NewDecoder(r.Body).Decode(&creds)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	session, err := Config.DB.CreateSession(r.Context(), creds.Email, creds.Password)
	if err != nil {
		log.Print(err)
		if err == db.ErrInvalidEmailOrPassword {
			http.Error(w, err.Error(), http.StatusUnauthorized)
		} else {
			w.WriteHeader(http.StatusInternalServerError)
		}
		return
	}
	resp := struct {
		Token      string    `json:"token"`
		ExpiryTime time.Time `json:"expiryTime"`
	}{
		Token:      session.Token,
		ExpiryTime: session.ExpiryTime,
	}
	if err = json.NewEncoder(w).Encode(&resp); err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusInternalServerError)
	}
}

func Logout(w http.ResponseWriter, r *http.Request) {
	session, err := Config.DB.ValidateSession(r)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	if err = Config.DB.DeleteSession(r.Context(), session.ID); err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusInternalServerError)
	}
}

func ChangePassword(w http.ResponseWriter, r *http.Request) {
	session, err := Config.DB.ValidateSession(r)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	var reqData struct {
		OldPassword string `json:"oldPassword"`
		NewPassword string `json:"newPassword"`
	}
	if err = json.NewDecoder(r.Body).Decode(&reqData); err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	err = Config.DB.ChangePasswordForAccount(
		r.Context(),
		session.AccountID,
		reqData.OldPassword,
		reqData.NewPassword)
	if err != nil {
		log.Print(err)
		if err == db.ErrInvalidEmailOrPassword {
			w.WriteHeader(http.StatusUnauthorized)
		} else {
			w.WriteHeader(http.StatusInternalServerError)
		}
		return
	}
}
