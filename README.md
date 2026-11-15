# ToolWise — Predictive CNC Tool-Life, Delay & Cost Intelligence

> **Every tool change. Every minute. Every rupee counts.**

ToolWise is a CNC tool-life digital twin and batch-intelligence platform. It combines material-aware **Taylor tool-life physics**, **flank wear (`VB`) progression**, **explainable 0–100 health scoring**, **3D shop-floor & spindle digital twins**, and **financial cost-of-loss comparisons** (`Change now` vs. `Run to planned limit` vs. `Run to failure`) so machining teams swap tools at the optimal part—eliminating unplanned spindle downtime, scrap billets, and tool-holder collisions.

**Live Web App:** [https://toolwise-app.vercel.app](https://toolwise-app.vercel.app)

---

## The Idea & Problem Solved

In CNC machining, tools are typically changed in two costly ways:
1. **Too early (fixed schedule):** Throwing away usable carbide edges, inflating tooling spend and unnecessary changeover stops.
2. **Too late (run to failure):** Pushing past the flank-wear limit (`VB >= 0.30 mm`), causing burrs, dimensional drift, scrapped workpieces, 90+ minutes of unplanned downtime, and expensive tool-holder collisions.

**ToolWise** turns live/simulated spindle telemetry and material parameters into a single, explainable decision:
- **Exact Remaining Useful Life (RUL)** in cutting minutes and parts remaining before the wear threshold.
- **Side-by-side Financial Comparison** (`₹` / `$`) breaking down Tool Cost, Downtime, Scrap, and Rework across all three changeover options.
- **3-Stage Product Damage Prevention Shield:**
  - **Stage 1 — Healthy (`VB < 35%`, Score ≥ 80):** Keep running at current parameters.
  - **Stage 2 — Monitor & Stage (`VB 35–69%`, Score 50–79):** Prepare sister tool in magazine pocket and schedule `VB` inspection.
  - **Stage 3 — Critical Lockout (`VB >= 90%` or `RUL < 10 min`):** Replace immediately before next cycle to prevent scrap and holder damage.

---

## Key Features

- **Pre-Login Overview (`/`)**: Interactive 3D CNC twin preview, 4-step prediction pipeline, 3 optimization workflows, and 3-stage damage prevention matrix.
- **Fleet Dashboard (`/dashboard`)**:
  - **Machine Fleet Status Strip**: Real-time counts for Total, Running, Idle, and Stopped cells.
  - **Fleet KPIs & Needs Attention**: Sorted by severity (`Critical` → `Monitor` → `OK`) in Table or Card view.
  - **Actual vs. Predicted Tool Life Chart**: Grouped bar chart comparing Taylor predicted life, actual cut time used, and remaining minutes per machine.
  - **Next Batches Queue**: Upcoming jobs across the fleet with part numbers, materials, operations, tool IDs, quantities, and start offsets.
- **3D Factory Floor (`/factory`)**: Interactive Three.js shop floor with distinct CNC & PLC cell models, status badges, Overview/Focus camera modes, and bay inspection.
- **Machine Monitor (`/machines/:id`)**:
  - **3D CNC Spindle Twin** (`Iso / Front / Top / Tool` camera presets) + **3D/2D Tool Magazine Twin**.
  - **Tool Life & Decision Dashboard**: State-aware Verdict Hero, 4 KPI tiles, 5-row Actual vs. Predicted table + `VB` wear-over-time curve, 3-option Cost Comparison with 4-segment stacked breakdown bars, CSV/Print export, and prioritized **AI Suggestions**.
- **Process & Tool Magazine (`/machines/:id/process`)** and **Score & Cost Report (`/machines/:id/report`)**.
- **Materials Library (`/materials`)**, **AI Assistance (`/ai-assistance`)**, **Edge Gateway AI (`/edge-gateway`)**, and **Settings (`/settings`)** (`INR ₹` / `USD $` currency toggle).

---

## Tech Stack & Architecture

- **Frontend (`frontend/`)**: React 19, TypeScript, Vite, Material UI v6 (dark-mode first), `@mui/x-charts`, Three.js (`@react-three/fiber`, `@react-three/drei`), React Query, React Router.
- **Backend (`backend/`)**: FastAPI, SQLAlchemy, Pytest, Taylor tool-life & wear calculation services, and edge-ingestion contract endpoints (`/predict`, `/signals/ingest`, `/ws/live/{machine_id}`, `/architecture`).
- **Docs (`docs/`)**: Edge-contract and Aerial-inspired ingestion architecture notes.

```text
CNC / PLC Controller (FOCAS / OPC UA / MTConnect)
  └─ Edge Adapter → Validated Signal Batch → Optional GPU Inference
       └─ FastAPI Store & WebSocket (/signals/ingest, /ws/live/{id})
            └─ ToolWise Digital Twin (3D Scene + Taylor RUL + Cost Engine + AI Suggestions)
```

> **Note on Simulated Telemetry:** ToolWise runs out-of-the-box with built-in simulated shop-floor telemetry and Taylor physics calculations so every route works without live CNC hardware attached.

---

## Local Setup & Quick Start

### 1. Backend (FastAPI)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt pytest
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API docs are available at `http://127.0.0.1:8000/docs`.

### 2. Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev -- --host 0.0.0.0 --port 5173
```

Open `http://127.0.0.1:5173` in your browser. Click **Launch Demo** on the home page (or sign in at `/signin`) to explore the dashboard.

### 3. Verification

```bash
# Frontend TypeScript check + production build
cd frontend && npm run build

# Backend tests
cd ../backend && .venv/bin/pytest -q
```
