package mail

import (
	"fmt"
	"net/smtp"

	"github.com/Prince-695/seasyn/backend/internal/ports"
	"github.com/jordan-wright/email"
)

type mailService struct {
	host string
	port string
	user string
	pass string
	from string
	auth smtp.Auth
}

func NewMailService(host, port, user, pass, from string) ports.MailService {
	return &mailService{
		host: host,
		port: port,
		user: user,
		pass: pass,
		from: from,
		auth: smtp.PlainAuth("", user, pass, host),
	}
}

func (s *mailService) SendOTP(to, otp string) error {
	e := email.NewEmail()
	e.From = s.from
	e.To = []string{to}
	e.Subject = "SEASYN - Password Reset OTP"
	e.HTML = []byte(fmt.Sprintf("<h1>Your OTP is: %s</h1><p>It will expire in 10 minutes.</p>", otp))

	addr := fmt.Sprintf("%s:%s", s.host, s.port)
	return e.Send(addr, s.auth)
}

func (s *mailService) SendWelcome(to, name string) error {
	e := email.NewEmail()
	e.From = s.from
	e.To = []string{to}
	e.Subject = "Welcome to SEASYN!"
	e.HTML = []byte(fmt.Sprintf("<h1>Welcome %s!</h1><p>Thanks for joining SEASYN.</p>", name))

	addr := fmt.Sprintf("%s:%s", s.host, s.port)
	return e.Send(addr, s.auth)
}
