package main

import (
	"database/sql"
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"github.com/lassilaiho/expenditure-accounting/server/api"
	_ "github.com/lib/pq"
	"github.com/rs/cors"
)

type dbConfiguration struct {
	User     string `json:"user"`
	Name     string `json:"name"`
	Password string `json:"password"`
}

type configuration struct {
	Port           int             `json:"port"`
	BcryptCost     int             `json:"bcryptCost"`
	SessionTimeout time.Duration   `json:"sessionTimeout"`
	RefreshTime    time.Duration   `json:"refreshTime"`
	RootURL        string          `json:"rootUrl"`
	AllowedOrigins []string        `json:"allowedOrigins"`
	DB             dbConfiguration `json:"db"`
}

func loadConfig(file string) (*configuration, error) {
	f, err := os.Open(file)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	var config configuration
	if err = json.NewDecoder(f).Decode(&config); err != nil {
		return nil, err
	}
	if config.Port == 0 {
		config.Port = 8080
	}
	if config.BcryptCost == 0 {
		config.BcryptCost = 14
	}
	if config.SessionTimeout == 0 {
		config.SessionTimeout = time.Hour
	}
	if config.RefreshTime == 0 {
		config.RefreshTime = 15 * time.Minute
	}
	if config.RootURL == "" {
		config.RootURL = "/api"
	}
	if config.AllowedOrigins == nil {
		config.AllowedOrigins = []string{}
	}
	return &config, nil
}

func connectDB(config *dbConfiguration) (*sql.DB, error) {
	connStr := fmt.Sprint(
		"user=", config.User,
		" dbname=", config.Name,
		" password=", config.Password,
		" sslmode=disable")
	return sql.Open("postgres", connStr)
}

func defineRoutes() http.Handler {
	r := mux.NewRouter()
	r.Path("/login").Methods("POST").HandlerFunc(api.Login)
	r.Path("/logout").Methods("POST").HandlerFunc(api.Logout)
	r.Path("/purchases").Methods("GET").HandlerFunc(api.GetPurchases)
	r.Path("/purchases/{id}").Methods("PATCH").HandlerFunc(api.UpdatePurchase)
	r.Path("/tags").Methods("POST").HandlerFunc(api.AddTags)
	r.Path("/products").Methods("POST").HandlerFunc(api.AddProduct)
	return r
}

func main() {
	configPath := flag.String("config", "", "path to configuration file")
	flag.Parse()

	config, err := loadConfig(*configPath)
	if err != nil {
		log.Fatal(err)
	}

	db, err := connectDB(&config.DB)
	if err != nil {
		log.Fatal(err)
	}

	api.Config = &api.Configuration{
		DB:             db,
		BcryptCost:     config.BcryptCost,
		SessionTimeout: config.SessionTimeout,
	}

	r := mux.NewRouter()
	r.PathPrefix(config.RootURL).Handler(
		http.StripPrefix(config.RootURL, defineRoutes()))

	c := cors.New(cors.Options{
		AllowedOrigins:   config.AllowedOrigins,
		AllowCredentials: true,
		AllowedMethods:   []string{"GET", "POST", "PUT", "OPTIONS", "HEAD", "PATCH"},
		AllowedHeaders:   []string{"Authorization", "Content-Type"},
	})

	log.Print("Listening to port ", config.Port)
	err = http.ListenAndServe(
		":"+strconv.Itoa(config.Port),
		c.Handler(r))
	if err != nil {
		log.Fatal(err)
	}
}
