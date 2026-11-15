import { useState } from 'react'
import { AppBar, Box } from '@mui/material'
import { Outlet } from 'react-router-dom'
import { SideNav, navWidth } from '../components/nav/SideNav'
import { TopBar } from '../components/nav/TopBar'

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <Box sx={{ bgcolor: '#0B0E14', minHeight: '100vh' }}>
      <AppBar position="fixed" color="inherit" sx={{ bgcolor: '#14181D' }}>
        <TopBar onMenu={() => setMobileOpen(true)} />
      </AppBar>
      <SideNav mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <Box
        component="main"
        sx={{
          mt: '64px',
          ml: { lg: `${navWidth}px` },
          minHeight: 'calc(100vh - 64px)',
          p: { xs: 2, md: 3 },
        }}
      >
        <Outlet />
      </Box>
    </Box>
  )
}
