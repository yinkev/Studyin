from __future__ import annotations

import logging
from typing import Any, Dict, List

from app.config import settings

logger = logging.getLogger(__name__)

# Gemini SDK import strategy: prefer new google-genai, fall back to google-generativeai
_USE_NEW_SDK = False
try:  # pragma: no cover
    from google import genai as genai_new  # type: ignore
    from google.genai import types as genai_types  # type: ignore
    _USE_NEW_SDK = True
except Exception:
    try:
        import google.generativeai as genai_old  # type: ignore
    except Exception as exc:  # pragma: no cover
        raise RuntimeError(
            "Gemini SDK not found. Install with `pip install google-genai` or `pip install google-generativeai`."
        ) from exc

try:  # pragma: no cover - dependency guard
    from chromadb import PersistentClient
except ImportError as exc:  # pragma: no cover
    raise RuntimeError("chromadb package is required for vector storage.") from exc


def _l2_normalize(vec: list[float]) -> list[float]:
    s = sum(v * v for v in vec) or 1.0
    norm = s ** 0.5
    return [v / norm for v in vec]


class EmbeddingService:
    def __init__(self) -> None:
        if not settings.GEMINI_API_KEY:
            raise RuntimeError(
                "GEMINI_API_KEY is not configured. Set GEMINI_API_KEY in the environment before running embeddings."
            )

        # Create Gemini client
        if _USE_NEW_SDK:
            self._gemini = genai_new.Client(api_key=settings.GEMINI_API_KEY)
        else:
            genai_old.configure(api_key=settings.GEMINI_API_KEY)
            self._gemini = None

        # Vector store (Chroma)
        self._client = PersistentClient(path=settings.CHROMA_PERSIST_DIR)
        self._dim = int(getattr(settings, "GEMINI_EMBEDDING_DIM", 1536) or 1536)
        coll_name = f"material_chunks_{self._dim}"
        self._collection = self._client.get_or_create_collection(
            name=coll_name,
            metadata={"hnsw:space": "cosine"},
        )

    def generate_embedding(self, text: str, *, is_query: bool = False, title: str | None = None) -> List[float]:
        if not text.strip():
            raise ValueError("Cannot generate embeddings for empty text")

        # Use string constants for compatibility across SDK versions
        task_type = "RETRIEVAL_QUERY" if is_query else "RETRIEVAL_DOCUMENT"
        dim = int(getattr(settings, "GEMINI_EMBEDDING_DIM", 1536) or 1536)

        if _USE_NEW_SDK:
            resp = self._gemini.models.embed_content(  # type: ignore[union-attr]
                model=settings.GEMINI_EMBEDDING_MODEL,
                contents=text,
                config=genai_types.EmbedContentConfig(
                    task_type=task_type,
                    title=title or None,
                    output_dimensionality=dim,
                ),
            )
            try:
                vec = resp.embeddings[0].values  # type: ignore[attr-defined]
            except Exception as exc:  # pragma: no cover
                raise RuntimeError(f"Unexpected embedding response: {resp!r}") from exc
        else:
            # google-generativeai compatibility path
            resp = genai_old.embed_content(  # type: ignore[name-defined]
                model=settings.GEMINI_EMBEDDING_MODEL,
                content=text,
                task_type=task_type,
                title=title or None,
                output_dimensionality=dim,
            )
            # Response shape: { 'embedding': { 'values': [...] } } or {'embedding': [...]}
            data = getattr(resp, 'embedding', None) or resp.get('embedding')
            if isinstance(data, dict) and 'values' in data:
                vec = data['values']
            else:
                vec = data

        return _l2_normalize([float(v) for v in vec])

    def store_chunk_embedding(self, chunk_id: str, text: str, metadata: Dict[str, Any]) -> None:
        embedding = self.generate_embedding(text, is_query=False, title=metadata.get("filename") if metadata else None)

        logger.debug(
            "store_chunk_embedding",
            extra={"chunk_id": chunk_id, "material_id": metadata.get("material_id"), "chunk_index": metadata.get("chunk_index")},
        )

        self._collection.upsert(
            ids=[chunk_id],
            embeddings=[embedding],
            documents=[text],
            metadatas=[metadata],
        )

    def search_similar(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        if top_k <= 0:
            raise ValueError("top_k must be greater than zero")

        query_embedding = self.generate_embedding(query, is_query=True)
        results = self._collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            include=["documents", "metadatas", "distances"],
        )

        matches: List[Dict[str, Any]] = []
        if not results:
            return matches

        ids = results.get("ids", [[]])[0]
        documents = results.get("documents", [[]])[0]
        metadatas = results.get("metadatas", [[]])[0]
        distances = results.get("distances", [[]])[0]

        for chunk_id, document, metadata, distance in zip(ids, documents, metadatas, distances):
            matches.append(
                {
                    "id": chunk_id,
                    "content": document,
                    "metadata": metadata,
                    "distance": distance,
                }
            )

        return matches

    def delete_chunk_embeddings(self, chunk_ids: List[str]) -> None:
        if not chunk_ids:
            return

        self._collection.delete(ids=chunk_ids)


_embedding_service: EmbeddingService | None = None


def get_embedding_service() -> EmbeddingService:
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = EmbeddingService()
    return _embedding_service
