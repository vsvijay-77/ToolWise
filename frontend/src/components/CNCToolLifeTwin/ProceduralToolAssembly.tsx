import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ToolMetadata } from './types';
import {
  getToolWearStatus,
  getInterpolatedWearColor,
  COLOR_CRITICAL,
  EMISSIVE_CRITICAL,
} from './wearUtils';
import { CuttingEdgeHotspot } from './CuttingEdgeHotspot';

interface ProceduralToolAssemblyProps {
  toolLifePercent: number;
  flankWearVB: number;
  toolMetadata: ToolMetadata;
  wireframe?: boolean;
}

export const ProceduralToolAssembly: React.FC<ProceduralToolAssemblyProps> = ({
  toolLifePercent,
  flankWearVB,
  toolMetadata,
  wireframe = false,
}) => {
  const status = getToolWearStatus(toolLifePercent, flankWearVB);
  const insertMatRef = useRef<THREE.MeshStandardMaterial>(null!);

  // 1. Tool_Holder: Industrial Matte Brushed Steel (metallic: 0.85, roughness: 0.35)
  const holderMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#94a3b8'),
        metalness: 0.85,
        roughness: 0.35,
        wireframe,
        name: 'Holder_Matte_Brushed_Steel',
      }),
    [wireframe]
  );

  // 2. Tool_Shank / End_Mill_Body: Darkened Tungsten Carbide Steel
  const carbideMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#1e293b'),
        metalness: 0.88,
        roughness: 0.25,
        wireframe,
        name: 'Darkened_Tungsten_Carbide',
      }),
    [wireframe]
  );

  // 3. Dynamic PBR Material for Insert_Cutting_Edge (Wear Zone)
  const insertColor = useMemo(
    () => getInterpolatedWearColor(toolLifePercent),
    [toolLifePercent]
  );

  const insertMaterial = useMemo(() => {
    const isCritical = status === 'critical';
    const isWarning = status === 'warning';

    return new THREE.MeshStandardMaterial({
      color: insertColor,
      metalness: 0.65,
      roughness: 0.2,
      emissive: isCritical
        ? EMISSIVE_CRITICAL
        : isWarning
        ? new THREE.Color('#b45309')
        : new THREE.Color('#064e3b'),
      emissiveIntensity: isCritical ? 0.9 : isWarning ? 0.35 : 0.2,
      wireframe,
      name: 'Dynamic_Insert_Cutting_Edge',
    });
  }, [insertColor, status, wireframe]);

  // Frame animation: Pulsing emissive glow during critical state
  useFrame(({ clock }) => {
    if (insertMatRef.current) {
      if (status === 'critical') {
        const pulse = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 6.5);
        insertMatRef.current.emissive.copy(COLOR_CRITICAL);
        insertMatRef.current.emissiveIntensity = 0.4 + pulse * 1.6;
      } else {
        insertMatRef.current.emissiveIntensity = status === 'warning' ? 0.35 : 0.2;
      }
    }
  });

  return (
    <group position={[0, 0.4, 0]}>
      {/* ----------------- 1. Tool_Holder (BT40 Chuck) ----------------- */}
      <group name="Tool_Holder">
        {/* Retention Pull Stud */}
        <mesh position={[0, 2.4, 0]} material={holderMaterial} castShadow>
          <cylinderGeometry args={[0.18, 0.22, 0.45, 32]} />
        </mesh>
        <mesh position={[0, 2.65, 0]} material={holderMaterial} castShadow>
          <sphereGeometry args={[0.24, 24, 24]} />
        </mesh>

        {/* BT40 7:24 Steep Taper */}
        <mesh position={[0, 1.25, 0]} material={holderMaterial} castShadow>
          <cylinderGeometry args={[0.55, 1.15, 2.0, 48]} />
        </mesh>

        {/* V-Flange Gripper Ring */}
        <mesh position={[0, 0.15, 0]} material={holderMaterial} castShadow>
          <cylinderGeometry args={[1.5, 1.5, 0.25, 48]} />
        </mesh>
        <mesh position={[0, -0.08, 0]} material={holderMaterial} castShadow>
          <cylinderGeometry args={[1.3, 1.3, 0.22, 48]} />
        </mesh>
        <mesh position={[0, -0.31, 0]} material={holderMaterial} castShadow>
          <cylinderGeometry args={[1.5, 1.5, 0.25, 48]} />
        </mesh>

        {/* ER32 / FMA Collet Nose & Clamping Nut */}
        <mesh position={[0, -0.85, 0]} material={holderMaterial} castShadow>
          <cylinderGeometry args={[1.0, 0.9, 0.9, 48]} />
        </mesh>
        <mesh position={[0, -1.45, 0]} material={holderMaterial} castShadow>
          <cylinderGeometry args={[0.92, 0.82, 0.55, 8]} />
        </mesh>
      </group>

      {/* ----------------- 2. Tool_Shank & End_Mill_Body ----------------- */}
      {/* Carbide Shank */}
      <mesh
        name="Tool_Shank"
        position={[0, -2.1, 0]}
        material={carbideMaterial}
        castShadow
        receiveShadow
      >
        <cylinderGeometry args={[0.48, 0.48, 1.4, 36]} />
      </mesh>

      {/* End Mill Body Core & Flutes */}
      <group name="End_Mill_Body">
        <mesh
          position={[0, -3.2, 0]}
          material={carbideMaterial}
          castShadow
          receiveShadow
        >
          <cylinderGeometry args={[0.48, 0.46, 1.5, 36]} />
        </mesh>

        {/* 4 Helical Flutes */}
        {[0, 1, 2, 3].map((i) => {
          const angle = (i * Math.PI) / 2;
          return (
            <mesh
              key={i}
              position={[Math.cos(angle) * 0.42, -3.2, Math.sin(angle) * 0.42]}
              rotation={[0, angle, 0.18 * (i % 2 === 0 ? 1 : -1)]}
              material={carbideMaterial}
              castShadow
            >
              <cylinderGeometry args={[0.12, 0.12, 1.4, 16]} />
            </mesh>
          );
        })}
      </group>

      {/* ----------------- 3. Insert_Cutting_Edge (Wear Zone) ----------------- */}
      <group name="Insert_Cutting_Edge">
        {[0, 1, 2, 3].map((i) => {
          const angle = (i * Math.PI) / 2;
          const r = 0.46;
          return (
            <group key={i}>
              {/* Indexable Insert */}
              <mesh
                ref={i === 0 ? insertMatRef : undefined}
                position={[Math.cos(angle) * r, -3.85, Math.sin(angle) * r]}
                rotation={[0.08, -angle + Math.PI / 6, 0.08]}
                material={insertMaterial}
                castShadow
              >
                <boxGeometry args={[0.24, 0.42, 0.12]} />
              </mesh>

              {/* Cutting Edge Flank Land */}
              <mesh
                position={[
                  Math.cos(angle) * (r + 0.05),
                  -3.85,
                  Math.sin(angle) * (r + 0.05),
                ]}
                rotation={[0, -angle, 0]}
                material={insertMaterial}
                castShadow
              >
                <boxGeometry args={[0.08, 0.38, 0.04]} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* ----------------- 4. 3D Hotspot / Annotations ----------------- */}
      <CuttingEdgeHotspot
        position={[0.55, -2.85, 0.35]}
        toolMetadata={toolMetadata}
        toolLifePercent={toolLifePercent}
        flankWearVB={flankWearVB}
        status={status}
      />
    </group>
  );
};
