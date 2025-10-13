"""
Medical Learning Platform - RAG Pipeline
Handles document processing, vector storage, and intelligent retrieval
"""

import asyncio
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum
import hashlib
import re
from datetime import datetime
import numpy as np
from pydantic import BaseModel, Field

# Vector store and embedding imports
from qdrant_client import QdrantClient
from qdrant_client.http import models as qdrant_models
from sentence_transformers import SentenceTransformer
import tiktoken
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_experimental.text_splitter import SemanticChunker
import fitz  # PyMuPDF for PDF processing


class DocumentType(Enum):
    """Types of medical documents"""
    TEXTBOOK = "textbook"
    RESEARCH_PAPER = "research_paper"
    CLINICAL_GUIDELINE = "clinical_guideline"
    LECTURE_NOTES = "lecture_notes"
    QUESTION_BANK = "question_bank"


class ChunkingStrategy(Enum):
    """Different chunking strategies for documents"""
    SEMANTIC = "semantic"          # Semantic similarity-based
    HIERARCHICAL = "hierarchical"  # Preserve document structure
    SLIDING_WINDOW = "sliding"      # Fixed size with overlap
    HYBRID = "hybrid"              # Combination of strategies


@dataclass
class DocumentMetadata:
    """Metadata for processed documents"""
    doc_id: str
    title: str
    doc_type: DocumentType
    source: str
    chapter: Optional[str] = None
    section: Optional[str] = None
    subsection: Optional[str] = None
    page_number: Optional[int] = None
    topics: List[str] = Field(default_factory=list)
    difficulty_level: Optional[int] = None  # 1-5 scale
    clinical_relevance: Optional[float] = None  # 0-1 score
    upload_date: datetime = Field(default_factory=datetime.now)
    processing_date: datetime = Field(default_factory=datetime.now)


class Chunk(BaseModel):
    """Individual chunk with metadata"""
    chunk_id: str
    content: str
    embedding: Optional[List[float]] = None
    metadata: DocumentMetadata
    token_count: int
    chunk_index: int  # Position in original document
    parent_chunk_id: Optional[str] = None  # For hierarchical chunks
    child_chunk_ids: List[str] = Field(default_factory=list)


