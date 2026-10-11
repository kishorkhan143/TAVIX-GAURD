"""
AuthSentinel — FastAPI Backend
================================
Runs on Laptop B.  Exposes:

  POST /api/events          — receive events from the Windows collector
  POST /api/collector/status — collector heartbeat
  GET  /api/events          — list recent events
  GET  /api/alerts          — list active alerts
  GET  /api/stats           — summary counts
  GET  /api/health          — health check
  WS   /ws                  — real-time dashboard feed
"""

from __future__ import annotations

import asyncio
import csv
import io
import logging
import os
import sys
import time

# Ensure backend directory is in sys.path
backend_dir = os.path.dirname(os.path.abspath(__file__))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import (
    Depends,
    FastAPI,
    HTTPException,
    Header,
    Query,
    Response,
    WebSocket,
    WebSocketDisconnect,
)
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func, select, desc, text
from sqlalchemy.orm import Session

import detection
from config import settings
from database import get_db, init_db
from models import Alert, AuthEvent, Laboratory, TerminalAssignment, Computer
from schemas import (
    AlertResponse,
    CollectorStatusRequest,
    EventIngestionRequest,
    EventResponse,
    HealthResponse,
    StatsResponse,
    LabCreateRequest,
    LabResponse,
    TerminalAssignRequest,
    TerminalResponse,
    LastAuthEventSummary,
    ComputerSummary,
    LabComputersResponse,
    ComputerDetailResponse,
)
from ws_manager import manager
from csv_analytics import csv_router
import api_risk

# ── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
)
logger = logging.getLogger("authsentinel.backend")

# ── State ────────────────────────────────────────────────────────────────────
_start_time = time.monotonic()
COLLECTOR_STALE_SECONDS = 45
COLLECTOR_HEARTBEAT_INTERVAL_SECONDS = 15
# Track each collector by label (LAPTOP-A, LAPTOP-B, …)
_collectors: dict[str, dict] = {}


def _utc_isoformat(value: datetime) -> str:
    if value.tzinfo is None:
        value = value.replace(tzinfo=timezone.utc)
    else:
        value = value.astimezone(timezone.utc)
    return value.isoformat().replace("+00:00", "Z")


def _collector_last_seen_utc(collector: dict) -> Optional[datetime]:
    last_seen = collector.get("last_seen")
    if isinstance(last_seen, str):
        try:
            last_seen = datetime.fromisoformat(last_seen.replace("Z", "+00:00"))
        except ValueError:
            return None
    if not isinstance(last_seen, datetime):
        return None
    if last_seen.tzinfo is None:
        return last_seen.replace(tzinfo=timezone.utc)
    return last_seen.astimezone(timezone.utc)


def _collector_is_connected(collector: dict, now: datetime) -> bool:
    last_seen = _collector_last_seen_utc(collector)
    if collector.get("status") not in ("CONNECTED", "ONLINE", "Online") or last_seen is None:
        return False
    return (now - last_seen).total_seconds() <= COLLECTOR_STALE_SECONDS


async def _mark_stale_collectors(now: Optional[datetime] = None) -> None:
    current_time = now or datetime.now(timezone.utc)
    for collector in _collectors.values():
        if collector.get("status") not in ("CONNECTED", "ONLINE", "Online"):
            continue
        last_seen = _collector_last_seen_utc(collector)
        if (
            last_seen is None
            or (current_time - last_seen).total_seconds() > COLLECTOR_STALE_SECONDS
        ):
            collector["status"] = "DISCONNECTED"
            label = collector.get("terminal_id") or collector.get("hostname")
            try:
                from database import get_session
                with get_session() as db:
                    comp = db.get(Computer, label)
                    if comp:
                        comp.status = "Offline"
                        comp.updated_at = current_time
                        db.commit()
            except Exception as e:
                logger.warning("Error updating stale computer status in DB: %s", e)

            await manager.broadcast(
                {
                    "type": "COLLECTOR_STATUS",
                    "status": "DISCONNECTED",
                    "connection_status": "Offline",
                    "terminal_id": label,
                    "hostname": collector.get("hostname"),
                    "ip": collector.get("ip"),
                    "message": f"No heartbeat for {COLLECTOR_STALE_SECONDS}s",
                }
            )


async def _collector_watchdog() -> None:
    while True:
        await asyncio.sleep(COLLECTOR_HEARTBEAT_INTERVAL_SECONDS)
        await _mark_stale_collectors()


