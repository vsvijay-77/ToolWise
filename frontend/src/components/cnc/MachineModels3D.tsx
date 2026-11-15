import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group } from 'three'
import type { Machine, MachineDesignType, Material, Tool } from '../../data'
import { ToolMesh } from './ToolMesh'
import { Particles } from './Particles'

const workColours: Record<string, string> = {
  Aluminium: '#C7D0D8',
  'Alloy steel': '#4B5563',
  Titanium: '#718096',
  'Nickel alloy': '#71605B',
}

const DEFAULT_DESIGNS: MachineDesignType[] = [
  'CNC-VMC',
  'CNC-Turning',
  'CNC-5Axis',
  'PLC-Conveyor',
  'PLC-Robotic',
  'PLC-DrillStation',
]

export const resolveDesignType = (machine: Machine, fallbackIndex = 0): MachineDesignType => {
  if (machine.designType) return machine.designType
  const num = Number(machine.id.replace(/\D/g, '')) || fallbackIndex + 1
  return DEFAULT_DESIGNS[(num - 1) % DEFAULT_DESIGNS.length]
}

/** Shared status light tower for all CNC & PLC machines */
function LightTower({ status, position }: { status: Machine['status']; position: [number, number, number] }) {
  const tower = status === 'Running' ? '#2E7D32' : status === 'Maintenance' ? '#ED6C02' : '#B8C2CC'
  return (
    <group position={position}>
      {['#D32F2F', '#ED6C02', tower].map((colour, index) => (
        <mesh key={colour} position={[0, index * 0.13, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.11, 18]} />
          <meshStandardMaterial color={colour} emissive={colour} emissiveIntensity={index === 2 ? 1.6 : 0.1} />
        </mesh>
      ))}
    </group>
  )
}

/** Shared operator HMI pendant */
function OperatorPendant({ position, plc = false }: { position: [number, number, number]; plc?: boolean }) {
  return (
    <group position={position} rotation={[0, -0.26, 0]}>
      <mesh>
        <boxGeometry args={[0.42, 0.7, 0.14]} />
        <meshStandardMaterial color={plc ? '#1E293B' : '#5D6871'} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.08, 0.08]}>
        <boxGeometry args={[0.28, 0.25, 0.015]} />
        <meshStandardMaterial
          color={plc ? '#0D47A1' : '#0C766D'}
          emissive={plc ? '#2979FF' : '#00BFA5'}
          emissiveIntensity={0.5}
        />
      </mesh>
    </group>
  )
}

/**
 * Renders 6 distinct 3D industrial architectures so every CNC or PLC machine type
 * has a unique, recognizable 3D silhouette and motion animation.
 */
