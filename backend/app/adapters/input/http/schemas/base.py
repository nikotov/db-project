"""Shared Pydantic helpers for HTTP schemas."""
from datetime import datetime, timezone
from typing import Annotated

from pydantic import PlainSerializer

UtcDatetime = Annotated[
    datetime,
    PlainSerializer(
        lambda dt: dt.replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")
        if dt is not None else None,
        return_type=str,
        when_used="json",
    ),
]