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

type session struct {
	ID         int64     `json:"id"`
	Token      string    `json:"token"`
	ExpiryTime time.Time `json:"expiryTime"`
	AccountID  int64     `json:"accountId"`
}

func createSession(ctx context.Context, email, password string) (*session, error) {
	tx, err := Config.DB.BeginTx(ctx, nil)
	if err != nil {
		return nil, err
	}
	var (
		accountID    int64
		passwordHash string
	)
	err = tx.QueryRowContext(
		ctx,
		"SELECT id, password_hash FROM accounts WHERE email = $1",
		email).Scan(&accountID, &passwordHash)
	if err != nil {
		tx.Rollback()
		if err == sql.ErrNoRows {
			return nil, errInvalidEmailOrPassword
		}
		return nil, err
	}
	if err = comparePassword(password, passwordHash); err != nil {
		tx.Rollback()
		return nil, errInvalidEmailOrPassword
	}
	now := time.Now().UTC()
	session := &session{
		Token:      generateSessionToken(),
		ExpiryTime: now.Add(Config.SessionTimeout),
	}
	_, err = tx.ExecContext(
		ctx,
		"INSERT INTO sessions (token, expiry_time, account_id) VALUES ($1, $2, $3)",
		session.Token, session.ExpiryTime, accountID)
	if err != nil {
		tx.Rollback()
		return nil, err
	}
	_, err = tx.ExecContext(
		ctx,
		"DELETE FROM sessions WHERE account_id = $1 AND expiry_time < $2",
		accountID,
		now)
	if err != nil {
		tx.Rollback()
		return nil, err
	}
	if err = tx.Commit(); err != nil {
		tx.Rollback()
		return nil, err
	}
	return session, nil
}

func deleteSession(ctx context.Context, id int64) error {
	_, err := Config.DB.ExecContext(
		ctx,
		"DELETE FROM sessions WHERE id = $1",
		id)
	return err
}

func validateSession(r *http.Request) (*session, error) {
	authStr := r.Header.Get("Authorization")
	if authStr == "" {
		return nil, errInvalidSession
	}
	authParts := strings.Split(authStr, " ")
	if len(authParts) != 2 || strings.ToLower(authParts[0]) != "basic" {
		return nil, errInvalidSession
	}
	tokenBytes, err := base64.StdEncoding.DecodeString(authParts[1])
	if err != nil {
		return nil, errInvalidSession
	}
	session := &session{
		Token: string(tokenBytes),
	}
	err = Config.DB.
		QueryRowContext(
			r.Context(),
			"SELECT id, account_id, expiry_time FROM sessions WHERE token = $1",
			session.Token).
		Scan(
			&session.ID,
			&session.AccountID,
			&session.ExpiryTime)
	if err != nil {
		return nil, err
	}
	now := time.Now().UTC()
	if now.After(session.ExpiryTime) {
		return nil, errSessionExpired
	}
	if now.Add(Config.RefreshTime).After(session.ExpiryTime) {
		go func() {
			_, err := Config.DB.Exec(
				"UPDATE sessions SET expiry_time = $1 WHERE id = $2",
				now.Add(Config.SessionTimeout), session.ID)
			if err != nil {
				log.Print("error refreshing session: ", err)
			}
		}()
	}
	return session, nil
}

func changePasswordForAccount(ctx context.Context, accountID int64, old, new string) error {
	tx, err := Config.DB.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	query := "SELECT password_hash FROM accounts WHERE id = $1"
	var oldHash string
	if err = tx.QueryRowContext(ctx, query, accountID).Scan(&oldHash); err != nil {
		tx.Rollback()
		return err
	}
	if err = comparePassword(old, oldHash); err != nil {
		return errInvalidEmailOrPassword
	}
	newHash, err := hashPassword(new)
	if err != nil {
		return errInvalidEmailOrPassword
	}
	query = "UPDATE accounts SET password_hash = $1 WHERE id = $2"
	if _, err = tx.ExecContext(ctx, query, newHash, accountID); err != nil {
		tx.Rollback()
		return err
	}
	if err = tx.Commit(); err != nil {
		tx.Rollback()
		return err
	}
	return nil
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
	session, err := createSession(r.Context(), creds.Email, creds.Password)
	if err != nil {
		log.Print(err)
		if err == errInvalidEmailOrPassword {
			http.Error(w, err.Error(), http.StatusUnauthorized)
		} else {
			w.WriteHeader(http.StatusInternalServerError)
		}
		return
	}
	resp := struct {
		Token      string    `json:"token"`
		ExpiryTime time.Time `json:"expiryTime"`
	}{
		Token:      session.Token,
		ExpiryTime: session.ExpiryTime,
	}
	if err = json.NewEncoder(w).Encode(&resp); err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusInternalServerError)
	}
}

func Logout(w http.ResponseWriter, r *http.Request) {
	session, err := validateSession(r)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	if err = deleteSession(r.Context(), session.ID); err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusInternalServerError)
	}
}

func ChangePassword(w http.ResponseWriter, r *http.Request) {
	session, err := validateSession(r)
	if err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusUnauthorized)
		return
	}
	var reqData struct {
		OldPassword string `json:"oldPassword"`
		NewPassword string `json:"newPassword"`
	}
	if err = json.NewDecoder(r.Body).Decode(&reqData); err != nil {
		log.Print(err)
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	err = changePasswordForAccount(
		r.Context(),
		session.AccountID,
		reqData.OldPassword,
		reqData.NewPassword)
	if err != nil {
		log.Print(err)
		if err == errInvalidEmailOrPassword {
			w.WriteHeader(http.StatusUnauthorized)
		} else {
			w.WriteHeader(http.StatusInternalServerError)
		}
		return
	}
}
