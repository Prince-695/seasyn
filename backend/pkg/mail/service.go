package mail

import (
	"bytes"
	"crypto/tls"
	"fmt"
	"html/template"
	"net/smtp"
	"path/filepath"
	"strings"

	"github.com/Prince-695/seasyn/backend/internal/ports"
	"github.com/jordan-wright/email"
)

type mailService struct {
	host        string
	port        string
	user        string
	pass        string
	from        string
	auth        smtp.Auth
	templateDir string
	frontendURL string
}

func NewMailService(host, port, user, pass, from, templateDir, frontendURL string) ports.MailService {
	host = strings.TrimSpace(host)
	port = strings.TrimSpace(port)
	user = strings.TrimSpace(user)
	pass = strings.TrimSpace(pass)
	from = strings.TrimSpace(from)

	var auth smtp.Auth
	if user != "" && pass != "" {
		auth = smtp.PlainAuth("", user, pass, host)
	}

	return &mailService{
		host:        host,
		port:        port,
		user:        user,
		pass:        pass,
		from:        fmt.Sprintf("SEASYN <%s>", from), // Adds a friendly sender name to reduce spam score
		auth:        auth,
		templateDir: templateDir,
		frontendURL: frontendURL,
	}
}

func (s *mailService) sendEmail(e *email.Email) error {
	addr := fmt.Sprintf("%s:%s", s.host, s.port)
	tlsConfig := &tls.Config{
		ServerName: s.host,
	}

	// Smart port detection: Port 465 uses direct SSL/TLS; Port 587/25 uses STARTTLS
	if s.port == "465" {
		return e.SendWithTLS(addr, s.auth, tlsConfig)
	}

	// Try STARTTLS with fallback for unauthenticated relays
	err := e.SendWithStartTLS(addr, s.auth, tlsConfig)
	if err != nil && s.auth == nil {
		return e.Send(addr, nil)
	}
	return err
}

func (s *mailService) SendEmailVerificationOTP(to, otp string) error {
	e := email.NewEmail()
	e.From = s.from
	e.To = []string{to}
	e.Subject = "Verify Your Email Address - SEASYN"

	tmplPath := filepath.Join(s.templateDir, "verify_email_otp.html")
	tmpl, err := template.ParseFiles(tmplPath)

	// Always set a plain-text alternative.
	e.Text = []byte(fmt.Sprintf("Your SEASYN Email Verification OTP is: %s\n\nIt will expire in 10 minutes. If you did not request this, please ignore this email.", otp))

	if err == nil {
		var body bytes.Buffer
		if err := tmpl.Execute(&body, map[string]string{"OTP": otp}); err == nil {
			e.HTML = body.Bytes()
		}
	}

	return s.sendEmail(e)
}

func (s *mailService) SendPasswordResetOTP(to, otp string) error {
	e := email.NewEmail()
	e.From = s.from
	e.To = []string{to}
	e.Subject = "Reset Your Password - SEASYN"

	tmplPath := filepath.Join(s.templateDir, "password_reset_otp.html")
	tmpl, err := template.ParseFiles(tmplPath)

	// Always set a plain-text alternative.
	e.Text = []byte(fmt.Sprintf("Your SEASYN Password Reset OTP is: %s\n\nIt will expire in 10 minutes. If you did not request this, please ignore this email.", otp))

	if err == nil {
		var body bytes.Buffer
		if err := tmpl.Execute(&body, map[string]string{"OTP": otp}); err == nil {
			e.HTML = body.Bytes()
		}
	}

	return s.sendEmail(e)
}

func (s *mailService) SendWelcome(to, name string) error {
	e := email.NewEmail()
	e.From = s.from
	e.To = []string{to}
	e.Subject = "Welcome to SEASYN!"

	tmplPath := filepath.Join(s.templateDir, "welcome.html")
	tmpl, err := template.ParseFiles(tmplPath)

	// Always set a plain-text alternative.
	e.Text = []byte(fmt.Sprintf("Welcome aboard, %s!\n\nWe're thrilled to have you join SEASYN. You can access your dashboard here: %s", name, s.frontendURL))

	if err == nil {
		var body bytes.Buffer
		data := map[string]string{
			"Name":        name,
			"FrontendURL": s.frontendURL,
		}
		if err := tmpl.Execute(&body, data); err == nil {
			e.HTML = body.Bytes()
		}
	}

	return s.sendEmail(e)
}
