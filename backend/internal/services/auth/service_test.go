package auth_test

import (
	"context"
	"testing"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/services/auth"
	"github.com/Prince-695/seasyn/backend/pkg/errors"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
)

type mockUserRepo struct {
	users map[string]*domain.User
}

func newMockUserRepo() *mockUserRepo {
	return &mockUserRepo{users: make(map[string]*domain.User)}
}

func (m *mockUserRepo) Create(ctx context.Context, u domain.User) (*domain.User, error) {
	u.ID = "usr_123"
	m.users[u.ID] = &u
	return &u, nil
}

func (m *mockUserRepo) GetByEmail(ctx context.Context, email string) (*domain.User, error) {
	for _, u := range m.users {
		if u.Email == email {
			return u, nil
		}
	}
	return nil, errors.NotFound("user not found")
}

func (m *mockUserRepo) GetByID(ctx context.Context, id string) (*domain.User, error) {
	u, ok := m.users[id]
	if !ok {
		return nil, errors.NotFound("user not found")
	}
	return u, nil
}

func (m *mockUserRepo) Update(ctx context.Context, u domain.User) (*domain.User, error) {
	m.users[u.ID] = &u
	return &u, nil
}

func (m *mockUserRepo) UpdatePassword(ctx context.Context, email, hashedPassword string) error {
	for _, u := range m.users {
		if u.Email == email {
			u.PasswordHash = hashedPassword
			return nil
		}
	}
	return errors.NotFound("user not found")
}

func (m *mockUserRepo) CheckUsername(ctx context.Context, username string) (bool, error) {
	return true, nil
}

type mockOTPRepo struct{}

func (m *mockOTPRepo) Create(ctx context.Context, email, otp string, expiry time.Time) error {
	return nil
}
func (m *mockOTPRepo) Verify(ctx context.Context, email, otp string) (bool, error) {
	return true, nil
}
func (m *mockOTPRepo) DeleteByEmail(ctx context.Context, email string) error {
	return nil
}

type mockMailService struct{}

func (m *mockMailService) SendEmailVerificationOTP(to, otp string) error { return nil }
func (m *mockMailService) SendPasswordResetOTP(to, otp string) error     { return nil }
func (m *mockMailService) SendWelcome(to, name string) error             { return nil }


func TestRefreshToken_SuccessAndSlidingExpiration(t *testing.T) {
	jwtSecret := "super-secure-test-jwt-secret-key-32chars"
	repo := newMockUserRepo()
	hash, _ := bcrypt.GenerateFromPassword([]byte("Password123!"), bcrypt.DefaultCost)
	user := &domain.User{
		ID:           "usr_test_1",
		Email:        "test@example.com",
		FirstName:    "Test",
		LastName:     "User",
		PasswordHash: string(hash),
		IsVerified:   true,
	}
	repo.users[user.ID] = user

	svc := auth.NewAuthService(
		repo,
		&mockOTPRepo{},
		&mockMailService{},
		jwtSecret,
		30*time.Minute,
		7*24*time.Hour,
		"", "", "",
		"", "", "",
	)

	ctx := context.Background()
	loginRes, err := svc.Login(ctx, domain.LoginRequest{
		Email:    "test@example.com",
		Password: "Password123!",
	})
	if err != nil {
		t.Fatalf("Login failed: %v", err)
	}

	if loginRes.AccessToken == "" || loginRes.RefreshToken == "" {
		t.Fatalf("Expected non-empty tokens, got access=%q refresh=%q", loginRes.AccessToken, loginRes.RefreshToken)
	}

	// Verify RefreshToken is a valid signed JWT with token_type: refresh
	parsedRefresh, err := jwt.Parse(loginRes.RefreshToken, func(token *jwt.Token) (interface{}, error) {
		return []byte(jwtSecret), nil
	})
	if err != nil || !parsedRefresh.Valid {
		t.Fatalf("Expected valid JWT refresh token, got err: %v", err)
	}
	claims := parsedRefresh.Claims.(jwt.MapClaims)
	if claims["token_type"] != "refresh" {
		t.Fatalf("Expected token_type=refresh, got %v", claims["token_type"])
	}
	if claims["sub"] != user.ID {
		t.Fatalf("Expected sub=%s, got %v", user.ID, claims["sub"])
	}

	// Perform refresh
	refreshRes, err := svc.RefreshToken(ctx, loginRes.RefreshToken)
	if err != nil {
		t.Fatalf("RefreshToken failed: %v", err)
	}

	if refreshRes.AccessToken == "" || refreshRes.RefreshToken == "" {
		t.Fatalf("Expected refreshed tokens, got empty")
	}
	if refreshRes.RefreshToken == loginRes.RefreshToken {
		t.Fatalf("Expected rotated refresh token, got same token")
	}

	// Validate the newly issued access token
	sub, err := svc.ValidateToken(refreshRes.AccessToken)
	if err != nil {
		t.Fatalf("ValidateToken on new access token failed: %v", err)
	}
	if sub != user.ID {
		t.Fatalf("Expected sub=%s, got %s", user.ID, sub)
	}
}

