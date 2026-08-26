package crypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
)

// Encryptor provides AES-256-GCM authenticated symmetric encryption.
type Encryptor struct {
	key []byte
}

// NewEncryptor creates a new Encryptor. If the secret is not exactly 32 bytes,
// it derives a deterministic 32-byte SHA-256 key from it.
func NewEncryptor(secret string) *Encryptor {
	sum := sha256.Sum256([]byte(secret))
	return &Encryptor{key: sum[:]}
}

// Encrypt encrypts plainText using AES-256-GCM with a random 12-byte nonce.
// Returns a hex-encoded string containing [nonce (12 bytes) + ciphertext + tag (16 bytes)].
func (e *Encryptor) Encrypt(plainText string) (string, error) {
	if plainText == "" {
		return "", nil
	}

	block, err := aes.NewCipher(e.key)
	if err != nil {
		return "", fmt.Errorf("create aes cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("create gcm: %w", err)
	}

	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("generate nonce: %w", err)
	}

	// Seal appends the ciphertext and tag to nonce
	sealed := gcm.Seal(nonce, nonce, []byte(plainText), nil)
	return hex.EncodeToString(sealed), nil
}

// Decrypt decrypts a hex-encoded ciphertext produced by Encrypt.
func (e *Encryptor) Decrypt(cipherHex string) (string, error) {
	if cipherHex == "" {
		return "", nil
	}

	data, err := hex.DecodeString(cipherHex)
	if err != nil {
		return "", fmt.Errorf("hex decode: %w", err)
	}

	block, err := aes.NewCipher(e.key)
	if err != nil {
		return "", fmt.Errorf("create aes cipher: %w", err)
	}

	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", fmt.Errorf("create gcm: %w", err)
	}

	nonceSize := gcm.NonceSize()
	if len(data) < nonceSize {
		return "", errors.New("ciphertext too short")
	}

	nonce, ciphertext := data[:nonceSize], data[nonceSize:]
	plainBytes, err := gcm.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", fmt.Errorf("gcm decrypt failed: %w", err)
	}

	return string(plainBytes), nil
}
