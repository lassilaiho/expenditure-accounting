package db

import (
	"database/sql"
	"errors"
	"time"
)

var (
	ErrNoRowsAffected = errors.New("no rows were affected")
)

type API struct {
	DB             *sql.DB
	BcryptCost     int
	SessionTimeout time.Duration
	RefreshTime    time.Duration
}
