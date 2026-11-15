"""Offline-first contracts for the future ToolTwin edge runtime.

These contracts deliberately define data interchange only. They do not open a
machine connection or generate plant telemetry. The design borrows the useful
control-plane/data-plane separation from NVIDIA Aerial, not any 5G RAN code.
"""

from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field


class ToolTwinSignalFrame(BaseModel):
    """One normalized CNC observation emitted by a plant-side adapter."""

    machine_id: str = Field(examples=["CNC-01"])
    controller_family: Literal["CNC", "PNC"]
    occurred_at: datetime
    sequence: int = Field(ge=0)
    tool_instance_id: int | None = None
    spindle_load_pct: float | None = Field(default=None, ge=0, le=100)
    current_rms_amp: float | None = Field(default=None, ge=0)
    vibration_rms_g: float | None = Field(default=None, ge=0)
    cutting_speed_m_min: float | None = Field(default=None, ge=0)
    feed_mm_tooth: float | None = Field(default=None, ge=0)
    depth_of_cut_mm: float | None = Field(default=None, ge=0)


class InferenceBatch(BaseModel):
    """Ordered, validated frames submitted to a future GPU inference worker."""

    batch_id: str
    edge_id: str
    frames: list[ToolTwinSignalFrame] = Field(min_length=1, max_length=4096)
    source: Literal["focas", "opcua", "mtconnect", "rest"]


class EdgeArchitectureStatus(BaseModel):
    mode: Literal["offline"] = "offline"
    adapter: str = "not configured"
    inference: str = "not configured"
    data_contract: str = "ToolTwinSignalFrame v1"
    guardrail: str = "No controller or sensor data is read in offline mode."
