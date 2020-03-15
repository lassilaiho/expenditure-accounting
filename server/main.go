package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"flag"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"github.com/lassilaiho/expenditure-accounting/server/api"
	dbapi "github.com/lassilaiho/expenditure-accounting/server/db"
	_ "github.com/lib/pq"
	"github.com/rs/cors"
)

type configuration struct {
	Port               int           `json:"port"`
	BcryptCost         int           `json:"bcryptCost"`
	SessionTimeout     time.Duration `json:"sessionTimeout"`
	RefreshTime        time.Duration `json:"refreshTime"`
	RootURL            string        `json:"rootUrl"`
	AllowedOrigins     []string      `json:"allowedOrigins"`
	DBConnectionString string        `json:"dbConnectionString"`
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

func run() error {
	configPath := flag.String("config", "", "path to configuration file")
	flag.Parse()

	config, err := loadConfig(*configPath)
	if err != nil {
		return err
	}

	db, err := sql.Open("postgres", config.DBConnectionString)
	if err != nil {
		return err
	}
	defer db.Close()

	dbapi := &dbapi.API{
		DB:             db,
		BcryptCost:     config.BcryptCost,
		SessionTimeout: config.SessionTimeout,
		RefreshTime:    config.RefreshTime,
	}

	if err = dbapi.CheckDBVersion(context.Background()); err != nil {
		return err
	}

	apiHandler := api.NewHandler(&api.API{DB: dbapi})

	r := mux.NewRouter()
	r.PathPrefix(config.RootURL).Handler(
		http.StripPrefix(config.RootURL, apiHandler))

	c := cors.New(cors.Options{
		AllowedOrigins:   config.AllowedOrigins,
		AllowCredentials: true,
		AllowedMethods:   []string{"GET", "POST", "DELETE", "OPTIONS", "HEAD", "PATCH"},
		AllowedHeaders:   []string{"Authorization", "Content-Type"},
	})

	log.Print("Listening to port ", config.Port)
	return http.ListenAndServe(
		":"+strconv.Itoa(config.Port),
		c.Handler(r))
}

func main() {
	if err := run(); err != nil {
		log.Fatal(err)
	}
}
