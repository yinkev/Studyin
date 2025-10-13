from __future__ import annotations

import logging
from time import perf_counter
from typing import Any, Dict, List, Literal, Sequence, TypedDict

from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect

from app.api.deps import HARDCODED_USER_ID, ensure_hardcoded_user
from app.config import settings
from app.db.session import get_db
from app.services.codex_llm import get_codex_llm
from app.services.rag_service import RagContextChunk
from app.services.rag_service_cached import get_cached_rag_service
from app.services.cache_rag import RagCacheService

try:  # pragma: no cover - optional dependency guard
    from sqlalchemy.ext.asyncio import AsyncSession
except ImportError:  # pragma: no cover - fallback when SQLAlchemy missing
    AsyncSession = object  # type: ignore

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/chat", tags=["chat"])


class WebSocketMessage(TypedDict, total=False):
    """Incoming WebSocket payload structure."""

    type: Literal["user_message"]
    content: str
    user_level: int
    profile: str  # "studyin_fast", "studyin_study", or "studyin_deep"
    effort: str   # optional: minimal | low | medium | high


class ChatHistoryEntry(TypedDict):
    """Represents past chat turns tracked server-side."""

    role: Literal["user", "assistant"]
    content: str


def _build_prompt(
    *,
    question: str,
    user_level: int,
    history: Sequence[ChatHistoryEntry],
    context_block: str,
) -> str:
    """Compose the full prompt sent to Codex."""
    clipped_history = history[-6:]
    if clipped_history:
        formatted_history = "\n".join(
            f"{'Student' if turn['role'] == 'user' else 'Coach'}: {turn['content']}".strip()
            for turn in clipped_history
        )
    else:
        formatted_history = "No prior conversation."

    return (
        "You are StudyIn's AI medical coach. Use the Socratic method, guiding the student with "
        "questions, hints, and clinical reasoning rather than giving answers outright. "
        "Stay supportive and encourage reflection. Reference the provided study materials only.\n\n"
        f"Student level (1 beginner - 5 expert): {user_level}\n\n"
        f"Relevant study materials:\n{context_block}\n\n"
        "Conversation so far:\n"
        f"{formatted_history}\n\n"
        "Current student question:\n"
        f"{question}\n\n"
        "Respond in markdown. Encourage the student to explain their thinking. "
        "Ask at least one probing question and suggest a next step if appropriate."
    )


