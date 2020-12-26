package db

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/lassilaiho/expenditure-accounting/server/testutil"
	_ "github.com/lib/pq"
	"github.com/stretchr/testify/require"
)

var dbAPI = API{
	BcryptCost:     14,
	SessionTimeout: time.Hour,
	RefreshTime:    15 * time.Minute,
}
var bgctx = context.Background()

func TestMain(m *testing.M) {
	migrationScripts[migration{From: 2, To: 3}] =
		"ALTER TABLE metadata ADD COLUMN test_col TEXT DEFAULT 'test'"

	var cleanup func()
	dbAPI.DB, cleanup = testutil.ConnectDB()
	code := m.Run()
	cleanup()
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