# ── Lifespan ─────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    # init_db is not async, call it directly
    init_db()
    watchdog = asyncio.create_task(_collector_watchdog())
    logger.info("AuthSentinel backend started on %s:%d", settings.host, settings.port)
    try:
        yield
    finally:
        watchdog.cancel()
        try:
            await watchdog
        except asyncio.CancelledError:
            pass
        logger.info("AuthSentinel backend shutting down")


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="AuthSentinel",
    description="Real-time Windows authentication monitoring backend",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(csv_router)
app.include_router(api_risk.router)


# ── Auth helper ───────────────────────────────────────────────────────────────
def verify_collector(x_collector_secret: Optional[str] = Header(None)) -> None:
    if x_collector_secret != settings.collector_secret:
        raise HTTPException(status_code=403, detail="Invalid collector secret")


# ── Reset endpoint (clears all data + detection state) ───────────────────────
@app.delete("/api/reset")
async def reset_all(
    db: Session = Depends(get_db),
    _: None = Depends(verify_collector),
):
    """Delete all events and alerts, reset detection windows."""
    db.execute(text("DELETE FROM alerts"))
    db.execute(text("DELETE FROM auth_events"))
    for tbl in ["incidents", "risk_snapshots", "risk_contributions", "computers", "terminal_assignments", "csv_alerts", "csv_records", "csv_imports"]:
        try:
            db.execute(text(f"DELETE FROM {tbl}"))
        except Exception:
            pass
    db.commit()
    detection._windows.clear()
    detection._success_alerted.clear()
    global _collectors
    _collectors = {}
    await manager.broadcast({"type": "RESET", "message": "All data cleared"})
    logger.info("[RESET] All events, alerts and detection state cleared")
    return {"ok": True, "message": "All data cleared"}


# ── WebSocket endpoint ────────────────────────────────────────────────────────
@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    logger.info("Dashboard connected via WebSocket")
    try:
        # Send initial state
        await ws.send_json({"type": "CONNECTED", "message": "AuthSentinel WebSocket active"})
        while True:
            # Keep alive — client sends pings
            data = await ws.receive_text()
            if data == "ping":
                await ws.send_text("pong")
    except WebSocketDisconnect:
        logger.info("Dashboard WebSocket disconnected")
    finally:
        await manager.disconnect(ws)


# ── Collector status ──────────────────────────────────────────────────────────
@app.post("/api/collector/status")
async def collector_status(
    body: CollectorStatusRequest,
    db: Session = Depends(get_db),
    _: None = Depends(verify_collector),
):
    global _collectors
    label = body.terminal_id or body.hostname or "UNKNOWN"
    now_utc = datetime.now(timezone.utc)
    is_online = body.status in ("CONNECTED", "ONLINE", "Online")
    norm_status = "Online" if is_online else "Offline"
    
    _collectors[label] = {
        "status": "CONNECTED" if is_online else "DISCONNECTED",
        "norm_status": norm_status,
        "hostname": body.hostname,
        "terminal_id": label,
        "ip": body.ip,
        "computer_name": body.computer_name or body.hostname,
        "mac_address": body.mac_address,
        "os_name": body.os_name,
        "os_version": body.os_version,
        "logged_in_user": body.logged_in_user,
        "cpu": body.cpu,
        "ram": body.ram,
        "manufacturer": body.manufacturer,
        "model": body.model,
        "last_seen": now_utc,
    }
    
    # Upsert in DB
    comp = db.get(Computer, label)
    if not comp:
        comp = Computer(
            terminal_id=label,
            computer_name=body.computer_name or body.hostname,
            hostname=body.hostname,
            ip_address=body.ip,
            mac_address=body.mac_address,
            os_name=body.os_name,
            os_version=body.os_version,
            logged_in_user=body.logged_in_user,
            cpu=body.cpu,
            ram=body.ram,
            manufacturer=body.manufacturer,
            model=body.model,
            status=norm_status,
            last_seen=now_utc,
            created_at=now_utc,
            updated_at=now_utc,
        )
        db.add(comp)
    else:
        if body.computer_name:
            comp.computer_name = body.computer_name
        if body.hostname:
            comp.hostname = body.hostname
        if body.ip:
            comp.ip_address = body.ip
        if body.mac_address:
            comp.mac_address = body.mac_address
        if body.os_name:
            comp.os_name = body.os_name
        if body.os_version:
            comp.os_version = body.os_version
        if body.logged_in_user:
            comp.logged_in_user = body.logged_in_user
        if body.cpu:
            comp.cpu = body.cpu
        if body.ram:
            comp.ram = body.ram
        if body.manufacturer:
            comp.manufacturer = body.manufacturer
        if body.model:
            comp.model = body.model
        comp.status = norm_status
        comp.last_seen = now_utc
        comp.updated_at = now_utc
    db.commit()

    logger.info("[COLLECTOR] Status=%s host=%s ip=%s label=%s", body.status, body.hostname, body.ip, label)

    await manager.broadcast({
        "type": "COLLECTOR_STATUS",
        "status": body.status,
        "connection_status": norm_status,
        "terminal_id": label,
        "hostname": body.hostname,
        "ip": body.ip,
        "message": body.message,
        "timestamp": _utc_isoformat(now_utc),
    })
    return {"ok": True, "terminal_id": label, "status": norm_status}



