import { useQuery } from "@tanstack/react-query";
import {
  machines as fallbackMachines,
  tools as fallbackTools,
  type Machine,
  type Tool,
} from "./data";

const api =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" && window.location.hostname
    ? `http://${window.location.hostname}:8000`
    : "http://127.0.0.1:8000");
type ApiMachine = Pick<Machine, "id" | "name" | "make" | "controller"> &
  Partial<Omit<Machine, "id" | "name" | "make" | "controller">>;
type ApiTool = Pick<
  Tool,
  | "id"
  | "name"
  | "type"
  | "material"
  | "coating"
  | "diameter_mm"
  | "flute_count"
  | "life_limit_min"
  | "vb_limit_mm"
  | "cost"
> &
  Partial<
    Omit<
      Tool,
      | "id"
      | "name"
      | "type"
      | "material"
      | "coating"
      | "diameter_mm"
      | "flute_count"
      | "life_limit_min"
      | "vb_limit_mm"
      | "cost"
    >
  >;
async function catalogueRequest<T>(path: string, fallback: T): Promise<T> {
  try {
    const response = await fetch(`${api}${path}`, {
      headers: { "ngrok-skip-browser-warning": "true" },
    });
    if (!response.ok) throw new Error("API unavailable");
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

const mergeMachines = (remote: ApiMachine[]): Machine[] =>
  remote.map((item) => {
    const fallback =
      fallbackMachines.find((candidate) => candidate.id === item.id) ??
      fallbackMachines[0];
    return {
      ...fallback,
      ...item,
      status: item.status ?? fallback.status,
      currentToolId: item.currentToolId ?? fallback.currentToolId,
    };
  });
const mergeTools = (remote: ApiTool[]): Tool[] =>
  remote.map((item) => {
    const fallback =
      fallbackTools.find((candidate) => candidate.id === item.id) ??
      fallbackTools[0];
    return {
      ...fallback,
      ...item,
      overhang_mm: item.overhang_mm ?? fallback.overhang_mm,
      holder: item.holder ?? fallback.holder,
      pocket: item.pocket ?? fallback.pocket,
      supplier: item.supplier ?? fallback.supplier,
    };
  });

export function useCatalogue() {
  const machineQuery = useQuery({
    queryKey: ["machines"],
    queryFn: async () =>
      mergeMachines(
        await catalogueRequest<ApiMachine[]>("/machines", fallbackMachines),
      ),
    staleTime: 60_000,
  });
  const toolQuery = useQuery({
    queryKey: ["tools"],
    queryFn: async () =>
      mergeTools(await catalogueRequest<ApiTool[]>("/tools", fallbackTools)),
    staleTime: 60_000,
  });
  return {
    machines: machineQuery.data ?? fallbackMachines,
    tools: toolQuery.data ?? fallbackTools,
    isLoading: machineQuery.isLoading || toolQuery.isLoading,
    refresh: () => {
      void machineQuery.refetch();
      void toolQuery.refetch();
    },
  };
}

export type Prediction = {
  predicted_life_minutes: number;
  rul_minutes: number;
  estimated_vb_mm?: number;
  warning_level: string;
};
export async function requestPrediction(
  payload: {
    toolId: string;
    speed: number;
    feed: number;
    depth: number;
    timeInCut: number;
    workpieceGroup: string;
  },
  fallbackLife: number,
): Promise<Prediction> {
  try {
    const response = await fetch(`${api}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true",
      },
      body: JSON.stringify({
        tool_id: payload.toolId,
        speed: payload.speed,
        feed: payload.feed,
        depth: payload.depth,
        time_in_cut: payload.timeInCut,
        workpiece_group: payload.workpieceGroup,
      }),
    });
    if (!response.ok) throw new Error("Prediction unavailable");
    return (await response.json()) as Prediction;
  } catch {
    return {
      predicted_life_minutes: fallbackLife,
      rul_minutes: Math.max(0, fallbackLife - payload.timeInCut),
      warning_level: "Simulated fallback",
    };
  }
}
