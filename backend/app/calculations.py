"""Transparent engineering-estimate calculations for ToolTwin.

These formulas are not sensor-derived predictions. They become calibration
baselines when validated wear measurements and tool-change outcomes are added.
"""
from dataclasses import dataclass
from math import exp


TAYLOR_COEFFICIENTS = {
    ("Carbide", "Alloy steel"): (390.0, 0.25),
    ("Carbide", "Titanium"): (170.0, 0.22),
    ("Carbide", "Nickel alloy"): (110.0, 0.20),
    ("Carbide", "Aluminium"): (780.0, 0.30),
}


@dataclass
class Conditions:
    speed: float
    feed: float
    depth: float


def taylor_life(conditions: Conditions, reference_limit: float, tool_material: str = "Carbide", workpiece_group: str = "Alloy steel") -> float:
    """V*T^n=C baseline capped by the approved tool-life limit."""
    if min(conditions.speed, conditions.feed, conditions.depth) <= 0:
        raise ValueError("Cutting conditions must be positive")
    c_value, exponent = TAYLOR_COEFFICIENTS.get((tool_material, workpiece_group), (300.0, 0.24))
    engagement_factor = (conditions.feed / 0.12) ** 0.10 * (conditions.depth / 1.0) ** 0.08
    raw_minutes = c_value / (conditions.speed ** exponent * engagement_factor)
    return round(max(5.0, min(raw_minutes, reference_limit)), 1)


def wear_model(cutting_minutes: float, vb0: float = 0.015, k: float = 0.00042, exponent: float = 1.22) -> float:
    return round(max(vb0, vb0 + k * (max(cutting_minutes, 0) ** exponent)), 4)


def failure_probability(wear_ratio: float, life_ratio: float) -> float:
    normalized_risk = wear_ratio * 0.62 + life_ratio * 0.38
    return round(1 / (1 + exp(-7 * (normalized_risk - 0.78))), 4)


def calculate(conditions: Conditions, tool_limit: float, time_in_cut: float = 0, vb_limit: float = 0.3, tool_material: str = "Carbide", workpiece_group: str = "Alloy steel") -> dict:
    life = taylor_life(conditions, tool_limit, tool_material, workpiece_group)
    rul = round(max(0.0, life - time_in_cut), 1)
    vb = wear_model(time_in_cut)
    probability = failure_probability(vb / vb_limit, time_in_cut / life)
    warning = "Critical" if vb / vb_limit >= .9 else "Replace soon" if vb / vb_limit >= .75 else "Watch" if vb / vb_limit >= .6 else "OK"
    return {
        "baseline": "Extended Taylor equation (engineering estimate)",
        "predicted_life_minutes": life,
        "rul_minutes": rul,
        "estimated_vb_mm": vb,
        "failure_probability": probability,
        "recommended_change_at_minutes": round(life * .85, 1),
        "confidence": "Simulated baseline — validate with measured wear and tool-change records",
        "warning_level": warning,
    }
