import React, { Suspense, useState, useRef, useEffect, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, Loader } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Compass,
  Cpu,
  Eye,
  Gauge,
  Layers,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Wrench,
  Zap,
} from 'lucide-react';
import { CNCToolLifeDashboardProps, ToolMetadata, ToolWearStatus } from './types';
import {
  calculateVBFromLife,
  calculateVibrationRms,
  getToolWearStatus,
} from './wearUtils';
import { ToolMeshAssembly } from './ToolMeshAssembly';
import { ProceduralToolAssembly } from './ProceduralToolAssembly';
import { ModelErrorBoundary } from './ModelErrorBoundary';

const DEFAULT_METADATA: ToolMetadata = {
  toolName: 'APKT 160408-PDR',
  holder: 'BT40-FMA25.4',
  rulHours: 18.5,
  maxLifeHours: 25.0,
  insertType: 'Indexable Carbide Milling Insert',
  coating: 'PVD TiAlN / AlCrN Multilayer',
  diameterMm: 25.4,
  flutes: 4,
  operation: 'Face Milling & Shoulder Profiling',
};

export const CNCToolLifeTwin: React.FC<CNCToolLifeDashboardProps> = ({
  toolLifePercent: propLife,
  flankWearVB: propVB,
  toolMetadata = DEFAULT_METADATA,
  modelUrl = '/models/cnc_tool_assembly.glb',
  cuttingSpeedVc = 850,
  feedRateFz = 0.18,
  vibrationRms: propVibration,
  onResetTool,
  className = '',
  autoRotateDefault = false,
}) => {
  // Controlled or internal state for interactive simulation
  const [internalLife, setInternalLife] = useState(propLife ?? 85);
  const [autoRotate, setAutoRotate] = useState(autoRotateDefault);
  const [wireframe, setWireframe] = useState(false);
  const [isPlayingCycle, setIsPlayingCycle] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);

  // Sync prop changes
  useEffect(() => {
    if (propLife !== undefined) {
      setInternalLife(propLife);
    }
  }, [propLife]);

  // Derive dynamic metrics
  const toolLife = internalLife;
  const flankWearVB = propVB !== undefined ? propVB : calculateVBFromLife(toolLife);
  const currentStatus: ToolWearStatus = getToolWearStatus(toolLife, flankWearVB);

  // Remaining Useful Life (RUL) in hours derived from tool life %
  const dynamicRulHours = (toolMetadata.maxLifeHours || 25) * (toolLife / 100);

  // Dynamic Vibration RMS calculation with flank wear progression
  const currentVibrationRms =
    propVibration !== undefined
      ? propVibration
      : calculateVibrationRms(toolLife, cuttingSpeedVc);

  // Live wear simulation loop
  useEffect(() => {
    if (!isPlayingCycle) return;
    const interval = setInterval(() => {
      setInternalLife((prev) => {
        if (prev <= 2) {
          setIsPlayingCycle(false);
          return 0;
        }
        return Math.max(0, prev - 1);
      });
    }, 180);

    return () => clearInterval(interval);
  }, [isPlayingCycle]);

  // Reset tool handler
  const handleReset = useCallback(() => {
    setInternalLife(100);
    setIsPlayingCycle(false);
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
    if (onResetTool) {
      onResetTool();
    }
    setToastMessage('New Tool Assembly Mounted. Flank wear reset to 0 µm.');
    setTimeout(() => setToastMessage(null), 3500);
  }, [onResetTool]);

  // Camera presets
  const handleResetCamera = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
    }
  }, []);

  const handleFocusCuttingEdge = useCallback(() => {
    if (controlsRef.current) {
      controlsRef.current.target.set(0, -3.0, 0);
      controlsRef.current.update();
    }
  }, []);

  // Fullscreen toggle
  const toggleFullScreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullScreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullScreen(false);
    }
  };

  // Status-dependent UI styles
  const statusStyles = {
    normal: {
      badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
      dotBg: 'bg-emerald-400 shadow-[0_0_10px_#10b981]',
      headline: 'NORMAL / OPTIMAL WEAR',
      accent: 'emerald',
      bannerBg: 'from-emerald-950/40 to-transparent',
    },
    warning: {
      badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
      dotBg: 'bg-amber-400 shadow-[0_0_10px_#f59e0b]',
      headline: 'WARNING / ELEVATED FLANK WEAR',
      accent: 'amber',
      bannerBg: 'from-amber-950/40 to-transparent',
    },
    critical: {
      badgeBg: 'bg-rose-500/20 border-rose-500/50 text-rose-300 animate-pulse',
      dotBg: 'bg-rose-500 shadow-[0_0_14px_#ef4444]',
      headline: 'CRITICAL LIMIT: TOOL REPLACEMENT REQUIRED',
      accent: 'rose',
      bannerBg: 'from-rose-950/50 to-transparent',
    },
  }[currentStatus];

  return (
    <div
      ref={containerRef}
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-100 shadow-2xl select-none font-sans ${className}`}
    >
      {/* ----------------- Top HUD Bar ----------------- */}
      <div className="absolute top-0 inset-x-0 z-20 flex flex-wrap items-center justify-between gap-3 p-4 bg-gradient-to-b from-slate-950/95 via-slate-950/70 to-transparent backdrop-blur-sm pointer-events-none">
        {/* Left: Tool Identification & Status */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-900/90 border border-slate-700/80 shadow-md">
            <Cpu className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-wider text-slate-300">
                CNC TWIN · {toolMetadata.holder}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-xs font-mono font-bold ${statusStyles.badgeBg}`}
              >
                <span className={`w-2 h-2 rounded-full ${statusStyles.dotBg}`} />
                {currentStatus.toUpperCase()}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-2">
              {toolMetadata.toolName}
              <span className="text-xs font-semibold text-slate-400 font-mono">
                (Ø {toolMetadata.diameterMm || 25.4} mm)
              </span>
            </h2>
          </div>
        </div>

        {/* Right: Camera and Viewport Controls */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900/80 border border-slate-800/80 backdrop-blur-md pointer-events-auto">
          {/* Auto Rotate Toggle */}
          <button
            type="button"
            onClick={() => setAutoRotate((a) => !a)}
            className={`p-2 rounded-lg transition-all text-xs font-semibold flex items-center gap-1.5 ${
              autoRotate
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title={autoRotate ? 'Disable auto-rotation' : 'Enable auto-rotation'}
            aria-label="Toggle Auto-Rotate"
          >
            <RotateCcw className={`w-4 h-4 ${autoRotate ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline font-mono text-xs">Rotate</span>
          </button>

          {/* Wireframe Toggle */}
          <button
            type="button"
            onClick={() => setWireframe((w) => !w)}
            className={`p-2 rounded-lg transition-all text-xs font-semibold flex items-center gap-1.5 ${
              wireframe
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Toggle Wireframe inspection"
            aria-label="Toggle Wireframe"
          >
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline font-mono text-xs">Wireframe</span>
          </button>

          {/* Focus Cutting Edge */}
          <button
            type="button"
            onClick={handleFocusCuttingEdge}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Focus camera on cutting edge"
            aria-label="Focus Cutting Edge"
          >
            <Compass className="w-4 h-4" />
          </button>

          {/* Reset View */}
          <button
            type="button"
            onClick={handleResetCamera}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Reset camera viewpoint"
            aria-label="Reset Camera"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullScreen}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Toggle Fullscreen"
            aria-label="Toggle Fullscreen"
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* ----------------- 3D Viewport (Canvas) ----------------- */}
      <div className="relative w-full h-[540px] sm:h-[620px] bg-gradient-to-b from-slate-950 via-[#0a1424] to-[#040810]">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(14,165,233,0.08),transparent_65%)] pointer-events-none" />

        <Canvas
          shadows
          camera={{ position: [0, -0.6, 7.8], fov: 40 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        >
          {/* HDR Studio Environment */}
          <Environment preset="city" />

          {/* Studio Key, Fill & Rim Lights */}
          <ambientLight intensity={0.65} />
          <directionalLight
            position={[8, 12, 10]}
            intensity={1.3}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0001}
          />
          <directionalLight position={[-8, -2, -6]} intensity={0.6} color="#93c5fd" />
          <pointLight position={[0, -3.5, 3]} intensity={0.8} color="#38bdf8" distance={6} />

          {/* Orbit Controls with smooth damping, zoom limits, auto-rotation */}
          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.06}
            minDistance={3.0}
            maxDistance={14.0}
            maxPolarAngle={Math.PI / 1.7}
            autoRotate={autoRotate}
            autoRotateSpeed={1.8}
            makeDefault
          />

          {/* 3D CNC Assembly with Error Boundary & Suspense Fallback */}
          <Suspense fallback={null}>
            <ModelErrorBoundary
              fallback={
                <ProceduralToolAssembly
                  toolLifePercent={toolLife}
                  flankWearVB={flankWearVB}
                  toolMetadata={{
                    ...toolMetadata,
                    rulHours: dynamicRulHours,
                  }}
                  wireframe={wireframe}
                />
              }
            >
              <ToolMeshAssembly
                modelUrl={modelUrl}
                toolLifePercent={toolLife}
                flankWearVB={flankWearVB}
                toolMetadata={{
                  ...toolMetadata,
                  rulHours: dynamicRulHours,
                }}
                wireframe={wireframe}
              />
            </ModelErrorBoundary>
          </Suspense>

          {/* Contact Shadows beneath the tool assembly */}
          <ContactShadows
            position={[0, -3.3, 0]}
            opacity={0.7}
            scale={11}
            blur={2.4}
            far={4.8}
            color="#020812"
          />
        </Canvas>

        {/* Fallback Drei Loader container */}
        <Loader
          containerStyles={{ background: 'rgba(5, 11, 20, 0.85)' }}
          innerStyles={{ width: '220px', background: '#1e293b' }}
          barStyles={{ background: '#38bdf8' }}
          dataInterpolation={(p) => `Loading CNC Assembly: ${p.toFixed(0)}%`}
        />

        {/* Toast Notification */}
        {toastMessage && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900/95 border border-emerald-500/40 text-emerald-300 shadow-2xl backdrop-blur-md font-mono text-xs animate-in fade-in slide-in-from-top-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 3D Floating Legend / Watermark */}
        {/* 3D Floating Legend / Watermark */}
        <div className="absolute bottom-32 sm:bottom-28 left-4 z-10 flex flex-col gap-1.5 text-xs font-mono font-medium text-slate-300 pointer-events-none">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
            <span>Normal: &gt;70% life / VB &lt;150 µm</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
            <span>Warning: 30%–70% life / VB 150–300 µm</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_#ef4444]" />
            <span>Critical: &lt;30% life / VB &gt;300 µm (Pulsing Glow)</span>
          </div>
        </div>
      </div>

      {/* ----------------- Bottom HUD Dashboard Controls & Readouts ----------------- */}
      <div className="p-4 sm:p-6 bg-slate-950 border-t border-slate-800/90 space-y-5">
        {/* Metric Readout Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Cutting Speed (Vc) */}
          <div className="p-3 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-300 mb-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Cutting Speed (Vc)
              </span>
              <Gauge className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold font-mono text-white">
                {cuttingSpeedVc}
              </span>
              <span className="text-xs text-slate-400 font-mono font-semibold">m/min</span>
            </div>
            <div className="mt-2 text-xs text-slate-400 font-mono font-medium flex justify-between">
              <span>Rec: 750–920</span>
              <span className="text-emerald-400 font-semibold">Stable</span>
            </div>
          </div>

          {/* Card 2: Feed Rate (fz) */}
          <div className="p-3 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-300 mb-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Feed Rate (fz)
              </span>
              <Activity className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold font-mono text-white">
                {feedRateFz.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400 font-mono font-semibold">mm/tooth</span>
            </div>
            <div className="mt-2 text-xs text-slate-400 font-mono font-medium flex justify-between">
              <span>Chip Load: 0.16–0.22</span>
              <span className="text-cyan-400 font-semibold">Nominal</span>
            </div>
          </div>

          {/* Card 3: Vibration (RMS) */}
          <div className="p-3 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-300 mb-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Vibration (RMS)
              </span>
              <Zap
                className={`w-4 h-4 ${
                  currentVibrationRms > 4.0
                    ? 'text-rose-400 animate-bounce'
                    : currentVibrationRms > 2.8
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-xl sm:text-2xl font-bold font-mono ${
                  currentVibrationRms > 4.0
                    ? 'text-rose-400'
                    : currentVibrationRms > 2.8
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {currentVibrationRms.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400 font-mono font-semibold">mm/s</span>
            </div>
            <div className="mt-2 text-xs text-slate-400 font-mono font-medium flex justify-between">
              <span>ISO 10816 Limit: 4.5</span>
              <span
                className={
                  currentVibrationRms > 4.0
                    ? 'text-rose-400 font-bold'
                    : currentVibrationRms > 2.8
                    ? 'text-amber-400 font-bold'
                    : 'text-emerald-400 font-bold'
                }
              >
                {currentVibrationRms > 4.0
                  ? 'Severe Chatter'
                  : currentVibrationRms > 2.8
                  ? 'Elevated'
                  : 'Good'}
              </span>
            </div>
          </div>

          {/* Card 4: Estimated Tool Life / RUL */}
          <div className="p-3 sm:p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-300 mb-1">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                Est. Tool Life (RUL)
              </span>
              <Clock className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl sm:text-2xl font-bold font-mono text-white">
                {dynamicRulHours.toFixed(1)}
              </span>
              <span className="text-xs text-slate-400 font-mono font-semibold">hours</span>
            </div>
            <div className="mt-2 text-xs text-slate-400 font-mono font-medium flex justify-between">
              <span>Flank VB: {flankWearVB} µm</span>
              <span
                className={
                  currentStatus === 'critical'
                    ? 'text-rose-400 font-bold'
                    : currentStatus === 'warning'
                    ? 'text-amber-400 font-bold'
                    : 'text-emerald-400 font-bold'
                }
              >
                {toolLife}% Left
              </span>
            </div>
          </div>
        </div>

        {/* Interactive Simulation Controls & Tool Life Slider */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs font-mono font-bold tracking-wider text-cyan-400 uppercase">
                Interactive Wear Simulation
              </span>
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 mt-0.5">
                Simulate Tool Life & Flank Wear (VB)
                <span className="text-xs font-medium text-slate-300">
                  (0% = End of Life, 100% = Brand New)
                </span>
              </h3>
            </div>

            {/* Quick Presets & Replacement Button */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setInternalLife(100)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold border border-slate-700 transition-colors"
              >
                100% (New)
              </button>
              <button
                type="button"
                onClick={() => setInternalLife(55)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-mono text-xs font-bold border border-amber-500/30 transition-colors"
              >
                55% (Warning)
              </button>
              <button
                type="button"
                onClick={() => setInternalLife(15)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-300 font-mono text-xs font-bold border border-rose-500/30 transition-colors"
              >
                15% (Critical)
              </button>

              {/* Cycle Wear Animation Play / Pause */}
              <button
                type="button"
                onClick={() => setIsPlayingCycle((p) => !p)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-mono text-xs font-bold border transition-colors ${
                  isPlayingCycle
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
                title="Simulate continuous tool wear progression"
              >
                {isPlayingCycle ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Cycle Wear</span>
                  </>
                )}
              </button>

              {/* Reset / Tool Replacement Button */}
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono text-xs font-extrabold shadow-lg shadow-cyan-500/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
                title="Mount fresh tool and reset wear telemetry"
              >
                <Wrench className="w-4 h-4" />
                <span>Replace Tool</span>
              </button>
            </div>
          </div>

          {/* Tool Life Range Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs font-mono font-medium">
              <span className="text-slate-300">
                Current Wear Zone: <strong className="text-white font-bold">{100 - toolLife}% Worn</strong>
              </span>
              <div className="flex items-center gap-3">
                <span className="text-slate-300">
                  Flank Wear: <strong className="text-cyan-300 font-bold">{flankWearVB} µm</strong>
                </span>
                <span className="text-white font-bold text-xs bg-slate-800 px-3 py-1 rounded-md border border-slate-700">
                  {toolLife}% Life
                </span>
              </div>
            </div>

            {/* Slider track */}
            <div className="relative flex items-center">
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={toolLife}
                onChange={(e) => {
                  setIsPlayingCycle(false);
                  setInternalLife(Number(e.target.value));
                }}
                className="w-full h-2.5 rounded-lg appearance-none cursor-pointer bg-slate-800 accent-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
                aria-label="Simulate Tool Life Slider"
              />
            </div>

            {/* Zone Markers & Threshold labels */}
            <div className="flex justify-between text-xs font-mono text-slate-400 pt-1.5">
              <span className="text-rose-400 font-bold">0% (VB 350 µm Critical)</span>
              <span className="text-amber-400 font-bold">30% (VB 300 µm Warning)</span>
              <span className="text-emerald-400 font-bold">70% (VB 150 µm In Spec)</span>
              <span className="text-cyan-400 font-bold">100% (New Tool)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CNCToolLifeTwin;