class MedicalDocumentProcessor:
    """Process medical documents with specialized strategies"""

    def __init__(self):
        self.tokenizer = tiktoken.get_encoding("cl100k_base")
        self.medical_abbreviations = self._load_medical_abbreviations()
        self.concept_patterns = self._compile_medical_patterns()

    def _load_medical_abbreviations(self) -> Dict[str, str]:
        """Load common medical abbreviations to preserve during chunking"""
        return {
            "HTN": "hypertension",
            "DM": "diabetes mellitus",
            "MI": "myocardial infarction",
            "CHF": "congestive heart failure",
            "COPD": "chronic obstructive pulmonary disease",
            # Add more as needed
        }

    def _compile_medical_patterns(self) -> Dict[str, re.Pattern]:
        """Compile regex patterns for medical concepts"""
        return {
            "lab_values": re.compile(r'\b\d+\.?\d*\s*(?:mg/dL|mmol/L|mEq/L|g/dL|U/L)\b'),
            "medications": re.compile(r'\b(?:mg|mcg|units?|mL)\b'),
            "anatomy": re.compile(r'\b(?:anterior|posterior|lateral|medial|superior|inferior)\b', re.I),
            "clinical_findings": re.compile(r'\b(?:positive|negative|normal|abnormal|elevated|decreased)\b', re.I),
        }

    async def process_document(
        self,
        file_path: str,
        doc_type: DocumentType,
        chunking_strategy: ChunkingStrategy = ChunkingStrategy.HYBRID
    ) -> List[Chunk]:
        """Process a medical document into chunks"""

        # Extract text based on file type
        if file_path.endswith('.pdf'):
            text, structure = await self._extract_pdf_with_structure(file_path)
        elif file_path.endswith('.txt'):
            with open(file_path, 'r', encoding='utf-8') as f:
                text = f.read()
                structure = None
        else:
            raise ValueError(f"Unsupported file type: {file_path}")

        # Clean and prepare text
        text = self._clean_medical_text(text)

        # Apply chunking strategy
        if chunking_strategy == ChunkingStrategy.SEMANTIC:
            chunks = await self._semantic_chunking(text)
        elif chunking_strategy == ChunkingStrategy.HIERARCHICAL:
            chunks = await self._hierarchical_chunking(text, structure)
        elif chunking_strategy == ChunkingStrategy.SLIDING_WINDOW:
            chunks = self._sliding_window_chunking(text)
        else:  # HYBRID
            chunks = await self._hybrid_chunking(text, structure)

        # Create chunk objects with metadata
        return self._create_chunk_objects(chunks, file_path, doc_type)

    async def _extract_pdf_with_structure(self, file_path: str) -> Tuple[str, Dict]:
        """Extract text from PDF while preserving structure"""
        doc = fitz.open(file_path)
        full_text = []
        structure = {
            "chapters": [],
            "sections": [],
            "subsections": [],
            "pages": []
        }

        for page_num, page in enumerate(doc, 1):
            page_text = page.get_text()
            full_text.append(page_text)

            # Extract structure from headers (simplified)
            lines = page_text.split('\n')
            for line in lines:
                if self._is_chapter_header(line):
                    structure["chapters"].append({
                        "title": line,
                        "page": page_num,
                        "start_pos": len(''.join(full_text))
                    })
                elif self._is_section_header(line):
                    structure["sections"].append({
                        "title": line,
                        "page": page_num,
                        "start_pos": len(''.join(full_text))
                    })

        doc.close()
        return '\n'.join(full_text), structure

    def _is_chapter_header(self, line: str) -> bool:
        """Detect chapter headers (customize based on your documents)"""
        patterns = [
            r'^Chapter \d+',
            r'^CHAPTER \d+',
            r'^\d+\.\s+[A-Z]',  # "1. Introduction to..."
        ]
        return any(re.match(p, line.strip()) for p in patterns)

    def _is_section_header(self, line: str) -> bool:
        """Detect section headers"""
        patterns = [
            r'^\d+\.\d+\s+',  # "1.1 Overview"
            r'^[A-Z][A-Z\s]+$',  # "CLINICAL FEATURES"
        ]
        return any(re.match(p, line.strip()) for p in patterns) and len(line) < 100

    def _clean_medical_text(self, text: str) -> str:
        """Clean medical text while preserving important information"""
        # Preserve medical abbreviations
        for abbr, full in self.medical_abbreviations.items():
            # Add markers to preserve abbreviations
            text = text.replace(abbr, f"__ABBR_{abbr}__")

        # Basic cleaning
        text = re.sub(r'\s+', ' ', text)  # Normalize whitespace
        text = re.sub(r'[^\w\s\.\,\;\:\!\?\-\(\)\/\%]', '', text)  # Keep medical punctuation

        # Restore abbreviations
        for abbr in self.medical_abbreviations:
            text = text.replace(f"__ABBR_{abbr}__", abbr)

        return text.strip()

    async def _semantic_chunking(self, text: str, max_chunk_size: int = 512) -> List[str]:
        """Semantic chunking based on meaning boundaries"""
        # Use embedding model to find semantic boundaries
        embedder = SentenceTransformer('all-MiniLM-L6-v2')

        # Split into sentences first
        sentences = re.split(r'(?<=[.!?])\s+', text)

        chunks = []
        current_chunk = []
        current_size = 0

        for sentence in sentences:
            sentence_tokens = len(self.tokenizer.encode(sentence))

            if current_size + sentence_tokens > max_chunk_size:
                if current_chunk:
                    chunks.append(' '.join(current_chunk))
                current_chunk = [sentence]
                current_size = sentence_tokens
            else:
                current_chunk.append(sentence)
                current_size += sentence_tokens

        if current_chunk:
            chunks.append(' '.join(current_chunk))

        return chunks

    async def _hierarchical_chunking(
        self,
        text: str,
        structure: Optional[Dict],
        max_chunk_size: int = 512
    ) -> List[Dict[str, Any]]:
        """Hierarchical chunking preserving document structure"""
        chunks = []

        if structure and structure.get("chapters"):
            # Process by chapter/section
            for i, chapter in enumerate(structure["chapters"]):
                chapter_start = chapter["start_pos"]
                chapter_end = (structure["chapters"][i + 1]["start_pos"]
                              if i + 1 < len(structure["chapters"])
                              else len(text))

                chapter_text = text[chapter_start:chapter_end]

                # Create parent chunk for chapter
                parent_chunk = {
                    "content": chapter_text[:max_chunk_size],
                    "type": "chapter",
                    "title": chapter["title"],
                    "children": []
                }

                # Split chapter into smaller chunks
                sub_chunks = self._sliding_window_chunking(
                    chapter_text,
                    chunk_size=max_chunk_size,
                    overlap=128
                )

                for sub_chunk in sub_chunks:
                    child = {
                        "content": sub_chunk,
                        "type": "section",
                        "parent": chapter["title"]
                    }
                    parent_chunk["children"].append(child)

                chunks.append(parent_chunk)
        else:
            # Fallback to simple chunking
            return self._sliding_window_chunking(text, max_chunk_size, 128)

        return chunks

    def _sliding_window_chunking(
        self,
        text: str,
        chunk_size: int = 512,
        overlap: int = 128
    ) -> List[str]:
        """Simple sliding window chunking"""
        tokens = self.tokenizer.encode(text)
        chunks = []

        for i in range(0, len(tokens), chunk_size - overlap):
            chunk_tokens = tokens[i:i + chunk_size]
            chunk_text = self.tokenizer.decode(chunk_tokens)
            chunks.append(chunk_text)

            if i + chunk_size >= len(tokens):
                break

        return chunks

    async def _hybrid_chunking(
        self,
        text: str,
        structure: Optional[Dict]
    ) -> List[Dict[str, Any]]:
        """Hybrid approach combining multiple strategies"""
        chunks = []

        # First, apply hierarchical chunking if structure exists
        if structure:
            hierarchical_chunks = await self._hierarchical_chunking(text, structure)
            chunks.extend(hierarchical_chunks)

        # Then apply semantic chunking for better granularity
        semantic_chunks = await self._semantic_chunking(text)

        # Merge and deduplicate
        seen_content = set()
        final_chunks = []

        for chunk in chunks + [{"content": sc, "type": "semantic"} for sc in semantic_chunks]:
            chunk_hash = hashlib.md5(chunk["content"].encode()).hexdigest()
            if chunk_hash not in seen_content:
                seen_content.add(chunk_hash)
                final_chunks.append(chunk)

        return final_chunks

    def _create_chunk_objects(
        self,
        chunks: List[Any],
        file_path: str,
        doc_type: DocumentType
    ) -> List[Chunk]:
        """Convert raw chunks to Chunk objects with metadata"""
        chunk_objects = []
        doc_id = hashlib.md5(file_path.encode()).hexdigest()

        for i, chunk_data in enumerate(chunks):
            # Handle different chunk formats
            if isinstance(chunk_data, str):
                content = chunk_data
                metadata_extra = {}
            elif isinstance(chunk_data, dict):
                content = chunk_data.get("content", "")
                metadata_extra = {k: v for k, v in chunk_data.items() if k != "content"}
            else:
                continue

            # Create metadata
            metadata = DocumentMetadata(
                doc_id=doc_id,
                title=file_path.split('/')[-1],
                doc_type=doc_type,
                source=file_path,
                **metadata_extra
            )

            # Create chunk object
            chunk = Chunk(
                chunk_id=f"{doc_id}_{i}",
                content=content,
                metadata=metadata,
                token_count=len(self.tokenizer.encode(content)),
                chunk_index=i
            )

            chunk_objects.append(chunk)

        return chunk_objects


