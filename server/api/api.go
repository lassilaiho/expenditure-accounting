package api

import (
	"database/sql"
	"time"
)

type Configuration struct {
	DB             *sql.DB
	BcryptCost     int
	SessionTimeout time.Duration
	RefreshTime    time.Duration
}

var Config *Configuration
