package api

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"log"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"
	"time"

	"github.com/lassilaiho/expenditure-accounting/server/db"
	"github.com/lassilaiho/expenditure-accounting/server/testutil"
	"github.com/stretchr/testify/require"
)

var httpAPI = API{DB: &db.API{
	BcryptCost:     14,
	SessionTimeout: time.Hour,
	RefreshTime:    15 * time.Minute,
}}
var bgctx = context.Background()
var handler = NewHandler(&httpAPI)

var testSession *db.Session

func queryDB(t *testing.T, query string, values ...interface{}) []string {
	t.Helper()
	rows, err := httpAPI.DB.DB.Query(query, values...)
	require.Nil(t, err)
	defer rows.Close()
	cols, err := rows.Columns()
	require.Nil(t, err)
	result := []string{}
	rowRefs := make([]interface{}, len(cols))
	for rows.Next() {
		row := make([]string, len(cols))
		for i := range rowRefs {
			rowRefs[i] = &row[i]
		}
		require.Nil(t, rows.Scan(rowRefs...))
		result = append(result, strings.Join(row, "\u0000   "))
	}
	return result
}

func assertInResult(t *testing.T, result []string, s string) {
	t.Helper()
	found := false
	for _, r := range result {
		if strings.Contains(r, s) {
			found = true
			break
		}
	}
	if !found {
		t.Fatalf("expected %s in %v", s, result)
	}
}

func assertSuccess(t *testing.T, r *http.Response) {
	t.Helper()
	if r.StatusCode != 200 {
		t.Fatalf("expected code 200, found %d", r.StatusCode)
	}
}

func testReq(t *testing.T, method, url string, body interface{}) *http.Response {
	t.Helper()
	var buf bytes.Buffer
	if body != nil {
		require.Nil(t, json.NewEncoder(&buf).Encode(body))
	}
	req := httptest.NewRequest(method, url, &buf)
	req.Header.Add(
		"Authorization",
		"Basic "+base64.StdEncoding.EncodeToString([]byte(testSession.Token)))
	resp := httptest.NewRecorder()
	handler.ServeHTTP(resp, req)
	return resp.Result()
}

func parseTime(s string) time.Time {
	t, err := time.Parse("2006-01-02", "2020-12-26")
	if err != nil {
		panic(err)
	}
	return t
}

func toJSON(t *testing.T, out interface{}, r *http.Response) interface{} {
	t.Helper()
	defer r.Body.Close()
	if out == nil {
		require.Nil(t, json.NewDecoder(r.Body).Decode(&out))
	} else {
		require.Nil(t, json.NewDecoder(r.Body).Decode(out))
	}
	return out
}

type obj map[string]interface{}
type arr []interface{}

func TestMain(m *testing.M) {
	var cleanup func()
	httpAPI.DB.DB, cleanup = testutil.ConnectDB()
	if err := httpAPI.DB.InitDB(bgctx); err != nil {
		cleanup()
		log.Fatal(err)
	}
	err := httpAPI.DB.InsertAccount(bgctx, "test@example.com", "password", "user")
	if err != nil {
		cleanup()
		log.Fatal(err)
	}
	testSession, err = httpAPI.DB.CreateSession(bgctx, "test@example.com", "password")
	if err != nil {
		cleanup()
		log.Fatal(err)
	}
	code := m.Run()
	cleanup()
	os.Exit(code)
}

func TestOperation(t *testing.T) {
	t.Run("AddTags", func(t *testing.T) {
		assertSuccess(t, testReq(t, "POST", "/tags", obj{
			"tags": arr{"Tag 1", "Tag 2", "Tag 3"},
		}))
		result := queryDB(t, "SELECT * FROM tags")
		require.Len(t, result, 3)
		assertInResult(t, result, "Tag 1")
		assertInResult(t, result, "Tag 2")
		assertInResult(t, result, "Tag 3")
	})
	t.Run("AddProduct", func(t *testing.T) {
		assertSuccess(t, testReq(t, "POST", "/products", obj{"name": "Product 1"}))
		assertSuccess(t, testReq(t, "POST", "/products", obj{"name": "Product 2"}))
		assertSuccess(t, testReq(t, "POST", "/products", obj{"name": "Product 3"}))
		result := queryDB(t, "SELECT * FROM products")
		require.Len(t, result, 3)
		assertInResult(t, result, "Product 1")
		assertInResult(t, result, "Product 2")
		assertInResult(t, result, "Product 3")
	})
	assertSuccess(t, testReq(t, "POST", "/purchases", obj{
		"product":  2,
		"date":     parseTime("2020-12-26"),
		"quantity": "12",
		"price":    "8",
		"tags":     arr{1, 2},
	}))
	assertSuccess(t, testReq(t, "POST", "/purchases", obj{
		"product":  1,
		"date":     parseTime("2020-12-27"),
		"quantity": "0.25",
		"price":    "4",
		"tags":     arr{3},
	}))
	assertSuccess(t, testReq(t, "POST", "/purchases", obj{
		"product":  1,
		"date":     parseTime("2021-01-03"),
		"quantity": "2.53",
		"price":    "2.09",
		"tags":     arr{1, 3},
	}))
	t.Run("DeletePurchase", func(t *testing.T) {
		assertSuccess(t, testReq(t, "DELETE", "/purchases/1", nil))
		result := queryDB(t, "SELECT deleted FROM purchases ORDER BY id")
		require.Len(t, result, 3)
		require.Contains(t, result[0], "true")
		require.Contains(t, result[1], "false")
		require.Contains(t, result[2], "false")
		result = queryDB(t, "SELECT deleted FROM tags ORDER BY id")
		require.Len(t, result, 3)
		require.Contains(t, result[0], "false")
		require.Contains(t, result[1], "true")
		require.Contains(t, result[2], "false")
		result = queryDB(t, "SELECT deleted FROM products ORDER BY id")
		require.Len(t, result, 3)
		require.Contains(t, result[0], "false")
		require.Contains(t, result[1], "true")
		require.Contains(t, result[2], "false")
	})
}
