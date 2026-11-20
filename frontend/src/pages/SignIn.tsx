import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  IconButton,
  InputAdornment,
  LinearProgress,
  Link,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import Grid from '@mui/material/Grid2'
import { CheckCircle2, Eye, EyeOff, LockKeyhole, ShieldCheck, Wrench } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function SignIn() {
  const { isAuthenticated, signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (isAuthenticated) return <Navigate to="/dashboard" replace />

  const submit = async () => {
    setLoading(true)
    setError('')
    const success = await signIn(email, password)
    setLoading(false)
    if (success) navigate('/dashboard')
    else setError('Invalid credentials. Use the quick-fill button below.')
  }

  const demo = () => {
    setEmail('demo@toolwise.io')
    setPassword('Demo@1234')
    setError('')
  }

  return (
    <Grid container sx={{ minHeight: '100vh', bgcolor: '#14181D' }}>
      <Grid
        size={{ xs: 12, md: 6 }}
        sx={{
          display: { xs: 'none', md: 'block' },
          bgcolor: 'rgba(255,255,255,0.03)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          p: { md: 4, lg: 7 },
        }}
      >
        <Stack spacing={3} sx={{ maxWidth: 600, mx: 'auto' }}>
          <Stack direction="row" alignItems="center" spacing={1.1}>
            <Box sx={{ p: 1, bgcolor: 'primary.main', color: 'white', borderRadius: 2, display: 'grid', placeItems: 'center' }}>
              <Wrench size={20} />
            </Box>
            <Typography variant="h5" fontWeight={800} color="#F8FAFC">
              Tool<span style={{ color: '#1565C0' }}>Wise</span>
            </Typography>
          </Stack>

          <Box>
            <Typography variant="h2" sx={{ maxWidth: 500, color: '#F8FAFC' }}>
              Predict tool wear. Protect every batch.
            </Typography>
            <Typography color="text.secondary" mt={1.25}>
              Enter the ToolWise production workspace with 2D live tool &amp; batch intelligence, explainable 0–100 health scores, and planned changeover ROI in ₹.
            </Typography>
          </Box>

          {/* Clean 2D Tool & Batch Snapshot Card */}
          <Card sx={{ bgcolor: '#14181D', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 3 }}>
            <CardContent sx={{ p: 2.75 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: '#1565C0', letterSpacing: '0.06em' }}>
                  2D LIVE TOOL &amp; BATCH SNAPSHOT · CNC-01
                </Typography>
                <Chip
                  label="SAFE ZONE · 82/100"
                  size="small"
                  sx={{ bgcolor: 'rgba(34,197,94,0.14)', color: '#4ADE80', border: '1px solid rgba(34,197,94,0.35)', fontWeight: 800, fontSize: 11 }}
                />
              </Stack>

              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#F8FAFC' }}>
                TL-001 · Ø12 Roughing End Mill (AlTiN Carbide)
              </Typography>
              <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mb: 2 }}>
                Workpiece: AISI 4140 (28 HRC) · Part #BRK-4140-221 · 71 min RUL remaining
              </Typography>

              <Stack spacing={1.25}>
                <Box>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="caption" fontWeight={700} color="#475569">
                      Flank Wear (VB): 0.16 / 0.30 mm limit
                    </Typography>
                    <Typography variant="caption" fontWeight={800} color="#F8FAFC">
                      53% worn
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={53}
                    sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.06)', '& .MuiLinearProgress-bar': { bgcolor: '#1565C0' } }}
                  />
                </Box>

                <Box>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="caption" fontWeight={700} color="#475569">
                      Active Batch Progress: 76 / 120 parts
                    </Typography>
                    <Typography variant="caption" fontWeight={800} color="#16A34A">
                      +12 min buffer to finish batch
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={63}
                    sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(255,255,255,0.06)', '& .MuiLinearProgress-bar': { bgcolor: '#F8FAFC' } }}
                  />
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Stack spacing={1.2}>
            {[
              ['2D Live Tool Wear & Batch Readiness Intelligence', ShieldCheck],
              ['Explainable 0–100 Health Score & Taylor Wear Physics', CheckCircle2],
              ['Part Quality Shield & Planned Swap ROI in ₹', LockKeyhole],
            ].map(([text, Icon]) => (
              <Stack key={String(text)} direction="row" spacing={1} alignItems="center">
                <Icon size={17} color="#1565C0" />
                <Typography variant="body2" fontWeight={600} color="#1E293B">
                  {String(text)}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Grid>

      <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'grid', placeItems: 'center', p: 2, bgcolor: '#14181D' }}>
        <Card sx={{ width: '100%', maxWidth: 440, border: '1px solid rgba(255,255,255,0.08)' }}>
          <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
            <Typography variant="h3" color="#F8FAFC">
              Welcome back
            </Typography>
            <Typography color="text.secondary" mt={1}>
              Sign in to open the ToolWise demo workspace.
            </Typography>
            <Stack spacing={2} mt={3}>
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                fullWidth
              />
              <TextField
                label="Password"
                type={show ? 'text' : 'password'}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                fullWidth
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShow(!show)} aria-label="Show password">
                        {show ? <EyeOff size={18} /> : <Eye size={18} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <FormControlLabel control={<Checkbox size="small" />} label={<Typography variant="body2">Remember me</Typography>} />
                <Link href="#" underline="hover" variant="body2">
                  Forgot password?
                </Link>
              </Stack>
              {error && <Alert severity="error">{error}</Alert>}
              <Button variant="contained" size="large" onClick={submit} disabled={loading}>
                {loading ? <CircularProgress size={20} color="inherit" /> : 'Sign in'}
              </Button>
              <Button variant="outlined" onClick={demo}>
                Fill demo credentials (demo@toolwise.io)
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  )
}
