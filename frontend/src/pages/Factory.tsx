import { Box, Stack, Typography } from '@mui/material'
import { useCatalogue } from '../api'
import { FactoryFloor2D } from '../components/cnc/FactoryFloor2D'
import { useSelection } from '../context/SelectionContext'
import { machines as fallbackMachines, tools as fallbackTools } from '../data'

export default function FactoryPage() {
  const { machines, tools } = useCatalogue()
  const { machineId, setMachineId } = useSelection()
  const machinesList = machines.length ? machines : fallbackMachines
  const toolsList = tools.length ? tools : fallbackTools

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4">3D Factory Workspace</Typography>
        <Typography color="text.secondary" mt={0.5}>
          3D white-lined factory floor with all CNC & PLC machines — click any machine to inspect its tool twin, wear, and production status
        </Typography>
      </Box>
      <FactoryFloor2D
        machinesList={machinesList}
        toolsList={toolsList}
        selectedMachineId={machineId}
        onSelectMachine={setMachineId}
      />
    </Stack>
  )
}
