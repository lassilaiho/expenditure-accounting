package api

import (
	"github.com/lassilaiho/expenditure-accounting/server/db"
)

type Configuration struct {
	DB *db.API
}

var Config *Configuration
