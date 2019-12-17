package api

import (
	"context"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"errors"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var (
	errInvalidEmailOrPassword = errors.New("invalid email or password")
	errInvalidSession         = errors.New("missing or invalid session token")
	errSessionExpired         = errors.New("session has been expired")
)

func hashPassword(password string) ([]byte, error) {
	return bcrypt.GenerateFromPassword([]byte(password), Config.BcryptCost)
}

func comparePassword(password, hash string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}

func generateSessionToken() string {
	return uuid.New().String()
}

func createSession(ctx context.Context, email, password string) (string, error) {
	var (
		accountID    int64
		passwordHash string
	)
	err := Config.DB.QueryRowContext(
		ctx,
		"SELECT id, password_hash FROM accounts WHERE email = $1",
		email).Scan(&accountID, &passwordHash)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", errInvalidEmailOrPassword
		}
		return "", err
	}
	if err = comparePassword(password, passwordHash); err != nil {
		return "", errInvalidEmailOrPassword
	}
	token := generateSessionToken()
	_, err = Config.DB.ExecContext(
		ctx,
		"INSERT INTO sessions (token, expiry_time, account_id) VALUES ($1, $2, $3)",
		token, time.Now().UTC().Add(Config.SessionTimeout), accountID)
	if err != nil {
		return "", err
	}
	return token, nil
}

func deleteSession(ctx context.Context, id int64) error {
	_, err := Config.DB.ExecContext(
		ctx,
		"DELETE FROM sessions WHERE id = $1",
		id)
	return err
}

func validateSession(r *http.Request) (int64, error) {
	authStr := r.Header.Get("Authorization")
	if authStr == "" {
		return -1, errInvalidSession
	}
	authParts := strings.Split(authStr, " ")
	if len(authParts) != 2 || strings.ToLower(authParts[0]) != "basic" {
		return -1, errInvalidSession
	}
	tokenBytes, err := base64.StdEncoding.DecodeString(authParts[1])
	if err != nil {
		return -1, errInvalidSession
	}
	var (
		id         int64
		expiryTime time.Time
	)
	err = Config.DB.QueryRowContext(
		r.Context(),
		"SELECT id, expiry_time FROM sessions WHERE token = $1",
		string(tokenBytes)).Scan(&id, &expiryTime)
	if err != nil {
		return -1, err
	}
	now := time.Now().UTC()
	if now.After(expiryTime) {
		return -1, errSessionExpired
	}
	if now.Add(Config.RefreshTime).After(expiryTime) {
		go func() {
			_, err := Config.DB.Exec(
				"UPDATE sessions SET expiry_time = $1 WHERE id = $2",
				now.Add(Config.SessionTimeout), id)
			if err != nil {
				log.Print("error refreshing session: ", err)
			}
		}()
	}
	return id, nil
}

func Login(w http.ResponseWriter, r *http.Request) {
	var creds struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	err := json.NewDecoder(r.Body).Decode(&creds)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	var resp struct {
		Token string `json:"token"`
	}
	resp.Token, err = createSession(r.Context(), creds.Email, creds.Password)
	if err != nil {
		log.Print(err)
		if err == errInvalidEmailOrPassword {
			http.Error(w, err.Error(), http.StatusUnauthorized)
		} else {
			w.WriteHeader(http.StatusInternalServerError)
		}
		return
	}
	if err = json.NewEncoder(w).Encode(&resp); err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusInternalServerError)
	}
}

func Logout(w http.ResponseWriter, r *http.Request) {
	sessionID, err := validateSession(r)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	if err = deleteSession(r.Context(), sessionID); err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusInternalServerError)
	}
}
