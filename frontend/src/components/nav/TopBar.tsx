import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Avatar,
  Badge,
  Box,
  ButtonBase,
  Chip,
  Divider,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Popover,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from '@mui/material'
import {
  AlertTriangle,
  Bell,
  ChevronDown,
  Info,
  LogOut,
  Menu as MenuIcon,
  OctagonAlert,
  RotateCcw,
  Search,
  Settings,
  Wrench,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useSelection } from '../../context/SelectionContext'
import { sampleAlerts } from '../../data'

export function Brand({ to }: { to?: string }) {
  const navigate = useNavigate()
  return (
    <ButtonBase
      onClick={() => to && navigate(to)}
      disabled={!to}
      sx={{ borderRadius: 2, textAlign: 'left', px: 0.5, py: 0.25 }}
    >
      <Stack direction="row" alignItems="center" spacing={1.1}>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: 2,
            bgcolor: 'primary.main',
            color: 'white',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Wrench size={17} />
        </Box>
        <Typography fontWeight={800} letterSpacing="-.04em" fontSize={20} color="#F8FAFC">
          Tool<span style={{ color: '#1565C0' }}>Wise</span>
        </Typography>
      </Stack>
    </ButtonBase>
  )
}

export function TopBar({ onMenu }: { onMenu: () => void }) {
  const navigate = useNavigate()
  const { signOut } = useAuth()
  const { fleetMachines, fleetTools, fleetMaterials, machineId, resetDemoData } = useSelection()
  const [userAnchor, setUserAnchor] = useState<HTMLElement | null>(null)
  const [alertAnchor, setAlertAnchor] = useState<HTMLElement | null>(null)
  const [search, setSearch] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Global "/" shortcut to focus search
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || target?.isContentEditable) return
      event.preventDefault()
      searchInputRef.current?.focus()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const matches = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    return [
      ...fleetMachines.map(item => ({ name: `${item.id} · ${item.name}`, tag: 'Machine', path: `/machines/${item.id}` })),
      ...fleetTools.map(item => ({ name: `${item.id} · ${item.name}`, tag: 'Tool', path: `/machines/${machineId}` })),
      ...fleetMaterials.map(item => ({ name: `${item.name} (${item.isoGroup})`, tag: 'Material', path: '/materials' })),
    ]
      .filter(item => item.name.toLowerCase().includes(q))
      .slice(0, 6)
  }, [search, fleetMachines, fleetTools, fleetMaterials, machineId])

  return (
    <>
      <Toolbar sx={{ px: { xs: 1.5, md: 3 }, gap: 2, minHeight: '64px !important', bgcolor: '#14181D' }}>
        <IconButton aria-label="Open navigation" onClick={onMenu} sx={{ display: { lg: 'none' }, color: '#F8FAFC' }}>
          <MenuIcon size={20} />
        </IconButton>

        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Brand to="/dashboard" />
        </Box>

        <Box sx={{ flex: 1, minWidth: 0, maxWidth: 440, ml: { lg: 4 }, position: 'relative' }}>
          <TextField
            size="small"
            fullWidth
            inputRef={searchInputRef}
            value={search}
            onChange={event => setSearch(event.target.value)}
            placeholder="Search machines, tools, materials..."
            inputProps={{ 'aria-label': 'Global search' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={16} color="#64748B" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end" sx={{ display: { xs: 'none', sm: 'flex' } }}>
                  <Box
                    sx={{
                      px: 0.7,
                      py: 0.15,
                      borderRadius: 1,
                      bgcolor: 'rgba(255,255,255,0.08)',
                      color: '#94A3B8',
                      fontSize: 11,
                      fontWeight: 700,
                      fontFamily: '"JetBrains Mono", monospace',
                    }}
                  >
                    /
                  </Box>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(255,255,255,0.04)',
                borderRadius: 2.5,
                fontSize: 13.5,
                '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
                '&:hover fieldset': { borderColor: '#CBD5E1' },
              },
            }}
          />
          {matches.length > 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: 44,
                left: 0,
                right: 0,
                zIndex: 20,
                bgcolor: '#14181D',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 2,
                boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
                overflow: 'hidden',
              }}
            >
              {matches.map(item => (
                <MenuItem
                  key={`${item.tag}-${item.name}`}
                  onClick={() => {
                    navigate(item.path)
                    setSearch('')
                  }}
                  sx={{ fontSize: 13, justifyContent: 'space-between' }}
                >
                  <span>{item.name}</span>
                  <Chip label={item.tag} size="small" sx={{ height: 20, fontSize: 10, fontWeight: 700 }} />
                </MenuItem>
              ))}
            </Box>
          )}
        </Box>

        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ ml: 'auto' }}>
          <Chip
            size="small"
            label="Online"
            icon={
              <Box
                sx={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  bgcolor: '#16A34A',
                  ml: '8px !important',
                }}
              />
            }
            sx={{
              display: { xs: 'none', md: 'inline-flex' },
              bgcolor: 'rgba(34,197,94,0.14)',
              color: '#22C55E',
              border: '1px solid rgba(34,197,94,0.35)',
              fontWeight: 700,
            }}
          />

          <IconButton
            aria-label="Open machine alerts"
            onClick={event => setAlertAnchor(event.currentTarget)}
            sx={{
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 2.5,
              width: 38,
              height: 38,
              bgcolor: '#14181D',
              color: '#F8FAFC',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
            }}
          >
            <Badge badgeContent={sampleAlerts.length} color="error">
              <Bell size={18} />
            </Badge>
          </IconButton>

          <ButtonBase
            aria-label="Open user menu"
            onClick={event => setUserAnchor(event.currentTarget)}
            sx={{
              px: 1,
              py: 0.5,
              borderRadius: 2.5,
              border: '1px solid rgba(255,255,255,0.08)',
              bgcolor: '#14181D',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
            }}
          >
            <Stack direction="row" spacing={0.75} alignItems="center">
              <Avatar sx={{ width: 28, height: 28, bgcolor: 'primary.main', fontSize: 11, fontWeight: 800 }}>
                DM
              </Avatar>
              <Typography variant="caption" fontWeight={700} color="#F8FAFC" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                Demo User
              </Typography>
              <ChevronDown size={14} color="#64748B" />
            </Stack>
          </ButtonBase>
        </Stack>
      </Toolbar>

      {/* Sample Alerts Popover */}
      <Popover
        open={Boolean(alertAnchor)}
        anchorEl={alertAnchor}
        onClose={() => setAlertAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{ sx: { width: { xs: 'calc(100vw - 24px)', sm: 360 }, maxWidth: 360, mt: 1, borderRadius: 2.5, overflow: 'hidden' } }}
      >
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.08)', bgcolor: 'rgba(255,255,255,0.04)' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2" fontWeight={800}>
              Active Shop-Floor Alerts
            </Typography>
            <Chip size="small" label={`${sampleAlerts.length} Sample`} color="warning" sx={{ height: 20, fontSize: 10 }} />
          </Stack>
        </Box>
        <List disablePadding>
          {sampleAlerts.map((alert, idx) => {
            const Icon =
              alert.severity === 'error' ? OctagonAlert : alert.severity === 'warning' ? AlertTriangle : Info
            const color =
              alert.severity === 'error' ? '#DC2626' : alert.severity === 'warning' ? '#D97706' : '#1565C0'
            return (
              <Box key={alert.id}>
                <ListItemButton
                  onClick={() => {
                    setAlertAnchor(null)
                    navigate(`/machines/${alert.machineId}`)
                  }}
                  sx={{ py: 1.25, px: 2, alignItems: 'flex-start' }}
                >
                  <ListItemIcon sx={{ minWidth: 32, mt: 0.3, color }}>
                    <Icon size={17} />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
                        <Typography variant="body2" fontWeight={700} color="#F8FAFC">
                          {alert.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>
                          {alert.time}
                        </Typography>
                      </Stack>
                    }
                    secondary={
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                        {alert.detail}
                      </Typography>
                    }
                  />
                </ListItemButton>
                {idx < sampleAlerts.length - 1 && <Divider />}
              </Box>
            )
          })}
        </List>
      </Popover>

      {/* User Menu */}
      <Menu
        anchorEl={userAnchor}
        open={Boolean(userAnchor)}
        onClose={() => setUserAnchor(null)}
        PaperProps={{ sx: { minWidth: 190, mt: 0.75, borderRadius: 2 } }}
      >
        <MenuItem
          onClick={() => {
            setUserAnchor(null)
            navigate('/settings')
          }}
          sx={{ fontSize: 13.5 }}
        >
          <ListItemIcon>
            <Settings size={16} />
          </ListItemIcon>
          Settings
        </MenuItem>
        <MenuItem
          onClick={() => {
            setUserAnchor(null)
            resetDemoData()
            navigate('/dashboard')
          }}
          sx={{ fontSize: 13.5 }}
        >
          <ListItemIcon>
            <RotateCcw size={16} />
          </ListItemIcon>
          Reset Demo Data
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            setUserAnchor(null)
            signOut()
            navigate('/signin')
          }}
          sx={{ fontSize: 13.5, color: 'error.main' }}
        >
          <ListItemIcon sx={{ color: 'error.main' }}>
            <LogOut size={16} />
          </ListItemIcon>
          Sign out
        </MenuItem>
      </Menu>
    </>
  )
}
