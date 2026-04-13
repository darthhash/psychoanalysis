"""
Extract text from DjVu and PDF files, chunk them, and store in the database.

Usage:
    python -m scripts.extract_texts /path/to/psycho/directory

Requires: djvulibre (brew install djvulibre), PyMuPDF
"""

import os
import subprocess
import sys
import asyncio

import fitz  # PyMuPDF


def extract_djvu(filepath: str) -> str:
    """Extract text from a DjVu file using djvutxt."""
    result = subprocess.run(
        ["djvutxt", filepath],
        capture_output=True,
        text=True,
        timeout=120,
    )
    if result.returncode != 0:
        print(f"  WARNING: djvutxt failed for {filepath}: {result.stderr[:200]}")
        return ""
    return result.stdout


def extract_pdf(filepath: str) -> str:
    """Extract text from a PDF file using PyMuPDF."""
    doc = fitz.open(filepath)
    text = ""
    for page in doc:
        text += page.get_text()
    doc.close()
    return text


def chunk_text(text: str, chunk_size: int = 1500, overlap: int = 200) -> list[str]:
    """Split text into overlapping chunks by character count, respecting paragraph breaks."""
    # Split on double newlines first (paragraphs)
    paragraphs = text.split("\n\n")
    chunks = []
    current = ""

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        if len(current) + len(para) > chunk_size and current:
            chunks.append(current.strip())
            # keep overlap from end of current chunk
            current = current[-overlap:] + "\n\n" + para
        else:
            current = current + "\n\n" + para if current else para

    if current.strip():
        chunks.append(current.strip())

    return chunks


async def store_chunks(chunks: list[dict]):
    """Store text chunks in the database (without embeddings for now)."""
    # Import here to avoid circular imports when running as script
    from backend.database import async_session, init_db
    from backend.models import TextChunk

    await init_db()

    async with async_session() as db:
        for c in chunks:
            db.add(TextChunk(source=c["source"], content=c["content"]))
        await db.commit()
        print(f"  Stored {len(chunks)} chunks in database")


def process_directory(root_dir: str) -> list[dict]:
    """Walk directory and extract text from all DjVu and PDF files."""
    all_chunks = []

    for dirpath, _, filenames in os.walk(root_dir):
        for fname in sorted(filenames):
            filepath = os.path.join(dirpath, fname)
            ext = fname.lower().rsplit(".", 1)[-1] if "." in fname else ""

            if ext == "djvu":
                print(f"Processing DjVu: {fname}")
                text = extract_djvu(filepath)
            elif ext == "pdf":
                print(f"Processing PDF: {fname}")
                text = extract_pdf(filepath)
            else:
                continue

            if not text.strip():
                print(f"  No text extracted, skipping")
                continue

            source_name = fname.rsplit(".", 1)[0]
            chunks = chunk_text(text)
            print(f"  Extracted {len(text)} chars -> {len(chunks)} chunks")

            for chunk in chunks:
                all_chunks.append({"source": source_name, "content": chunk})

    return all_chunks


def main():
    if len(sys.argv) < 2:
        print("Usage: python -m scripts.extract_texts /path/to/psycho/directory")
        sys.exit(1)

    root_dir = sys.argv[1]
    if not os.path.isdir(root_dir):
        print(f"Directory not found: {root_dir}")
        sys.exit(1)

    print(f"Scanning: {root_dir}\n")
    all_chunks = process_directory(root_dir)
    print(f"\nTotal chunks: {len(all_chunks)}")

    if all_chunks:
        if "--dry-run" in sys.argv:
            print("Dry run — not storing to DB")
        else:
            asyncio.run(store_chunks(all_chunks))


if __name__ == "__main__":
    main()
