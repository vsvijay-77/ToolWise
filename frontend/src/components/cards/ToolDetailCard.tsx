import {
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import type { Tool } from "../../data";
export function ToolDetailCard({
  tool,
  timeInCut,
  vbWear,
  partsProduced,
}: {
  tool: Tool;
  timeInCut: number;
  vbWear: number;
  partsProduced: number;
}) {
  const facts = [
    ["Tool ID", tool.id],
    ["Type", tool.type],
    ["Material", tool.material],
    ["Coating", tool.coating],
    ["Diameter", `Ø ${tool.diameter_mm} mm`],
    ["Flutes", String(tool.flute_count)],
    ["Stick-out", `${tool.overhang_mm} mm`],
    ["Holder", tool.holder],
    ["Pocket", tool.pocket],
    ["Life limit", `${tool.life_limit_min} min`],
    ["VB limit", `${tool.vb_limit_mm.toFixed(2)} mm`],
    ["Time in cut", `${timeInCut} min`],
    ["Remaining life", `${Math.max(0, tool.life_limit_min - timeInCut)} min`],
    ["Current VB", `${vbWear.toFixed(2)} mm`],
    ["Parts produced", String(partsProduced)],
    ["Cost", `$${tool.cost}`],
    ["Supplier", tool.supplier],
    ["Last change", "29 Oct 2026"],
  ];
  return (
    <Card>
      <CardContent>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="start"
          mb={2}
        >
          <div>
            <Typography variant="h6">Currently running tool</Typography>
            <Typography variant="body2" color="text.secondary">
              Full tool and holder profile
            </Typography>
          </div>
          <Chip label="In cut" color="success" size="small" />
        </Stack>
        <Divider sx={{ mb: 1.5 }} />
        <Grid container spacing={1.1}>
          {facts.map(([label, value]) => (
            <Grid key={label} size={{ xs: 6, sm: 4 }}>
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
              <Typography variant="body2" fontWeight={700} noWrap>
                {value}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}
