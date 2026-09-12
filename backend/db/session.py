"""
LexPort — Async Database Engine & Session Provider
Defaults to local SQLite file (lexport.db) via aiosqlite for zero-overhead hackathon setup.
"""
from __future__ import annotations
import os
import logging
import urllib.parse
from typing import AsyncGenerator
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

logger = logging.getLogger(__name__)

DB_PATH = Path(__file__).resolve().parent.parent.parent / "lexport.db"
raw_db_url = os.getenv("DATABASE_URL", f"sqlite+aiosqlite:///{DB_PATH}")

connect_args = {}
# Normalize PostgreSQL URL for asyncpg
if raw_db_url.startswith("postgres://"):
    DATABASE_URL = raw_db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif raw_db_url.startswith("postgresql://") and not raw_db_url.startswith("postgresql+asyncpg://"):
    DATABASE_URL = raw_db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
else:
    DATABASE_URL = raw_db_url

if "sqlite" in DATABASE_URL:
    connect_args = {"check_same_thread": False}
elif "postgresql+asyncpg" in DATABASE_URL:
    if "sslmode=" in DATABASE_URL:
        parsed = urllib.parse.urlparse(DATABASE_URL)
        query_dict = urllib.parse.parse_qs(parsed.query)
        sslmode = query_dict.pop("sslmode", [None])[0]
        new_query = urllib.parse.urlencode({k: v[0] for k, v in query_dict.items()})
        DATABASE_URL = urllib.parse.urlunparse(parsed._replace(query=new_query))
        if sslmode and sslmode != "disable":
            connect_args = {"ssl": "require"}

engine = create_async_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True,
    echo=False,
    future=True,
)

async_session = async_sessionmaker(
    engine,
    expire_on_commit=False,
    class_=AsyncSession,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
