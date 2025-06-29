import React, { useEffect, useState } from 'react'
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Package,
  TrendingUp,
  TrendingDown,
  Receipt,
  Calculator,
  PieChart
} from 'lucide-react'
import { orderService } from '../../services/orderService'
import { productService } from '../../services/productService'
import { expenseService } from '../../services/expenseService'
import { cashFlowService } from '../../services/cashFlowService'
import { CashFlowData } from '../../types'

interface DashboardStats {
  totalSales: number
  totalOrders: number
  totalProducts: number
  averageTicket: number
  averageMargin: number
  totalExpenses: number
  netProfit: number
  salesGrowth: number
  ordersGrowth: number
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalOrders: 0,
    totalProducts: 0,
    averageTicket: 0,
    averageMargin: 0,
    totalExpenses: 0,
    netProfit: 0,
    salesGrowth: 0,
    ordersGrowth: 0
  })
  const [cashFlow, setCashFlow] = useState<CashFlowData | null>(null)
  const [topProducts, setTopProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      // Get current month dates
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]

      const [
        totalSales,
        totalOrders,
        averageTicket,
        products,
        averageMargin,
        totalExpenses,
        monthlyComparison,
        topProductsData
      ] = await Promise.all([
        orderService.getTotalSales(),
        orderService.getOrdersCount(),
        orderService.getAverageTicket(),
        productService.getAllProducts(),
        productService.getAverageMargin(),
        expenseService.getTotalExpenses(startOfMonth, endOfMonth),
        cashFlowService.getMonthlyComparison(),
        cashFlowService.getTopSellingProducts(5)
      ])

      const netProfit = monthlyComparison.current.net_profit

      setStats({
        totalSales,
        totalOrders,
        totalProducts: products.length,
        averageTicket,
        averageMargin,
        totalExpenses,
        netProfit,
        salesGrowth: monthlyComparison.growth.revenue,
        ordersGrowth: 8.3 // Mock data
      })

      setCashFlow(monthlyComparison.current)
      setTopProducts(topProductsData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const StatCard: React.FC<{
    title: string
    value: string | number
    icon: React.ReactNode
    growth?: number
    color: string
    subtitle?: string
  }> = ({ title, value, icon, growth, color, subtitle }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
          {growth !== undefined && (
            <div className="flex items-center mt-2">
              {growth >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${
                growth >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {Math.abs(growth).toFixed(1)}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs mês anterior</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Visão geral do sistema</p>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Vendas Totais"
          value={formatCurrency(stats.totalSales)}
          icon={<DollarSign className="h-6 w-6 text-green-600" />}
          growth={stats.salesGrowth}
          color="bg-green-100"
        />
        
        <StatCard
          title="Pedidos"
          value={stats.totalOrders}
          icon={<ShoppingCart className="h-6 w-6 text-blue-600" />}
          growth={stats.ordersGrowth}
          color="bg-blue-100"
        />
        
        <StatCard
          title="Ticket Médio"
          value={formatCurrency(stats.averageTicket)}
          icon={<Calculator className="h-6 w-6 text-purple-600" />}
          color="bg-purple-100"
        />
        
        <StatCard
          title="Produtos"
          value={stats.totalProducts}
          icon={<Package className="h-6 w-6 text-orange-600" />}
          color="bg-orange-100"
        />
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <StatCard
          title="Margem Média"
          value={`${stats.averageMargin.toFixed(1)}%`}
          icon={<TrendingUp className="h-6 w-6 text-green-600" />}
          color="bg-green-100"
          subtitle="Margem de lucro dos produtos"
        />
        
        <StatCard
          title="Despesas do Mês"
          value={formatCurrency(stats.totalExpenses)}
          icon={<Receipt className="h-6 w-6 text-red-600" />}
          color="bg-red-100"
        />
        
        <StatCard
          title="Lucro Líquido"
          value={formatCurrency(stats.netProfit)}
          icon={<PieChart className="h-6 w-6 text-indigo-600" />}
          color="bg-indigo-100"
          subtitle="Receita - Custos - Despesas - Taxas"
        />
      </div>

      {/* Cash Flow Breakdown */}
      {cashFlow && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Fluxo de Caixa - Mês Atual</h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">{formatCurrency(cashFlow.revenue)}</p>
              <p className="text-sm text-green-700">Receita</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(cashFlow.costs)}</p>
              <p className="text-sm text-blue-700">Custos</p>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <p className="text-2xl font-bold text-red-600">{formatCurrency(cashFlow.expenses)}</p>
              <p className="text-sm text-red-700">Despesas</p>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(cashFlow.fees)}</p>
              <p className="text-sm text-yellow-700">Taxas</p>
            </div>
            <div className="text-center p-4 bg-indigo-50 rounded-lg">
              <p className="text-2xl font-bold text-indigo-600">{formatCurrency(cashFlow.net_profit)}</p>
              <p className="text-sm text-indigo-700">Lucro Líquido</p>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Margem de Lucro: <span className="font-medium">{cashFlow.margin_percentage.toFixed(1)}%</span>
            </p>
          </div>
        </div>
      )}

      {/* Recent Activity and Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Vendas Recentes</h3>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div>
                  <p className="font-medium text-gray-900">Pedido #{1000 + i}</p>
                  <p className="text-sm text-gray-500">Há {i} hora{i > 1 ? 's' : ''}</p>
                </div>
                <span className="font-semibold text-green-600">
                  {formatCurrency(25.50 * i)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Produtos Mais Vendidos</h3>
          <div className="space-y-4">
            {topProducts.slice(0, 3).map((item, index) => (
              <div key={item.product.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center space-x-3">
                  <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">{item.product.name}</p>
                    <p className="text-sm text-gray-500">{item.quantity_sold} vendidos</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">{formatCurrency(item.revenue)}</p>
                  <p className="text-sm text-gray-500">Lucro: {formatCurrency(item.profit)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}