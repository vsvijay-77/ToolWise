import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Pin,
  PinOff,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';
import { ToolMetadata, ToolWearStatus } from './types';

interface CuttingEdgeHotspotProps {
  position?: [number, number, number];
  toolMetadata: ToolMetadata;
  toolLifePercent: number;
  flankWearVB: number;
  status: ToolWearStatus;
}

export const CuttingEdgeHotspot: React.FC<CuttingEdgeHotspotProps> = ({
  position = [0.65, -3.1, 0.35],
  toolMetadata,
  toolLifePercent,
  flankWearVB,
  status,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const showCard = isOpen || isPinned || isHovered;

  // Status badges & styling
  const statusConfig = {
    normal: {
      label: 'OPTIMAL / IN SPEC',
      bgClass: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300',
      dotClass: 'bg-emerald-400 shadow-[0_0_8px_#10b981]',
      beaconColor: 'bg-emerald-500 ring-emerald-400',
      icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
      vbLimit: '150 µm',
    },
    warning: {
      label: 'ELEVATED WEAR',
      bgClass: 'bg-amber-950/80 border-amber-500/40 text-amber-300',
      dotClass: 'bg-amber-400 shadow-[0_0_8px_#f59e0b]',
      beaconColor: 'bg-amber-500 ring-amber-400',
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
      vbLimit: '300 µm',
    },
    critical: {
      label: 'CRITICAL LIMIT REACHED',
      bgClass: 'bg-rose-950/80 border-rose-500/50 text-rose-300 animate-pulse',
      dotClass: 'bg-rose-500 shadow-[0_0_12px_#ef4444]',
      beaconColor: 'bg-rose-500 ring-rose-400',
      icon: <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />,
      vbLimit: '>300 µm',
    },
  }[status];

  return (
    <group position={position}>
      <Html
        center
        distanceFactor={7.5}
        zIndexRange={[100, 0]}
        className="pointer-events-auto select-none"
      >
        <div className="relative font-sans text-xs">
          {/* Interactive 3D Beacon Node */}
          <button
            type="button"
            onClick={() => {
              setIsOpen((prev) => !prev);
              setIsPinned((prev) => !prev);
            }}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="group relative flex items-center justify-center w-8 h-8 rounded-full bg-slate-900/90 border border-slate-600/80 shadow-2xl backdrop-blur-md transition-all duration-300 hover:scale-125 focus:outline-none focus:ring-2 focus:ring-cyan-400 cursor-pointer"
            title="Inspect cutting edge wear hotspot"
            aria-label="Cutting Edge Hotspot"
          >
            {/* Pulsing ring */}
            <span
              className={`absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping ${statusConfig.beaconColor}`}
            />
            {/* Center core */}
            <span
              className={`relative inline-flex w-3.5 h-3.5 rounded-full ${statusConfig.beaconColor} transition-transform group-hover:scale-110`}
            />

            {/* Micro label pill next to hotspot */}
            {!showCard && (
              <span className="absolute left-9 whitespace-nowrap px-2.5 py-1 rounded-md bg-slate-900/95 border border-slate-700/80 text-xs font-mono font-bold text-slate-200 shadow-lg backdrop-blur-sm pointer-events-none transition-opacity duration-200">
                VB: <span className="font-bold text-cyan-300">{flankWearVB} µm</span>
              </span>
            )}
          </button>

          {/* Expandable Glassmorphic Inspection Card */}
          {showCard && (
            <div
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              className="absolute left-10 -top-24 w-80 rounded-xl bg-slate-950/95 border border-slate-700/80 shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-xl p-4 text-slate-100 transition-all duration-200 transform scale-100 z-50 animate-in fade-in zoom-in-95"
            >
              {/* Connector line indicator */}
              <div className="absolute -left-3 top-28 w-3 h-0.5 bg-gradient-to-r from-cyan-400 to-transparent" />

              {/* Card Header */}
              <div className="flex items-start justify-between border-b border-slate-800/80 pb-2.5 mb-2.5">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-mono tracking-wider uppercase text-cyan-400 font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Cutting Zone Telemetry</span>
                  </div>
                  <h4 className="text-base font-bold tracking-tight text-white mt-0.5">
                    {toolMetadata.toolName}
                  </h4>
                  <p className="text-xs text-slate-300 font-mono">
                    Holder: <span className="text-white font-semibold">{toolMetadata.holder}</span>
                  </p>
                </div>

                {/* Card Action Buttons (Pin & Close) */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsPinned((p) => !p);
                    }}
                    className={`p-1 rounded-md transition-colors ${
                      isPinned
                        ? 'bg-cyan-500/20 text-cyan-300'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                    title={isPinned ? 'Unpin overlay' : 'Pin overlay'}
                  >
                    {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsOpen(false);
                      setIsPinned(false);
                      setIsHovered(false);
                    }}
                    className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    title="Close"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Status Badge */}
              <div
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold mb-3 ${statusConfig.bgClass}`}
              >
                {statusConfig.icon}
                <span className="flex-1 font-bold">{statusConfig.label}</span>
                <span className={`w-2.5 h-2.5 rounded-full ${statusConfig.dotClass}`} />
              </div>

              {/* Wear & RUL Metrics Grid */}
              <div className="grid grid-cols-2 gap-2.5 mb-3">
                {/* Flank Wear VB */}
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="block text-xs uppercase font-mono font-bold text-slate-400">
                    Flank Wear (VB)
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span
                      className={`text-lg font-bold font-mono ${
                        status === 'critical'
                          ? 'text-rose-400'
                          : status === 'warning'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {flankWearVB}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">µm</span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
                        status === 'critical'
                          ? 'bg-rose-500'
                          : status === 'warning'
                          ? 'bg-amber-400'
                          : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(100, (flankWearVB / 350) * 100)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 font-mono mt-1 block">
                    Limit: 300 µm
                  </span>
                </div>

                {/* Remaining Useful Life (RUL) */}
                <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                  <span className="block text-xs uppercase font-mono font-bold text-slate-400">
                    RUL (Remaining)
                  </span>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span className="text-lg font-bold font-mono text-white">
                      {toolMetadata.rulHours.toFixed(1)}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">hrs</span>
                  </div>
                  {/* Life percentage indicator */}
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1.5 overflow-hidden">
                    <div
                      className="h-full bg-cyan-400 transition-all duration-300"
                      style={{ width: `${toolLifePercent}%` }}
                    />
                  </div>
                  <span className="text-xs text-cyan-400 font-mono font-semibold mt-1 block">
                    {toolLifePercent}% intact
                  </span>
                </div>
              </div>

              {/* Substrate & Geometry specs */}
              <div className="pt-2 border-t border-slate-800/80 text-xs text-slate-300 flex justify-between items-center font-mono font-medium">
                <span>Edge Prep: Honed 25µm</span>
                <span className="text-cyan-300">ISO 3685 Standard</span>
              </div>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
};
