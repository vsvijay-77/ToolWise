# Real data integration hand-off

The UI deliberately shows no fabricated telemetry. When plant connectivity is approved, add a secured edge service between each machine and ToolTwin.

Use FOCAS for Fanuc, OPC UA when exposed by the controller, or MTConnect where an adapter exists. Normalize incoming data into this shape:

```json
{"machine_id":"CNC-01","timestamp":"2026-11-10T10:15:00Z","spindle_load":42.1,"current":5.8,"vibration_rms":0.12,"speed":850,"feed":0.18,"depth":1.2}
```

Validate units, clock drift, tool identity, and sampling rate at the edge. Publish only over authenticated TLS MQTT or HTTPS; retain the raw stream independently for auditability. Train and release prediction models only once calibrated wear checks and removal reasons are available.
