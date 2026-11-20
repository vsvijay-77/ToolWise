import { useState } from 'react'
import { Link as RouterLink, useNavigate } from 'react-router-dom'
import {
  AppBar,
  Box,
  Button,
  ButtonBase,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
  Stack,
  Toolbar,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  Cpu,
  Gauge,
  Layers,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Wrench,
} from 'lucide-react'
import { Brand } from '../components/nav/TopBar'
import { CNCMachine3D } from '../components/cnc/CNCMachine3D'
import { useAuth } from '../context/AuthContext'
import { jobs, machines, materials, tools } from '../data'

type WorkflowTabId = 'process-steps' | 'cost-life-optimization' | 'product-damage-shield'

const navbarWorkflowTabs: {
  id: WorkflowTabId
  label: string
  icon: typeof Cpu
}[] = [
  {
    id: 'process-steps',
    label: 'Process & Steps',
    icon: Cpu,
  },
  {
    id: 'cost-life-optimization',
    label: 'Optimization Workflow',
    icon: Sliders,
  },
  {
    id: 'product-damage-shield',
    label: 'Damage Prevention',
    icon: ShieldCheck,
  },
]

const highlights = [
  {
    icon: CircleDollarSign,
    title: 'Every Tool Change (₹ Cost Comparison)',
    text: 'Compare a planned ₹9,130 between-cycle tool replacement against a ₹78,400 mid-cut breakage event before starting the next batch.',
    color: '#1565C0',
    bg: 'rgba(59,130,246,0.14)',
  },
  {
    icon: Clock,
    title: 'Every Minute (Delay Prevention)',
    text: 'Track actual vs. predicted cutting minutes in real time—replacing 96+ minutes of unplanned spindle downtime with a 3-minute planned swap.',
    color: '#00897B',
    bg: 'rgba(20,184,166,0.14)',
  },
  {
    icon: ShieldCheck,
    title: 'Every Rupee & Part Protected',
    text: 'Prevent scrapped billets, dimensional drift, and ₹53,950 tool-holder collisions with explainable 0–100 health scores and automatic lockout alerts.',
    color: '#16A34A',
    bg: 'rgba(34,197,94,0.14)',
  },
]

