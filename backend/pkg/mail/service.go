package mail

import (
	"bytes"
	"fmt"
	"html/template"
	"net/smtp"
	"path/filepath"

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
	return &mailService{
		host:        host,
		port:        port,
		user:        user,
		pass:        pass,
		from:        fmt.Sprintf("SEASYN <%s>", from), // Adds a friendly sender name to reduce spam score
		auth:        smtp.PlainAuth("", user, pass, host),
		templateDir: templateDir,
		frontendURL: frontendURL,
	}
}

func (s *mailService) SendOTP(to, otp string) error {
	e := email.NewEmail()
	e.From = s.from
	e.To = []string{to}
	e.Subject = "SEASYN - Password Reset OTP"

	tmplPath := filepath.Join(s.templateDir, "otp.html")
	tmpl, err := template.ParseFiles(tmplPath)
	
	// Always set a plain-text alternative. Emails with ONLY HTML often get flagged as spam.
	e.Text = []byte(fmt.Sprintf("Your SEASYN Password Reset OTP is: %s\n\nIt will expire in 10 minutes. If you did not request this, please ignore this email.", otp))

	if err == nil {
		var body bytes.Buffer
		if err := tmpl.Execute(&body, map[string]string{"OTP": otp}); err == nil {
			e.HTML = body.Bytes()
		}
	}

	addr := fmt.Sprintf("%s:%s", s.host, s.port)
	return e.Send(addr, s.auth)
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

	addr := fmt.Sprintf("%s:%s", s.host, s.port)
	return e.Send(addr, s.auth)
}
