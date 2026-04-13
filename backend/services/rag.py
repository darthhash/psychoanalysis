from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession


async def search_chunks(db: AsyncSession, query_embedding: list[float], top_k: int = 3) -> list[dict]:
    """Search for relevant text chunks using pgvector cosine similarity."""
    result = await db.execute(
        text("""
            SELECT source, content,
                   1 - (embedding <=> :embedding::vector) AS similarity
            FROM text_chunks
            WHERE embedding IS NOT NULL
            ORDER BY embedding <=> :embedding::vector
            LIMIT :top_k
        """),
        {"embedding": str(query_embedding), "top_k": top_k},
    )
    rows = result.fetchall()
    return [{"source": r[0], "content": r[1], "similarity": r[2]} for r in rows]


def format_rag_context(chunks: list[dict]) -> str:
    if not chunks:
        return ""
    parts = []
    for c in chunks:
        parts.append(f"[{c['source']}]\n{c['content']}")
    return "\n---\n".join(parts)
