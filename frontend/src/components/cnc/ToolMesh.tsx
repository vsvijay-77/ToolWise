import { useMemo } from 'react'
import { Cylinder, Torus } from '@react-three/drei'
import type { Tool } from '../../data'

const coatings: Record<string, string> = {
  AlTiN: '#454052',
  TiN: '#C49A28',
  TiSiN: '#8A6642',
  AlCrN: '#536C84',
  CVD: '#6D726F',
  TiAlN: '#5B4B6E',
  Uncoated: '#9FA7AF',
}

/**
 * Renders the active cutting tool accurately seated inside the spindle nose
 * (top of holder at y=1.80) extending down to the workpiece cutting surface (tip at y=1.22).
 */
export function ToolMesh({ tool, wear }: { tool: Tool; wear: number }) {
  const coating = coatings[tool.coating] ?? '#5D6570'
  const tipColor = wear > 80 ? '#D32F2F' : wear > 55 ? '#ED6C02' : '#2E7D32'
  const radius = Math.max(0.085, tool.diameter_mm / 135)
  const flutes = useMemo(() => Array.from({ length: Math.min(tool.flute_count, 5) }, (_, index) => index), [tool.flute_count])

  return (
    <group position={[0, 1.8, 0]}>
      {/* BT40 / HSK Tool Holder Collar seated at spindle nose */}
      <Cylinder args={[0.21, 0.17, 0.22, 32]} position={[0, -0.09, 0]}>
        <meshPhysicalMaterial color="#3F4752" metalness={0.88} roughness={0.24} />
      </Cylinder>

      {/* Carbide Cutter Flute Body extending down toward workpiece */}
      <Cylinder args={[radius, radius, 0.36, 36]} position={[0, -0.37, 0]}>
        <meshPhysicalMaterial color={coating} metalness={0.85} roughness={0.26} />
      </Cylinder>

      {/* Helical Flute Grooves */}
      {flutes.map(index => (
        <Torus
          key={index}
          args={[radius * 1.02, 0.011, 8, 24, Math.PI * 1.4]}
          position={[0, -0.25 - index * 0.065, 0]}
          rotation={[0.28, index * ((Math.PI * 2) / flutes.length), Math.PI / 2]}
        >
          <meshStandardMaterial color="#D5DFE2" metalness={0.82} roughness={0.24} />
        </Torus>
      ))}

      {/* Active Cutting Tip & VB Flank Wear Band right on the workpiece surface (y ≈ 1.22) */}
      <Cylinder args={[radius * 1.03, radius * 0.78, 0.055, 36]} position={[0, -0.56, 0]}>
        <meshStandardMaterial color={tipColor} emissive={tipColor} emissiveIntensity={0.32} />
      </Cylinder>
    </group>
  )
}
