package db

import (
	"context"
	"database/sql"
	"encoding/base64"
	"errors"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/google/uuid"
	"golang.org/x/crypto/bcrypt"
)

var (
	ErrInvalidEmailOrPassword = errors.New("invalid email or password")
	ErrInvalidSession         = errors.New("missing or invalid session token")
	ErrSessionExpired         = errors.New("session has been expired")
)

func (api *API) hashPassword(password string) ([]byte, error) {
	return bcrypt.GenerateFromPassword([]byte(password), api.BcryptCost)
}

func comparePassword(password, hash string) error {
	return bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
}

func generateSessionToken() string {
	return uuid.New().String()
}

type Session struct {
	ID         int64     `json:"id"`
	Token      string    `json:"token"`
	ExpiryTime time.Time `json:"expiryTime"`
	AccountID  int64     `json:"accountId"`
}

func (api *API) CreateSession(ctx context.Context, email, password string) (*Session, error) {
	tx, err := api.DB.BeginTx(ctx, nil)
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
			return nil, ErrInvalidEmailOrPassword
		}
		return nil, err
	}
	if err = comparePassword(password, passwordHash); err != nil {
		tx.Rollback()
		return nil, ErrInvalidEmailOrPassword
	}
	now := time.Now().UTC()
	session := &Session{
		Token:      generateSessionToken(),
		ExpiryTime: now.Add(api.SessionTimeout),
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

func (api *API) DeleteSession(ctx context.Context, id int64) error {
	_, err := api.DB.ExecContext(
		ctx,
		"DELETE FROM sessions WHERE id = $1",
		id)
	return err
}

func (api *API) ValidateSession(r *http.Request) (*Session, error) {
	authStr := r.Header.Get("Authorization")
	if authStr == "" {
		return nil, ErrInvalidSession
	}
	authParts := strings.Split(authStr, " ")
	if len(authParts) != 2 || strings.ToLower(authParts[0]) != "basic" {
		return nil, ErrInvalidSession
	}
	tokenBytes, err := base64.StdEncoding.DecodeString(authParts[1])
	if err != nil {
		return nil, ErrInvalidSession
	}
	session := &Session{
		Token: string(tokenBytes),
	}
	err = api.DB.
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
		return nil, ErrSessionExpired
	}
	if now.Add(api.RefreshTime).After(session.ExpiryTime) {
		go func() {
			_, err := api.DB.Exec(
				"UPDATE sessions SET expiry_time = $1 WHERE id = $2",
				now.Add(api.SessionTimeout), session.ID)
			if err != nil {
				log.Print("error refreshing session: ", err)
			}
		}()
	}
	return session, nil
}

func (api *API) ChangePasswordForAccount(ctx context.Context, accountID int64, old, new string) error {
	tx, err := api.DB.BeginTx(ctx, nil)
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
		return ErrInvalidEmailOrPassword
	}
	newHash, err := api.hashPassword(new)
	if err != nil {
		return ErrInvalidEmailOrPassword
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
