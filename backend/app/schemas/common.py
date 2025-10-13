"""Common Pydantic schemas used across the application.

This module contains reusable request/response schemas that are shared
across multiple API endpoints. This reduces duplication and ensures
consistent response structures.

Usage:
    from app.schemas.common import MessageResponse, ErrorResponse, UserPublic
"""

from __future__ import annotations

from typing import Any, Dict, Optional

from pydantic import BaseModel, EmailStr, Field


class MessageResponse(BaseModel):
    """Standard success message response."""

    message: str = Field(..., description="Success message")

    class Config:
        json_schema_extra = {
            "example": {
                "message": "Operation completed successfully",
            }
        }


class ErrorResponse(BaseModel):
    """Standard error response."""

    detail: str = Field(..., description="Error message")

    class Config:
        json_schema_extra = {
            "example": {
                "detail": "An error occurred",
            }
        }


class UserPublic(BaseModel):
    """Public user information (safe to expose to clients)."""

    id: str = Field(..., description="User UUID")
    email: EmailStr = Field(..., description="User email address")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "email": "user@example.com",
            }
        }


class TokenResponse(BaseModel):
    """Authentication token response."""

    access_token: str = Field(..., description="JWT access token")
    token_type: str = Field(default="bearer", description="Token type (always 'bearer')")

    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
            }
        }


class LoginResponse(TokenResponse):
    """Login response with access token and user info."""

    user: UserPublic = Field(..., description="Authenticated user information")

    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
                "user": {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "email": "user@example.com",
                },
            }
        }


class RegistrationResponse(BaseModel):
    """User registration response."""

    message: str = Field(..., description="Success message")
    user: UserPublic = Field(..., description="Newly registered user information")

    class Config:
        json_schema_extra = {
            "example": {
                "message": "User registered successfully",
                "user": {
                    "id": "123e4567-e89b-12d3-a456-426614174000",
                    "email": "user@example.com",
                },
            }
        }


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = Field(..., description="Service status")
    version: Optional[str] = Field(None, description="API version")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional health details")

    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "version": "1.0.0",
                "details": {
                    "database": "connected",
                    "redis": "connected",
                },
            }
        }
