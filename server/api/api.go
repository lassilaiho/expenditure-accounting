package api

import (
	"net/http"

	"github.com/gorilla/mux"
	"github.com/lassilaiho/expenditure-accounting/server/db"
)

type API struct {
	DB *db.API
}

func NewHandler(api *API) http.Handler {
	r := mux.NewRouter()
	r.Path("/login").Methods("POST").HandlerFunc(api.Login)
	r.Path("/logout").Methods("POST").HandlerFunc(api.Logout)
	r.Path("/purchases").Methods("GET").HandlerFunc(api.GetPurchases)
	r.Path("/purchases/{id}").Methods("PATCH").HandlerFunc(api.UpdatePurchase)
	r.Path("/tags").Methods("POST").HandlerFunc(api.AddTags)
	r.Path("/products").Methods("POST").HandlerFunc(api.AddProduct)
	r.Path("/purchases").Methods("POST").HandlerFunc(api.AddPurchase)
	r.Path("/purchases/{id}").Methods("DELETE").HandlerFunc(api.DeletePurchase)
	r.Path("/account/password").Methods("POST").HandlerFunc(api.ChangePassword)
	return r
}
