"""
RAG Engine - Retrieval-Augmented Generation for SeedGuide
Uses ChromaDB for vector storage and Anthropic Claude for generation.
"""

import os
import re

import chromadb
from anthropic import Anthropic

# ── Configuration ────────────────────────────────────────────────

KNOWLEDGE_BASE_PATH = os.path.join(os.path.dirname(__file__), "knowledge_base.txt")
CHROMA_PERSIST_DIR = os.path.join(os.path.dirname(__file__), "chroma_db")
COLLECTION_NAME = "seedguide_knowledge"
CHUNK_SIZE = 800  # characters per chunk
CHUNK_OVERLAP = 100
TOP_K = 5  # number of relevant chunks to retrieve

# ── Text Chunking ────────────────────────────────────────────────


def chunk_text(text, chunk_size=CHUNK_SIZE, overlap=CHUNK_OVERLAP):
    """Split text into overlapping chunks, respecting section boundaries."""
    sections = re.split(r"\n## ", text)
    chunks = []

    for section in sections:
        section = section.strip()
        if not section:
            continue

        # Extract section title
        lines = section.split("\n", 1)
        title = lines[0].strip().replace("#", "").strip()
        body = lines[1].strip() if len(lines) > 1 else ""

        # If section fits in one chunk, keep it whole
        if len(body) <= chunk_size:
            chunks.append({"text": body, "title": title})
            continue

        # Split into overlapping chunks
        words = body.split()
        current_chunk = []
        current_len = 0

        for word in words:
            current_chunk.append(word)
            current_len += len(word) + 1

            if current_len >= chunk_size:
                chunk_text_str = " ".join(current_chunk)
                chunks.append({"text": chunk_text_str, "title": title})
                # Keep overlap
                overlap_words = current_chunk[-(overlap // 5):]
                current_chunk = list(overlap_words)
                current_len = sum(len(w) + 1 for w in current_chunk)

        if current_chunk:
            chunk_text_str = " ".join(current_chunk)
            if len(chunk_text_str) > 50:  # skip tiny trailing chunks
                chunks.append({"text": chunk_text_str, "title": title})

    return chunks


# ── ChromaDB Vector Store ────────────────────────────────────────


def get_chroma_client():
    """Get or create a ChromaDB persistent client."""
    return chromadb.PersistentClient(path=CHROMA_PERSIST_DIR)


def index_knowledge_base():
    """Load knowledge base, chunk it, and index in ChromaDB."""
    client = get_chroma_client()

    # Delete existing collection if it exists, to re-index
    try:
        client.delete_collection(COLLECTION_NAME)
    except Exception:
        pass

    collection = client.create_collection(
        name=COLLECTION_NAME,
        metadata={"description": "SeedGuide gardening knowledge base"},
    )

    # Load and chunk
    with open(KNOWLEDGE_BASE_PATH) as f:
        text = f.read()

    chunks = chunk_text(text)

    # Index all chunks
    ids = []
    documents = []
    metadatas = []

    for i, chunk in enumerate(chunks):
        ids.append(f"chunk_{i}")
        documents.append(f"[{chunk['title']}] {chunk['text']}")
        metadatas.append({"title": chunk["title"], "chunk_index": i})

    collection.add(ids=ids, documents=documents, metadatas=metadatas)

    return len(chunks)


def retrieve(query, top_k=TOP_K):
    """Retrieve the most relevant chunks for a query."""
    client = get_chroma_client()

    try:
        collection = client.get_collection(COLLECTION_NAME)
    except Exception:
        # Collection doesn't exist yet — index first
        index_knowledge_base()
        collection = client.get_collection(COLLECTION_NAME)

    results = collection.query(query_texts=[query], n_results=top_k)
    return results["documents"][0] if results["documents"] else []


# ── Claude LLM Generation ───────────────────────────────────────

_client = None


def get_anthropic_client():
    """Get Anthropic client (lazy singleton)."""
    global _client
    if _client is None:
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError(
                "ANTHROPIC_API_KEY environment variable is required. "
                "Get your key at https://console.anthropic.com/"
            )
        _client = Anthropic(api_key=api_key)
    return _client


SYSTEM_PROMPT = """You are SeedGuide AI, a friendly and knowledgeable gardening assistant. You help people grow their own food — from complete beginners to experienced gardeners.

Your personality:
- Warm, encouraging, and patient
- You give practical, actionable advice
- You reference specific varieties, measurements, and timelines
- You mention when something is beginner-friendly vs. more advanced
- You suggest library resources (seed libraries, tool lending) when relevant
- You keep answers concise but thorough

Rules:
- ONLY answer gardening-related questions. For off-topic questions, kindly redirect to gardening.
- Base your answers on the provided context. If the context doesn't cover the topic, say so and give general gardening knowledge.
- When mentioning plants, include key details: sun needs, water, spacing, days to harvest.
- For pest/disease questions, always suggest organic solutions first.
- Encourage beginners and make gardening feel accessible."""


def generate_response(query, conversation_history=None):
    """Retrieve context and generate a response using Claude."""
    # Retrieve relevant context
    context_chunks = retrieve(query)
    context = "\n\n---\n\n".join(context_chunks) if context_chunks else ""

    # Build messages
    messages = []

    # Add conversation history if provided
    if conversation_history:
        for msg in conversation_history:
            messages.append({"role": msg["role"], "content": msg["content"]})

    # Build the user message with RAG context
    user_message = query
    if context:
        user_message = f"""Use the following gardening knowledge to answer the question. If the context doesn't fully answer the question, supplement with your general knowledge but note when you're going beyond the provided sources.

CONTEXT:
{context}

QUESTION: {query}"""

    messages.append({"role": "user", "content": user_message})

    # Call Claude
    client = get_anthropic_client()
    response = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=messages,
    )

    return response.content[0].text


# ── Initialization ───────────────────────────────────────────────


def ensure_indexed():
    """Ensure the knowledge base is indexed. Call at app startup."""
    client = get_chroma_client()
    try:
        collection = client.get_collection(COLLECTION_NAME)
        if collection.count() == 0:
            raise ValueError("Empty collection")
    except Exception:
        print("Indexing knowledge base...")
        n = index_knowledge_base()
        print(f"Indexed {n} chunks into ChromaDB.")
