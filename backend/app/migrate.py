"""Standalone migration runner: python -m backend.app.migrate"""
from __future__ import annotations

import asyncio
from backend.app.db import get_db, run_migrations


async def main():
    db = await get_db()
    await run_migrations(db)
    print("Migrations applied successfully.")
    await db.close()


if __name__ == "__main__":
    asyncio.run(main())
