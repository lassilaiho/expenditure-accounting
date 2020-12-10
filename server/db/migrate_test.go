package db

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"testing"
	"time"

	_ "github.com/lib/pq"
	"github.com/ory/dockertest/v3"
	"github.com/stretchr/testify/require"
)

var dbAPI = API{
	BcryptCost:     14,
	SessionTimeout: time.Hour,
	RefreshTime:    15 * time.Minute,
}
var bgctx = context.Background()

func TestMain(m *testing.M) {
	// Add test migration script
	migrationScripts[migration{From: 2, To: 3}] =
		"ALTER TABLE metadata ADD COLUMN test_col TEXT DEFAULT 'test'"

	// Start and connect to database container
	pool, err := dockertest.NewPool("")
	if err != nil {
		log.Fatalf("Could not connect to docker: %s", err)
	}
	resource, err := pool.Run("postgres", "12.5", []string{"POSTGRES_PASSWORD=password"})
	if err != nil {
		log.Fatalf("Could not start resource: %s", err)
	}
	if err := pool.Retry(func() error {
		var err error
		dbAPI.DB, err = sql.Open("postgres", fmt.Sprintf("user=postgres password=password port=%s sslmode=disable", resource.GetPort("5432/tcp")))
		if err != nil {
			return err
		}
		return dbAPI.DB.Ping()
	}); err != nil {
		log.Fatalf("Could not connect to docker: %s", err)
	}
	code := m.Run()
	if err := pool.Purge(resource); err != nil {
		log.Fatalf("Could not purge resource: %s", err)
	}
	os.Exit(code)
}

func TestAutoMigrate(t *testing.T) {
	require.Nil(t, dbAPI.InitDB(bgctx))
	version, err := dbAPI.GetSchemaVersion(bgctx)
	require.Nil(t, err)
	require.Equal(t, SchemaVersion, version)

	require.Nil(t, dbAPI.AutoMigrate(bgctx, 3))
	var testData string
	require.Nil(t, dbAPI.DB.QueryRow(
		"select test_col from metadata").Scan(&testData))
	require.Equal(t, "test", testData)
}
