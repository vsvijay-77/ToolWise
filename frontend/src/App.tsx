import { lazy, Suspense } from 'react'
import { Box, CircularProgress } from '@mui/material'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AppLayout from './layouts/AppLayout'
import PublicLayout from './layouts/PublicLayout'

const AiAssistance = lazy(() => import('./pages/AiAssistance'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const EdgeGatewayAi = lazy(() => import('./pages/EdgeGatewayAi'))
const Factory = lazy(() => import('./pages/Factory'))
const Home = lazy(() => import('./pages/Home'))
const MachineDetail = lazy(() => import('./pages/MachineDetail'))
const Materials = lazy(() => import('./pages/Materials'))
const Process = lazy(() => import('./pages/Process'))
const Report = lazy(() => import('./pages/Report'))
const Settings = lazy(() => import('./pages/Settings'))
const SignIn = lazy(() => import('./pages/SignIn'))

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  return isAuthenticated ? <>{children}</> : <Navigate to="/signin" replace state={{ from: location.pathname }} />
}

function RootRoute() {
  return <Home />
}

const Loading = () => (
  <Box sx={{ minHeight: '55vh', display: 'grid', placeItems: 'center' }}>
    <CircularProgress />
  </Box>
)

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<RootRoute />} />
          <Route path="/signin" element={<SignIn />} />
        </Route>
        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/factory" element={<Factory />} />
          <Route path="/machines/:id" element={<MachineDetail />} />
          <Route path="/machines/:id/process" element={<Process />} />
          <Route path="/machines/:id/report" element={<Report />} />
          <Route path="/materials" element={<Materials />} />
          <Route path="/ai-assistance" element={<AiAssistance />} />
          <Route path="/edge-gateway" element={<EdgeGatewayAi />} />
          <Route path="/edge-ai" element={<Navigate to="/edge-gateway" replace />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}
