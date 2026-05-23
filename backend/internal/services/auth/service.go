package auth

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
	"golang.org/x/oauth2/google"
)

type authService struct {
	repo               ports.UserRepository
	otpRepo            ports.OTPRepository
	mailService        ports.MailService
	jwtSecret          []byte
	accessTokenExpiry  time.Duration
	refreshTokenExpiry time.Duration
	oauthConfigs       map[string]*oauth2.Config
}

func NewAuthService(
	repo ports.UserRepository,
	otpRepo ports.OTPRepository,
	mailService ports.MailService,
	jwtSecret string,
	accessTokenExpiry time.Duration,
	refreshTokenExpiry time.Duration,
	googleClientID, googleClientSecret, googleCallbackURL string,
	githubClientID, githubClientSecret, githubCallbackURL string,
) ports.AuthService {
	configs := make(map[string]*oauth2.Config)
	
	if googleClientID != "" {
		configs["google"] = &oauth2.Config{
			ClientID:     googleClientID,
			ClientSecret: googleClientSecret,
			RedirectURL:  googleCallbackURL,
			Endpoint:     google.Endpoint,
			Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"},
		}
	}

	if githubClientID != "" {
		configs["github"] = &oauth2.Config{
			ClientID:     githubClientID,
			ClientSecret: githubClientSecret,
			RedirectURL:  githubCallbackURL,
			Endpoint:     github.Endpoint,
			Scopes:       []string{"user:email", "read:user"},
		}
	}

	return &authService{
		repo:               repo,
		otpRepo:            otpRepo,
		mailService:        mailService,
		jwtSecret:          []byte(jwtSecret),
		accessTokenExpiry:  accessTokenExpiry,
		refreshTokenExpiry: refreshTokenExpiry,
		oauthConfigs:       configs,
	}
}

func (s *authService) GetOAuthURL(provider string) (string, error) {
	config, ok := s.oauthConfigs[provider]
	if !ok {
		return "", fmt.Errorf("unsupported provider: %s", provider)
	}
	return config.AuthCodeURL("state"), nil
}

func (s *authService) HandleOAuthCallback(ctx context.Context, provider, code string) (*domain.AuthResponse, error) {
	config, ok := s.oauthConfigs[provider]
	if !ok {
		return nil, fmt.Errorf("unsupported provider: %s", provider)
	}

	token, err := config.Exchange(ctx, code)
	if err != nil {
		return nil, fmt.Errorf("code exchange failed: %w", err)
	}

	// Fetch user info based on provider
	var email, firstName, lastName string
	if provider == "google" {
		email, firstName, lastName, err = s.fetchGoogleUser(token.AccessToken)
	} else if provider == "github" {
		email, firstName, lastName, err = s.fetchGitHubUser(token.AccessToken)
	}

	if err != nil {
		return nil, err
	}

	// Check if user exists, otherwise create
	user, err := s.repo.GetByEmail(ctx, email)
	if err != nil {
		// Create new user for OAuth
		user = &domain.User{
			Email:      email,
			FirstName:  firstName,
			LastName:   lastName,
			IsVerified: true, // OAuth users are verified
		}
		user, err = s.repo.Create(ctx, *user)
		if err != nil {
			return nil, fmt.Errorf("failed to create oauth user: %w", err)
		}
	}

	return s.generateAuthResponse(user)
}

func (s *authService) fetchGoogleUser(accessToken string) (string, string, string, error) {
	resp, err := http.Get("https://www.googleapis.com/oauth2/v2/userinfo?access_token=" + accessToken)
	if err != nil {
		return "", "", "", err
	}
	defer resp.Body.Close()

	var profile struct {
		Email     string `json:"email"`
		FirstName string `json:"given_name"`
		LastName  string `json:"family_name"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&profile); err != nil {
		return "", "", "", err
	}
	return profile.Email, profile.FirstName, profile.LastName, nil
}

func (s *authService) fetchGitHubUser(accessToken string) (string, string, string, error) {
	req, _ := http.NewRequest("GET", "https://api.github.com/user", nil)
	req.Header.Set("Authorization", "Bearer "+accessToken)
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", "", "", err
	}
	defer resp.Body.Close()

	var profile struct {
		Login string `json:"login"`
		Name  string `json:"name"`
		Email string `json:"email"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&profile); err != nil {
		return "", "", "", err
	}

	// GitHub name can be one string, split it
	// If email is private, we'd need another call to /user/emails
	return profile.Email, profile.Name, "", nil
}

