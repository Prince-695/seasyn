package users

import (
	"context"
	"regexp"
	"strings"

	"github.com/Prince-695/seasyn/backend/internal/domain"
	"github.com/Prince-695/seasyn/backend/internal/ports"
	"github.com/Prince-695/seasyn/backend/pkg/errors"
)

type usersService struct {
	repo ports.UserRepository
}

func NewUsersService(repo ports.UserRepository) ports.UsersService {
	return &usersService{repo: repo}
}

func (s *usersService) GetMe(ctx context.Context, userID string) (*domain.PublicUser, error) {
	user, err := s.repo.GetByID(ctx, userID)
	if err != nil {
		return nil, errors.NotFound("User not found")
	}

	return &domain.PublicUser{
		Username:   user.Username,
		Email:      user.Email,
		FirstName:  user.FirstName,
		LastName:   user.LastName,
		IsVerified: user.IsVerified,
		CreatedAt:  user.CreatedAt,
		UpdatedAt:  user.UpdatedAt,
	}, nil
}

func (s *usersService) CheckUsername(ctx context.Context, username string) (bool, error) {
	return s.repo.CheckUsername(ctx, strings.ToLower(username))
}

func (s *usersService) SetUsername(ctx context.Context, userID, username string) error {
	user, err := s.repo.GetByID(ctx, userID)
	if err != nil {
		return errors.NotFound("User not found")
	}

	if user.Username != "" {
		return errors.BadRequest("Username is already set and cannot be changed")
	}

	username = strings.ToLower(username)

	valid, _ := regexp.MatchString(`^[a-z0-9_]{3,20}$`, username)
	if !valid {
		return errors.BadRequest("Username must be 3-20 characters long and can only contain lowercase letters, numbers, and underscores")
	}

	taken, err := s.repo.CheckUsername(ctx, username)
	if err != nil {
		return errors.Internal("Failed to check username availability")
	}
	if taken {
		return errors.BadRequest("Username is already taken")
	}

	user.Username = username
	_, err = s.repo.Update(ctx, *user)
	if err != nil {
		return errors.Internal("Failed to set username")
	}

	return nil
}

func (s *usersService) UpdateProfile(ctx context.Context, userID string, req domain.UpdateProfileRequest) (*domain.PublicUser, error) {
	user, err := s.repo.GetByID(ctx, userID)
	if err != nil {
		return nil, errors.NotFound("User not found")
	}

	user.FirstName = req.FirstName
	user.LastName = req.LastName

	updatedUser, err := s.repo.Update(ctx, *user)
	if err != nil {
		return nil, errors.Internal("Failed to update profile")
	}

	return &domain.PublicUser{
		Username:   updatedUser.Username,
		Email:      updatedUser.Email,
		FirstName:  updatedUser.FirstName,
		LastName:   updatedUser.LastName,
		IsVerified: updatedUser.IsVerified,
		CreatedAt:  updatedUser.CreatedAt,
		UpdatedAt:  updatedUser.UpdatedAt,
	}, nil
}
