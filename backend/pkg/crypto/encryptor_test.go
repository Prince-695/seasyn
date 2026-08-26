package crypto_test

import (
	"testing"

	"github.com/Prince-695/seasyn/backend/pkg/crypto"
)

func TestEncryptor_RoundTrip(t *testing.T) {
	enc := crypto.NewEncryptor("super-secret-jwt-key-for-testing-12345")

	secretPasswords := []string{
		"postgres_super_secret_password_123!#",
		"mysql_root_pass",
		"mongodb+srv://admin:pass123@cluster0.abc.mongodb.net/test?retryWrites=true",
		"",
		"a",
		"very-long-connection-string-with-special-characters-!@#$%^&*()_+~`|}{[]:;?><,./-=",
	}

	for _, original := range secretPasswords {
		encrypted, err := enc.Encrypt(original)
		if err != nil {
			t.Fatalf("encryption failed for '%s': %v", original, err)
		}

		if original != "" && encrypted == original {
			t.Errorf("encrypted text should not equal plain text: %s", encrypted)
		}

		decrypted, err := enc.Decrypt(encrypted)
		if err != nil {
			t.Fatalf("decryption failed for '%s': %v", original, err)
		}

		if decrypted != original {
			t.Errorf("expected '%s', got '%s'", original, decrypted)
		}
	}
}

func TestEncryptor_TamperedCiphertext(t *testing.T) {
	enc := crypto.NewEncryptor("secret-key")

	encrypted, err := enc.Encrypt("my-secret-password")
	if err != nil {
		t.Fatalf("encrypt failed: %v", err)
	}

	// Tamper with the ciphertext by flipping a character
	tampered := []byte(encrypted)
	if tampered[len(tampered)-1] == 'a' {
		tampered[len(tampered)-1] = 'b'
	} else {
		tampered[len(tampered)-1] = 'a'
	}

	_, err = enc.Decrypt(string(tampered))
	if err == nil {
		t.Fatal("expected decryption of tampered ciphertext to fail, but it succeeded")
	}
}
