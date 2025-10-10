from __future__ import annotations

import os
import uuid
from datetime import datetime

import pytest
from sqlalchemy import text
from sqlalchemy.exc import OperationalError
from sqlalchemy.ext.asyncio import create_async_engine


TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")


@pytest.mark.integration
@pytest.mark.asyncio
async def test_partitioning_with_sample_data():  # pragma: no cover - requires database
    if not TEST_DATABASE_URL:
        pytest.skip("TEST_DATABASE_URL not configured")

    engine = create_async_engine(TEST_DATABASE_URL)

    async with engine.begin() as connection:
        try:
            await connection.execute(text("""TRUNCATE TABLE user_question_attempts;"""))
        except OperationalError as exc:  # pragma: no cover - depends on schema state
            pytest.skip(f"Partitioned table unavailable: {exc}")

        answered_at = datetime(2025, 10, 5, 12, 0, 0)
        await connection.execute(
            text(
                """
                INSERT INTO user_question_attempts (
                    id,
                    user_id,
                    question_id,
                    selected_index,
                    is_correct,
                    confidence_rating,
                    time_taken_seconds,
                    attempt_type,
                    session_id,
                    answered_at
                ) VALUES (
                    :id,
                    :user_id,
                    :question_id,
                    2,
                    true,
                    4,
                    85,
                    'quiz',
                    :session_id,
                    :answered_at
                );
                """
            ),
            {
                "id": uuid.uuid4(),
                "user_id": uuid.uuid4(),
                "question_id": uuid.uuid4(),
                "session_id": uuid.uuid4(),
                "answered_at": answered_at,
            },
        )

        result = await connection.execute(
            text(
                """EXPLAIN ANALYZE SELECT *
                FROM user_question_attempts
                WHERE answered_at >= '2025-10-01'::timestamptz
                  AND answered_at < '2025-11-01'::timestamptz;
                """
            )
        )

        execution_plan = "\n".join(row[0] for row in result)

    await engine.dispose()

    assert "Partition" in execution_plan
