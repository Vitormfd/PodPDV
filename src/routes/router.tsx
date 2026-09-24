import { createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { PdvPage } from '@/pages/PdvPage'
import { ProductsPage } from '@/pages/ProductsPage'
import { StockMovementsPage } from '@/pages/StockMovementsPage'
import { CustomersPage } from '@/pages/CustomersPage'
import { CustomerDetailPage } from '@/pages/CustomerDetailPage'
import { FiadoPage } from '@/pages/FiadoPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <DashboardPage /> },
          { path: '/pdv', element: <PdvPage /> },
          { path: '/produtos', element: <ProductsPage /> },
          { path: '/estoque', element: <StockMovementsPage /> },
          { path: '/clientes', element: <CustomersPage /> },
          { path: '/clientes/:id', element: <CustomerDetailPage /> },
          { path: '/fiado', element: <FiadoPage /> },
          { path: '/relatorios', element: <ReportsPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
])