func (s *authService) Signup(ctx context.Context, req domain.SignupRequest) (*domain.User, error) {
	_, err := s.repo.GetByEmail(ctx, req.Email)
	if err == nil {
		return nil, fmt.Errorf("user with this email already exists")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	user := domain.User{
		Email:        req.Email,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		PasswordHash: string(hashedPassword),
	}

	createdUser, err := s.repo.Create(ctx, user)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Async send welcome email
	go s.mailService.SendWelcome(createdUser.Email, createdUser.FirstName)

	return createdUser, nil
}

func (s *authService) Login(ctx context.Context, req domain.LoginRequest) (*domain.AuthResponse, error) {
	user, err := s.repo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		return nil, fmt.Errorf("invalid credentials")
	}

	return s.generateAuthResponse(user)
}

func (s *authService) RefreshToken(ctx context.Context, refreshToken string) (*domain.AuthResponse, error) {
	userID, err := s.ValidateToken(refreshToken)
	if err != nil {
		return nil, fmt.Errorf("invalid refresh token: %w", err)
	}

	user, err := s.repo.GetByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("user not found")
	}

	return s.generateAuthResponse(user)
}

func (s *authService) ForgotPassword(ctx context.Context, req domain.ForgotPasswordRequest) error {
	_, err := s.repo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil // Return nil for security to avoid user enumeration
	}

	otp := generateOTP(6)
	expiry := time.Now().Add(10 * time.Minute)

	err = s.otpRepo.DeleteByEmail(ctx, req.Email)
	if err != nil {
		return fmt.Errorf("failed to cleanup old OTPs: %w", err)
	}

	err = s.otpRepo.Create(ctx, req.Email, otp, expiry)
	if err != nil {
		return fmt.Errorf("failed to store OTP: %w", err)
	}

	go s.mailService.SendOTP(req.Email, otp)

	return nil
}

func (s *authService) ResetPassword(ctx context.Context, req domain.ResetPasswordRequest) error {
	valid, err := s.otpRepo.Verify(ctx, req.Email, req.OTP)
	if err != nil || !valid {
		return fmt.Errorf("invalid or expired OTP")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	err = s.repo.UpdatePassword(ctx, req.Email, string(hashedPassword))
	if err != nil {
		return fmt.Errorf("failed to update password: %w", err)
	}

	_ = s.otpRepo.DeleteByEmail(ctx, req.Email)

	return nil
}

func (s *authService) generateAuthResponse(user *domain.User) (*domain.AuthResponse, error) {
	accessToken, accessExp, err := s.createToken(user.ID, s.accessTokenExpiry)
	if err != nil {
		return nil, err
	}

	refreshToken, _, err := s.createToken(user.ID, s.refreshTokenExpiry)
	if err != nil {
		return nil, err
	}

	return &domain.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    accessExp.Format(time.RFC3339),
		User:         *user,
	}, nil
}

func (s *authService) createToken(userID string, expiry time.Duration) (string, time.Time, error) {
	expirationTime := time.Now().Add(expiry)
	claims := jwt.MapClaims{
		"sub": userID,
		"exp": expirationTime.Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(s.jwtSecret)
	return tokenString, expirationTime, err
}

func (s *authService) ValidateToken(tokenString string) (string, error) {
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return s.jwtSecret, nil
	})

	if err != nil {
		return "", err
	}

	if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
		sub, ok := claims["sub"].(string)
		if !ok {
			return "", fmt.Errorf("invalid token claims")
		}
		return sub, nil
	}

	return "", fmt.Errorf("invalid token")
}

func generateOTP(max int) string {
	var table = [...]byte{'1', '2', '3', '4', '5', '6', '7', '8', '9', '0'}
	b := make([]byte, max)
	n, err := io.ReadAtLeast(rand.Reader, b, max)
	if n != max || err != nil {
		return "123456" // fallback
	}
	for i := 0; i < len(b); i++ {
		b[i] = table[int(b[i])%len(table)]
	}
	return string(b)
}
