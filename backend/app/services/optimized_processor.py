"""Optimized document processing service with parallel processing and batching.

Provides high-performance document processing with:
- Parallel chunk processing
- Batch embedding generation
- Memory-efficient streaming
- Smart chunking strategies
"""

from __future__ import annotations

import asyncio
import hashlib
import logging
from concurrent.futures import ThreadPoolExecutor
from io import BytesIO
from typing import AsyncIterator, List, Optional, Tuple

import numpy as np
from pydantic import BaseModel

logger = logging.getLogger(__name__)

# Lazy imports for optional dependencies
try:
    import pypdf
    import fitz  # PyMuPDF
    PDF_LIBS_AVAILABLE = True
except ImportError:
    PDF_LIBS_AVAILABLE = False
    logger.warning("PDF libraries not available. Install pypdf and PyMuPDF for PDF support.")


class ChunkMetadata(BaseModel):
    """Metadata for document chunks."""

    chunk_index: int
    start_page: Optional[int] = None
    end_page: Optional[int] = None
    char_count: int
    word_count: int
    semantic_density: float = 0.0
    has_tables: bool = False
    has_images: bool = False


class ProcessingMetrics(BaseModel):
    """Metrics for document processing performance."""

    total_chunks: int
    processing_time_ms: float
    avg_chunk_size: float
    memory_used_mb: float
    parallel_efficiency: float


class OptimizedDocumentProcessor:
    """High-performance document processor with parallel processing."""

    def __init__(
        self,
        max_workers: int = 4,
        chunk_size: int = 1000,
        chunk_overlap: int = 200,
        min_chunk_size: int = 100,
        max_chunk_size: int = 2000,
        batch_size: int = 10,
    ):
        """Initialize processor with optimized settings.

        Args:
            max_workers: Maximum parallel workers
            chunk_size: Target chunk size in characters
            chunk_overlap: Overlap between chunks
            min_chunk_size: Minimum chunk size
            max_chunk_size: Maximum chunk size
            batch_size: Batch size for embedding generation
        """
        self.max_workers = max_workers
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap
        self.min_chunk_size = min_chunk_size
        self.max_chunk_size = max_chunk_size
        self.batch_size = batch_size
        self.executor = ThreadPoolExecutor(max_workers=max_workers)

    async def process_document_stream(
        self,
        file_content: bytes,
        file_type: str,
    ) -> AsyncIterator[Tuple[str, ChunkMetadata]]:
        """Process document as a stream for memory efficiency.

        Args:
            file_content: Document content
            file_type: MIME type of document

        Yields:
            Tuples of (chunk_text, metadata)
        """
        if file_type == "application/pdf":
            async for chunk in self._process_pdf_stream(file_content):
                yield chunk
        elif file_type in ["text/plain", "text/markdown"]:
            async for chunk in self._process_text_stream(file_content.decode("utf-8")):
                yield chunk
        else:
            raise ValueError(f"Unsupported file type: {file_type}")

    async def _process_pdf_stream(
        self,
        pdf_content: bytes,
    ) -> AsyncIterator[Tuple[str, ChunkMetadata]]:
        """Stream process PDF document.

        Args:
            pdf_content: PDF file content

        Yields:
            Tuples of (chunk_text, metadata)
        """
        if not PDF_LIBS_AVAILABLE:
            raise RuntimeError("PDF libraries not installed")

        # Use PyMuPDF for better performance
        pdf_stream = BytesIO(pdf_content)
        doc = fitz.open(stream=pdf_stream, filetype="pdf")

        try:
            # Process pages in parallel batches
            total_pages = len(doc)
            chunk_index = 0

            for batch_start in range(0, total_pages, self.batch_size):
                batch_end = min(batch_start + self.batch_size, total_pages)
                batch_pages = range(batch_start, batch_end)

                # Extract text from batch in parallel
                loop = asyncio.get_event_loop()
                batch_texts = await loop.run_in_executor(
                    self.executor,
                    self._extract_batch_pages,
                    doc,
                    list(batch_pages),
                )

                # Process and chunk the batch text
                for page_num, page_text in zip(batch_pages, batch_texts):
                    if not page_text.strip():
                        continue

                    # Smart chunking with semantic boundaries
                    chunks = self._smart_chunk_text(page_text)

                    for chunk_text in chunks:
                        if len(chunk_text) < self.min_chunk_size:
                            continue

                        metadata = ChunkMetadata(
                            chunk_index=chunk_index,
                            start_page=page_num + 1,
                            end_page=page_num + 1,
                            char_count=len(chunk_text),
                            word_count=len(chunk_text.split()),
                            semantic_density=self._calculate_semantic_density(chunk_text),
                        )

                        yield (chunk_text, metadata)
                        chunk_index += 1

        finally:
            doc.close()

    async def _process_text_stream(
        self,
        text: str,
    ) -> AsyncIterator[Tuple[str, ChunkMetadata]]:
        """Stream process text document.

        Args:
            text: Document text

        Yields:
            Tuples of (chunk_text, metadata)
        """
        # Smart chunking with semantic boundaries
        chunks = self._smart_chunk_text(text)
        chunk_index = 0

        for chunk_text in chunks:
            if len(chunk_text) < self.min_chunk_size:
                continue

            metadata = ChunkMetadata(
                chunk_index=chunk_index,
                char_count=len(chunk_text),
                word_count=len(chunk_text.split()),
                semantic_density=self._calculate_semantic_density(chunk_text),
            )

            yield (chunk_text, metadata)
            chunk_index += 1

    def _extract_batch_pages(
        self,
        doc: any,  # fitz.Document
        page_numbers: List[int],
    ) -> List[str]:
        """Extract text from multiple pages in parallel.

        Args:
            doc: PyMuPDF document
            page_numbers: Page numbers to extract

        Returns:
            List of page texts
        """
        texts = []
        for page_num in page_numbers:
            page = doc[page_num]
            text = page.get_text()
            texts.append(text)
        return texts

    def _smart_chunk_text(self, text: str) -> List[str]:
        """Smart text chunking with semantic boundary detection.

        Args:
            text: Text to chunk

        Returns:
            List of text chunks
        """
        # Split by paragraphs first
        paragraphs = text.split("\n\n")
        chunks = []
        current_chunk = []
        current_size = 0

        for para in paragraphs:
            para = para.strip()
            if not para:
                continue

            para_size = len(para)

            # If paragraph is too large, split by sentences
            if para_size > self.max_chunk_size:
                sentences = self._split_sentences(para)
                for sent in sentences:
                    sent_size = len(sent)

                    if current_size + sent_size > self.chunk_size:
                        if current_chunk:
                            chunks.append(" ".join(current_chunk))
                        current_chunk = [sent]
                        current_size = sent_size
                    else:
                        current_chunk.append(sent)
                        current_size += sent_size

            # If adding paragraph exceeds chunk size, start new chunk
            elif current_size + para_size > self.chunk_size:
                if current_chunk:
                    chunks.append("\n\n".join(current_chunk))

                # Add overlap from previous chunk if available
                if chunks and self.chunk_overlap > 0:
                    overlap_text = chunks[-1][-self.chunk_overlap:]
                    current_chunk = [overlap_text, para]
                    current_size = len(overlap_text) + para_size
                else:
                    current_chunk = [para]
                    current_size = para_size

            else:
                current_chunk.append(para)
                current_size += para_size

        # Add remaining chunk
        if current_chunk:
            chunks.append("\n\n".join(current_chunk))

        return chunks

    def _split_sentences(self, text: str) -> List[str]:
        """Split text into sentences.

        Args:
            text: Text to split

        Returns:
            List of sentences
        """
        # Simple sentence splitting (can be improved with NLTK or spaCy)
        import re

        sentences = re.split(r"(?<=[.!?])\s+", text)
        return [s.strip() for s in sentences if s.strip()]

    def _calculate_semantic_density(self, text: str) -> float:
        """Calculate semantic density of text.

        Args:
            text: Text to analyze

        Returns:
            Semantic density score (0-1)
        """
        # Simple heuristic: ratio of unique words to total words
        words = text.lower().split()
        if not words:
            return 0.0

        unique_words = set(words)
        density = len(unique_words) / len(words)

        # Adjust for text length (longer texts naturally have lower density)
        length_factor = min(1.0, len(words) / 100)
        adjusted_density = density * (0.5 + 0.5 * length_factor)

        return min(1.0, adjusted_density)

    async def batch_process_embeddings(
        self,
        chunks: List[str],
        embedding_func: callable,
    ) -> List[np.ndarray]:
        """Process embeddings in batches for efficiency.

        Args:
            chunks: Text chunks to embed
            embedding_func: Function to generate embeddings

        Returns:
            List of embedding vectors
        """
        embeddings = []

        # Process in batches
        for i in range(0, len(chunks), self.batch_size):
            batch = chunks[i : i + self.batch_size]

            # Generate embeddings in parallel
            loop = asyncio.get_event_loop()
            batch_embeddings = await loop.run_in_executor(
                self.executor,
                lambda: [embedding_func(chunk) for chunk in batch],
            )

            embeddings.extend(batch_embeddings)

        return embeddings

    def get_content_hash(self, content: bytes) -> str:
        """Generate hash for content deduplication.

        Args:
            content: Document content

        Returns:
            SHA256 hash of content
        """
        return hashlib.sha256(content).hexdigest()

    async def cleanup(self) -> None:
        """Clean up resources."""
        self.executor.shutdown(wait=True)


