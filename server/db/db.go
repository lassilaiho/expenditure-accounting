package db

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
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

const ExpectedDBVersion = 2

type DBVersionError struct {
	Expected, Found int
}

func (err *DBVersionError) Error() string {
	return fmt.Sprintf(
		"mismatching DB version: expected %d, found %d",
		err.Expected,
		err.Found)
}

func (api *API) CheckDBVersion(ctx context.Context) error {
	query := "SELECT version FROM metadata WHERE is_current = TRUE"
	var foundVersion int
	err := api.DB.QueryRowContext(ctx, query).Scan(&foundVersion)
	if err != nil {
		return err
	}
	if foundVersion != ExpectedDBVersion {
		return &DBVersionError{
			Expected: ExpectedDBVersion,
			Found:    foundVersion,
		}
	}
	return nil
}
