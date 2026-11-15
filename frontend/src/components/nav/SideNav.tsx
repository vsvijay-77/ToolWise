import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from '@mui/material'
import { Bot, Boxes, Cpu, Factory, LayoutGrid, Server, Settings } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useSelection } from '../../context/SelectionContext'
import { Brand } from './TopBar'

const width = 228

export function SideNav({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { machineId } = useSelection()

  const primaryLinks = [
    {
      label: 'Dashboard',
      icon: LayoutGrid,
      path: '/dashboard',
      isActive: (pathname: string) => pathname === '/dashboard',
    },
    {
      label: '3D Factory',
      icon: Factory,
      path: '/factory',
      isActive: (pathname: string) => pathname === '/factory',
    },
    {
      label: 'Machine Monitor',
      icon: Cpu,
      path: `/machines/${machineId}`,
      isActive: (pathname: string) => pathname.startsWith('/machines/'),
    },
    {
      label: 'Materials',
      icon: Boxes,
      path: '/materials',
      isActive: (pathname: string) => pathname === '/materials',
    },
    {
      label: 'AI Assistance',
      icon: Bot,
      path: '/ai-assistance',
      isActive: (pathname: string) => pathname === '/ai-assistance',
    },
    {
      label: 'Edge Gateway',
      icon: Server,
      path: '/edge-gateway',
      isActive: (pathname: string) => pathname === '/edge-gateway' || pathname === '/edge-ai',
    },
    {
      label: 'Settings',
      icon: Settings,
      path: '/settings',
      isActive: (pathname: string) => pathname === '/settings',
    },
  ]

  const renderItem = ({
    label,
    icon: Icon,
    path,
    isActive,
  }: {
    label: string
    icon: typeof LayoutGrid
    path: string
    isActive: (pathname: string) => boolean
  }) => {
    const active = isActive(location.pathname)
    return (
      <ListItemButton
        key={label}
        selected={active}
        onClick={() => {
          navigate(path)
          onClose()
        }}
        sx={{
          mb: 0.5,
          borderRadius: 2,
          py: 1,
          px: 1.5,
          color: active ? '#1565C0' : '#475569',
          '&.Mui-selected': {
            bgcolor: 'rgba(59,130,246,.14)',
            color: '#60A5FA',
            '&:hover': { bgcolor: 'rgba(59,130,246,.2)' },
            '& .MuiListItemIcon-root': { color: '#60A5FA' },
          },
          '&:hover': { bgcolor: 'rgba(255,255,255,0.04)', color: '#F8FAFC' },
        }}
      >
        <ListItemIcon sx={{ minWidth: 34, color: active ? '#60A5FA' : '#94A3B8' }}>
          <Icon size={18} />
        </ListItemIcon>
        <ListItemText
          primary={label}
          primaryTypographyProps={{
            fontSize: 13.5,
            fontWeight: active ? 700 : 600,
            color: active ? '#60A5FA' : '#CBD5E1',
          }}
        />
      </ListItemButton>
    )
  }

  const content = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#14181D' }}>
      <Toolbar sx={{ minHeight: '64px !important', px: 2.5, display: { lg: 'none' }, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <Brand />
      </Toolbar>
      <Box sx={{ px: 2, pt: 2, pb: 0.75 }}>
        <Typography variant="caption" sx={{ fontSize: 10, fontWeight: 800, letterSpacing: '.08em', color: '#64748B' }}>
          WORKSPACE
        </Typography>
      </Box>
      <List sx={{ px: 1.25, py: 0.5 }}>{primaryLinks.map(renderItem)}</List>
    </Box>
  )

  return (
    <>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', lg: 'block' },
          width,
          '& .MuiDrawer-paper': {
            width,
            top: 64,
            height: 'calc(100% - 64px)',
            border: 0,
            borderRight: '1px solid rgba(255,255,255,0.08)',
            boxShadow: 'none',
            bgcolor: '#14181D',
          },
        }}
        open
      >
        {content}
      </Drawer>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { lg: 'none' }, '& .MuiDrawer-paper': { width, bgcolor: '#14181D' } }}
      >
        {content}
      </Drawer>
    </>
  )
}

export const navWidth = width
