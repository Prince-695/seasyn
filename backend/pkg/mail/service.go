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
		from:        from,
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
	if err != nil {
		// Fallback to plain text
		e.Text = []byte(fmt.Sprintf("Your OTP is: %s. It will expire in 10 minutes.", otp))
	} else {
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
	if err != nil {
		e.Text = []byte(fmt.Sprintf("Welcome %s! Thanks for joining SEASYN.", name))
	} else {
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
