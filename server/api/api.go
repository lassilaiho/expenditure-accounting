package api

import (
	"context"
	"database/sql"
	"fmt"
	"time"
)

type Configuration struct {
	DB             *sql.DB
	BcryptCost     int
	SessionTimeout time.Duration
	RefreshTime    time.Duration
}

var Config *Configuration

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

func CheckDBVersion(ctx context.Context) error {
	query := "SELECT version FROM metadata WHERE is_current = TRUE"
	var foundVersion int
	err := Config.DB.QueryRowContext(ctx, query).Scan(&foundVersion)
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
