import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  ArrowLeftRight,
  Users,
  HandCoins,
  Wallet,
  BarChart3,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  mobilePrimary?: boolean
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Vendas',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard, mobilePrimary: true },
      { to: '/pdv', label: 'PDV', icon: ShoppingCart, mobilePrimary: true },
      { to: '/caixa', label: 'Caixa', icon: Wallet },
    ],
  },
  {
    label: 'Gestão',
    items: [
      { to: '/produtos', label: 'Produtos', icon: Package, mobilePrimary: true },
      { to: '/estoque', label: 'Movimentações de estoque', icon: ArrowLeftRight },
      { to: '/clientes', label: 'Clientes', icon: Users },
      { to: '/fiado', label: 'Fiado', icon: HandCoins, mobilePrimary: true },
      { to: '/relatorios', label: 'Relatórios', icon: BarChart3 },
    ],
  },
]

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items)