# ── Event ingestion ───────────────────────────────────────────────────────────
LOGON_TYPE_MAP = {
    2: "Interactive",
    3: "Network",
    4: "Batch",
    5: "Service",
    7: "Unlock",
    8: "NetworkCleartext",
    9: "NewCredentials",
    10: "RemoteInteractive",
    11: "CachedInteractive",
}


@app.post("/api/events", response_model=EventResponse)
async def ingest_event(
    body: EventIngestionRequest,
    db: Session = Depends(get_db),
    _: None = Depends(verify_collector),
    x_source_label: Optional[str] = Header(None),
):
    source_label = x_source_label or body.source_host or body.target_computer

    if body.raw_record_id is not None:
        existing_event = db.execute(
            select(AuthEvent).where(
                AuthEvent.source_host == source_label,
                AuthEvent.raw_record_id == body.raw_record_id,
                AuthEvent.event_id == body.event_id,
            )
        ).scalars().first()
        if existing_event is not None:
            return existing_event

    # Normalise logon type description
    if body.logon_type and not body.logon_type_description:
        body.logon_type_description = LOGON_TYPE_MAP.get(body.logon_type, str(body.logon_type))

    # ── Detection ──────────────────────────────────────────────────────────
    alert_data = detection.evaluate(
        event_id=body.event_id,
        username=body.username or "",
        source_ip=body.source_ip or "",
        timestamp=body.timestamp,
        status=body.status,
    )

    risk_score = 10.0 if body.status == "SUCCESS" else 30.0
    risk_level = "LOW"
    detection_reason = None

    if alert_data:
        risk_score = alert_data["risk_score"]
        risk_level = alert_data["risk_level"]
        detection_reason = alert_data["reason"]

    # ── Persist event ──────────────────────────────────────────────────────
    event = AuthEvent(
        event_id=body.event_id,
        timestamp=body.timestamp,
        username=body.username,
        source_ip=body.source_ip,
        source_host=source_label,
        target_computer=body.target_computer,
        logon_type=body.logon_type,
        logon_type_description=body.logon_type_description,
        status=body.status,
        risk_score=risk_score,
        risk_level=risk_level,
        detection_reason=detection_reason,
        raw_record_id=body.raw_record_id,
    )
    db.add(event)
    db.flush()          # get the auto-generated id

    logger.info(
        "[EVENT] id=%d event_id=%d user=%s src=%s status=%s risk=%s",
        event.id, event.event_id, event.username,
        event.source_ip, event.status, event.risk_level,
    )

    # ── Persist alert ──────────────────────────────────────────────────────
    alert_obj = None
    if alert_data:
        alert_obj = Alert(
            alert_type=alert_data["alert_type"],
            username=alert_data["username"],
            source_ip=alert_data["source_ip"],
            source_host=source_label,
            target_computer=body.target_computer,
            risk_score=alert_data["risk_score"],
            risk_level=alert_data["risk_level"],
            failure_count=alert_data["failure_count"],
            time_window_seconds=alert_data["time_window_seconds"],
            reason=alert_data["reason"],
            triggered_at=datetime.now(timezone.utc),
        )
        db.add(alert_obj)
        logger.warning(
            "[ALERT] %s user=%s risk=%s",
            alert_data["alert_type"], alert_data["username"], alert_data["risk_level"],
        )

    db.commit()
    db.refresh(event)

    # ── Broadcast event via WebSocket ──────────────────────────────────────
    await manager.broadcast({
        "type": "NEW_EVENT",
        "event": {
            "id": event.id,
            "event_id": event.event_id,
            "timestamp": _utc_isoformat(event.timestamp),
            "username": event.username,
            "source_ip": event.source_ip,
            "source_host": event.source_host,
            "target_computer": event.target_computer,
            "logon_type": event.logon_type,
            "logon_type_description": event.logon_type_description,
            "status": event.status,
            "risk_score": event.risk_score,
            "risk_level": event.risk_level,
            "detection_reason": event.detection_reason,
            "created_at": _utc_isoformat(event.created_at) if event.created_at else None,
        },
    })

    # ── Broadcast alert via WebSocket ──────────────────────────────────────
    if alert_obj:
        db.refresh(alert_obj)
        await manager.broadcast({
            "type": "NEW_ALERT",
            "alert": {
                "id": alert_obj.id,
                "alert_type": alert_obj.alert_type,
                "username": alert_obj.username,
                "source_ip": alert_obj.source_ip,
                "source_host": source_label,
                "target_computer": alert_obj.target_computer,
                "risk_score": alert_obj.risk_score,
                "risk_level": alert_obj.risk_level,
                "failure_count": alert_obj.failure_count,
                "time_window_seconds": alert_obj.time_window_seconds,
                "reason": alert_obj.reason,
                "triggered_at": _utc_isoformat(alert_obj.triggered_at),
            },
        })

    return event


