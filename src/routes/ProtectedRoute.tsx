import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { LoadingState } from '@/components/ui/LoadingState'
import { CashRegisterProvider } from '@/contexts/CashRegisterContext'

export function ProtectedRoute() {
  const { session, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-ink-950">
        <LoadingState label="Carregando sessão..." />
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  return (
    <CashRegisterProvider>
      <Outlet />
    </CashRegisterProvider>
  )
}
