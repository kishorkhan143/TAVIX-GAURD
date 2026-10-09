"""
AuthSentinel — Detection Engine
================================
Correlates raw auth events into alerts.

Rules implemented:
  1. REPEATED_FAILURE   — N failures within T seconds for same user+source
  2. SUCCESS_AFTER_FAILURES — success after ≥ threshold failures
"""

from __future__ import annotations

import logging
from collections import deque
from datetime import datetime, timezone, timedelta
from typing import Optional

from config import settings

logger = logging.getLogger("authsentinel.detection")


# ── In-memory sliding window per (username, source_ip) ──────────────────────
# Each entry: dict  {"timestamp": datetime, "event_id": int, "status": str}
_windows: dict[str, deque] = {}
_success_alerted: set[str] = set()


def _key(username: str, source_ip: str) -> str:
    return f"{username}|{source_ip}"


def _prune(dq: deque, cutoff: datetime) -> None:
    """Remove entries older than the cutoff datetime."""
    while dq and dq[0]["timestamp"] < cutoff:
        dq.popleft()


def evaluate(
    event_id: int,
    username: str,
    source_ip: str,
    timestamp: datetime,
    status: str,
) -> Optional[dict]:
    """
    Evaluate a single auth event.

    Returns an alert dict if a rule fires, otherwise None.
    Never persists—caller handles DB writes.
    """
    if not username or username.strip() in ("", "-", "SYSTEM"):
        return None

    key = _key(username, source_ip)
    if key not in _windows:
        _windows[key] = deque()

    dq = _windows[key]
    cutoff = timestamp - timedelta(seconds=settings.brute_force_window_seconds)
    _prune(dq, cutoff)

    dq.append({"timestamp": timestamp, "event_id": event_id, "status": status})

    # ── Rule 1: Repeated failures ─────────────────────────────────────────
    if status == "FAILURE":
        _success_alerted.discard(key)
        failures_in_window = sum(1 for e in dq if e["status"] == "FAILURE")

        if failures_in_window == settings.brute_force_threshold:
            # Fire exactly when crossing the threshold (not every subsequent event)
            logger.warning(
                "[DETECTION] REPEATED_FAILURE | user=%s src=%s count=%d",
                username,
                source_ip,
                failures_in_window,
            )
            return {
                "alert_type": "REPEATED_FAILURE",
                "username": username,
                "source_ip": source_ip,
                "risk_score": 85.0,
                "risk_level": "HIGH",
                "failure_count": failures_in_window,
                "time_window_seconds": settings.brute_force_window_seconds,
                "reason": (
                    f"Multiple failed authentication events were observed for the same "
                    f"account/source within the configured detection window. "
                    f"{failures_in_window} failures detected in "
                    f"{settings.brute_force_window_seconds} seconds."
                ),
            }

    # ── Rule 2: Success after multiple failures ───────────────────────────
    if status == "SUCCESS":
        failures_before = sum(1 for e in dq if e["status"] == "FAILURE")

        if (
            failures_before >= settings.success_after_failures_threshold
            and key not in _success_alerted
        ):
            _success_alerted.add(key)
            logger.warning(
                "[DETECTION] SUCCESS_AFTER_FAILURES | user=%s src=%s prior_failures=%d",
                username,
                source_ip,
                failures_before,
            )
            return {
                "alert_type": "SUCCESS_AFTER_FAILURES",
                "username": username,
                "source_ip": source_ip,
                "risk_score": 90.0,
                "risk_level": "HIGH",
                "failure_count": failures_before,
                "time_window_seconds": settings.brute_force_window_seconds,
                "reason": (
                    f"A successful authentication occurred after {failures_before} "
                    f"recent authentication failures. This is a suspicious "
                    f"authentication pattern requiring investigation."
                ),
            }

    return None


def reset_window(username: str, source_ip: str) -> None:
    """Clear the sliding window for a user/source pair (e.g. after alert acknowledged)."""
    key = _key(username, source_ip)
    _windows.pop(key, None)
    _success_alerted.discard(key)
