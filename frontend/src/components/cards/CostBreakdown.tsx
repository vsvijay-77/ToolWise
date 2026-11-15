import { Info } from "lucide-react";
import {
  Box,
  Card,
  CardContent,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { money } from "../../utils/format";
export function CostBreakdown({
  title,
  total,
  items,
  currency,
  recommended,
}: {
  title: string;
  total: number;
  items: Record<string, number>;
  currency: "USD" | "INR";
  recommended?: boolean;
}) {
  return (
    <Card
      sx={{
        borderColor: recommended ? "secondary.main" : "divider",
        position: "relative",
      }}
    >
      {recommended && (
        <Box
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            px: 1,
            py: 0.35,
            borderRadius: 1,
            bgcolor: "secondary.light",
            color: "secondary.dark",
            fontSize: 10,
            fontWeight: 800,
          }}
        >
          RECOMMENDED
        </Box>
      )}
      <CardContent>
        <Typography variant="subtitle2">{title}</Typography>
        <Typography variant="h4" sx={{ mt: 0.8 }}>
          {money(total, currency)}
        </Typography>
        <Stack spacing={0.7} mt={2}>
          {Object.entries(items).map(([label, value]) => (
            <Stack
              key={label}
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Stack direction="row" spacing={0.5} alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  {label}
                </Typography>
                <Tooltip title="Engineering estimate — simulated data">
                  <Info size={11} />
                </Tooltip>
              </Stack>
              <Typography variant="caption" fontWeight={700}>
                {money(value, currency)}
              </Typography>
            </Stack>
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}
