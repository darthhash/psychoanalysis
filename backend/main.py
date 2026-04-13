from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db
from .routers import auth, dreams, notes, session, voice


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    yield


app = FastAPI(title="Psychoanalysis", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5174",
        "http://localhost:3000",
        "https://lacanist.space",
        "https://www.lacanist.space",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(session.router, prefix="/api/sessions", tags=["sessions"])
app.include_router(dreams.router, prefix="/api/dreams", tags=["dreams"])
app.include_router(notes.router, prefix="/api/notes", tags=["notes"])
app.include_router(voice.router, prefix="/api/voice", tags=["voice"])


@app.get("/api/health")
async def health():
    return {"status": "ok"}
