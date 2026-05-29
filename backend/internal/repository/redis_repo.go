package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/Prince-695/seasyn/backend/internal/ports"
	"github.com/redis/go-redis/v9"
)

type redisRepo struct {
	client *redis.Client
}

func NewRedisRepository(client *redis.Client) ports.RedisRepository {
	return &redisRepo{client: client}
}

func (r *redisRepo) SetOTP(ctx context.Context, email, otp string, ttl time.Duration) error {
	key := fmt.Sprintf("otp:%s", email)
	return r.client.Set(ctx, key, otp, ttl).Err()
}

func (r *redisRepo) GetOTP(ctx context.Context, email string) (string, error) {
	key := fmt.Sprintf("otp:%s", email)
	return r.client.Get(ctx, key).Result()
}

func (r *redisRepo) DeleteOTP(ctx context.Context, email string) error {
	key := fmt.Sprintf("otp:%s", email)
	return r.client.Del(ctx, key).Err()
}

func (r *redisRepo) BlacklistToken(ctx context.Context, tokenID string, ttl time.Duration) error {
	key := fmt.Sprintf("blacklist:%s", tokenID)
	return r.client.Set(ctx, key, "true", ttl).Err()
}

func (r *redisRepo) IsTokenBlacklisted(ctx context.Context, tokenID string) (bool, error) {
	key := fmt.Sprintf("blacklist:%s", tokenID)
	val, err := r.client.Exists(ctx, key).Result()
	if err != nil {
		return false, err
	}
	return val > 0, nil
}
