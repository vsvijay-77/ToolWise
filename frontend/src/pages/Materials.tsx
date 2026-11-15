import { useState, type ChangeEvent } from 'react'
import {
  Alert,
  Box,
  Button,
  ButtonBase,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  MenuItem,
  Slider,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { ImagePlus, Layers, Plus, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { MaterialCard } from '../components/cards/MaterialCard'
import { useSelection } from '../context/SelectionContext'
import {
  costParameters,
  presetMaterialTextures,
  type IsoGroup,
  type Material,
  type MaterialFactoryContext,
} from '../data'
import { money } from '../utils/format'

const isoOptions: { group: string; iso: IsoGroup }[] = [
  { group: 'Aluminium', iso: 'ISO N' },
  { group: 'Alloy steel', iso: 'ISO P' },
  { group: 'Titanium', iso: 'ISO S' },
  { group: 'Nickel alloy', iso: 'ISO S' },
  { group: 'Stainless steel', iso: 'ISO M' },
  { group: 'Cast iron', iso: 'ISO K' },
  { group: 'Hardened steel', iso: 'ISO H' },
]

export default function Materials() {
  const navigate = useNavigate()
  const {
    machineId,
    fleetMachines,
    fleetMaterials,
    fleetTools,
    fleetQueues,
    addMaterial,
    assignMaterialToMachine,
    queueMaterialForMachine,
    advanceMachineQueue,
  } = useSelection()

  const [open, setOpen] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [assignImmediately, setAssignImmediately] = useState(true)
  const [targetMachineId, setTargetMachineId] = useState(machineId)

  const [form, setForm] = useState({
    name: '',
    group: 'Stainless steel',
    isoGroup: 'ISO M' as IsoGroup,
    hardness: '220 HB',
    machinability: 45,
    vcMin: 90,
    vcMax: 160,
    imageUrl: presetMaterialTextures[1].imageUrl,
    colour: presetMaterialTextures[1].colour,
    partName: 'Valve Body #VB-310',
    operationType: 'Roughing' as MaterialFactoryContext['operationType'],
    coolantStrategy: 'Flood Coolant' as MaterialFactoryContext['coolantStrategy'],
    recommendedCutter: 'AlTiN 4-Flute Carbide End Mill',
    wearMultiplier: 1.4,
  })

  const handleImageUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setForm(prev => ({ ...prev, imageUrl: reader.result as string }))
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSaveMaterial = () => {
    const cleanName = form.name.trim() || 'SS 316L'
    const newMat: Material = {
      id: `mat-${Date.now().toString(36)}`,
      name: cleanName,
      group: form.group,
      isoGroup: form.isoGroup,
      hardness: form.hardness.trim() || '200 HB',
      machinability: form.machinability,
      vcMin: Number(form.vcMin) || 80,
      vcMax: Number(form.vcMax) || 150,
      colour: form.colour,
      imageUrl: form.imageUrl,
      recommendedCoatings: ['AlTiN', 'TiSiN'],
      factoryContext: {
        partName: form.partName.trim() || `${cleanName} Component`,
        operationType: form.operationType,
        coolantStrategy: form.coolantStrategy,
        recommendedCutter: form.recommendedCutter.trim() || 'AlTiN Solid Carbide',
        wearMultiplier: Number(form.wearMultiplier) || 1.2,
      },
    }

    addMaterial(newMat, assignImmediately ? targetMachineId : undefined)
    setFeedback(
      assignImmediately
        ? `Added ${newMat.name} and assigned it to ${targetMachineId}.`
        : `Added ${newMat.name} to the Workpiece Materials library.`
    )
    setOpen(false)
    setForm(prev => ({ ...prev, name: '' }))
  }

  // Flatten upcoming queue rows across machines
  const queueRows = fleetMachines.flatMap(machine => {
    const q = fleetQueues[machine.id] ?? []
    return q.map((item, idx) => {
      const mat = fleetMaterials.find(m => m.id === item.materialId) ?? fleetMaterials[0]
      const tool = fleetTools.find(t => t.id === item.toolId) ?? fleetTools[0]
      return { machine, item, mat, tool, order: idx + 1 }
    })
  })

  return (
    <Stack spacing={3}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
        <Box>
          <Typography variant="h4">Workpiece Materials</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage alloy billets, factory machining context, and upcoming production queues.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Plus size={17} />}
          onClick={() => {
            setTargetMachineId(machineId)
            setOpen(true)
          }}
          sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' } }}
        >
          Add Workpiece Material
        </Button>
      </Stack>

      {feedback && (
        <Alert severity="success" onClose={() => setFeedback(null)}>
          {feedback}
        </Alert>
      )}

      {/* Material Cards Grid */}
      <Grid container spacing={2.5}>
        {fleetMaterials.map(material => (
          <Grid key={material.id} size={{ xs: 12, sm: 6, lg: 3 }}>
            <MaterialCard
              material={material}
              activeMachineId={machineId}
              onAssign={() => {
                assignMaterialToMachine(machineId, material.id)
                setFeedback(`Assigned ${material.name} to ${machineId}.`)
              }}
              onQueue={() => {
                queueMaterialForMachine(machineId, material.id, 24)
                setFeedback(`Queued ${material.name} (24 pcs) on ${machineId}.`)
              }}
            />
          </Grid>
        ))}
      </Grid>

      {/* Factory Workpiece Production Queue */}
      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} flexWrap="wrap" gap={1}>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Layers size={18} color="#1565C0" />
                <Typography variant="h6" sx={{ fontSize: 16 }}>
                  Factory Workpiece Production Queue — Cost (₹), Time (min) &amp; Damage Shield
                </Typography>
                <Chip size="small" label={`${queueRows.length} Scheduled`} color="primary" variant="outlined" />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Compare planned tool replacement cost (₹), batch cutting minutes, and potential part-scrap losses before starting each queued run.
              </Typography>
            </Box>
            <Button size="small" endIcon={<ArrowRight size={14} />} onClick={() => navigate('/dashboard')}>
              View on Dashboard
            </Button>
          </Stack>

          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Machine</TableCell>
                  <TableCell>Material</TableCell>
                  <TableCell>Part & Operation</TableCell>
                  <TableCell>Tool &amp; Swap Cost (₹)</TableCell>
                  <TableCell align="right">Batch &amp; Duration</TableCell>
                  <TableCell align="right">Potential Scrap / Delay Risk</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {queueRows.map(({ machine, item, mat, tool, order }) => {
                  const plannedSwapInr = money(tool.cost + costParameters.labourChangeCost * 0.45)
                  const highWearAlloy = mat.factoryContext.wearMultiplier >= 1.5
                  const riskParts = highWearAlloy ? 3 : 1
                  const potentialLossInr = money(
                    tool.cost + riskParts * costParameters.partCost + costParameters.machineHourlyRate * 1.6
                  )
                  return (
                    <TableRow key={`${machine.id}-${item.id}`} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {machine.id}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Queue #{order}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box
                            component="img"
                            src={mat.imageUrl}
                            alt={mat.name}
                            sx={{ width: 30, height: 30, borderRadius: 1.25, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.08)' }}
                          />
                          <Box>
                            <Typography variant="body2" fontWeight={700}>
                              {mat.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {mat.isoGroup} · {mat.factoryContext.wearMultiplier}x wear
                            </Typography>
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {item.partNumber}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {item.operationNumber} · {item.operation}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {tool.id} ({tool.coating})
                        </Typography>
                        <Typography variant="caption" color="primary.main" fontWeight={700}>
                          Planned Swap: {plannedSwapInr} (3m)
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ fontFamily: '"JetBrains Mono", monospace' }}>
                        <Typography variant="body2" fontWeight={800}>
                          {item.batchSize} pcs · {item.expectedDurationMin}m
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Starts in {item.expectedStartOffsetMin}m
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={800} color={highWearAlloy ? 'warning.main' : 'success.main'}>
                          {highWearAlloy ? `${riskParts} pcs risk · ${potentialLossInr}` : `Protected · ${potentialLossInr} saved`}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {highWearAlloy ? 'Pre-stage sister tool (avoid 96m delay)' : '0m unplanned delay'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {order === 1 && (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => {
                              advanceMachineQueue(machine.id)
                              setFeedback(`Started ${mat.name} (${item.partNumber}) on ${machine.id}.`)
                            }}
                          >
                            Start Next
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>

      {/* Add Workpiece Material & Factory Context Modal */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Add Workpiece Material & Factory Context</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5} pt={0.5}>
            {/* Material Identity */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 5 }}>
                <TextField
                  label="Material Name & Grade"
                  placeholder="e.g. SS 316L, EN24T Steel"
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  select
                  label="Category & ISO Group"
                  value={form.group}
                  onChange={e => {
                    const chosen = isoOptions.find(o => o.group === e.target.value)
                    setForm(prev => ({
                      ...prev,
                      group: e.target.value,
                      isoGroup: chosen?.iso ?? 'ISO P',
                    }))
                  }}
                  fullWidth
                  size="small"
                >
                  {isoOptions.map(opt => (
                    <MenuItem key={opt.group} value={opt.group}>
                      {opt.group} ({opt.iso})
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 3 }}>
                <TextField
                  label="Hardness"
                  placeholder="e.g. 220 HB / 32 HRC"
                  value={form.hardness}
                  onChange={e => setForm(prev => ({ ...prev, hardness: e.target.value }))}
                  fullWidth
                  size="small"
                />
              </Grid>
            </Grid>

            {/* Image Upload & Preset Billet Picker */}
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <Typography variant="subtitle2" fontWeight={800} mb={1.25}>
                Material Billet Thumbnail
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                <Box
                  component="img"
                  src={form.imageUrl}
                  alt="Preview"
                  sx={{ width: 68, height: 68, borderRadius: 2, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.12)' }}
                />
                <Stack spacing={1} flex={1}>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    <Button component="label" size="small" variant="outlined" startIcon={<ImagePlus size={15} />}>
                      Upload Photo
                      <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                    </Button>
                    {presetMaterialTextures.map(preset => (
                      <ButtonBase
                        key={preset.label}
                        onClick={() => setForm(prev => ({ ...prev, imageUrl: preset.imageUrl, colour: preset.colour }))}
                        sx={{
                          p: 0.4,
                          borderRadius: 1.5,
                          border: form.imageUrl === preset.imageUrl ? '2px solid #1565C0' : '1px solid rgba(255,255,255,0.12)',
                        }}
                      >
                        <Box
                          component="img"
                          src={preset.imageUrl}
                          alt={preset.label}
                          sx={{ width: 32, height: 32, borderRadius: 1, display: 'block' }}
                        />
                      </ButtonBase>
                    ))}
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Upload a billet/sample photo or select a metallic preset texture.
                  </Typography>
                </Stack>
              </Stack>
            </Box>

            {/* Cutting Specs */}
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary">
                  Machinability Index: <strong>{form.machinability}/100</strong>
                </Typography>
                <Slider
                  value={form.machinability}
                  min={5}
                  max={100}
                  onChange={(_, val) => setForm(prev => ({ ...prev, machinability: val as number }))}
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <TextField
                  type="number"
                  label="Vc Min (m/min)"
                  value={form.vcMin}
                  onChange={e => setForm(prev => ({ ...prev, vcMin: Number(e.target.value) }))}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 6, sm: 4 }}>
                <TextField
                  type="number"
                  label="Vc Max (m/min)"
                  value={form.vcMax}
                  onChange={e => setForm(prev => ({ ...prev, vcMax: Number(e.target.value) }))}
                  fullWidth
                  size="small"
                />
              </Grid>
            </Grid>

            <Divider />

            {/* Factory Machining Context */}
            <Typography variant="subtitle2" fontWeight={800}>
              Factory Machining Context
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Target Workpiece / Part Name"
                  value={form.partName}
                  onChange={e => setForm(prev => ({ ...prev, partName: e.target.value }))}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Recommended Cutter & Coating"
                  value={form.recommendedCutter}
                  onChange={e => setForm(prev => ({ ...prev, recommendedCutter: e.target.value }))}
                  fullWidth
                  size="small"
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  select
                  label="Operation Type"
                  value={form.operationType}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      operationType: e.target.value as MaterialFactoryContext['operationType'],
                    }))
                  }
                  fullWidth
                  size="small"
                >
                  {['Roughing', 'Semi-Finishing', 'Finishing', 'High-Speed Milling', 'Drilling'].map(op => (
                    <MenuItem key={op} value={op}>
                      {op}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  select
                  label="Coolant Strategy"
                  value={form.coolantStrategy}
                  onChange={e =>
                    setForm(prev => ({
                      ...prev,
                      coolantStrategy: e.target.value as MaterialFactoryContext['coolantStrategy'],
                    }))
                  }
                  fullWidth
                  size="small"
                >
                  {['Flood Coolant', 'MQL', 'High-Pressure Through-Tool', 'Dry Air Blast'].map(c => (
                    <MenuItem key={c} value={c}>
                      {c}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  type="number"
                  label="Wear Rate Multiplier (x)"
                  inputProps={{ step: 0.1, min: 0.2, max: 5 }}
                  value={form.wearMultiplier}
                  onChange={e => setForm(prev => ({ ...prev, wearMultiplier: Number(e.target.value) }))}
                  fullWidth
                  size="small"
                />
              </Grid>
            </Grid>

            {/* Immediate Machine Assignment */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={assignImmediately}
                    onChange={e => setAssignImmediately(e.target.checked)}
                  />
                }
                label="Assign immediately to machine"
              />
              {assignImmediately && (
                <TextField
                  select
                  label="Target Machine"
                  value={targetMachineId}
                  onChange={e => setTargetMachineId(e.target.value)}
                  size="small"
                  sx={{ minWidth: 220 }}
                >
                  {fleetMachines.map(m => (
                    <MenuItem key={m.id} value={m.id}>
                      {m.id} · {m.name}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveMaterial}>
            Save Workpiece Material
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  )
}