class RAGRetriever:
    """Intelligent retrieval system for medical content"""

    def __init__(self, vector_store_config: Dict[str, Any]):
        # Initialize vector store (Qdrant)
        self.client = QdrantClient(
            url=vector_store_config.get("url", "localhost"),
            port=vector_store_config.get("port", 6333)
        )
        self.collection_name = vector_store_config.get("collection", "medical_knowledge")

        # Initialize embedding model
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2')

        # Initialize reranker (optional)
        self.use_reranking = vector_store_config.get("use_reranking", True)

    async def initialize_collection(self, vector_size: int = 384):
        """Create vector collection if not exists"""
        try:
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=qdrant_models.VectorParams(
                    size=vector_size,
                    distance=qdrant_models.Distance.COSINE
                )
            )
        except Exception as e:
            print(f"Collection already exists or error: {e}")

    async def index_chunks(self, chunks: List[Chunk]):
        """Index chunks in vector store"""
        # Generate embeddings
        texts = [chunk.content for chunk in chunks]
        embeddings = self.embedder.encode(texts, show_progress_bar=True)

        # Prepare points for Qdrant
        points = []
        for chunk, embedding in zip(chunks, embeddings):
            point = qdrant_models.PointStruct(
                id=chunk.chunk_id,
                vector=embedding.tolist(),
                payload={
                    "content": chunk.content,
                    "doc_id": chunk.metadata.doc_id,
                    "title": chunk.metadata.title,
                    "doc_type": chunk.metadata.doc_type.value,
                    "chapter": chunk.metadata.chapter,
                    "section": chunk.metadata.section,
                    "topics": chunk.metadata.topics,
                    "difficulty_level": chunk.metadata.difficulty_level,
                    "token_count": chunk.token_count,
                    "chunk_index": chunk.chunk_index
                }
            )
            points.append(point)

        # Upload to Qdrant in batches
        batch_size = 100
        for i in range(0, len(points), batch_size):
            batch = points[i:i + batch_size]
            self.client.upsert(
                collection_name=self.collection_name,
                points=batch
            )

    async def retrieve(
        self,
        query: str,
        top_k: int = 10,
        filters: Optional[Dict[str, Any]] = None,
        use_hybrid: bool = True
    ) -> List[Dict[str, Any]]:
        """Retrieve relevant chunks for query"""

        # Generate query embedding
        query_embedding = self.embedder.encode(query).tolist()

        # Build filter conditions
        filter_conditions = []
        if filters:
            if "doc_type" in filters:
                filter_conditions.append(
                    qdrant_models.FieldCondition(
                        key="doc_type",
                        match=qdrant_models.MatchValue(value=filters["doc_type"])
                    )
                )
            if "difficulty_level" in filters:
                filter_conditions.append(
                    qdrant_models.FieldCondition(
                        key="difficulty_level",
                        range=qdrant_models.Range(
                            lte=filters["difficulty_level"]
                        )
                    )
                )

        # Vector search
        search_params = {
            "collection_name": self.collection_name,
            "query_vector": query_embedding,
            "limit": top_k * 2 if self.use_reranking else top_k
        }

        if filter_conditions:
            search_params["query_filter"] = qdrant_models.Filter(
                must=filter_conditions
            )

        results = self.client.search(**search_params)

        # Format results
        retrieved_chunks = []
        for result in results:
            chunk_data = {
                "chunk_id": result.id,
                "content": result.payload.get("content"),
                "score": result.score,
                "metadata": {
                    k: v for k, v in result.payload.items()
                    if k != "content"
                }
            }
            retrieved_chunks.append(chunk_data)

        # Apply reranking if enabled
        if self.use_reranking and len(retrieved_chunks) > 0:
            retrieved_chunks = await self._rerank(query, retrieved_chunks, top_k)

        return retrieved_chunks[:top_k]

    async def _rerank(
        self,
        query: str,
        chunks: List[Dict[str, Any]],
        top_k: int
    ) -> List[Dict[str, Any]]:
        """Rerank retrieved chunks for better relevance"""
        # Simple reranking based on keyword overlap
        # In production, use a proper reranker like Cohere Rerank

        query_terms = set(query.lower().split())

        for chunk in chunks:
            content_terms = set(chunk["content"].lower().split())
            overlap = len(query_terms & content_terms)
            keyword_score = overlap / len(query_terms) if query_terms else 0

            # Combine vector score with keyword score
            chunk["final_score"] = (0.7 * chunk["score"]) + (0.3 * keyword_score)

        # Sort by final score
        chunks.sort(key=lambda x: x["final_score"], reverse=True)

        return chunks

    async def get_context_for_question(
        self,
        question: str,
        user_level: int = 3
    ) -> str:
        """Get formatted context for a question"""

        # Retrieve relevant chunks
        chunks = await self.retrieve(
            query=question,
            top_k=5,
            filters={"difficulty_level": user_level}
        )

        # Format context
        context_parts = []
        for i, chunk in enumerate(chunks, 1):
            source = chunk["metadata"].get("title", "Unknown")
            context_parts.append(f"[Source {i}: {source}]\n{chunk['content']}\n")

        return "\n".join(context_parts)


