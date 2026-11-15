import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import {
  jobs as defaultJobs,
  machines as defaultMachines,
  materialQueues as defaultQueues,
  materials as defaultMaterials,
  tools as defaultTools,
  type Job,
  type Machine,
  type Material,
  type QueuedJob,
  type Tool,
} from '../data'

const STORAGE_KEY = 'tooltwin_workspace_state_v1'

type PersistedState = {
  fleetMachines: Machine[]
  fleetTools: Tool[]
  fleetJobs: Record<string, Job>
  fleetMaterials: Material[]
  fleetQueues: Record<string, QueuedJob[]>
  machineId: string
}

function loadPersistedState(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<PersistedState>
    if (!Array.isArray(parsed.fleetMachines) || parsed.fleetMachines.length === 0) return null
    return {
      fleetMachines: parsed.fleetMachines,
      fleetTools: Array.isArray(parsed.fleetTools) && parsed.fleetTools.length > 0 ? parsed.fleetTools : defaultTools,
      fleetJobs: parsed.fleetJobs && typeof parsed.fleetJobs === 'object' ? parsed.fleetJobs : defaultJobs,
      fleetMaterials:
        Array.isArray(parsed.fleetMaterials) && parsed.fleetMaterials.length > 0
          ? parsed.fleetMaterials
          : defaultMaterials,
      fleetQueues: parsed.fleetQueues && typeof parsed.fleetQueues === 'object' ? parsed.fleetQueues : defaultQueues,
      machineId: typeof parsed.machineId === 'string' ? parsed.machineId : parsed.fleetMachines[0].id,
    }
  } catch {
    return null
  }
}

type SelectionValue = {
  machineId: string
  toolId: string
  materialId: string
  fleetMachines: Machine[]
  fleetTools: Tool[]
  fleetJobs: Record<string, Job>
  fleetMaterials: Material[]
  fleetQueues: Record<string, QueuedJob[]>
  setMachineId: (id: string) => void
  setToolId: (id: string) => void
  setMaterialId: (id: string) => void
  addMachineWithTool: (machine: Machine, newTool?: Tool, job?: Job) => void
  deleteMachine: (id: string) => void
  mountToolOnMachine: (machineId: string, toolId: string) => void
  addMaterial: (material: Material, assignToMachineId?: string) => void
  assignMaterialToMachine: (targetMachineId: string, newMaterialId: string) => void
  queueMaterialForMachine: (targetMachineId: string, matId: string, batchSize?: number) => void
  advanceMachineQueue: (targetMachineId: string) => void
  resetDemoData: () => void
}

const SelectionContext = createContext<SelectionValue | undefined>(undefined)

