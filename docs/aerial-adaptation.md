# Aerial-to-ToolTwin adaptation

NVIDIA Aerial CUDA-Accelerated RAN is a 5G/6G radio access network SDK. Its cuPHY and cuMAC implementations are radio-specific and must **not** be copied into a CNC tool-life application. ToolTwin instead adopts the engineering patterns that transfer safely across domains.

| Aerial pattern | ToolTwin adaptation | Current status |
| --- | --- | --- |
| Separate control/data-plane components | Edge adapter separates FOCAS, OPC UA, MTConnect, or REST protocol handling from tool-life services | Interface defined; disabled |
| GPU-accelerated batch processing | Validated `InferenceBatch` carries ordered tool signals to an optional CUDA/TensorRT model worker | Future phase |
| Python bindings for ML workflows | A typed Python contract (`ToolTwinSignalFrame`) feeds training and inference code | Implemented contract only |
| Test benches and test vectors | Golden signal batches, wear-measurement outcomes, and tool-change cases validate models before release | Future phase |
| Containers and reproducible runtime | Per-site edge container plus central API, versioned model artifact, and rollout checks | Future phase |

## Redefined architecture

```text
CNC/PNC controller
  └─ plant adapter (FOCAS / OPC UA / MTConnect)
       └─ ToolTwinSignalFrame validation and ordering
            └─ InferenceBatch
                 ├─ GPU model worker (optional TensorRT/CUDA)
                 ├─ prediction and alert event store
                 └─ dashboard WebSocket
```

The entire chain remains intentionally inactive until a machine owner authorizes a connection. Use `GET /architecture` to inspect this offline boundary. The `ToolTwinSignalFrame` model resides in `backend/app/edge_contracts.py`.

## Licensing and provenance

This is an architectural adaptation, not a code dependency or a modification of NVIDIA Aerial. Review NVIDIA Aerial's Apache-2.0 license and third-party attributions before taking any code or dependency from that repository into production.
