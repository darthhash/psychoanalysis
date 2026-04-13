import os
import tempfile

from fastapi import APIRouter, UploadFile
from openai import AsyncOpenAI

router = APIRouter()

whisper_client = AsyncOpenAI(api_key=os.getenv("OPENROUTER_API_KEY", ""))


@router.post("/transcribe")
async def transcribe(file: UploadFile):
    suffix = "." + (file.filename.split(".")[-1] if file.filename else "webm")
    with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
        content = await file.read()
        tmp.write(content)
        tmp_path = tmp.name

    try:
        with open(tmp_path, "rb") as audio:
            transcript = await whisper_client.audio.transcriptions.create(
                model="whisper-1",
                file=audio,
            )
        return {"text": transcript.text}
    finally:
        os.unlink(tmp_path)