export function MachineModelByType({
  machine,
  tool,
  material,
  rpm,
  wearPct,
  fallbackIndex = 0,
}: {
  machine: Machine
  tool: Tool
  material: Material
  rpm: number
  wearPct: number
  fallbackIndex?: number
}) {
  const design = resolveDesignType(machine, fallbackIndex)
  const running = machine.status === 'Running'
  const matColor = workColours[material.group] ?? '#64748B'

  const spindle = useRef<Group>(null)
  const head = useRef<Group>(null)
  const aux = useRef<Group>(null)

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    if (spindle.current && running) {
      spindle.current.rotation.y = t * Math.min(rpm / 190, 35)
    }
    if (head.current && running) {
      if (design === 'CNC-Turning') {
        head.current.position.z = Math.sin(t * 0.7) * 0.28
      } else if (design === 'PLC-Robotic') {
        head.current.rotation.y = Math.sin(t * 0.65) * 0.55
      } else {
        head.current.position.x = Math.sin(t * 0.55) * 0.34
      }
    }
    if (aux.current && running) {
      if (design === 'CNC-5Axis' || design === 'PLC-DrillStation') {
        aux.current.rotation.y = t * 0.9
      } else if (design === 'PLC-Conveyor') {
        aux.current.position.x = ((t * 0.5) % 1.8) - 0.9
      } else if (design === 'PLC-Robotic') {
        aux.current.rotation.z = Math.sin(t * 0.9) * 0.25
      }
    }
  })

  // 1. CNC-VMC: Classic 3-Axis Vertical Machining Center (Home page flagship)
  if (design === 'CNC-VMC') {
    return (
      <group>
        <mesh position={[0, 0.18, 0]} receiveShadow>
          <boxGeometry args={[4.4, 0.36, 3.5]} />
          <meshPhysicalMaterial color="#D7DDE2" metalness={0.25} roughness={0.58} />
        </mesh>
        <mesh position={[0, 1.9, -1.37]}>
          <boxGeometry args={[4.2, 3.4, 0.12]} />
          <meshPhysicalMaterial color="#ECEFF3" metalness={0.18} roughness={0.5} />
        </mesh>
        {[-1.83, 1.83].map(sideX => (
          <group key={sideX}>
            <mesh position={[sideX, 0.92, 0]}>
              <boxGeometry args={[0.14, 1.45, 2.7]} />
              <meshPhysicalMaterial color="#CFD8E3" metalness={0.28} roughness={0.48} />
            </mesh>
            <mesh position={[sideX, 2.28, 0]}>
              <boxGeometry args={[0.04, 1.45, 2.4]} />
              <meshPhysicalMaterial color="#B5DAE6" transparent opacity={0.16} roughness={0.1} />
            </mesh>
          </group>
        ))}
        {[-1.55, 1.55].map(x => (
          <mesh key={x} position={[x, 1.8, 1.35]}>
            <boxGeometry args={[0.12, 2.7, 0.05]} />
            <meshStandardMaterial color="#9FAAB4" metalness={0.7} />
          </mesh>
        ))}
        <mesh position={[0, 1.8, 1.4]}>
          <boxGeometry args={[3.0, 2.5, 0.035]} />
          <meshPhysicalMaterial color="#B5DAE6" transparent opacity={0.22} roughness={0.1} />
        </mesh>
        <mesh position={[0, 0.66, 0.1]}>
          <boxGeometry args={[2.8, 0.25, 1.85]} />
          <meshPhysicalMaterial color="#7F8A94" metalness={0.9} roughness={0.35} />
        </mesh>
        {[-0.75, -0.25, 0.25, 0.75].map(z => (
          <mesh key={z} position={[0, 0.8, z]}>
            <boxGeometry args={[2.55, 0.025, 0.05]} />
            <meshStandardMaterial color="#3F4A53" metalness={0.7} />
          </mesh>
        ))}
        <mesh position={[0, 0.94, 0.05]}>
          <boxGeometry args={[1.15, 0.32, 0.95]} />
          <meshStandardMaterial color="#4B5560" metalness={0.75} roughness={0.35} />
        </mesh>
        <mesh position={[0, 1.16, 0.05]}>
          <boxGeometry args={[0.74, 0.18, 0.55]} />
          <meshPhysicalMaterial color={matColor} metalness={0.78} roughness={0.32} />
        </mesh>
        <mesh position={[0, 2.15, -1.03]}>
          <boxGeometry args={[1.25, 2.95, 0.55]} />
          <meshPhysicalMaterial color="#ECEFF3" metalness={0.2} roughness={0.5} />
        </mesh>
        <group ref={head}>
          <mesh position={[0, 2.55, -0.58]}>
            <boxGeometry args={[1.6, 0.72, 1.0]} />
            <meshPhysicalMaterial color="#ECEFF3" metalness={0.25} roughness={0.45} />
          </mesh>
          <group ref={spindle}>
            <mesh position={[0, 2.15, 0.03]}>
              <cylinderGeometry args={[0.23, 0.29, 0.8, 32]} />
              <meshPhysicalMaterial color="#606C77" metalness={0.9} roughness={0.24} />
            </mesh>
            <ToolMesh tool={tool} wear={wearPct} />
          </group>
        </group>
        <OperatorPendant position={[1.95, 1.52, 0.72]} />
        <LightTower status={machine.status} position={[1.5, 3.4, -1.0]} />
        <Particles running={running} />
      </group>
    )
  }

  // 2. CNC-Turning: Horizontal Slant-Bed Turning Center with Rotary Chuck & Indexing Turret
  if (design === 'CNC-Turning') {
    return (
      <group>
        {/* Heavy slant-bed base */}
        <mesh position={[0, 0.28, 0]} receiveShadow>
          <boxGeometry args={[4.6, 0.55, 3.1]} />
          <meshPhysicalMaterial color="#CFD8E3" metalness={0.28} roughness={0.52} />
        </mesh>
        {/* Blue accent fascia */}
        <mesh position={[0, 0.62, 1.48]}>
          <boxGeometry args={[4.4, 0.18, 0.12]} />
          <meshPhysicalMaterial color="#1565C0" metalness={0.35} roughness={0.4} />
        </mesh>
        {/* Slanted rear cabinet */}
        <mesh position={[0, 1.75, -0.95]} rotation={[0.18, 0, 0]}>
          <boxGeometry args={[4.3, 2.6, 1.1]} />
          <meshPhysicalMaterial color="#ECEFF3" metalness={0.2} roughness={0.48} />
        </mesh>
        {/* Left Headstock + Spinning 3-Jaw Chuck */}
        <mesh position={[-1.35, 1.45, 0.1]}>
          <boxGeometry args={[1.25, 1.65, 1.6]} />
          <meshPhysicalMaterial color="#334155" metalness={0.65} roughness={0.35} />
        </mesh>
        <group ref={spindle} position={[-0.55, 1.45, 0.1]} rotation={[0, 0, Math.PI / 2]}>
          <mesh>
            <cylinderGeometry args={[0.48, 0.48, 0.34, 32]} />
            <meshPhysicalMaterial color="#94A3B8" metalness={0.9} roughness={0.22} />
          </mesh>
          <mesh position={[0, -0.52, 0]}>
            <cylinderGeometry args={[0.22, 0.22, 0.85, 28]} />
            <meshPhysicalMaterial color={matColor} metalness={0.82} roughness={0.28} />
          </mesh>
        </group>
        {/* Right Sliding Turret Carriage + Tool */}
        <group ref={head} position={[0.65, 0, 0]}>
          <mesh position={[0, 1.45, 0.1]}>
            <cylinderGeometry args={[0.46, 0.46, 0.42, 8]} />
            <meshPhysicalMaterial color="#1E293B" metalness={0.8} roughness={0.3} />
          </mesh>
          <group position={[-0.35, -0.45, 0.1]}>
            <ToolMesh tool={tool} wear={wearPct} />
          </group>
        </group>
        {/* Sliding angled glass canopy */}
        <mesh position={[0.2, 1.85, 1.1]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[2.8, 1.6, 0.04]} />
          <meshPhysicalMaterial color="#BAE6FD" transparent opacity={0.24} roughness={0.1} />
        </mesh>
        <OperatorPendant position={[2.05, 1.48, 0.85]} />
        <LightTower status={machine.status} position={[-1.7, 2.95, -0.6]} />
        <Particles running={running} />
      </group>
    )
  }

  // 3. CNC-5Axis: Twin-Pillar Bridge Gantry 5-Axis Mill with Rotary Trunnion Table
  if (design === 'CNC-5Axis') {
    return (
      <group>
        <mesh position={[0, 0.2, 0]} receiveShadow>
          <boxGeometry args={[4.5, 0.4, 3.6]} />
          <meshPhysicalMaterial color="#CBD5E1" metalness={0.3} roughness={0.5} />
        </mesh>
        {/* Left & Right Bridge Gantry Pillars */}
        {[-1.75, 1.75].map(x => (
          <mesh key={x} position={[x, 1.95, -0.1]}>
            <boxGeometry args={[0.55, 3.2, 2.4]} />
            <meshPhysicalMaterial color="#F1F5F9" metalness={0.22} roughness={0.45} />
          </mesh>
        ))}
        {/* Top Cross-Beam Bridge */}
        <mesh position={[0, 3.25, -0.1]}>
          <boxGeometry args={[4.1, 0.62, 1.35]} />
          <meshPhysicalMaterial color="#0D47A1" metalness={0.4} roughness={0.35} />
        </mesh>
        {/* 5-Axis Rotary Trunnion Cradle & Table */}
        <group ref={aux} position={[0, 0.82, 0.05]}>
          <mesh>
            <cylinderGeometry args={[0.95, 1.05, 0.32, 36]} />
            <meshPhysicalMaterial color="#64748B" metalness={0.88} roughness={0.28} />
          </mesh>
          <mesh position={[0, 0.28, 0]}>
            <cylinderGeometry args={[0.45, 0.45, 0.26, 28]} />
            <meshPhysicalMaterial color={matColor} metalness={0.8} roughness={0.3} />
          </mesh>
        </group>
        {/* Moving Overhead 5-Axis Spindle Ram */}
        <group ref={head}>
          <mesh position={[0, 2.65, 0.05]}>
            <boxGeometry args={[0.95, 0.85, 0.95]} />
            <meshPhysicalMaterial color="#E2E8F0" metalness={0.3} roughness={0.4} />
          </mesh>
          <group ref={spindle}>
            <mesh position={[0, 2.15, 0.05]}>
              <cylinderGeometry args={[0.24, 0.3, 0.75, 32]} />
              <meshPhysicalMaterial color="#475569" metalness={0.9} roughness={0.22} />
            </mesh>
            <ToolMesh tool={tool} wear={wearPct} />
          </group>
        </group>
        <OperatorPendant position={[2.1, 1.5, 1.1]} />
        <LightTower status={machine.status} position={[1.75, 3.65, -0.5]} />
        <Particles running={running} />
      </group>
    )
  }

  // 4. PLC-Conveyor: PLC Automated Transfer Line & Indexing Machining Station
  if (design === 'PLC-Conveyor') {
    return (
      <group>
        {/* Long transfer line floor base */}
        <mesh position={[0, 0.14, 0]} receiveShadow>
          <boxGeometry args={[4.8, 0.28, 3.2]} />
          <meshPhysicalMaterial color="#E2E8F0" metalness={0.25} roughness={0.55} />
        </mesh>
        {/* Twin conveyor rails */}
        {[-0.48, 0.48].map(z => (
          <mesh key={z} position={[0, 0.78, z]}>
            <boxGeometry args={[4.5, 0.14, 0.14]} />
            <meshStandardMaterial color="#00897B" metalness={0.65} roughness={0.35} />
          </mesh>
        ))}
        {/* Conveyor rollers */}
        {[-1.8, -1.2, -0.6, 0, 0.6, 1.2, 1.8].map(x => (
          <mesh key={x} position={[x, 0.78, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.055, 0.055, 0.9, 16]} />
            <meshStandardMaterial color="#94A3B8" metalness={0.85} roughness={0.25} />
          </mesh>
        ))}
        {/* Moving pallet & workpiece on the PLC conveyor */}
        <group ref={aux} position={[0, 0.95, 0]}>
          <mesh>
            <boxGeometry args={[0.85, 0.12, 0.75]} />
            <meshStandardMaterial color="#334155" metalness={0.7} />
          </mesh>
          <mesh position={[0, 0.16, 0]}>
            <boxGeometry args={[0.6, 0.2, 0.5]} />
            <meshPhysicalMaterial color={matColor} metalness={0.78} roughness={0.3} />
          </mesh>
        </group>
        {/* Central PLC Portal Arch & Spindle */}
        <mesh position={[0, 1.85, -0.85]}>
          <boxGeometry args={[1.6, 2.9, 0.5]} />
          <meshPhysicalMaterial color="#1E293B" metalness={0.45} roughness={0.4} />
        </mesh>
        <group ref={head}>
          <mesh position={[0, 2.55, -0.2]}>
            <boxGeometry args={[1.15, 0.65, 1.0]} />
            <meshPhysicalMaterial color="#00897B" metalness={0.35} roughness={0.4} />
          </mesh>
          <group ref={spindle}>
            <ToolMesh tool={tool} wear={wearPct} />
          </group>
        </group>
        <OperatorPendant position={[1.95, 1.45, 0.9]} plc />
        <LightTower status={machine.status} position={[0.6, 3.35, -0.85]} />
        <Particles running={running} />
      </group>
    )
  }

  // 5. PLC-Robotic: PLC Articulated Robotic Machining Cell with Orange/Teal Arm & Safety Perimeter
  if (design === 'PLC-Robotic') {
    return (
      <group>
        <mesh position={[0, 0.15, 0]} receiveShadow>
          <boxGeometry args={[4.5, 0.3, 3.5]} />
          <meshPhysicalMaterial color="#DBE4EE" metalness={0.25} roughness={0.55} />
        </mesh>
        {/* Safety yellow perimeter posts */}
        {[
          [-2.0, -1.5],
          [2.0, -1.5],
          [-2.0, 1.5],
          [2.0, 1.5],
        ].map(([x, z]) => (
          <mesh key={`${x}-${z}`} position={[x, 1.25, z]}>
            <cylinderGeometry args={[0.06, 0.06, 2.2, 16]} />
            <meshStandardMaterial color="#F59E0B" metalness={0.5} roughness={0.35} />
          </mesh>
        ))}
        {/* Workpiece fixture table in front */}
        <mesh position={[0.65, 0.75, 0.25]}>
          <cylinderGeometry args={[0.68, 0.78, 0.85, 28]} />
          <meshPhysicalMaterial color="#475569" metalness={0.8} roughness={0.3} />
        </mesh>
        <mesh position={[0.65, 1.28, 0.25]}>
          <boxGeometry args={[0.7, 0.22, 0.55]} />
          <meshPhysicalMaterial color={matColor} metalness={0.8} roughness={0.28} />
        </mesh>
        {/* Articulated 6-Axis Industrial Robot Pedestal & Arm */}
        <group ref={head} position={[-0.75, 0.3, -0.15]}>
          <mesh position={[0, 0.45, 0]}>
            <cylinderGeometry args={[0.45, 0.55, 0.9, 32]} />
            <meshPhysicalMaterial color="#1E293B" metalness={0.7} roughness={0.3} />
          </mesh>
          <group ref={aux} position={[0, 0.95, 0]}>
            <mesh position={[0.35, 0.75, 0]} rotation={[0, 0, -0.45]}>
              <boxGeometry args={[0.36, 1.55, 0.36]} />
              <meshPhysicalMaterial color="#ED6C02" metalness={0.45} roughness={0.32} />
            </mesh>
            <mesh position={[0.95, 1.35, 0]} rotation={[0, 0, 1.2]}>
              <boxGeometry args={[0.28, 1.2, 0.28]} />
              <meshPhysicalMaterial color="#ED6C02" metalness={0.45} roughness={0.32} />
            </mesh>
          </group>
        </group>
        {/* Active spindle effector at the workpiece */}
        <group ref={spindle} position={[0.65, 0.15, 0.25]}>
          <ToolMesh tool={tool} wear={wearPct} />
        </group>
        <OperatorPendant position={[1.85, 1.42, 1.05]} plc />
        <LightTower status={machine.status} position={[-1.6, 2.5, -1.2]} />
        <Particles running={running} />
      </group>
    )
  }

  // 6. PLC-DrillStation: PLC Rotary Indexing Dial Multi-Spindle Station
  return (
    <group>
      <mesh position={[0, 0.18, 0]} receiveShadow>
        <cylinderGeometry args={[2.15, 2.25, 0.36, 40]} />
        <meshPhysicalMaterial color="#D8E2EC" metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Rotary Indexing Dial Plate */}
      <group ref={aux} position={[0, 0.65, 0.15]}>
        <mesh>
          <cylinderGeometry args={[1.45, 1.45, 0.22, 36]} />
          <meshPhysicalMaterial color="#475569" metalness={0.85} roughness={0.28} />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map(idx => {
          const angle = (idx * Math.PI) / 3
          return (
            <mesh key={idx} position={[Math.cos(angle) * 0.95, 0.2, Math.sin(angle) * 0.95]}>
              <cylinderGeometry args={[0.22, 0.22, 0.18, 20]} />
              <meshPhysicalMaterial color={matColor} metalness={0.8} roughness={0.3} />
            </mesh>
          )
        })}
      </group>
      {/* Rear Multi-Spindle Column */}
      <mesh position={[0, 1.95, -1.1]}>
        <boxGeometry args={[1.8, 3.1, 0.65]} />
        <meshPhysicalMaterial color="#0F172A" metalness={0.5} roughness={0.4} />
      </mesh>
      <group ref={head}>
        <mesh position={[0, 2.55, -0.35]}>
          <boxGeometry args={[1.5, 0.68, 1.1]} />
          <meshPhysicalMaterial color="#0288D1" metalness={0.4} roughness={0.35} />
        </mesh>
        <group ref={spindle}>
          <ToolMesh tool={tool} wear={wearPct} />
        </group>
      </group>
      <OperatorPendant position={[1.85, 1.45, 0.85]} plc />
      <LightTower status={machine.status} position={[0, 3.55, -1.1]} />
      <Particles running={running} />
    </group>
  )
}
