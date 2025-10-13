"""API contract types shared between frontend and backend.

This module defines the exact structure of data exchanged via WebSocket
and REST API endpoints. These types serve as the contract between
frontend and backend.

Keep these types in sync with frontend types in:
    frontend/src/types/api-contract.ts

Usage:
    from app.schemas.api_contract import ContextChunk, WebSocketMessage
"""

from __future__ import annotations

from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field


class ContextChunk(BaseModel):
    """A chunk of document content retrieved from RAG system.

    This structure is sent to clients via WebSocket when relevant
    context is found for a user's question.
    """

    id: str = Field(..., description="Unique chunk identifier")
    filename: str = Field(..., description="Source document filename")
    chunk_index: int = Field(..., description="Index of chunk within document")
    content: str = Field(..., description="Text content of the chunk")
    distance: Optional[float] = Field(None, description="Semantic distance/similarity score")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional metadata")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "chunk_123",
                "filename": "cardiology_notes.pdf",
                "chunk_index": 5,
                "content": "The cardiac cycle consists of systole and diastole...",
                "distance": 0.23,
                "metadata": {"page": 12, "section": "Cardiovascular Physiology"},
            }
        }


# =============================================================================
# WebSocket Message Types (Server → Client)
# =============================================================================


class WSInfoMessage(BaseModel):
    """Informational message from server."""

    type: Literal["info"] = "info"
    message: str = Field(..., description="Info message content")
    user_id: Optional[str] = Field(None, description="User ID (for logging)")

    class Config:
        json_schema_extra = {
            "example": {
                "type": "info",
                "message": "Connected to AI coach",
                "user_id": "user_123",
            }
        }


class WSContextMessage(BaseModel):
    """Context chunks retrieved from RAG."""

    type: Literal["context"] = "context"
    chunks: List[ContextChunk] = Field(..., description="Retrieved context chunks")

    class Config:
        json_schema_extra = {
            "example": {
                "type": "context",
                "chunks": [
                    {
                        "id": "chunk_123",
                        "filename": "cardiology_notes.pdf",
                        "chunk_index": 5,
                        "content": "The cardiac cycle...",
                        "distance": 0.23,
                        "metadata": {},
                    }
                ],
            }
        }


class WSTokenMessage(BaseModel):
    """Streaming token from LLM."""

    type: Literal["token"] = "token"
    value: str = Field(..., description="Token text")

    class Config:
        json_schema_extra = {
            "example": {
                "type": "token",
                "value": "The cardiac cycle consists of ",
            }
        }


class WSCompleteMessage(BaseModel):
    """Completion signal (end of response)."""

    type: Literal["complete"] = "complete"
    message: Optional[str] = Field(None, description="Final complete message (if applicable)")

    class Config:
        json_schema_extra = {
            "example": {
                "type": "complete",
                "message": "The cardiac cycle consists of systole and diastole.",
            }
        }


class WSErrorMessage(BaseModel):
    """Error message from server."""

    type: Literal["error"] = "error"
    message: str = Field(..., description="Error message")

    class Config:
        json_schema_extra = {
            "example": {
                "type": "error",
                "message": "Failed to process question",
            }
        }


# Union type for all server messages
WebSocketServerMessage = (
    WSInfoMessage | WSContextMessage | WSTokenMessage | WSCompleteMessage | WSErrorMessage
)


# =============================================================================
# WebSocket Message Types (Client → Server)
# =============================================================================


class WSUserMessage(BaseModel):
    """User message sent to AI coach."""

    type: Literal["user_message"] = "user_message"
    content: str = Field(..., description="User's question/message")
    user_level: int = Field(3, ge=1, le=5, description="User knowledge level (1-5)")
    profile: Optional[str] = Field("studyin_fast", description="Codex profile to use")

    class Config:
        json_schema_extra = {
            "example": {
                "type": "user_message",
                "content": "Explain the cardiac cycle",
                "user_level": 3,
                "profile": "studyin_fast",
            }
        }


# Union type for all client messages
WebSocketClientMessage = WSUserMessage


# =============================================================================
# Material/Upload Types
# =============================================================================


class MaterialMetadata(BaseModel):
    """Metadata for uploaded study material."""

    filename: str = Field(..., description="Original filename")
    file_size: int = Field(..., description="File size in bytes")
    mime_type: str = Field(..., description="MIME type")
    upload_date: str = Field(..., description="ISO 8601 upload timestamp")
    chunk_count: Optional[int] = Field(None, description="Number of chunks created")

    class Config:
        json_schema_extra = {
            "example": {
                "filename": "cardiology_notes.pdf",
                "file_size": 1048576,
                "mime_type": "application/pdf",
                "upload_date": "2025-10-11T12:00:00Z",
                "chunk_count": 42,
            }
        }
