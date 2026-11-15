from app.calculations import Conditions, failure_probability, taylor_life, wear_model
from app.edge_contracts import InferenceBatch, ToolTwinSignalFrame
from datetime import datetime, timezone


def test_life_is_capped_at_tool_limit():
    assert taylor_life(Conditions(speed=100, feed=.1, depth=.5), 90) == 90


def test_higher_speed_reduces_life():
    slow = taylor_life(Conditions(speed=100, feed=.2, depth=1), 1000)
    fast = taylor_life(Conditions(speed=250, feed=.2, depth=1), 1000)
    assert fast < slow


def test_edge_batch_contract_keeps_controller_context():
    frame = ToolTwinSignalFrame(machine_id="CNC-01", controller_family="CNC", occurred_at=datetime.now(timezone.utc), sequence=1)
    batch = InferenceBatch(batch_id="batch-001", edge_id="edge-a", frames=[frame], source="opcua")
    assert batch.frames[0].machine_id == "CNC-01"


def test_wear_and_failure_probability_increase_with_usage():
    assert wear_model(100) > wear_model(10)
    assert failure_probability(.95, .95) > failure_probability(.25, .25)
