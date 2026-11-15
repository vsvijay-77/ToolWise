import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { CssBaseline, ThemeProvider } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { SelectionProvider } from './context/SelectionContext'
import { theme } from './theme'

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode><ThemeProvider theme={theme}><CssBaseline/><QueryClientProvider client={queryClient}><BrowserRouter><AuthProvider><SelectionProvider><App/></SelectionProvider></AuthProvider></BrowserRouter></QueryClientProvider></ThemeProvider></StrictMode>,
)
