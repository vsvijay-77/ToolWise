import { createContext, useContext, useMemo, useState, type PropsWithChildren } from 'react'

type AuthValue = { isAuthenticated: boolean; signIn: (email: string, password: string) => Promise<boolean>; signOut: () => void }
const AuthContext = createContext<AuthValue | undefined>(undefined)
const demoEmails = ['demo@toolwise.io', 'demo@tooltwin.io']
const demoPassword = 'Demo@1234'

export function AuthProvider({ children }: PropsWithChildren) {
  const [isAuthenticated, setAuthenticated] = useState(() => Boolean(localStorage.getItem('tooltwin_token')))
  const value = useMemo<AuthValue>(() => ({
    isAuthenticated,
    signIn: async (email, password) => {
      await new Promise(resolve => window.setTimeout(resolve, 650))
      const accepted = demoEmails.includes(email.trim().toLowerCase()) && password === demoPassword
      if (accepted) { localStorage.setItem('tooltwin_token', 'demo-toolwise-session'); setAuthenticated(true) }
      return accepted
    },
    signOut: () => { localStorage.removeItem('tooltwin_token'); setAuthenticated(false) },
  }), [isAuthenticated])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