export function SelectionProvider({ children }: PropsWithChildren) {
  const initial = useMemo(() => loadPersistedState(), [])

  const [fleetMachines, setFleetMachines] = useState<Machine[]>(initial?.fleetMachines ?? defaultMachines)
  const [fleetTools, setFleetTools] = useState<Tool[]>(initial?.fleetTools ?? defaultTools)
  const [fleetJobs, setFleetJobs] = useState<Record<string, Job>>(initial?.fleetJobs ?? defaultJobs)
  const [fleetMaterials, setFleetMaterials] = useState<Material[]>(initial?.fleetMaterials ?? defaultMaterials)
  const [fleetQueues, setFleetQueues] = useState<Record<string, QueuedJob[]>>(initial?.fleetQueues ?? defaultQueues)

  const initialMachine =
    fleetMachines.find(m => m.id === initial?.machineId) ?? fleetMachines[0] ?? defaultMachines[0]

  const [machineId, setMachineIdState] = useState(initialMachine.id)
  const [toolId, setToolId] = useState(initialMachine.currentToolId)
  const [materialId, setMaterialId] = useState(
    (fleetJobs[initialMachine.id] ?? defaultJobs['CNC-01']).materialId
  )

  useEffect(() => {
    try {
      const payload: PersistedState = {
        fleetMachines,
        fleetTools,
        fleetJobs,
        fleetMaterials,
        fleetQueues,
        machineId,
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
    } catch {
      // Ignore quota errors if very large images are uploaded
    }
  }, [fleetMachines, fleetTools, fleetJobs, fleetMaterials, fleetQueues, machineId])

  const value = useMemo<SelectionValue>(
    () => ({
      machineId,
      toolId,
      materialId,
      fleetMachines,
      fleetTools,
      fleetJobs,
      fleetMaterials,
      fleetQueues,
      setMachineId: (id: string) => {
        const machine = fleetMachines.find(item => item.id === id)
        setMachineIdState(id)
        if (machine) {
          setToolId(machine.currentToolId)
          const job = fleetJobs[id] ?? defaultJobs['CNC-01']
          setMaterialId(job.materialId)
        }
      },
      setToolId,
      setMaterialId,
      addMachineWithTool: (machine: Machine, newTool?: Tool, job?: Job) => {
        if (newTool) {
          setFleetTools(prev => [...prev, newTool])
        }
        setFleetMachines(prev => [...prev, machine])
        setFleetJobs(prev => ({
          ...prev,
          [machine.id]:
            job ?? {
              ...defaultJobs['CNC-01'],
              machineId: machine.id,
              partNumber: `${machine.category ?? 'CNC'}-${machine.id}-101`,
            },
        }))
        setMachineIdState(machine.id)
        setToolId(machine.currentToolId)
      },
      deleteMachine: (id: string) => {
        setFleetMachines(prev => {
          if (prev.length <= 1) return prev
          const remaining = prev.filter(item => item.id !== id)
          if (machineId === id && remaining.length > 0) {
            setMachineIdState(remaining[0].id)
            setToolId(remaining[0].currentToolId)
          }
          return remaining
        })
      },
      mountToolOnMachine: (targetMachineId: string, newToolId: string) => {
        setFleetMachines(prev =>
          prev.map(item => (item.id === targetMachineId ? { ...item, currentToolId: newToolId } : item))
        )
        if (machineId === targetMachineId) {
          setToolId(newToolId)
        }
      },
      addMaterial: (material: Material, assignToMachineId?: string) => {
        setFleetMaterials(prev => [material, ...prev])
        if (assignToMachineId) {
          setFleetJobs(prev => {
            const current = prev[assignToMachineId] ?? defaultJobs['CNC-01']
            return {
              ...prev,
              [assignToMachineId]: {
                ...current,
                machineId: assignToMachineId,
                materialId: material.id,
                operation: material.factoryContext.operationType,
                coolant: material.factoryContext.coolantStrategy,
              },
            }
          })
          if (machineId === assignToMachineId) {
            setMaterialId(material.id)
          }
        }
      },
      assignMaterialToMachine: (targetMachineId: string, newMaterialId: string) => {
        const mat = fleetMaterials.find(m => m.id === newMaterialId) ?? defaultMaterials[0]
        setFleetJobs(prev => {
          const current = prev[targetMachineId] ?? defaultJobs['CNC-01']
          return {
            ...prev,
            [targetMachineId]: {
              ...current,
              machineId: targetMachineId,
              materialId: newMaterialId,
              operation: mat.factoryContext.operationType,
              coolant: mat.factoryContext.coolantStrategy,
            },
          }
        })
        if (machineId === targetMachineId) {
          setMaterialId(newMaterialId)
        }
      },
      queueMaterialForMachine: (targetMachineId: string, matId: string, batchSize = 24) => {
        const mat = fleetMaterials.find(m => m.id === matId) ?? defaultMaterials[0]
        const targetMachine = fleetMachines.find(m => m.id === targetMachineId) ?? fleetMachines[0]
        setFleetQueues(prev => {
          const currentQueue = prev[targetMachineId] ?? []
          const lastOffset =
            currentQueue.length > 0
              ? currentQueue[currentQueue.length - 1].expectedStartOffsetMin +
                currentQueue[currentQueue.length - 1].expectedDurationMin
              : 90
          const nextJob: QueuedJob = {
            id: `Q-${Date.now().toString().slice(-4)}`,
            partNumber: mat.factoryContext.partName.split('#')[1]?.trim() || `JOB-${mat.id.toUpperCase()}`,
            operationNumber: `OP-${(currentQueue.length + 2) * 10}`,
            operation: mat.factoryContext.operationType,
            materialId: mat.id,
            toolId: targetMachine.currentToolId,
            batchSize,
            expectedStartOffsetMin: lastOffset,
            expectedDurationMin: Math.max(45, batchSize * 3),
          }
          return {
            ...prev,
            [targetMachineId]: [...currentQueue, nextJob],
          }
        })
      },
      advanceMachineQueue: (targetMachineId: string) => {
        setFleetQueues(prev => {
          const currentQueue = prev[targetMachineId] ?? []
          if (currentQueue.length === 0) return prev
          const [nextUp, ...rest] = currentQueue
          const mat = fleetMaterials.find(m => m.id === nextUp.materialId) ?? defaultMaterials[0]
          setFleetJobs(jobPrev => {
            const currentJob = jobPrev[targetMachineId] ?? defaultJobs['CNC-01']
            return {
              ...jobPrev,
              [targetMachineId]: {
                ...currentJob,
                machineId: targetMachineId,
                materialId: nextUp.materialId,
                partNumber: nextUp.partNumber,
                operationNumber: nextUp.operationNumber,
                operation: nextUp.operation,
                batchSize: nextUp.batchSize,
                partsCompleted: 0,
                coolant: mat.factoryContext.coolantStrategy,
              },
            }
          })
          return {
            ...prev,
            [targetMachineId]: rest,
          }
        })
      },
      resetDemoData: () => {
        localStorage.removeItem(STORAGE_KEY)
        setFleetMachines(defaultMachines)
        setFleetTools(defaultTools)
        setFleetJobs(defaultJobs)
        setFleetMaterials(defaultMaterials)
        setFleetQueues(defaultQueues)
        setMachineIdState(defaultMachines[0].id)
        setToolId(defaultMachines[0].currentToolId)
        setMaterialId(defaultJobs[defaultMachines[0].id].materialId)
      },
    }),
    [machineId, toolId, materialId, fleetMachines, fleetTools, fleetJobs, fleetMaterials, fleetQueues]
  )

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>
}

export function useSelection() {
  const context = useContext(SelectionContext)
  if (!context) throw new Error('useSelection must be used within SelectionProvider')
  return context
}

export const selectedFrom = (
  machineId: string,
  toolId: string,
  materialId: string,
  customMachines: Machine[] = defaultMachines,
  customTools: Tool[] = defaultTools,
  customJobs: Record<string, Job> = defaultJobs,
  customMaterials: Material[] = defaultMaterials
) => {
  const machine = customMachines.find(item => item.id === machineId) ?? customMachines[0] ?? defaultMachines[0]
  const tool =
    customTools.find(item => item.id === toolId) ??
    customTools.find(item => item.id === machine.currentToolId) ??
    defaultTools[0]
  const job = customJobs[machine.id] ?? defaultJobs[machine.id] ?? defaultJobs['CNC-01']
  const material =
    customMaterials.find(item => item.id === materialId) ??
    customMaterials.find(item => item.id === job.materialId) ??
    customMaterials[0] ??
    defaultMaterials[0]
  return { machine, tool, material, job }
}
