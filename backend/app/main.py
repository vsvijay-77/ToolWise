from contextlib import asynccontextmanager
from fastapi import Depends, FastAPI, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.orm import Session
from .calculations import Conditions, calculate
from .database import Base, SessionLocal, engine
from .edge_contracts import EdgeArchitectureStatus
from .models import Machine, Tool
from .seed import seed


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    with SessionLocal() as db:
        seed(db)
    yield


app = FastAPI(title="ToolTwin API", version="0.1.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=False, allow_methods=["*"], allow_headers=["*"])


def db_session():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


class PredictRequest(BaseModel):
    tool_id: str
    speed: float = Field(gt=0)
    feed: float = Field(gt=0)
    depth: float = Field(gt=0)
    time_in_cut: float = Field(default=0, ge=0)
    workpiece_group: str = "Alloy steel"


@app.get("/health")
def health():
    return {"status": "ok", "integration_mode": "offline"}


@app.get("/architecture", response_model=EdgeArchitectureStatus)
def architecture():
    """Expose the planned edge boundary without activating integrations."""
    return EdgeArchitectureStatus()


@app.get("/machines")
def machines(db: Session = Depends(db_session)):
    return db.scalars(select(Machine).order_by(Machine.id)).all()


@app.get("/tools")
def tools(db: Session = Depends(db_session)):
    return db.scalars(select(Tool).order_by(Tool.id)).all()


@app.post("/predict")
def predict(request: PredictRequest, db: Session = Depends(db_session)):
    tool = db.get(Tool, request.tool_id)
    if not tool:
        raise HTTPException(404, "Tool not found")
    return calculate(Conditions(speed=request.speed, feed=request.feed, depth=request.depth), tool.life_limit_min, request.time_in_cut, tool.vb_limit_mm, tool.material, request.workpiece_group)


@app.post("/signals/ingest", status_code=503)
def ingest_signals():
    return {"detail": "Signal ingestion is not configured. Connect an edge gateway before enabling this endpoint."}


@app.websocket("/ws/live/{machine_id}")
async def live(websocket: WebSocket, machine_id: str):
    await websocket.accept()
    await websocket.send_json({"machine_id": machine_id, "status": "offline", "detail": "Live monitoring has not been configured."})
    await websocket.close()