class DocumentCache:
    """Cache for processed documents to avoid reprocessing."""

    def __init__(self, max_size: int = 100):
        """Initialize document cache.

        Args:
            max_size: Maximum number of documents to cache
        """
        self.max_size = max_size
        self._cache = {}
        self._access_order = []

    def get(self, doc_hash: str) -> Optional[List[Tuple[str, ChunkMetadata]]]:
        """Get cached document chunks.

        Args:
            doc_hash: Document hash

        Returns:
            Cached chunks or None
        """
        if doc_hash in self._cache:
            # Update access order
            self._access_order.remove(doc_hash)
            self._access_order.append(doc_hash)
            return self._cache[doc_hash]
        return None

    def put(self, doc_hash: str, chunks: List[Tuple[str, ChunkMetadata]]) -> None:
        """Cache document chunks.

        Args:
            doc_hash: Document hash
            chunks: Document chunks with metadata
        """
        # Evict oldest if cache is full
        if len(self._cache) >= self.max_size and doc_hash not in self._cache:
            oldest = self._access_order.pop(0)
            del self._cache[oldest]

        self._cache[doc_hash] = chunks
        if doc_hash in self._access_order:
            self._access_order.remove(doc_hash)
        self._access_order.append(doc_hash)

    def clear(self) -> None:
        """Clear the cache."""
        self._cache.clear()
        self._access_order.clear()


# Global instances
document_processor = OptimizedDocumentProcessor()
document_cache = DocumentCache()