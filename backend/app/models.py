from datetime import datetime
from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from .database import Base


class Machine(Base):
    __tablename__ = "machines"
    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    make: Mapped[str] = mapped_column(String(80))
    controller: Mapped[str] = mapped_column(String(80))
    status: Mapped[str] = mapped_column(String(32), default="Offline")
    last_data_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)


class Tool(Base):
    __tablename__ = "tools"
    id: Mapped[str] = mapped_column(String(32), primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    type: Mapped[str] = mapped_column(String(48))
    material: Mapped[str] = mapped_column(String(48))
    coating: Mapped[str] = mapped_column(String(48))
    diameter_mm: Mapped[float] = mapped_column(Float)
    flute_count: Mapped[int] = mapped_column(Integer)
    life_limit_min: Mapped[int] = mapped_column(Integer)
    vb_limit_mm: Mapped[float] = mapped_column(Float)
    cost: Mapped[float] = mapped_column(Float)


class ToolInstance(Base):
    __tablename__ = "tool_instances"
    id: Mapped[int] = mapped_column(primary_key=True)
    tool_id: Mapped[str] = mapped_column(ForeignKey("tools.id"))
    machine_id: Mapped[str] = mapped_column(ForeignKey("machines.id"))
    tool_number: Mapped[str] = mapped_column(String(16))
    installed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Signal(Base):
    __tablename__ = "signals"
    id: Mapped[int] = mapped_column(primary_key=True)
    machine_id: Mapped[str] = mapped_column(ForeignKey("machines.id"))
    tool_instance_id: Mapped[int | None] = mapped_column(ForeignKey("tool_instances.id"), nullable=True)
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    spindle_load: Mapped[float | None] = mapped_column(Float, nullable=True)
    current: Mapped[float | None] = mapped_column(Float, nullable=True)
    vibration_rms: Mapped[float | None] = mapped_column(Float, nullable=True)
    speed: Mapped[float | None] = mapped_column(Float, nullable=True)
    feed: Mapped[float | None] = mapped_column(Float, nullable=True)


class WearMeasurement(Base):
    __tablename__ = "wear_measurements"
    id: Mapped[int] = mapped_column(primary_key=True)
    tool_instance_id: Mapped[int] = mapped_column(ForeignKey("tool_instances.id"))
    vb: Mapped[float] = mapped_column(Float)
    measured_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Prediction(Base):
    __tablename__ = "predictions"
    id: Mapped[int] = mapped_column(primary_key=True)
    tool_instance_id: Mapped[int | None] = mapped_column(ForeignKey("tool_instances.id"), nullable=True)
    predicted_life: Mapped[float] = mapped_column(Float)
    rul: Mapped[float] = mapped_column(Float)
    model_version: Mapped[str] = mapped_column(String(32))
    timestamp: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