@router.websocket("/ws")
async def chat_websocket(
    websocket: WebSocket,
    session: AsyncSession = Depends(get_db),
) -> None:
    """
    WebSocket endpoint for the AI coaching chat interface.

    The MVP runs against a hardcoded user (for demo purposes) and streams Codex tokens to the client.
    """

    # Validate WebSocket origin to prevent CORS issues
    origin = websocket.headers.get("origin")
    allowed_origins = settings.get_cors_origins_list()

    if origin and origin not in allowed_origins:
        logger.warning(
            "websocket_rejected_invalid_origin",
            extra={"origin": origin, "allowed": allowed_origins}
        )
        await websocket.close(code=1008)  # Policy Violation
        return

    await websocket.accept()
    user = await ensure_hardcoded_user(session)
    rag_service = get_cached_rag_service(RagCacheService())
    codex_llm = get_codex_llm()
    history: List[ChatHistoryEntry] = []
    user_id_str = str(user.id or HARDCODED_USER_ID)
    session_start = perf_counter()
    user_message_count = 0
    assistant_message_count = 0
    streamed_token_events = 0
    disconnect_reason = "completed"
    client_info = getattr(websocket, "client", None)

    logger.info(
        "websocket_connected",
        extra={
            "user_id": user_id_str,
            "client_host": getattr(client_info, "host", None),
            "client_port": getattr(client_info, "port", None),
        },
    )

    try:
        await websocket.send_json(
            {
                "type": "info",
                "message": "Connected to StudyIn AI coach.",
                "user_id": user_id_str,
            }
        )
    except Exception as send_error:
        logger.error(
            "failed_to_send_welcome_message",
            extra={
                "user_id": user_id_str,
                "error": str(send_error),
                "error_type": type(send_error).__name__,
            },
        )
        raise

    try:
        while True:
            message: WebSocketMessage = await websocket.receive_json()
            if message.get("type") != "user_message":
                logger.warning(
                    "unsupported_websocket_message",
                    extra={"user_id": user_id_str, "message_type": message.get("type")},
                )
                await websocket.send_json(
                    {"type": "error", "message": "Unsupported message type.", "received": message}
                )
                continue

            content = (message.get("content") or "").strip()
            if not content:
                logger.warning(
                    "empty_chat_message",
                    extra={"user_id": user_id_str},
                )
                await websocket.send_json(
                    {"type": "error", "message": "Your message was empty. Please ask a question."}
                )
                continue

            user_message_count += 1
            logger.info(
                "chat_message_received",
                extra={
                    "user_id": user_id_str,
                    "message_length": len(content),
                    "message_index": user_message_count,
                },
            )

            user_level = message.get("user_level") or 3
            user_level = max(1, min(user_level, 5))

            # Extract profile with validation
            profile = message.get("profile") or "studyin_fast"
            if profile not in ("studyin_fast", "studyin_study", "studyin_deep"):
                profile = "studyin_fast"  # Default to fast mode

            history.append({"role": "user", "content": content})

            rag_start = perf_counter()
            try:
                chunks: List[RagContextChunk] = await rag_service.retrieve_context(
                    session=session,
                    user_id=user.id,
                    query=content,
                    top_k=4,
                )
                rag_duration_ms = round((perf_counter() - rag_start) * 1000, 2)
                logger.info(
                    "rag_context_retrieved",
                    extra={
                        "user_id": user_id_str,
                        "duration_ms": rag_duration_ms,
                        "chunks": len(chunks),
                        "materials": sorted({chunk.filename for chunk in chunks}),
                    },
                )
            except Exception as retrieval_error:  # pragma: no cover - defensive guard
                # Graceful fallback: proceed without RAG so chat still works
                logger.exception(
                    "rag_retrieval_failed_fallback",
                    extra={
                        "user_id": user_id_str,
                        "query_preview": content[:100],
                        "message_index": user_message_count,
                        "error": str(retrieval_error),
                    },
                )
                chunks = []

            await websocket.send_json(
                {
                    "type": "context",
                    "chunks": [chunk.as_display_dict() for chunk in chunks],
                }
            )

            context_block = rag_service.render_context_summary(chunks)
            prompt = _build_prompt(
                question=content,
                user_level=user_level,
                history=history,
                context_block=context_block,
            )

            # Optional per-request reasoning effort → model mapping
            effort = (message.get("effort") or "").strip().lower()
            if effort in {"minimal", "low", "medium", "high"}:
                effective_model = f"gpt-5-{effort}"
            else:
                effective_model = settings.CODEX_DEFAULT_MODEL

            try:
                stream = codex_llm.generate_completion(
                    prompt,
                    model=effective_model,
                    max_tokens=settings.CODEX_MAX_TOKENS,
                    temperature=settings.CODEX_TEMPERATURE,
                    stream=True,
                    user_id=user_id_str,
                    profile=profile,
                )
            except Exception as llm_error:  # pragma: no cover - defensive guard
                logger.exception(
                    "codex_invocation_failed",
                    extra={
                        "user_id": user_id_str,
                        "error": str(llm_error),
                        "message_index": user_message_count,
                    },
                )
                await websocket.send_json(
                    {
                        "type": "error",
                        "message": "The AI tutor is temporarily unavailable. Please try again.",
                    }
                )
                continue

            response_fragments: List[str] = []
            try:
                async for token in stream:
                    response_fragments.append(token)
                    streamed_token_events += 1
                    await websocket.send_json({"type": "token", "value": token})
            except Exception as stream_error:  # pragma: no cover - defensive guard
                logger.exception(
                    "codex_stream_failed",
                    extra={
                        "user_id": user_id_str,
                        "error": str(stream_error),
                        "tokens_streamed": streamed_token_events,
                        "message_index": user_message_count,
                    },
                )
                await websocket.send_json(
                    {
                        "type": "error",
                        "message": "Connection to the AI tutor was interrupted. Ask your question again.",
                    }
                )
                continue

            assistant_message = "".join(response_fragments).strip()
            if not assistant_message:
                assistant_message = "I wasn't able to generate a response this time. Let's try again."
            history.append({"role": "assistant", "content": assistant_message})
            assistant_message_count += 1

            await websocket.send_json(
                {
                    "type": "complete",
                    "message": assistant_message,
                }
            )

    except WebSocketDisconnect:
        disconnect_reason = "client_disconnect"
    except Exception as exc:  # pragma: no cover - defensive guard
        disconnect_reason = "server_error"
        logger.exception(
            "unexpected_websocket_failure",
            extra={"user_id": user_id_str, "error": str(exc)},
        )
        try:
            await websocket.send_json({"type": "error", "message": "Unexpected server error."})
        except RuntimeError:
            pass
        finally:
            await websocket.close()
    finally:
        session_duration_sec = round(perf_counter() - session_start, 2)
        total_messages = user_message_count + assistant_message_count
        logger.info(
            "websocket_disconnected",
            extra={
                "user_id": user_id_str,
                "session_duration_sec": session_duration_sec,
                "user_messages": user_message_count,
                "assistant_messages": assistant_message_count,
                "messages_sent": total_messages,
                "tokens_streamed": streamed_token_events,
                "reason": disconnect_reason,
            },
        )
