import React, { useMemo, useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
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

interface ToolMeshAssemblyProps {
  modelUrl?: string;
  toolLifePercent: number;
  flankWearVB: number;
  toolMetadata: ToolMetadata;
  wireframe?: boolean;
}

export const ToolMeshAssembly: React.FC<ToolMeshAssemblyProps> = ({
  modelUrl = '/models/cnc_tool_assembly.glb',
  toolLifePercent,
  flankWearVB,
  toolMetadata,
  wireframe = false,
}) => {
  const { scene } = useGLTF(modelUrl);
  const status = getToolWearStatus(toolLifePercent, flankWearVB);
  const clonedScene = useMemo(() => scene.clone(true), [scene]);

  // References to dynamic wear materials for frame-by-frame pulsing
  const dynamicInsertMaterials = useRef<THREE.MeshStandardMaterial[]>([]);

  // 1. Industrial Matte Brushed Steel Material for Tool_Holder
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

  // 2. Darkened Tungsten Carbide Steel for Tool_Shank & End_Mill_Body
  const carbideMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: new THREE.Color('#222933'),
        metalness: 0.88,
        roughness: 0.25,
        wireframe,
        name: 'Darkened_Tungsten_Carbide',
      }),
    [wireframe]
  );

  // 3. Dynamic PBR Material for Insert_Cutting_Edge (Wear Zone)
  const insertBaseColor = useMemo(
    () => getInterpolatedWearColor(toolLifePercent),
    [toolLifePercent]
  );

  const insertMaterial = useMemo(() => {
    const isCritical = status === 'critical';
    const isWarning = status === 'warning';

    return new THREE.MeshStandardMaterial({
      color: insertBaseColor,
      metalness: 0.65,
      roughness: 0.22,
      emissive: isCritical
        ? EMISSIVE_CRITICAL
        : isWarning
        ? new THREE.Color('#b45309')
        : new THREE.Color('#064e3b'),
      emissiveIntensity: isCritical ? 0.8 : isWarning ? 0.35 : 0.2,
      wireframe,
      name: 'Dynamic_Insert_Cutting_Edge',
    });
  }, [insertBaseColor, status, wireframe]);

  // Map sub-meshes to their corresponding industrial materials
  useEffect(() => {
    dynamicInsertMaterials.current = [];

    clonedScene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        const name = (mesh.name || '').toLowerCase();

        // 1. Tool_Holder identification (BT40, Collet chuck, Flange)
        if (
          name.includes('tool_holder') ||
          name.includes('holder') ||
          name.includes('taper') ||
          name.includes('flange') ||
          name.includes('collet')
        ) {
          mesh.material = holderMaterial;
        }
        // 2. Tool_Shank / End_Mill_Body identification (Darkened tungsten carbide)
        else if (
          name.includes('tool_shank') ||
          name.includes('end_mill_body') ||
          name.includes('shank') ||
          name.includes('flute') ||
          name.includes('cutter')
        ) {
          mesh.material = carbideMaterial;
        }
        // 3. Insert_Cutting_Edge identification (Active wear zone)
        else if (
          name.includes('insert_cutting_edge') ||
          name.includes('insert') ||
          name.includes('edge') ||
          name.includes('cutting') ||
          name.includes('wear')
        ) {
          const mat = insertMaterial.clone();
          mesh.material = mat;
          dynamicInsertMaterials.current.push(mat);
        } else {
          // Default fallback to carbide steel
          mesh.material = carbideMaterial;
        }
      }
    });

    return () => {
      // Graceful cleanup of cloned materials
      dynamicInsertMaterials.current.forEach((m) => m.dispose());
    };
  }, [clonedScene, holderMaterial, carbideMaterial, insertMaterial]);

  // Dynamic animation loop: Pulsing emissive glow when in Critical state (<30% life or VB >300µm)
  useFrame(({ clock }) => {
    if (status === 'critical') {
      const pulse = 0.5 + 0.5 * Math.sin(clock.elapsedTime * 6.5);
      const intensity = 0.4 + pulse * 1.6;

      for (let i = 0; i < dynamicInsertMaterials.current.length; i++) {
        const mat = dynamicInsertMaterials.current[i];
        mat.emissive.copy(COLOR_CRITICAL);
        mat.emissiveIntensity = intensity;
      }
    } else {
      // Normal / warning resting emissive level
      const targetIntensity = status === 'warning' ? 0.35 : 0.2;
      for (let i = 0; i < dynamicInsertMaterials.current.length; i++) {
        const mat = dynamicInsertMaterials.current[i];
        mat.emissiveIntensity = targetIntensity;
      }
    }
  });

  return (
    <group position={[0, 0.4, 0]}>
      {/* 3D CNC Assembly Mesh Hierarchy */}
      <primitive object={clonedScene} />

      {/* 3D Hotspot / Annotations at the active cutting edge */}
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

// Preload the GLTF asset for instant hydration
useGLTF.preload('/models/cnc_tool_assembly.glb');