func TestRefreshToken_ConcurrentGraceCache(t *testing.T) {
	jwtSecret := "super-secure-test-jwt-secret-key-32chars"
	repo := newMockUserRepo()
	hash, _ := bcrypt.GenerateFromPassword([]byte("Password123!"), bcrypt.DefaultCost)
	user := &domain.User{
		ID:           "usr_test_grace",
		Email:        "grace@example.com",
		PasswordHash: string(hash),
	}
	repo.users[user.ID] = user

	svc := auth.NewAuthService(
		repo,
		&mockOTPRepo{},
		&mockMailService{},
		jwtSecret,
		30*time.Minute,
		7*24*time.Hour,
		"", "", "",
		"", "", "",
	)

	ctx := context.Background()
	loginRes, err := svc.Login(ctx, domain.LoginRequest{
		Email:    "grace@example.com",
		Password: "Password123!",
	})
	if err != nil {
		t.Fatalf("Login failed: %v", err)
	}

	// First refresh call
	res1, err := svc.RefreshToken(ctx, loginRes.RefreshToken)
	if err != nil {
		t.Fatalf("First RefreshToken failed: %v", err)
	}

	// Immediate second refresh call with the same old refresh token (simulating concurrent browser requests)
	res2, err := svc.RefreshToken(ctx, loginRes.RefreshToken)
	if err != nil {
		t.Fatalf("Second concurrent RefreshToken failed: %v", err)
	}

	// Both should yield the same response from grace cache
	if res1.AccessToken != res2.AccessToken || res1.RefreshToken != res2.RefreshToken {
		t.Fatalf("Expected grace cache to return identical rotated tokens, got res1=%+v res2=%+v", res1, res2)
	}
}

func TestRefreshToken_Rejections(t *testing.T) {
	jwtSecret := "super-secure-test-jwt-secret-key-32chars"
	repo := newMockUserRepo()
	hash, _ := bcrypt.GenerateFromPassword([]byte("Password123!"), bcrypt.DefaultCost)
	user := &domain.User{
		ID:           "usr_test_reject",
		Email:        "reject@example.com",
		PasswordHash: string(hash),
	}
	repo.users[user.ID] = user

	svc := auth.NewAuthService(
		repo,
		&mockOTPRepo{},
		&mockMailService{},
		jwtSecret,
		30*time.Minute,
		7*24*time.Hour,
		"", "", "",
		"", "", "",
	)

	ctx := context.Background()
	loginRes, err := svc.Login(ctx, domain.LoginRequest{
		Email:    "reject@example.com",
		Password: "Password123!",
	})
	if err != nil {
		t.Fatalf("Login failed: %v", err)
	}

	// Passing access token as refresh token should be rejected (type mismatch)
	_, err = svc.RefreshToken(ctx, loginRes.AccessToken)
	if err == nil {
		t.Fatal("Expected error when using access token as refresh token, got nil")
	}

	// Passing random string should be rejected
	_, err = svc.RefreshToken(ctx, "invalid-random-string")
	if err == nil {
		t.Fatal("Expected error for invalid string, got nil")
	}

	// Logout invalidates tokens
	err = svc.Logout(ctx, loginRes.AccessToken, loginRes.RefreshToken)
	if err != nil {
		t.Fatalf("Logout failed: %v", err)
	}

	_, err = svc.ValidateToken(loginRes.AccessToken)
	if err == nil {
		t.Fatal("Expected access token to be revoked after logout")
	}

	_, err = svc.RefreshToken(ctx, loginRes.RefreshToken)
	if err == nil {
		t.Fatal("Expected refresh token to be rejected after logout")
	}
}
