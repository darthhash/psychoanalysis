import datetime
import uuid

from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=True)
    password_hash = Column(String(255), nullable=True)
    created_at = Column(DateTime, server_default=text("now()"))

    sessions = relationship("Session", back_populates="user")
    dreams = relationship("Dream", back_populates="user")
    notes = relationship("Note", back_populates="user")


class Session(Base):
    __tablename__ = "sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    started_at = Column(DateTime, server_default=text("now()"))
    ended_at = Column(DateTime, nullable=True)
    interpretation = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    key_signifier = Column(String(255), nullable=True)
    end_type = Column(String(32), nullable=True)  # interpretation | analyst_cut | user_exit
    message_count = Column(Integer, default=0)
    cooldown_until = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="sessions")
    messages = relationship("Message", back_populates="session", order_by="Message.created_at")


class Message(Base):
    __tablename__ = "messages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id"), nullable=False)
    role = Column(String(16), nullable=False)  # user | assistant
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=text("now()"))

    session = relationship("Session", back_populates="messages")


class Dream(Base):
    __tablename__ = "dreams"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=text("now()"))

    user = relationship("User", back_populates="dreams")


class Note(Base):
    __tablename__ = "notes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=text("now()"))

    user = relationship("User", back_populates="notes")


class TextChunk(Base):
    __tablename__ = "text_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source = Column(String(512), nullable=False)  # filename / book title
    content = Column(Text, nullable=False)
    embedding = Column(Vector(1536), nullable=True)  # openai embedding dim
    created_at = Column(DateTime, server_default=text("now()"))
