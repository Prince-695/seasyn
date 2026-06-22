package auth

import (
	"context"
	"crypto/rand"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"sync"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	"github.com/Prince-695/seasyn/backend/pkg/errors"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/github"
	"golang.org/x/oauth2/google"
)

// tokenTypeAccess and tokenTypeRefresh are the JWT "token_type" claim values.
// BUG-01 fix: without this, an access token can be passed as a refresh token
// and ValidateToken will accept it, defeating the purpose of the two-token system.
const (
	tokenTypeAccess  = "access"
	tokenTypeRefresh = "refresh"
)

// oauthState holds a CSRF state value with its expiry.
type oauthState struct {
	expiry time.Time
}

type authService struct {
	repo               ports.UserRepository
	otpRepo            ports.OTPRepository
	mailService        ports.MailService
	jwtSecret          []byte
	accessTokenExpiry  time.Duration
	refreshTokenExpiry time.Duration
	oauthConfigs       map[string]*oauth2.Config

	// BUG-02 fix: store pending OAuth states so the callback can verify them.
	// sync.Map is safe for concurrent use; states expire after 10 minutes.
	pendingStates sync.Map
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

// GetOAuthURL generates the provider redirect URL and stores the CSRF state.
func (s *authService) GetOAuthURL(provider string) (string, error) {
	config, ok := s.oauthConfigs[provider]
	if !ok {
		return "", errors.BadRequest(fmt.Sprintf("unsupported provider: %s", provider))
	}

	// BUG-10/11 fix: generateRandomString now returns an error instead of a
	// static fallback. Propagate it so the caller gets a proper 500.
	state, err := generateRandomString(32)
	if err != nil {
		return "", errors.Internal("Failed to generate secure OAuth state")
	}

	// BUG-02 fix: store the state so HandleOAuthCallback can verify it.
	s.pendingStates.Store(state, oauthState{expiry: time.Now().Add(10 * time.Minute)})

	return config.AuthCodeURL(state), nil
}

// HandleOAuthCallback validates the CSRF state then exchanges the code for user info.
func (s *authService) HandleOAuthCallback(ctx context.Context, provider, code, state string) (*domain.AuthResponse, error) {
	// BUG-02 fix: verify the CSRF state parameter.
	if err := s.verifyOAuthState(state); err != nil {
		return nil, err
	}

	config, ok := s.oauthConfigs[provider]
	if !ok {
		return nil, errors.BadRequest(fmt.Sprintf("unsupported provider: %s", provider))
	}

	token, err := config.Exchange(ctx, code)
	if err != nil {
		return nil, errors.Unauthorized("OAuth code exchange failed")
	}

	var email, firstName, lastName string
	if provider == "google" {
		email, firstName, lastName, err = s.fetchGoogleUser(token.AccessToken)
	} else if provider == "github" {
		email, firstName, lastName, err = s.fetchGitHubUser(token.AccessToken)
	}

	if err != nil {
		return nil, errors.Internal("Failed to fetch user info from provider")
	}

	// BUG-03 fix: GitHub users can have private emails. Reject rather than
	// create a corrupt account with an empty email.
	if email == "" {
		return nil, errors.BadRequest("OAuth provider did not return an email address. Please make your email public or use a different login method.")
	}

	// BUG-16 fix: distinguish a "user not found" (expected for new OAuth users)
	// from an actual database error. Only create a new user in the first case.
	user, err := s.repo.GetByEmail(ctx, email)
	if err != nil {
		appErr, isAppErr := err.(*errors.AppError)
		if !isAppErr || appErr.HTTPStatus != 404 {
			return nil, errors.Internal("Database error during OAuth user lookup")
		}
		// User genuinely does not exist — create them.
		user = &domain.User{
			Email:      email,
			FirstName:  firstName,
			LastName:   lastName,
			IsVerified: true,
		}
		user, err = s.repo.Create(ctx, *user)
		if err != nil {
			return nil, errors.Internal("Failed to create user account")
		}
	}

	return s.generateAuthResponse(user)
}

// verifyOAuthState checks the state exists in the pending store and has not expired.
func (s *authService) verifyOAuthState(state string) error {
	if state == "" {
		return errors.BadRequest("Missing OAuth state parameter")
	}
	raw, ok := s.pendingStates.LoadAndDelete(state)
	if !ok {
		return errors.BadRequest("Invalid OAuth state — possible CSRF attack")
	}
	st := raw.(oauthState)
	if time.Now().After(st.expiry) {
		return errors.BadRequest("OAuth state has expired. Please try logging in again.")
	}
	return nil
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
	// BUG-14 fix: handle NewRequest error explicitly instead of ignoring it.
	req, err := http.NewRequest("GET", "https://api.github.com/user", nil)
	if err != nil {
		return "", "", "", fmt.Errorf("failed to build GitHub user request: %w", err)
	}
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

	// BUG-03 fix: GitHub profiles may have an empty public email.
	// Fall back to the /user/emails endpoint to find the primary verified address.
	email := profile.Email
	if email == "" {
		var fetchErr error
		email, fetchErr = s.fetchGitHubPrimaryEmail(accessToken)
		if fetchErr != nil {
			// Non-fatal: we already know the login name, so log and return empty.
			// The caller (HandleOAuthCallback) will reject the empty email gracefully.
			log.Printf("warn: could not fetch GitHub primary email for login %s: %v", profile.Login, fetchErr)
		}
	}

	return email, profile.Name, "", nil
}

// fetchGitHubPrimaryEmail calls the /user/emails endpoint to get the verified primary email.
func (s *authService) fetchGitHubPrimaryEmail(accessToken string) (string, error) {
	req, err := http.NewRequest("GET", "https://api.github.com/user/emails", nil)
	if err != nil {
		return "", fmt.Errorf("failed to build GitHub emails request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	var emails []struct {
		Email    string `json:"email"`
		Primary  bool   `json:"primary"`
		Verified bool   `json:"verified"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&emails); err != nil {
		return "", err
	}
	for _, e := range emails {
		if e.Primary && e.Verified {
			return e.Email, nil
		}
	}
	return "", fmt.Errorf("no verified primary email found for GitHub user")
}

func (s *authService) Signup(ctx context.Context, req domain.SignupRequest) (*domain.AuthResponse, error) {
	_, err := s.repo.GetByEmail(ctx, req.Email)
	if err == nil {
		return nil, errors.BadRequest("User with this email already exists")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, errors.Internal("Failed to secure password")
	}

	user := domain.User{
		Email:        req.Email,
		FirstName:    req.FirstName,
		LastName:     req.LastName,
		PasswordHash: string(hashedPassword),
	}

	createdUser, err := s.repo.Create(ctx, user)
	if err != nil {
		return nil, errors.Internal("Failed to create user account")
	}

	go func() {
		if err := s.mailService.SendWelcome(createdUser.Email, createdUser.FirstName); err != nil {
			log.Printf("failed to send welcome email to %s: %v", createdUser.Email, err)
		}
	}()

	return s.generateAuthResponse(createdUser)
}

func (s *authService) Login(ctx context.Context, req domain.LoginRequest) (*domain.AuthResponse, error) {
	user, err := s.repo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil, errors.Unauthorized("Invalid email or password")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(req.Password))
	if err != nil {
		return nil, errors.Unauthorized("Invalid email or password")
	}

	return s.generateAuthResponse(user)
}

func (s *authService) RefreshToken(ctx context.Context, refreshToken string) (*domain.AuthResponse, error) {
	// BUG-01 fix: validate that the token is specifically a refresh token.
	// Previously, any valid access token could be used here.
	userID, err := s.validateTypedToken(refreshToken, tokenTypeRefresh)
	if err != nil {
		return nil, errors.Unauthorized("Invalid or expired session")
	}

	user, err := s.repo.GetByID(ctx, userID)
	if err != nil {
		return nil, errors.NotFound("User account no longer exists")
	}

	return s.generateAuthResponse(user)
}

func (s *authService) ForgotPassword(ctx context.Context, req domain.ForgotPasswordRequest) error {
	_, err := s.repo.GetByEmail(ctx, req.Email)
	if err != nil {
		return nil // Avoid user enumeration
	}

	// BUG-10 fix: generateOTP now returns an error instead of a static fallback.
	otp, err := generateOTP(6)
	if err != nil {
		return errors.Internal("Failed to generate OTP")
	}

	if err := s.otpRepo.DeleteByEmail(ctx, req.Email); err != nil {
		return fmt.Errorf("failed to cleanup old OTPs: %w", err)
	}

	if err := s.otpRepo.Create(ctx, req.Email, otp, time.Now().Add(10*time.Minute)); err != nil {
		return fmt.Errorf("failed to store OTP: %w", err)
	}

	go func() {
		if err := s.mailService.SendOTP(req.Email, otp); err != nil {
			log.Printf("failed to send OTP email to %s: %v", req.Email, err)
		}
	}()

	return nil
}

func (s *authService) ResetPassword(ctx context.Context, req domain.ResetPasswordRequest) error {
	valid, err := s.otpRepo.Verify(ctx, req.Email, req.OTP)
	if err != nil || !valid {
		return errors.BadRequest("Invalid or expired OTP")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return errors.Internal("Failed to secure new password")
	}

	if err := s.repo.UpdatePassword(ctx, req.Email, string(hashedPassword)); err != nil {
		return errors.Internal("Failed to update password in database")
	}

	// BUG-12 fix: OTP cleanup failure is now logged instead of silently discarded.
	// The reset succeeded, but leaving a used OTP around is a security concern.
	if err := s.otpRepo.DeleteByEmail(ctx, req.Email); err != nil {
		log.Printf("warn: failed to delete OTP after password reset for %s: %v", req.Email, err)
	}

	return nil
}

func (s *authService) generateAuthResponse(user *domain.User) (*domain.AuthResponse, error) {
	accessToken, accessExp, err := s.createToken(user.ID, tokenTypeAccess, s.accessTokenExpiry)
	if err != nil {
		return nil, errors.Internal("Failed to generate access token")
	}

	refreshToken, _, err := s.createToken(user.ID, tokenTypeRefresh, s.refreshTokenExpiry)
	if err != nil {
		return nil, errors.Internal("Failed to generate refresh token")
	}

	return &domain.AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresAt:    accessExp.Format(time.RFC3339),
		User:         *user,
	}, nil
}

// createToken mints a signed JWT with an explicit token_type claim.
func (s *authService) createToken(userID, tokenType string, expiry time.Duration) (string, time.Time, error) {
	expirationTime := time.Now().Add(expiry)
	claims := jwt.MapClaims{
		"sub":        userID,
		"exp":        expirationTime.Unix(),
		"iat":        time.Now().Unix(),
		"token_type": tokenType, // BUG-01 fix
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(s.jwtSecret)
	return tokenString, expirationTime, err
}

// ValidateToken validates a token and asserts it is an access token.
func (s *authService) ValidateToken(tokenString string) (string, error) {
	return s.validateTypedToken(tokenString, tokenTypeAccess)
}

// validateTypedToken parses a JWT and checks that its token_type matches expectedType.
func (s *authService) validateTypedToken(tokenString, expectedType string) (string, error) {
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
			return "", fmt.Errorf("invalid token claims: missing sub")
		}
		// BUG-01 fix: reject tokens whose type does not match what we expect.
		tokenType, _ := claims["token_type"].(string)
		if tokenType != expectedType {
			return "", fmt.Errorf("invalid token type: expected %s, got %s", expectedType, tokenType)
		}
		return sub, nil
	}

	return "", fmt.Errorf("invalid token")
}

// generateOTP returns a cryptographically random numeric OTP of the given length.
// BUG-10 fix: returns an error instead of a static "123456" fallback.
func generateOTP(max int) (string, error) {
	var table = [...]byte{'1', '2', '3', '4', '5', '6', '7', '8', '9', '0'}
	b := make([]byte, max)
	n, err := io.ReadAtLeast(rand.Reader, b, max)
	if n != max || err != nil {
		return "", fmt.Errorf("failed to generate secure OTP: %w", err)
	}
	for i := 0; i < len(b); i++ {
		b[i] = table[int(b[i])%len(table)]
	}
	return string(b), nil
}

// generateRandomString returns a hex-encoded random string of n bytes.
// BUG-11 fix: returns an error instead of a static "static_state_fallback".
func generateRandomString(n int) (string, error) {
	b := make([]byte, n)
	if _, err := rand.Read(b); err != nil {
		return "", fmt.Errorf("failed to generate secure random string: %w", err)
	}
	return fmt.Sprintf("%x", b), nil
}
