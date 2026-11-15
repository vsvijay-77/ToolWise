import * as THREE from 'three';
import { ToolWearStatus } from './types';

export const COLOR_NORMAL = new THREE.Color('#10b981');    // Vibrant Emerald
export const COLOR_WARNING = new THREE.Color('#f59e0b');   // Industrial Amber
export const COLOR_CRITICAL = new THREE.Color('#ef4444');  // Hazard Crimson

export const EMISSIVE_NORMAL = new THREE.Color('#064e3b');
export const EMISSIVE_WARNING = new THREE.Color('#78350f');
export const EMISSIVE_CRITICAL = new THREE.Color('#991b1b');

/**
 * Determine tool wear status based on tool life percent and Flank Wear VB.
 * Key Requirements:
 * - Normal: > 70% life, VB < 150 µm
 * - Warning: 30% - 70% life, VB 150 - 300 µm
 * - Critical: < 30% life, VB > 300 µm
 */
export function getToolWearStatus(lifePercent: number, flankWearVB: number): ToolWearStatus {
  if (lifePercent < 30 || flankWearVB > 300) {
    return 'critical';
  }
  if (lifePercent <= 70 || flankWearVB >= 150) {
    return 'warning';
  }
  return 'normal';
}

/**
 * Dynamically interpolate the cutting edge color based on tool life and VB.
 * Smoothly blends:
 * 100% -> 70%: Vibrant Emerald
 * 70% -> 30%: Emerald -> Industrial Amber
 * 30% -> 0%: Amber -> Hazard Crimson
 */
export function getInterpolatedWearColor(lifePercent: number): THREE.Color {
  const clampedLife = Math.max(0, Math.min(100, lifePercent));
  const target = new THREE.Color();

  if (clampedLife >= 70) {
    // 70% to 100%: Vibrant Emerald
    target.copy(COLOR_NORMAL);
  } else if (clampedLife >= 30) {
    // 30% to 70%: Lerp from Amber to Emerald
    const t = (clampedLife - 30) / 40; // 0 at 30%, 1 at 70%
    target.copy(COLOR_WARNING).lerp(COLOR_NORMAL, t);
  } else {
    // 0% to 30%: Lerp from Critical Red to Amber
    const t = clampedLife / 30; // 0 at 0%, 1 at 30%
    target.copy(COLOR_CRITICAL).lerp(COLOR_WARNING, t);
  }

  return target;
}

/**
 * Dynamically compute corresponding flank wear VB (in µm) from tool life percentage.
 * Typical Taylor wear curve: fast initial breakdown -> steady linear flank wear -> exponential breakdown
 */
export function calculateVBFromLife(lifePercent: number, maxVB = 350): number {
  const wearFraction = (100 - Math.max(0, Math.min(100, lifePercent))) / 100;
  // Non-linear power factor simulating ISO 3685 flank land progression
  const vb = Math.round(maxVB * Math.pow(wearFraction, 0.92));
  return Math.min(maxVB, Math.max(0, vb));
}

/**
 * Dynamically compute vibration RMS based on flank wear and cutting conditions.
 * Fresh tool: ~1.2 - 1.5 mm/s; Warning: ~2.5 - 3.8 mm/s; Critical chatter: > 4.5 mm/s.
 */
export function calculateVibrationRms(lifePercent: number, baseSpeed = 850): number {
  const wearFactor = (100 - lifePercent) / 100;
  const baseRms = 1.25 * (baseSpeed / 800);
  const chatter = wearFactor > 0.7 ? Math.pow((wearFactor - 0.7) * 3.3, 2) * 4.2 : 0;
  const rms = baseRms + wearFactor * 1.8 + chatter;
  return Math.round(rms * 100) / 100;
}
