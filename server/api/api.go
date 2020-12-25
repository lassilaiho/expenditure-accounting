package api

import (
	"context"
	"encoding/base64"
	"errors"
	"log"
	"net/http"
	"strings"

	"github.com/gorilla/mux"
	"github.com/lassilaiho/expenditure-accounting/server/db"
)

type API struct {
	DB *db.API
}

func NewHandler(api *API) http.Handler {
	root := mux.NewRouter()
	root.Path("/login").Methods("POST").HandlerFunc(api.Login)

	authed := mux.NewRouter()
	root.PathPrefix("/").Handler(authed)
	authed.Use(api.authMiddleware)
	authed.Path("/logout").Methods("POST").HandlerFunc(api.Logout)
	authed.Path("/account/password").Methods("POST").HandlerFunc(api.ChangePassword)
	authed.Path("/products").Methods("POST").HandlerFunc(api.AddProduct)
	authed.Path("/purchases").Methods("GET").HandlerFunc(api.GetPurchases)
	authed.Path("/purchases").Methods("POST").HandlerFunc(api.AddPurchase)
	authed.Path("/purchases/{id}").Methods("PATCH").HandlerFunc(api.UpdatePurchase)
	authed.Path("/purchases/{id}").Methods("DELETE").HandlerFunc(api.DeletePurchase)
	authed.Path("/tags").Methods("POST").HandlerFunc(api.AddTags)

	return root
}

func getSessionToken(r *http.Request) (string, error) {
	authStr := r.Header.Get("Authorization")
	if authStr == "" {
		return "", errors.New("missing or invalid session token")
	}
	authParts := strings.Split(authStr, " ")
	if len(authParts) != 2 || strings.ToLower(authParts[0]) != "basic" {
		return "", errors.New("missing or invalid session token")
	}
	tokenBytes, err := base64.StdEncoding.DecodeString(authParts[1])
	if err != nil {
		return "", errors.New("missing or invalid session token")
	}
	return string(tokenBytes), nil
}

type sessionContextKey struct{}

func getSession(r *http.Request) *db.Session {
	val := r.Context().Value(sessionContextKey{})
	if val == nil {
		return nil
	}
	return val.(*db.Session)
}

func (api *API) authMiddleware(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		token, err := getSessionToken(r)
		if err != nil {
			log.Print(err)
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		session, err := api.DB.ValidateSession(r.Context(), token)
		if err == nil {
			h.ServeHTTP(w, r.WithContext(
				context.WithValue(
					r.Context(),
					sessionContextKey{},
					session,
				),
			))
		} else {
			log.Print(err)
			w.WriteHeader(http.StatusUnauthorized)
		}
	})
}