# ── Query endpoints ───────────────────────────────────────────────────────────
@app.get("/api/events", response_model=List[EventResponse])
async def list_events(
    limit: int = Query(100, le=500),
    offset: int = Query(0),
    username: Optional[str] = Query(None),
    date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    stmt = select(AuthEvent).order_by(AuthEvent.timestamp.desc()).limit(limit).offset(offset)
    if username:
        stmt = stmt.where(AuthEvent.username == username)
    if date:
        stmt = stmt.where(func.date(AuthEvent.timestamp) == date)
    result = db.execute(stmt)
    return result.scalars().all()


@app.get("/api/alerts", response_model=List[AlertResponse])
async def list_alerts(
    limit: int = Query(50, le=200),
    resolved: Optional[bool] = Query(None),
    status: Optional[str] = Query(None),
    date: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    stmt = select(Alert).order_by(Alert.triggered_at.desc()).limit(limit)
    if resolved is not None:
        stmt = stmt.where(Alert.resolved == resolved)
    if status is not None and status != "ALL":
        stmt = stmt.where(Alert.status == status)
    if date:
        stmt = stmt.where(func.date(Alert.triggered_at) == date)
    result = db.execute(stmt)
    return result.scalars().all()


@app.patch("/api/alerts/{alert_id}/status")
async def update_alert_status(
    alert_id: int,
    body: dict,
    db: Session = Depends(get_db),
):
    alert = db.get(Alert, alert_id)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    new_status = (body.get("status") or "OPEN").upper()
    if new_status not in ("OPEN", "INVESTIGATING", "RESOLVED"):
        raise HTTPException(status_code=400, detail="Invalid status value")
    
    alert.status = new_status
    alert.resolved = (new_status == "RESOLVED")
    db.commit()
    db.refresh(alert)
    
    await manager.broadcast({
        "type": "ALERT_STATUS_CHANGED",
        "alert": {
            "id": alert.id,
            "status": alert.status,
            "resolved": alert.resolved,
        }
    })
    return {"ok": True, "alert_id": alert.id, "status": alert.status, "resolved": alert.resolved}


@app.get("/api/stats", response_model=StatsResponse)
async def get_stats(db: Session = Depends(get_db)):
    total = db.execute(select(func.count()).select_from(AuthEvent)).scalar_one()
    success = (
        db.execute(
            select(func.count()).select_from(AuthEvent).where(AuthEvent.status == "SUCCESS")
        )
    ).scalar_one()
    failed = (
        db.execute(
            select(func.count()).select_from(AuthEvent).where(AuthEvent.status == "FAILURE")
        )
    ).scalar_one()
    active_alerts = (
        db.execute(
            select(func.count()).select_from(Alert).where(Alert.resolved == False)  # noqa: E712
        )
    ).scalar_one()
    critical_alerts = (
        db.execute(
            select(func.count()).select_from(Alert).where(
                Alert.risk_level == "CRITICAL", Alert.resolved == False  # noqa: E712
            )
        )
    ).scalar_one()
    high_alerts = (
        db.execute(
            select(func.count()).select_from(Alert).where(
                Alert.risk_level == "HIGH", Alert.resolved == False  # noqa: E712
            )
        )
    ).scalar_one()
    resolved_incidents = (
        db.execute(
            select(func.count()).select_from(Alert).where(Alert.resolved == True)  # noqa: E712
        )
    ).scalar_one()
    
    return StatsResponse(
        total_events=total,
        successful_logins=success,
        failed_logins=failed,
        active_alerts=active_alerts,
        critical_alerts=critical_alerts,
        high_alerts=high_alerts,
        active_incidents=active_alerts,
        resolved_incidents=resolved_incidents,
    )


# ── Laboratories endpoints ───────────────────────────────────────────────────
@app.get("/api/labs", response_model=List[LabResponse])
async def list_laboratories(db: Session = Depends(get_db)):
    labs = db.execute(select(Laboratory).order_by(Laboratory.created_at.desc())).scalars().all()
    # Query terminal counts for each lab
    result = []
    for lab in labs:
        count = db.execute(
            select(func.count()).select_from(TerminalAssignment).where(TerminalAssignment.lab_id == lab.id)
        ).scalar_one()
        result.append(
            LabResponse(
                id=lab.id,
                name=lab.name,
                description=lab.description,
                location=lab.location,
                created_at=lab.created_at,
                terminals_count=count,
            )
        )
    return result


@app.post("/api/labs", response_model=LabResponse)
async def create_laboratory(body: LabCreateRequest, db: Session = Depends(get_db)):
    import uuid
    lab_id = body.id or f"LAB-{uuid.uuid4().hex[:6].upper()}"
    existing = db.get(Laboratory, lab_id)
    if existing:
        raise HTTPException(status_code=400, detail="Laboratory with this ID already exists")
    
    lab = Laboratory(
        id=lab_id,
        name=body.name,
        description=body.description,
        location=body.location,
        created_at=datetime.now(timezone.utc),
    )
    db.add(lab)
    db.commit()
    db.refresh(lab)
    return LabResponse(
        id=lab.id,
        name=lab.name,
        description=lab.description,
        location=lab.location,
        created_at=lab.created_at,
        terminals_count=0,
    )


@app.delete("/api/labs/{lab_id}")
async def delete_laboratory(lab_id: str, db: Session = Depends(get_db)):
    lab = db.get(Laboratory, lab_id)
    if not lab:
        raise HTTPException(status_code=404, detail="Laboratory not found")
    db.delete(lab)
    # Clear assignments for this lab
    db.execute(
        TerminalAssignment.__table__.update().where(TerminalAssignment.lab_id == lab_id).values(lab_id=None)
    )
    db.commit()
    return {"ok": True, "message": "Laboratory deleted"}


@app.get("/api/labs/{lab_id}/computers", response_model=LabComputersResponse)
async def get_lab_computers(lab_id: str, db: Session = Depends(get_db)):
    lab = db.get(Laboratory, lab_id)
    if not lab:
        raise HTTPException(status_code=404, detail="Laboratory not found")
        
    assignments = db.execute(
        select(TerminalAssignment).where(TerminalAssignment.lab_id == lab_id)
    ).scalars().all()
    
    now = datetime.now(timezone.utc)
    computers_list: list[ComputerSummary] = []
    
    online_count = 0
    offline_count = 0
    unknown_count = 0

    for assign in assignments:
        tid = assign.terminal_id
        comp = db.get(Computer, tid)
        
        collector_info = _collectors.get(tid)
        if not collector_info and comp and comp.hostname:
            collector_info = _collectors.get(comp.hostname)
        
        last_seen = None
        if collector_info and _collector_is_connected(collector_info, now):
            status = "Online"
            last_seen = _collector_last_seen_utc(collector_info)
        elif comp and comp.last_seen:
            last_seen = comp.last_seen
            if last_seen.tzinfo is None:
                last_seen = last_seen.replace(tzinfo=timezone.utc)
            if (now - last_seen).total_seconds() <= COLLECTOR_STALE_SECONDS:
                status = "Online"
            else:
                status = "Offline"
        elif collector_info and collector_info.get("last_seen"):
            last_seen = _collector_last_seen_utc(collector_info)
            status = "Offline"
        else:
            status = "Unknown"

        if status == "Online":
            online_count += 1
        elif status == "Offline":
            offline_count += 1
        else:
            unknown_count += 1

        last_event = db.execute(
            select(AuthEvent)
            .where((AuthEvent.target_computer == tid) | (AuthEvent.source_host == tid))
            .order_by(AuthEvent.timestamp.desc())
            .limit(1)
        ).scalars().first()
        
        last_auth_summary = None
        if last_event:
            last_auth_summary = LastAuthEventSummary(
                event_id=last_event.event_id,
                status=last_event.status or "UNKNOWN",
                timestamp=last_event.timestamp,
                username=last_event.username,
                logon_type_description=last_event.logon_type_description,
                source_ip=last_event.source_ip,
                risk_level=last_event.risk_level or "LOW",
            )
            
        incidents_count = db.execute(
            select(func.count())
            .select_from(Alert)
            .where((Alert.target_computer == tid) | (Alert.source_host == tid))
        ).scalar_one()

        last_seen_str = None
        if last_seen:
            last_seen_str = last_seen.strftime("%d/%m/%Y %H:%M:%S")

        c_name = (comp.computer_name if comp else None) or (collector_info.get("computer_name") if collector_info else None) or tid
        c_host = (comp.hostname if comp else None) or (collector_info.get("hostname") if collector_info else None) or tid
        c_ip = (comp.ip_address if comp else None) or (collector_info.get("ip") if collector_info else None) or (last_event.source_ip if last_event else None)
        c_mac = (comp.mac_address if comp else None) or (collector_info.get("mac_address") if collector_info else None)
        c_os_name = (comp.os_name if comp else None) or (collector_info.get("os_name") if collector_info else None)
        c_os_ver = (comp.os_version if comp else None) or (collector_info.get("os_version") if collector_info else None)
        c_user = (comp.logged_in_user if comp else None) or (collector_info.get("logged_in_user") if collector_info else None) or (last_event.username if last_event else None)
        c_cpu = (comp.cpu if comp else None) or (collector_info.get("cpu") if collector_info else None)
        c_ram = (comp.ram if comp else None) or (collector_info.get("ram") if collector_info else None)
        c_manuf = (comp.manufacturer if comp else None) or (collector_info.get("manufacturer") if collector_info else None)
        c_model = (comp.model if comp else None) or (collector_info.get("model") if collector_info else None)

        computers_list.append(
            ComputerSummary(
                terminal_id=tid,
                computer_name=c_name,
                hostname=c_host,
                ip_address=c_ip,
                mac_address=c_mac,
                os_name=c_os_name,
                os_version=c_os_ver,
                logged_in_user=c_user,
                cpu=c_cpu,
                ram=c_ram,
                manufacturer=c_manuf,
                model=c_model,
                status=status,
                last_seen=last_seen,
                last_seen_formatted=last_seen_str,
                last_auth_event=last_auth_summary,
                incidents_count=incidents_count,
                lab_id=lab.id,
                lab_name=lab.name,
            )
        )

    return LabComputersResponse(
        lab_id=lab.id,
        lab_name=lab.name,
        description=lab.description,
        location=lab.location,
        total_computers=len(computers_list),
        online_count=online_count,
        offline_count=offline_count,
        unknown_count=unknown_count,
        computers=computers_list,
    )


@app.get("/api/computers/{terminal_id}", response_model=ComputerDetailResponse)
async def get_computer_detail(terminal_id: str, db: Session = Depends(get_db)):
    comp = db.get(Computer, terminal_id)
    now = datetime.now(timezone.utc)
    collector_info = _collectors.get(terminal_id)
    if not collector_info and comp and comp.hostname:
        collector_info = _collectors.get(comp.hostname)

    last_seen = None
    if collector_info and _collector_is_connected(collector_info, now):
        status = "Online"
        last_seen = _collector_last_seen_utc(collector_info)
    elif comp and comp.last_seen:
        last_seen = comp.last_seen
        if last_seen.tzinfo is None:
            last_seen = last_seen.replace(tzinfo=timezone.utc)
        if (now - last_seen).total_seconds() <= COLLECTOR_STALE_SECONDS:
            status = "Online"
        else:
            status = "Offline"
    elif collector_info and collector_info.get("last_seen"):
        last_seen = _collector_last_seen_utc(collector_info)
        status = "Offline"
    else:
        status = "Unknown"

    assignment = db.get(TerminalAssignment, terminal_id)
    lab_response = None
    lab_id = None
    lab_name = None
    if assignment and assignment.lab_id:
        lab_obj = db.get(Laboratory, assignment.lab_id)
        if lab_obj:
            lab_id = lab_obj.id
            lab_name = lab_obj.name
            count = db.execute(
                select(func.count()).select_from(TerminalAssignment).where(TerminalAssignment.lab_id == lab_obj.id)
            ).scalar_one()
            lab_response = LabResponse(
                id=lab_obj.id,
                name=lab_obj.name,
                description=lab_obj.description,
                location=lab_obj.location,
                created_at=lab_obj.created_at,
                terminals_count=count,
            )

    auth_events = db.execute(
        select(AuthEvent)
        .where((AuthEvent.target_computer == terminal_id) | (AuthEvent.source_host == terminal_id))
        .order_by(AuthEvent.timestamp.desc())
        .limit(50)
    ).scalars().all()

    last_auth_summary = None
    if auth_events:
        last_event = auth_events[0]
        last_auth_summary = LastAuthEventSummary(
            event_id=last_event.event_id,
            status=last_event.status or "UNKNOWN",
            timestamp=last_event.timestamp,
            username=last_event.username,
            logon_type_description=last_event.logon_type_description,
            source_ip=last_event.source_ip,
            risk_level=last_event.risk_level or "LOW",
        )

    alerts = db.execute(
        select(Alert)
        .where((Alert.target_computer == terminal_id) | (Alert.source_host == terminal_id))
        .order_by(Alert.triggered_at.desc())
    ).scalars().all()

    last_seen_str = last_seen.strftime("%d/%m/%Y %H:%M:%S") if last_seen else None

    first_ev = auth_events[0] if auth_events else None
    c_name = (comp.computer_name if comp else None) or (collector_info.get("computer_name") if collector_info else None) or terminal_id
    c_host = (comp.hostname if comp else None) or (collector_info.get("hostname") if collector_info else None) or terminal_id
    c_ip = (comp.ip_address if comp else None) or (collector_info.get("ip") if collector_info else None) or (first_ev.source_ip if first_ev else None)
    c_mac = (comp.mac_address if comp else None) or (collector_info.get("mac_address") if collector_info else None)
    c_os_name = (comp.os_name if comp else None) or (collector_info.get("os_name") if collector_info else None)
    c_os_ver = (comp.os_version if comp else None) or (collector_info.get("os_version") if collector_info else None)
    c_user = (comp.logged_in_user if comp else None) or (collector_info.get("logged_in_user") if collector_info else None) or (first_ev.username if first_ev else None)
    c_cpu = (comp.cpu if comp else None) or (collector_info.get("cpu") if collector_info else None)
    c_ram = (comp.ram if comp else None) or (collector_info.get("ram") if collector_info else None)
    c_manuf = (comp.manufacturer if comp else None) or (collector_info.get("manufacturer") if collector_info else None)
    c_model = (comp.model if comp else None) or (collector_info.get("model") if collector_info else None)

    summary = ComputerSummary(
        terminal_id=terminal_id,
        computer_name=c_name,
        hostname=c_host,
        ip_address=c_ip,
        mac_address=c_mac,
        os_name=c_os_name,
        os_version=c_os_ver,
        logged_in_user=c_user,
        cpu=c_cpu,
        ram=c_ram,
        manufacturer=c_manuf,
        model=c_model,
        status=status,
        last_seen=last_seen,
        last_seen_formatted=last_seen_str,
        last_auth_event=last_auth_summary,
        incidents_count=len(alerts),
        lab_id=lab_id,
        lab_name=lab_name,
    )

    return ComputerDetailResponse(
        computer=summary,
        lab=lab_response,
        auth_events=auth_events,
        incidents=alerts,
    )



# ── Terminals endpoints ───────────────────────────────────────────────────────
@app.get("/api/terminals", response_model=List[TerminalResponse])
async def list_terminals(db: Session = Depends(get_db)):
    # Distinct terminals from auth_events
    events = db.execute(
        select(AuthEvent).order_by(AuthEvent.timestamp.desc())
    ).scalars().all()
    
    terminals_map = {}
    for ev in events:
        tid = ev.target_computer or ev.source_host
        if not tid:
            continue
        if tid not in terminals_map:
            terminals_map[tid] = ev
            
    # Fetch assignments
    assignments = {
        a.terminal_id: a.lab_id
        for a in db.execute(select(TerminalAssignment)).scalars().all()
    }
    # Fetch labs for lab names
    labs_map = {
        l.id: l.name
        for l in db.execute(select(Laboratory)).scalars().all()
    }
    
    terminal_list = []
    for tid, ev in terminals_map.items():
        assigned_lab_id = assignments.get(tid)
        assigned_lab_name = labs_map.get(assigned_lab_id) if assigned_lab_id else None
        
        # Format date as DD/MM/YYYY HH:mm:ss
        ts_str = "—"
        if ev.timestamp:
            ts_str = ev.timestamp.strftime("%d/%m/%Y %H:%M:%S")
            
        terminal_list.append(
            TerminalResponse(
                terminal_id=tid,
                account=ev.username or "—",
                source_ip=ev.source_ip or "—",
                last_login=ts_str,
                last_login_raw=ev.timestamp,
                status=ev.status or "UNKNOWN",
                lab_id=assigned_lab_id,
                lab_name=assigned_lab_name,
            )
        )
    return terminal_list


@app.post("/api/terminals/assign")
async def assign_terminal(body: TerminalAssignRequest, db: Session = Depends(get_db)):
    assignment = db.get(TerminalAssignment, body.terminal_id)
    if not assignment:
        assignment = TerminalAssignment(terminal_id=body.terminal_id, lab_id=body.lab_id)
        db.add(assignment)
    else:
        assignment.lab_id = body.lab_id
        assignment.assigned_at = datetime.now(timezone.utc)
    db.commit()
    
    # Broadcast update
    await manager.broadcast({
        "type": "TERMINAL_ASSIGNED",
        "terminal_id": body.terminal_id,
        "lab_id": body.lab_id,
    })
    return {"ok": True, "terminal_id": body.terminal_id, "lab_id": body.lab_id}


# ── Live Telemetry Export Endpoint ───────────────────────────────────────────
@app.get("/api/telemetry/export")
async def export_live_telemetry(db: Session = Depends(get_db)):
    events = db.execute(
        select(AuthEvent).order_by(AuthEvent.timestamp.desc()).limit(1000)
    ).scalars().all()
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Timestamp",
        "User",
        "Source IP",
        "Action/Event",
        "Status",
        "Country/Region",
        "Risk Level",
        "Attack/Alert Type",
        "Terminal",
    ])
    
    for ev in events:
        ts = ev.timestamp.strftime("%d/%m/%Y %H:%M:%S") if ev.timestamp else ""
        action = ev.logon_type_description or f"Event {ev.event_id}"
        terminal = ev.target_computer or ev.source_host or "—"
        attack_type = ev.detection_reason or "NORMAL"
        writer.writerow([
            ts,
            ev.username or "—",
            ev.source_ip or "—",
            action,
            ev.status or "UNKNOWN",
            "Local / Internal",
            ev.risk_level or "LOW",
            attack_type,
            terminal,
        ])
    
    csv_content = output.getvalue()
    return Response(
        content=csv_content,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=live_telemetry_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"},
    )



@app.get("/api/health", response_model=HealthResponse)
async def health(db: Session = Depends(get_db)):
    # Quick DB ping
    try:
        db.execute(select(func.count()).select_from(AuthEvent))
        db_status = "ONLINE"
    except Exception:
        db_status = "OFFLINE"

    # Determine aggregate collector status
    now = datetime.now(timezone.utc)
    connected = [
        c for c in _collectors.values() if _collector_is_connected(c, now)
    ]
    col_status = "CONNECTED" if connected else "DISCONNECTED"
    col_hostname = ", ".join(c["hostname"] for c in connected) if connected else None
    col_ip = ", ".join(c["ip"] for c in connected if c.get("ip")) if connected else None

    return HealthResponse(
        status="OK",
        backend="ONLINE",
        database=db_status,
        websocket_connections=manager.connection_count,
        collector_status=col_status,
        collector_hostname=col_hostname,
        collector_ip=col_ip,
        uptime_seconds=time.monotonic() - _start_time,
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.host,
        port=settings.port,
        log_level="info",
    )