export default function Home() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<WorkflowTabId>('process-steps')

  const machine = machines[0]
  const tool = tools[0]
  const material = materials[1]
  const job = jobs['CNC-01']

  const enterDemo = async () => {
    const ok = await signIn('demo@toolwise.io', 'Demo@1234')
    if (ok) navigate('/dashboard')
    else navigate('/signin')
  }

  const handleNavTabClick = (tabId: WorkflowTabId) => {
    setActiveTab(tabId)
    const el = document.getElementById(tabId)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <Box sx={{ bgcolor: '#14181D', minHeight: '100vh', color: '#F8FAFC' }}>
      {/* Clean White Top Navbar with 3 Pre-Login Workflow Tabs */}
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{
          bgcolor: 'rgba(20,24,29,0.92)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Toolbar
          sx={{
            maxWidth: 1280,
            width: '100%',
            mx: 'auto',
            px: { xs: 2, md: 3 },
            minHeight: 70,
            gap: 2,
            justifyContent: 'space-between',
          }}
        >
          <Brand to="/" />

          {/* 3 Pre-Login Workflow Navbar Tabs */}
          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
            sx={{ display: { xs: 'none', md: 'flex' } }}
          >
            {navbarWorkflowTabs.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <Button
                  key={tab.id}
                  onClick={() => handleNavTabClick(tab.id)}
                  sx={{
                    px: 1.5,
                    py: 0.75,
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontSize: 13.5,
                    fontWeight: isActive ? 700 : 600,
                    color: isActive ? '#1565C0' : '#94A3B8',
                    '&:hover': { color: '#F8FAFC', bgcolor: '#0B0E14' },
                  }}
                >
                  {tab.label}
                </Button>
              )
            })}
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              color="inherit"
              component={RouterLink}
              to="/signin"
              sx={{
                fontWeight: 600,
                textTransform: 'none',
                color: '#94A3B8',
                '&:hover': { color: '#F8FAFC', bgcolor: '#0B0E14' },
              }}
            >
              Sign in
            </Button>
            <Button
              variant="contained"
              onClick={enterDemo}
              endIcon={<ArrowRight size={16} />}
              sx={{
                px: 2.25,
                py: 0.9,
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: 600,
                bgcolor: '#1565C0',
                '&:hover': { bgcolor: '#0D47A1' },
              }}
            >
              Launch Demo
            </Button>
          </Stack>
        </Toolbar>

        {/* Mobile Section Links Bar */}
        <Box
          sx={{
            display: { xs: 'flex', md: 'none' },
            borderTop: '1px solid rgba(255,255,255,0.08)',
            bgcolor: '#0B0E14',
            px: 2,
            py: 0.75,
            gap: 1,
            overflowX: 'auto',
          }}
        >
          {navbarWorkflowTabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <ButtonBase
                key={tab.id}
                onClick={() => handleNavTabClick(tab.id)}
                sx={{
                  px: 1.25,
                  py: 0.6,
                  borderRadius: '8px',
                  whiteSpace: 'nowrap',
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: isActive ? '#1565C0' : '#94A3B8',
                }}
              >
                {tab.label}
              </ButtonBase>
            )
          })}
        </Box>
      </AppBar>

      {/* Clean White Hero */}
      <Box
        sx={{
          bgcolor: '#14181D',
          pt: { xs: 4, md: 5 },
          pb: { xs: 5, md: 7 },
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Container maxWidth={false} sx={{ px: { xs: 2.5, md: 5, lg: 7 } }}>
          <Grid container spacing={{ xs: 4, lg: 5 }} alignItems="center">
            {/* Left Column: Clean Headline, Sub-line & 2 Actions */}
            <Grid size={{ xs: 12, lg: 5.5 }} sx={{ pl: { lg: '3px' } }}>
              <Typography
                variant="h1"
                sx={{
                  fontSize: { xs: '2.35rem', sm: '3.1rem', lg: '3.65rem' },
                  fontWeight: 700,
                  lineHeight: 1.08,
                  letterSpacing: '-0.03em',
                  color: '#F8FAFC',
                }}
              >
                Every tool change. Every minute.{' '}
                <Box component="span" sx={{ color: '#1565C0', display: 'block' }}>
                  Every rupee counts.
                </Box>
              </Typography>

              <Typography
                sx={{
                  mt: 3,
                  color: '#94A3B8',
                  fontSize: { xs: '1.05rem', sm: '1.15rem' },
                  fontWeight: 400,
                  lineHeight: 1.6,
                  maxWidth: 560,
                }}
              >
                Compare replacement costs, production delays and potential losses to make smarter machining decisions.
              </Typography>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mt={4}>
                <Button
                  variant="contained"
                  size="large"
                  onClick={enterDemo}
                  endIcon={<ArrowRight size={20} />}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 600,
                    bgcolor: '#1565C0',
                    '&:hover': { bgcolor: '#0D47A1' },
                  }}
                >
                  Launch Demo
                </Button>
                <Button
                  variant="outlined"
                  size="large"
                  component={RouterLink}
                  to="/signin"
                  sx={{
                    px: 3.75,
                    py: 1.5,
                    fontSize: '1rem',
                    borderRadius: '8px',
                    textTransform: 'none',
                    fontWeight: 600,
                    borderColor: '#CBD5E1',
                    color: '#F8FAFC',
                    '&:hover': { borderColor: '#1565C0', bgcolor: '#0B0E14' },
                  }}
                >
                  Sign in
                </Button>
              </Stack>
            </Grid>

            {/* Right Column: 3D CNC Animation */}
            <Grid size={{ xs: 12, lg: 6.5 }}>
              <CNCMachine3D
                machine={machine}
                tool={tool}
                material={material}
                rpm={job.rpm}
                feed={job.feed}
                wear={job.vbWearMm}
                job={job}
                height={520}
              />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* 3 Scannable Executive Value Pillars */}
      <Box sx={{ bgcolor: '#0B0E14', py: { xs: 5, md: 6 } }}>
        <Container maxWidth="xl" sx={{ maxWidth: 1280, px: { xs: 2, md: 3 } }}>
          <Grid container spacing={2.5}>
            {highlights.map(({ icon: Icon, title, text, color, bg }) => (
              <Grid key={title} size={{ xs: 12, md: 4 }}>
                <Card sx={{ height: '100%', bgcolor: '#14181D', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box
                      sx={{
                        width: 42,
                        height: 42,
                        borderRadius: 2,
                        bgcolor: bg,
                        color,
                        display: 'grid',
                        placeItems: 'center',
                        mb: 1.75,
                      }}
                    >
                      <Icon size={20} />
                    </Box>
                    <Typography variant="h6" sx={{ fontSize: 17, fontWeight: 800, color: '#F8FAFC', mb: 0.75 }}>
                      {title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.6 }}>
                      {text}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Section 1: 1. Process & Steps */}
      <Box
        id="process-steps"
        sx={{
          scrollMarginTop: '84px',
          bgcolor: '#14181D',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          py: { xs: 6, md: 7.5 },
        }}
      >
        <Container maxWidth="xl" sx={{ maxWidth: 1280, px: { xs: 2, md: 3 } }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'flex-end' }}
            spacing={2}
            sx={{ mb: 4.5 }}
          >
            <Box>
              <Chip
                label="1. PROCESS & STEPS"
                size="small"
                sx={{
                  mb: 1.25,
                  bgcolor: 'rgba(59,130,246,0.14)',
                  color: '#1565C0',
                  fontWeight: 800,
                  fontSize: 11,
                  letterSpacing: '0.06em',
                }}
              />
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#F8FAFC' }}>
                4-Step Tool-Life, Delay &amp; Rupee Decision Pipeline
              </Typography>
              <Typography variant="body1" sx={{ color: '#94A3B8', mt: 0.75, maxWidth: 720 }}>
                How ToolWise transforms spindle telemetry into remaining cutting minutes, replacement cost comparisons (₹), and zero-scrap changeover decisions.
              </Typography>
            </Box>

            <Button
              variant="contained"
              size="large"
              onClick={enterDemo}
              endIcon={<ArrowRight size={18} />}
              sx={{ px: 3, py: 1.25, bgcolor: '#1565C0', '&:hover': { bgcolor: '#0D47A1' }, flexShrink: 0 }}
            >
              Open Live Demo
            </Button>
          </Stack>

          <Grid container spacing={2.5}>
            {[
              {
                step: 'STEP 01',
                title: 'Capture Spindle & Alloy Telemetry',
                icon: Cpu,
                accent: '#1565C0',
                bg: 'rgba(59,130,246,0.14)',
                metric: 'RPM · Feed · Torque · ISO Alloy',
                text: 'Streams live spindle load, RPM, feed rate, and active workpiece alloy (Al 6061, AISI 4140, Ti-6Al-4V, Inconel 718) from each bay.',
              },
              {
                step: 'STEP 02',
                title: 'Model Taylor Wear & Minutes Left',
                icon: Gauge,
                accent: '#0284C7',
                bg: '#F0F9FF',
                metric: 'VB Flank Wear (mm) · RUL (min)',
                text: 'Computes real-time flank wear progression toward the 0.30 mm ISO limit and predicts exact cutting minutes and parts remaining.',
              },
              {
                step: 'STEP 03',
                title: 'Compare Replacement vs. Failure Loss',
                icon: CircleDollarSign,
                accent: '#D97706',
                bg: 'rgba(245,158,11,0.14)',
                metric: 'Planned Swap (₹) vs. Breakdown (₹)',
                text: 'Weighs a planned between-cycle tool replacement (₹9,130 · 3 min) against mid-cut breakage, 96 min delay, and ₹78,400 loss.',
              },
              {
                step: 'STEP 04',
                title: 'Dispatch Smarter Shop-Floor Action',
                icon: ShieldCheck,
                accent: '#16A34A',
                bg: 'rgba(34,197,94,0.14)',
                metric: '0–100 Health · Batch Queue Sync',
                text: 'Alerts operators to swap worn tools between cycles and verifies if remaining tool life covers the next queued workpiece batch.',
              },
            ].map((item) => {
              const Icon = item.icon
              return (
                <Grid key={item.step} size={{ xs: 12, sm: 6, lg: 3 }}>
                  <Card
                    sx={{
                      height: '100%',
                      bgcolor: '#0B0E14',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: 'none',
                    }}
                  >
                    <CardContent sx={{ p: 2.75, display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Chip
                          label={item.step}
                          size="small"
                          sx={{
                            bgcolor: item.bg,
                            color: item.accent,
                            fontWeight: 800,
                            fontSize: 11.5,
                          }}
                        />
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 1.5,
                            bgcolor: item.bg,
                            color: item.accent,
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          <Icon size={18} />
                        </Box>
                      </Stack>
                      <Typography variant="h6" sx={{ fontWeight: 800, fontSize: 16.5, color: '#F8FAFC', mb: 1 }}>
                        {item.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.6, mb: 2, flexGrow: 1 }}>
                        {item.text}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'inline-block',
                          px: 1.25,
                          py: 0.6,
                          borderRadius: 1,
                          bgcolor: '#14181D',
                          border: '1px solid rgba(255,255,255,0.08)',
                          color: '#334155',
                          fontWeight: 700,
                        }}
                      >
                        {item.metric}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              )
            })}
          </Grid>
        </Container>
      </Box>

      {/* Section 2: 2. Cost & Life Optimization */}
      <Box
        id="cost-life-optimization"
        sx={{
          scrollMarginTop: '84px',
          bgcolor: '#0B0E14',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          py: { xs: 6, md: 7.5 },
        }}
      >
        <Container maxWidth="xl" sx={{ maxWidth: 1280, px: { xs: 2, md: 3 } }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'flex-end' }}
            spacing={2}
            sx={{ mb: 4.5 }}
          >
            <Box>
              <Chip
                label="2. COST & LIFE OPTIMIZATION"
                size="small"
                sx={{
                  mb: 1.25,
                  bgcolor: 'rgba(59,130,246,0.14)',
                  color: '#1565C0',
                  fontWeight: 800,
                  fontSize: 11,
                  letterSpacing: '0.06em',
                }}
              />
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#F8FAFC' }}>
                3 Workflows to Cut Replacement Costs &amp; Production Delays
              </Typography>
              <Typography variant="body1" sx={{ color: '#94A3B8', mt: 0.75, maxWidth: 720 }}>
                Practical shop-floor workflows that stretch cutting minutes per carbide edge, match coatings to workpiece alloys, and eliminate expensive unplanned stops.
              </Typography>
            </Box>

            <Button
              variant="outlined"
              size="large"
              onClick={enterDemo}
              endIcon={<ArrowRight size={18} />}
              sx={{
                px: 3,
                py: 1.25,
                borderColor: '#CBD5E1',
                bgcolor: '#14181D',
                color: '#F8FAFC',
                '&:hover': { borderColor: '#1565C0', bgcolor: '#EFF6FF' },
                flexShrink: 0,
              }}
            >
              Compare Cost &amp; Life Live
            </Button>
          </Stack>

          <Grid container spacing={2.5}>
            {[
              {
                badge: 'WORKFLOW 01',
                title: 'Cutting Speed & Feed Life Tuning',
                icon: Sliders,
                accent: '#1565C0',
                bg: 'rgba(59,130,246,0.14)',
                steps: [
                  'Benchmark live surface speed (Vc) against the alloy’s optimal window',
                  'Eliminate torque spikes during roughing that accelerate flank wear',
                  'Extend cutter minutes per edge without slowing part cycle time',
                ],
                outcome: '+22% longer tool life · ₹18,500 saved per 100 parts',
              },
              {
                badge: 'WORKFLOW 02',
                title: 'Material Queue & Coating Fit Verification',
                icon: Layers,
                accent: '#7C3AED',
                bg: '#F5F3FF',
                steps: [
                  'Verify AlTiN, TiSiN, AlCrN, and CVD coatings against queued ISO alloys',
                  'Check if active tool remaining minutes cover the next batch duration',
                  'Pre-stage sister tools before high-wear Ti-6Al-4V or Inconel 718 runs',
                ],
                outcome: '0 mid-batch coating failures or thermal edge burn-out',
              },
              {
                badge: 'WORKFLOW 03',
                title: 'Planned Swap vs. Breakdown ROI Scheduling',
                icon: Wrench,
                accent: '#16A34A',
                bg: 'rgba(34,197,94,0.14)',
                steps: [
                  'Compare planned replacement cost (₹) vs. emergency failure loss (₹)',
                  'Schedule 3-minute tool changes between part cycles instead of mid-cut',
                  'Avoid 96+ minute spindle recovery delays and holder replacement costs',
                ],
                outcome: 'Saves ₹44,800–₹69,270 per avoided mid-cut breakage',
              },
            ].map((wf) => {
              const Icon = wf.icon
              return (
                <Grid key={wf.badge} size={{ xs: 12, md: 4 }}>
                  <Card
                    sx={{
                      height: '100%',
                      bgcolor: '#14181D',
                      border: '1px solid rgba(255,255,255,0.08)',
                      boxShadow: 'none',
                    }}
                  >
                    <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Chip
                          label={wf.badge}
                          size="small"
                          sx={{ bgcolor: wf.bg, color: wf.accent, fontWeight: 800, fontSize: 11.5 }}
                        />
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 1.5,
                            bgcolor: wf.bg,
                            color: wf.accent,
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          <Icon size={18} />
                        </Box>
                      </Stack>
                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#F8FAFC', mb: 1.5 }}>
                        {wf.title}
                      </Typography>
                      <Stack spacing={1.15} sx={{ mb: 2.5, flexGrow: 1 }}>
                        {wf.steps.map((s) => (
                          <Stack key={s} direction="row" spacing={1} alignItems="flex-start">
                            <CheckCircle2 size={16} color={wf.accent} style={{ marginTop: 2, flexShrink: 0 }} />
                            <Typography variant="body2" sx={{ color: '#94A3B8', lineHeight: 1.55 }}>
                              {s}
                            </Typography>
                          </Stack>
                        ))}
                      </Stack>
                      <Box
                        sx={{
                          px: 1.5,
                          py: 1,
                          borderRadius: 1.5,
                          bgcolor: wf.bg,
                          border: '1px solid rgba(255,255,255,0.08)',
                        }}
                      >
                        <Typography variant="caption" sx={{ color: wf.accent, fontWeight: 800 }}>
                          DECISION IMPACT: {wf.outcome}
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )
            })}
          </Grid>
        </Container>
      </Box>

      {/* Section 3: 3. Product Damage Shield */}
      <Box
        id="product-damage-shield"
        sx={{
          scrollMarginTop: '84px',
          bgcolor: '#14181D',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          py: { xs: 6, md: 7.5 },
        }}
      >
        <Container maxWidth="xl" sx={{ maxWidth: 1280, px: { xs: 2, md: 3 } }}>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', md: 'flex-end' }}
            spacing={2}
            sx={{ mb: 4.5 }}
          >
            <Box>
              <Chip
                label="3. PRODUCT DAMAGE SHIELD"
                size="small"
                sx={{
                  mb: 1.25,
                  bgcolor: 'rgba(34,197,94,0.14)',
                  color: '#15803D',
                  fontWeight: 800,
                  fontSize: 11,
                  letterSpacing: '0.06em',
                }}
              />
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#F8FAFC' }}>
                3-Stage Product Damage, Delay &amp; Scrap Prevention Shield
              </Typography>
              <Typography variant="body1" sx={{ color: '#94A3B8', mt: 0.75, maxWidth: 720 }}>
                Progressive flank-wear guardrails that catch dulling edges early and lock out worn cutters before part scrap, rework delays, or spindle damage occur.
              </Typography>
            </Box>

            <Button
              variant="contained"
              size="large"
              onClick={enterDemo}
              endIcon={<ArrowRight size={18} />}
              sx={{ px: 3, py: 1.25, bgcolor: '#1565C0', '&:hover': { bgcolor: '#0D47A1' }, flexShrink: 0 }}
            >
              Open Live Demo
            </Button>
          </Stack>

          <Grid container spacing={2.5}>
            {[
              {
                stage: 'STAGE 1 · ALL OK (GREEN)',
                title: 'Zero Damaged Parts · Nominal Finish',
                icon: ShieldCheck,
                accent: '#16A34A',
                bg: 'rgba(34,197,94,0.14)',
                border: '#BBF7D0',
                threshold: 'Flank Wear VB < 0.20 mm · Score 80–100',
                risk: '0 pcs at risk · ₹0 scrap exposure — Surface finish (Ra) and part tolerances remain strictly within spec.',
                action: 'Continue batch machining; log cutting minutes and baseline spindle load.',
              },
              {
                stage: 'STAGE 2 · MONITOR (ORANGE)',
                title: 'Pre-Damage Staging & Delay Buffer',
                icon: AlertTriangle,
                accent: '#D97706',
                bg: 'rgba(245,158,11,0.14)',
                border: '#FDE68A',
                threshold: 'Flank Wear VB 0.20–0.28 mm · Score 50–79',
                risk: '1–2 pcs at rework risk (₹7,700–₹15,400) — Rising cutting forces can trigger exit burrs or minor chatter.',
                action: 'Stage replacement tool in magazine and schedule a 3-minute planned swap at the next cycle gap.',
              },
              {
                stage: 'STAGE 3 · CRITICAL LOCKOUT (RED)',
                title: 'Breakage, Scrap & Holder Protection',
                icon: ShieldAlert,
                accent: '#DC2626',
                bg: 'rgba(239,68,68,0.14)',
                border: '#FECACA',
                threshold: 'Flank Wear VB ≥ 0.30 mm or RUL = 0 min · Score < 50',
                risk: '3+ pcs scrap + 96 min delay + ₹53,950 holder collision risk (₹78,400+ total potential loss).',
                action: 'Trigger immediate critical alert and block next part cycle start until fresh cutter is mounted.',
              },
            ].map((st) => {
              const Icon = st.icon
              return (
                <Grid key={st.stage} size={{ xs: 12, md: 4 }}>
                  <Card
                    sx={{
                      height: '100%',
                      bgcolor: '#14181D',
                      border: `1.5px solid ${st.border}`,
                      boxShadow: 'none',
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                        <Chip
                          label={st.stage}
                          size="small"
                          sx={{ bgcolor: st.bg, color: st.accent, fontWeight: 800, fontSize: 11 }}
                        />
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: 1.5,
                            bgcolor: st.bg,
                            color: st.accent,
                            display: 'grid',
                            placeItems: 'center',
                          }}
                        >
                          <Icon size={18} />
                        </Box>
                      </Stack>

                      <Typography variant="h6" sx={{ fontWeight: 800, color: '#F8FAFC', mb: 0.75 }}>
                        {st.title}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'inline-block',
                          px: 1.25,
                          py: 0.5,
                          borderRadius: 1,
                          bgcolor: st.bg,
                          color: st.accent,
                          fontWeight: 800,
                          mb: 2,
                        }}
                      >
                        {st.threshold}
                      </Typography>

                      <Stack spacing={1.25}>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800 }}>
                            POTENTIAL LOSS &amp; DELAY EXPOSURE
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#334155', lineHeight: 1.55, mt: 0.25 }}>
                            {st.risk}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 800 }}>
                            SMARTER MACHINING DECISION
                          </Typography>
                          <Typography variant="body2" sx={{ color: '#F8FAFC', fontWeight: 600, lineHeight: 1.55, mt: 0.25 }}>
                            {st.action}
                          </Typography>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              )
            })}
          </Grid>
        </Container>
      </Box>

      {/* Footer with Quick Links */}
      <Box
        component="footer"
        sx={{
          bgcolor: '#0B0E14',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          py: { xs: 5, md: 6 },
        }}
      >
        <Container maxWidth="xl" sx={{ maxWidth: '1280px !important' }}>
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 5 }}>
              <Brand to="/" />
              <Typography
                variant="body2"
                sx={{ color: '#64748B', mt: 1.5, maxWidth: 360, lineHeight: 1.65 }}
              >
                CNC tool-life &amp; batch intelligence. Real-time Taylor wear forecasting,
                replacement cost comparison, and scrap prevention.
              </Typography>
            </Grid>

            <Grid size={{ xs: 6, sm: 4, md: 2.5 }}>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  fontWeight: 700,
                  color: '#F8FAFC',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  mb: 1.5,
                }}
              >
                Workflows
              </Typography>
              <Stack spacing={1} alignItems="flex-start">
                {navbarWorkflowTabs.map((link) => (
                  <Button
                    key={link.id}
                    onClick={() => handleNavTabClick(link.id)}
                    sx={{
                      p: 0,
                      minWidth: 0,
                      textTransform: 'none',
                      fontSize: 13.5,
                      fontWeight: 500,
                      color: '#94A3B8',
                      '&:hover': { color: '#1565C0', bgcolor: 'transparent' },
                    }}
                  >
                    {link.label}
                  </Button>
                ))}
                <Button
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  sx={{
                    p: 0,
                    minWidth: 0,
                    textTransform: 'none',
                    fontSize: 13.5,
                    fontWeight: 500,
                    color: '#94A3B8',
                    '&:hover': { color: '#1565C0', bgcolor: 'transparent' },
                  }}
                >
                  Back to top
                </Button>
              </Stack>
            </Grid>

            <Grid size={{ xs: 6, sm: 4, md: 2.5 }}>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  fontWeight: 700,
                  color: '#F8FAFC',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  mb: 1.5,
                }}
              >
                Quick Access
              </Typography>
              <Stack spacing={1} alignItems="flex-start">
                <Button
                  onClick={enterDemo}
                  sx={{
                    p: 0,
                    minWidth: 0,
                    textTransform: 'none',
                    fontSize: 13.5,
                    fontWeight: 600,
                    color: '#1565C0',
                    '&:hover': { color: '#0D47A1', bgcolor: 'transparent' },
                  }}
                >
                  Launch Demo
                </Button>
                <Button
                  component={RouterLink}
                  to="/signin"
                  sx={{
                    p: 0,
                    minWidth: 0,
                    textTransform: 'none',
                    fontSize: 13.5,
                    fontWeight: 500,
                    color: '#94A3B8',
                    '&:hover': { color: '#1565C0', bgcolor: 'transparent' },
                  }}
                >
                  Sign in
                </Button>
              </Stack>
            </Grid>

            <Grid size={{ xs: 12, sm: 4, md: 2 }}>
              <Typography
                variant="caption"
                sx={{
                  display: 'block',
                  fontWeight: 700,
                  color: '#F8FAFC',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  mb: 1.5,
                }}
              >
                Capabilities
              </Typography>
              <Stack spacing={1}>
                {[
                  'Taylor RUL Model',
                  'Cost Comparison',
                  '3D Spindle Twin',
                  'AI Suggestions',
                ].map((item) => (
                  <Typography key={item} sx={{ fontSize: 13.5, color: '#64748B' }}>
                    {item}
                  </Typography>
                ))}
              </Stack>
            </Grid>
          </Grid>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 3.5 }} />

          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={1}
          >
            <Typography sx={{ fontSize: 12.5, color: '#64748B' }}>
              © {new Date().getFullYear()} ToolWise · CNC Tool-Life &amp; Batch Intelligence
            </Typography>
            <Typography sx={{ fontSize: 12.5, color: '#64748B' }}>
              Simulated shop-floor telemetry · Taylor wear &amp; cost engine
            </Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  )
}
