export type ToolWearStatus = 'normal' | 'warning' | 'critical';

export interface ToolMetadata {
  toolName: string;
  holder: string;
  rulHours: number;
  insertType?: string;
  coating?: string;
  diameterMm?: number;
  flutes?: number;
  operation?: string;
  maxLifeHours?: number;
}

export interface CNCToolLifeDashboardProps {
  /** Current tool life percentage (0 - 100) */
  toolLifePercent?: number;
  /** Flank wear VB in micrometers (0 - 350 µm) */
  flankWearVB?: number;
  /** Tool and holder engineering metadata */
  toolMetadata?: ToolMetadata;
  /** Path to glTF/GLB model */
  modelUrl?: string;
  /** Optional cutting speed Vc in m/min */
  cuttingSpeedVc?: number;
  /** Optional feed rate fz in mm/tooth */
  feedRateFz?: number;
  /** Optional vibration RMS in mm/s */
  vibrationRms?: number;
  /** Callback triggered when user replaces or resets the tool */
  onResetTool?: () => void;
  /** Additional wrapper CSS classes */
  className?: string;
  /** Enable / disable initial auto-rotation */
  autoRotateDefault?: boolean;
}

export interface TelemetryMetrics {
  toolLifePercent: number;
  flankWearVB: number;
  cuttingSpeedVc: number;
  feedRateFz: number;
  vibrationRms: number;
  rulHours: number;
  status: ToolWearStatus;
}