class AdaptiveRetrieval:
    """Adaptive retrieval based on user performance"""

    def __init__(self, retriever: RAGRetriever):
        self.retriever = retriever
        self.user_profiles = {}  # In production, use a database

    async def retrieve_adaptive(
        self,
        query: str,
        user_id: str,
        session_context: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Retrieve content adapted to user's level and needs"""

        # Get user profile
        profile = self.user_profiles.get(user_id, {
            "level": 3,
            "weak_topics": [],
            "strong_topics": [],
            "error_patterns": []
        })

        # Adjust retrieval based on profile
        filters = {
            "difficulty_level": profile["level"]
        }

        # Boost weak topics if relevant
        if any(topic in query.lower() for topic in profile["weak_topics"]):
            filters["difficulty_level"] = max(1, profile["level"] - 1)

        # Retrieve with adaptive filters
        results = await self.retriever.retrieve(
            query=query,
            top_k=10,
            filters=filters
        )

        # Post-process based on error patterns
        if profile["error_patterns"]:
            results = self._prioritize_error_corrections(results, profile["error_patterns"])

        return results

    def _prioritize_error_corrections(
        self,
        results: List[Dict[str, Any]],
        error_patterns: List[str]
    ) -> List[Dict[str, Any]]:
        """Prioritize content that addresses known error patterns"""

        for result in results:
            boost = 0
            content_lower = result["content"].lower()

            for pattern in error_patterns:
                if pattern.lower() in content_lower:
                    boost += 0.1

            result["score"] += boost

        # Re-sort by boosted scores
        results.sort(key=lambda x: x["score"], reverse=True)
        return results


# Example usage
async def main():
    """Example usage of the RAG pipeline"""

    # Initialize document processor
    processor = MedicalDocumentProcessor()

    # Process a medical textbook
    chunks = await processor.process_document(
        file_path="/path/to/medical_textbook.pdf",
        doc_type=DocumentType.TEXTBOOK,
        chunking_strategy=ChunkingStrategy.HYBRID
    )

    print(f"Processed {len(chunks)} chunks")

    # Initialize retriever
    retriever = RAGRetriever({
        "url": "localhost",
        "port": 6333,
        "collection": "medical_knowledge",
        "use_reranking": True
    })

    # Initialize collection
    await retriever.initialize_collection()

    # Index chunks
    await retriever.index_chunks(chunks)

    # Test retrieval
    results = await retriever.retrieve(
        query="What are the symptoms of myocardial infarction?",
        top_k=5
    )

    for result in results:
        print(f"Score: {result['score']:.3f}")
        print(f"Content: {result['content'][:200]}...")
        print("---")


if __name__ == "__main__":
    asyncio.run(main())