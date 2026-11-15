import { Box, Tab, Tabs } from '@mui/material'
import { Activity, FileBarChart, Sliders } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

export function MachineSubTabs({ machineId }: { machineId: string }) {
  const location = useLocation()
  const navigate = useNavigate()

  const activeTab = location.pathname.includes('/process')
    ? 'process'
    : location.pathname.includes('/report')
    ? 'report'
    : 'overview'

  return (
    <Box
      sx={{
        bgcolor: '#14181D',
        borderRadius: 3,
        p: 0.75,
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <Tabs
        value={activeTab}
        variant="scrollable"
        scrollButtons="auto"
        onChange={(_, next) => {
          if (next === 'overview') navigate(`/machines/${machineId}`)
          else if (next === 'process') navigate(`/machines/${machineId}/process`)
          else navigate(`/machines/${machineId}/report`)
        }}
        TabIndicatorProps={{ style: { display: 'none' } }}
        sx={{
          minHeight: 46,
          '& .MuiTabs-flexContainer': { gap: 0.75 },
          '& .MuiTab-root': {
            minHeight: 44,
            textTransform: 'none',
            fontWeight: 700,
            fontSize: 14,
            px: 2.25,
            py: 1,
            borderRadius: 2,
            color: '#94A3B8',
            transition: 'all .18s ease',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.05)',
              color: '#F8FAFC',
            },
            '&.Mui-selected': {
              bgcolor: '#3B82F6',
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(59,130,246,.3)',
            },
          },
        }}
      >
        <Tab value="overview" icon={<Activity size={16} />} iconPosition="start" label="Operational Overview" />
        <Tab value="process" icon={<Sliders size={16} />} iconPosition="start" label="Process & Tool Magazine" />
        <Tab value="report" icon={<FileBarChart size={16} />} iconPosition="start" label="Score & Cost Report" />
      </Tabs>
    </Box>
  )
}
