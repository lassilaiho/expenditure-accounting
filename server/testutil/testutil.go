package testutil

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"strings"

	_ "github.com/lib/pq" // Package requires a PostgreSQL driver
	"github.com/ory/dockertest/v3"
)

func connectDockertestDB() (db *sql.DB, close func()) {
	pool, err := dockertest.NewPool("")
	if err != nil {
		log.Fatalf("Could not connect to docker: %s", err)
	}
	resource, err := pool.Run(
		"postgres", "12.5", []string{"POSTGRES_PASSWORD=password"})
	if err != nil {
		log.Fatalf("Could not start resource: %s", err)
	}
	if err := pool.Retry(func() error {
		db, err = sql.Open(
			"postgres",
			fmt.Sprintf(
				"user=postgres password=password port=%s sslmode=disable",
				resource.GetPort("5432/tcp")))
		if err != nil {
			return err
		}
		return db.Ping()
	}); err != nil {
		log.Fatalf("Could not connect to docker: %s", err)
	}
	return db, func() {
		if err := pool.Purge(resource); err != nil {
			log.Fatalf("Could not purge resource: %s", err)
		}
	}
}

func connectExistingDB() (*sql.DB, func()) {
	db, err := sql.Open(
		"postgres",
		fmt.Sprintf(
			"host=%s user=postgres password=postgres port=%s sslmode=disable",
			os.Getenv("POSTGRES_HOST"),
			os.Getenv(("POSTGRES_PORT"))))
	if err != nil {
		log.Fatal(err)
	}
	return db, func() { db.Close() }
}

func isCI() bool {
	for _, arg := range os.Args {
		if strings.ToLower(arg) == "ci" {
			return true
		}
	}
	return false
}

func ConnectDB() (*sql.DB, func()) {
	if isCI() {
		return connectExistingDB()
	}
	return connectDockertestDB()
}
