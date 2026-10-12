# 🛡️ AuthSentinel

**Real-time Windows Authentication Security Monitor**  
Two-laptop cybersecurity lab demonstration system.

---

## Project Structure

```
authsentinel/
├── backend/                 # FastAPI backend (Laptop B)
│   ├── main.py              # API routes + WebSocket
│   ├── detection.py         # Detection engine
│   ├── models.py            # SQLAlchemy ORM
│   ├── schemas.py           # Pydantic schemas
│   ├── ws_manager.py        # WebSocket connection manager
│   ├── database.py          # Async DB session
│   ├── config.py            # Settings (env-overridable)
│   └── requirements.txt
│
├── collector/               # Windows Event Collector (Laptop B)
│   ├── collector.py         # Security Event Log poller
│   └── requirements.txt
│
├── frontend/                # React Dashboard (Laptop B)
│   ├── src/
│   │   ├── App.jsx          # Main dashboard
│   │   ├── App.css          # Cybersecurity dark theme
│   │   ├── useAuthSentinel.js  # WebSocket + REST hook
│   │   └── main.jsx
│   └── vite.config.js
│
├── docs/
│   └── LAB_SETUP.md         # Full setup guide
│
├── test_simulate.py         # Lab simulation (no Laptop A needed)
├── start_backend.bat        # ① Start FastAPI backend
├── start_collector.bat      # ② Start Windows collector (as Admin)
├── start_dashboard.bat      # ③ Start React dashboard
└── run_tests.bat            # Run simulation tests
```

---

## Quick Start (Laptop B)

```
① start_backend.bat
② start_collector.bat   (run as Administrator)
③ start_dashboard.bat
```

Open: `http://localhost:5173`

---

## Two-Laptop Setup

See [docs/LAB_SETUP.md](docs/LAB_SETUP.md) for complete instructions.

**Laptop A** → authenticates to Laptop B (net use / RDP)  
**Laptop B** → monitors, detects, displays

---

## Detection Rules

| Rule | Trigger | Risk |
|------|---------|------|
| `REPEATED_FAILURE` | 5+ failures in 120s, same user+source | HIGH |
| `SUCCESS_AFTER_FAILURES` | Success after ≥3 failures in window | HIGH |

---

## Security Principles

- ❌ **No passwords collected, transmitted, or stored** — ever
- ✅ Only security-event metadata (Event ID, timestamp, username, source IP, logon type)
- ✅ Collector secret header prevents unauthorized injection
- ✅ Backend binds to LAN (`0.0.0.0`) — not exposed to the public Internet

---

## Lab Account Setup

```cmd
net user labtest LabTest@2026! /add
net localgroup "Remote Desktop Users" labtest /add
```

Disable after demo:
```cmd
net user labtest /active:no
```
