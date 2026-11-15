import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { LineChart } from "@mui/x-charts/LineChart";
import { useParams } from "react-router-dom";
import { MaterialCard } from "../components/cards/MaterialCard";
import { ToolMagazineTwinPanel } from "../components/cnc/ToolMagazineTwinPanel";
import { MachineSubTabs } from "../components/nav/MachineSubTabs";
import { requestPrediction } from "../api";
import { jobs, machines, materials, tools, wearHistory } from "../data";
import { useSelection } from "../context/SelectionContext";
import {
  mrr,
  predictTaylorLife,
  remainingLife,
  wearAtTime,
} from "../utils/calculations";

export default function Process() {
  const { id = "CNC-01" } = useParams();
  const { materialId, setMaterialId, setMachineId, fleetMachines, fleetTools, mountToolOnMachine } = useSelection();
  const machine = fleetMachines.find((item) => item.id === id) ?? machines.find((item) => item.id === id) ?? machines[0];
  const tool =
    fleetTools.find((item) => item.id === machine.currentToolId) ??
    tools.find((item) => item.id === machine.currentToolId) ??
    tools[0];
  const job = jobs[machine.id] ?? jobs["CNC-01"];
  const selectedMaterial =
    materials.find((item) => item.id === materialId) ??
    materials.find((item) => item.id === job.materialId) ??
    materials[0];
  const [params, setParams] = useState({
    vc: 186,
    feed: job.feed,
    depth: job.depth,
    width: job.width,
    coolant: job.coolant,
    operation: job.operation,
  });
  const [prediction, setPrediction] = useState(() =>
    predictTaylorLife(tool, selectedMaterial, params.vc),
  );
  useEffect(() => {
    setMachineId(machine.id);
  }, [machine.id, setMachineId]);
  useEffect(() => {
    let active = true;
    const handler = window.setTimeout(() => {
      const fallback = predictTaylorLife(tool, selectedMaterial, params.vc);
      void requestPrediction(
        {
          toolId: tool.id,
          speed: params.vc,
          feed: params.feed,
          depth: params.depth,
          timeInCut: job.timeInCutMin,
          workpieceGroup: selectedMaterial.group,
        },
        fallback,
      ).then((result) => {
        if (active) setPrediction(result.predicted_life_minutes);
      });
    }, 420);
    return () => {
      active = false;
      window.clearTimeout(handler);
    };
  }, [
    job.timeInCutMin,
    params.depth,
    params.feed,
    params.vc,
    selectedMaterial,
    tool,
  ]);
  const change = (key: keyof typeof params, raw: string) =>
    setParams((previous) => ({
      ...previous,
      [key]: key === "coolant" || key === "operation" ? raw : Number(raw),
    }));
  const estimatedWear = wearAtTime(job.timeInCutMin);
  return (
    <Stack spacing={2.5}>
      <MachineSubTabs machineId={machine.id} />
      <Box>
        <Typography variant="h4">Material & process</Typography>
        <Typography color="text.secondary">
          {machine.id} · {tool.id} · calculations refresh after each input
          change.
        </Typography>
      </Box>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 5 }}>
          <Stack spacing={2}>
            <MaterialCard material={selectedMaterial} />
            <Card>
              <CardContent>
                <Typography variant="h6">Workpiece context</Typography>
                <TextField
                  select
                  label="Material grade"
                  fullWidth
                  value={selectedMaterial.id}
                  onChange={(event) => setMaterialId(event.target.value)}
                  sx={{ mt: 2 }}
                >
                  {materials.map((material) => (
                    <MenuItem key={material.id} value={material.id}>
                      {material.name} · {material.hardness}
                    </MenuItem>
                  ))}
                </TextField>
                <Stack direction="row" gap={1} flexWrap="wrap" mt={2}>
                  <Chip
                    label={`Machinability index ${selectedMaterial.machinability}/100`}
                  />
                  <Chip
                    label={`Recommended Vc ${selectedMaterial.vcMin}–${selectedMaterial.vcMax} m/min`}
                    variant="outlined"
                    color="primary"
                  />
                </Stack>
              </CardContent>
            </Card>
            <Alert severity="info">
              Predicted life: <b>{prediction} min</b> · Remaining:{" "}
              <b>
                {Math.round(remainingLife(prediction, job.timeInCutMin))} min
              </b>
              <br />
              Engineering estimate — simulated data.
            </Alert>
          </Stack>
        </Grid>
        <Grid size={{ xs: 12, lg: 7 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Cutting parameters</Typography>
              <Typography variant="body2" color="text.secondary">
                Feed and engagement values are editable planning inputs.
              </Typography>
              <Grid container spacing={1.5} mt={1}>
                {[
                  { key: "vc", label: "Vc", unit: "m/min" },
                  { key: "feed", label: "Feed per tooth fz", unit: "mm/tooth" },
                  { key: "depth", label: "Depth ap", unit: "mm" },
                  { key: "width", label: "Width ae", unit: "mm" },
                ].map((field) => (
                  <Grid key={field.key} size={{ xs: 6, sm: 3 }}>
                    <TextField
                      fullWidth
                      type="number"
                      label={`${field.label} (${field.unit})`}
                      value={
                        params[field.key as "vc" | "feed" | "depth" | "width"]
                      }
                      onChange={(event) =>
                        change(field.key as "vc", event.target.value)
                      }
                    />
                  </Grid>
                ))}
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    select
                    fullWidth
                    label="Coolant"
                    value={params.coolant}
                    onChange={(event) => change("coolant", event.target.value)}
                  >
                    {[
                      "Flood",
                      "MQL",
                      "Dry",
                      "Through tool",
                      "High pressure",
                    ].map((value) => (
                      <MenuItem key={value} value={value}>
                        {value}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    select
                    fullWidth
                    label="Operation"
                    value={params.operation}
                    onChange={(event) =>
                      change("operation", event.target.value)
                    }
                  >
                    {[
                      "Roughing pocket",
                      "Finishing",
                      "Drilling",
                      "OD turning",
                      "Face milling",
                    ].map((value) => (
                      <MenuItem key={value} value={value}>
                        {value}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>
              <Divider sx={{ my: 2.5 }} />
              <Grid container spacing={2}>
                {[
                  [
                    "MRR",
                    `${mrr(params.vc, params.feed, params.depth, params.width)} cm³/min`,
                  ],
                  ["Job", job.partNumber],
                  ["Operation", job.operationNumber],
                  [
                    "Batch progress",
                    `${job.partsCompleted} / ${job.batchSize} parts`,
                  ],
                  ["Cycle time", `${job.cycleTimeSec} sec`],
                  [
                    "Current VB",
                    `${estimatedWear.toFixed(2)} / ${tool.vb_limit_mm.toFixed(2)} mm`,
                  ],
                ].map(([label, value]) => (
                  <Grid key={label} size={{ xs: 6, md: 4 }}>
                    <Typography variant="caption" color="text.secondary">
                      {label}
                    </Typography>
                    <Typography fontWeight={800}>{value}</Typography>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Tool wear VB vs time</Typography>
              <Box sx={{ height: 260, mt: 1 }}>
                <LineChart
                  xAxis={[
                    {
                      data: wearHistory.map((point) => point.time),
                      label: "Time in cut (min)",
                    },
                  ]}
                  series={[
                    {
                      data: wearHistory.map((point) => point.wear),
                      label: "VB wear",
                      color: "#ED6C02",
                      showMark: false,
                    },
                    {
                      data: wearHistory.map(() => tool.vb_limit_mm),
                      label: "VB limit",
                      color: "#D32F2F",
                      showMark: false,
                    },
                  ]}
                  grid={{ horizontal: true }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6">Spindle load vs time</Typography>
              <Box sx={{ height: 260, mt: 1 }}>
                <LineChart
                  xAxis={[
                    {
                      data: wearHistory.map((point) => point.time),
                      label: "Time in cut (min)",
                    },
                  ]}
                  series={[
                    {
                      data: wearHistory.map((point) => point.load),
                      label: "Load %",
                      color: "#1565C0",
                      area: true,
                      showMark: false,
                    },
                  ]}
                  grid={{ horizontal: true }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <ToolMagazineTwinPanel
        machine={machine}
        toolsList={fleetTools}
        job={job}
        material={selectedMaterial}
        onMountTool={mountToolOnMachine}
        showTwin={false}
        showCatalogue
      />
    </Stack>
  );
}
