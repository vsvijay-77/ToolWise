import { alpha, createTheme } from '@mui/material/styles'

declare module '@mui/material/styles' {
  interface Theme {
    shadowsSoft: { card: string; floating: string }
  }
  interface ThemeOptions {
    shadowsSoft?: { card: string; floating: string }
  }
}

const headingFont = '"Plus Jakarta Sans", "Inter", Roboto, Arial, sans-serif'
const bodyFont = '"Inter", Roboto, Arial, sans-serif'

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#3B82F6', dark: '#1D4ED8', light: '#60A5FA' },
    secondary: { main: '#14B8A6', dark: '#0D9488', light: '#5EEAD4' },
    success: { main: '#22C55E' },
    warning: { main: '#F59E0B' },
    error: { main: '#EF4444' },
    background: { default: '#0B0E14', paper: '#14181D' },
    text: { primary: '#F8FAFC', secondary: '#94A3B8' },
    divider: 'rgba(255, 255, 255, 0.08)',
  },
  typography: {
    fontFamily: bodyFont,
    h1: { fontFamily: headingFont, fontWeight: 800, letterSpacing: '-0.04em' },
    h2: { fontFamily: headingFont, fontWeight: 800, letterSpacing: '-0.032em' },
    h3: { fontFamily: headingFont, fontWeight: 700, letterSpacing: '-0.025em' },
    h4: { fontFamily: headingFont, fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontFamily: headingFont, fontWeight: 700, letterSpacing: '-0.015em' },
    h6: { fontFamily: headingFont, fontWeight: 700, letterSpacing: '-0.01em' },
    subtitle1: { fontFamily: headingFont, fontWeight: 700 },
    subtitle2: { fontFamily: headingFont, fontWeight: 700, letterSpacing: '-0.005em' },
    overline: { fontFamily: headingFont, fontWeight: 800, letterSpacing: '0.1em' },
    body1: { fontWeight: 400 },
  },
  shape: { borderRadius: 12 },
  shadowsSoft: {
    card: '0 1px 3px rgba(0, 0, 0, 0.3)',
    floating: '0 8px 24px rgba(0, 0, 0, 0.45)',
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        ':root, html': {
          colorScheme: 'dark only',
          backgroundColor: '#0B0E14',
          color: '#F8FAFC',
        },
        body: {
          minWidth: 320,
          backgroundColor: '#0B0E14',
          color: '#F8FAFC',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        '*': { boxSizing: 'border-box' },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          backgroundImage: 'none',
          backgroundColor: '#14181D',
          color: '#F8FAFC',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#14181D',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#14181D',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
        },
      },
    },
    MuiButton: { styleOverrides: { root: { fontFamily: headingFont, textTransform: 'none', fontWeight: 700, borderRadius: 10, boxShadow: 'none' } } },
    MuiChip: { styleOverrides: { root: { fontFamily: headingFont, borderRadius: 8, fontWeight: 700 } } },
    MuiTooltip: { styleOverrides: { tooltip: { fontSize: 12 } } },
  },
})

export const panelSx = {
  borderRadius: 3,
  boxShadow: theme.shadowsSoft.card,
  borderColor: 'divider',
}

export const activeNavSx = { bgcolor: alpha(theme.palette.primary.main, 0.1), color: 'primary.main' }
