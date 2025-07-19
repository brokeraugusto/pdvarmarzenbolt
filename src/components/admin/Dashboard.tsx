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
  PieChart,
  Clock,
  User,
  CreditCard,
  AlertTriangle
} from 'lucide-react'
import { orderService } from '../../services/orderService'
import { productService } from '../../services/productService'
import { expenseService } from '../../services/expenseService'
import { cashFlowService } from '../../services/cashFlowService'
import { CashFlowData, Order } from '../../types'

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
  const [recentOrders, setRecentOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadDashboardData()
    
    // Auto-refresh a cada 30 segundos
    const interval = setInterval(() => {
      refreshRecentData()
    }, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
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
        topProductsData,
        allOrders
      ] = await Promise.all([
        orderService.getTotalSales(),
        orderService.getOrdersCount(),
        orderService.getAverageTicket(),
        productService.getAllProducts(),
        productService.getAverageMargin(),
        expenseService.getTotalExpenses(startOfMonth, endOfMonth),
        cashFlowService.getMonthlyComparison(),
        cashFlowService.getTopSellingProducts(5),
        orderService.getAllOrders()
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
      
      // Pegar os 5 pedidos mais recentes
      setRecentOrders(allOrders.slice(0, 5))
      
    } catch (error: any) {
      console.error('Error loading dashboard data:', error)
      
      // Mostrar erro específico para o usuário
      const errorMessage = error?.message || 'Erro desconhecido ao carregar dados'
      
      // Se for erro de conexão com Supabase, mostrar mensagem específica
      if (errorMessage.includes('Supabase não está configurado')) {
        setError('Banco de dados não configurado. Acesse Configurações → Banco de Dados para configurar.')
      } else if (errorMessage.includes('Failed to fetch')) {
        setError('Erro de conexão com o banco de dados. Verifique sua conexão e configurações do Supabase.')
      } else {
        setError(errorMessage)
      }
    } finally {
      setLoading(false)
    }
  }

  const [error, setError] = useState<string>('')

  const refreshRecentData = async () => {
    setRefreshing(true)
    try {
      const allOrders = await orderService.getAllOrders()
      setRecentOrders(allOrders.slice(0, 5))
    } catch (error) {
      console.error('Error refreshing recent data:', error)
      // Don't show error for refresh failures, just log them
      // The main error handling is in loadDashboardData
    } finally {
      setRefreshing(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Agora'
    if (diffMins < 60) return `${diffMins}min atrás`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h atrás`
    
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays === 1) return 'Ontem'
    if (diffDays < 7) return `${diffDays} dias atrás`
    
    return date.toLocaleDateString('pt-BR')
  }

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'pix':
        return '💳'
      case 'credit':
        return '💳'
      case 'debit':
        return '💳'
      default:
        return '💰'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-100'
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      case 'rejected':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprovado'
      case 'pending':
        return 'Pendente'
      case 'rejected':
        return 'Rejeitado'
      default:
        return status
    }
  }

  const StatCard: React.FC<{
    title: string
    value: string | number
    icon: React.ReactNode
    growth?: number
    color: string
    subtitle?: string
  }> = ({ title, value, icon, growth, color, subtitle }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
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
        <p className="ml-4 text-gray-600">Carregando dados do dashboard...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-red-800">Erro ao Carregar Dashboard</h3>
              <p className="text-red-600 text-sm mt-1">{error}</p>
            </div>
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => {
                setError('')
                loadDashboardData()
              }}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            >
              Tentar Novamente
            </button>
            <button
              onClick={() => window.location.href = '/admin#settings'}
              className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            >
              Ir para Configurações
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">Visão geral do sistema</p>
        </div>
        <button
          onClick={refreshRecentData}
          disabled={refreshing}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
        >
          <Clock className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? 'Atualizando...' : 'Atualizar'}</span>
        </button>
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
        {/* Vendas Recentes - DADOS REAIS */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Vendas Recentes</h3>
            <div className="flex items-center space-x-2">
              {refreshing && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              )}
              <span className="text-xs text-gray-500">Atualização automática</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {recentOrders.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Nenhuma venda recente</p>
              </div>
            ) : (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 rounded-lg px-2 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getStatusColor(order.payment_status)}`}>
                      <span className="text-lg">{getPaymentMethodIcon(order.payment_method)}</span>
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium text-gray-900">#{order.id.slice(-8)}</p>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.payment_status)}`}>
                          {getStatusLabel(order.payment_status)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        {order.customer ? (
                          <div className="flex items-center space-x-1">
                            <User className="h-3 w-3" />
                            <span>{order.customer.name}</span>
                          </div>
                        ) : (
                          <span>Cliente não identificado</span>
                        )}
                        <span>•</span>
                        <span>{formatDate(order.created_at)}</span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {order.items.length} item{order.items.length > 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(order.total)}
                    </p>
                    {order.discount > 0 && (
                      <p className="text-xs text-green-600">
                        -{formatCurrency(order.discount)}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Produtos Mais Vendidos */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Produtos Mais Vendidos</h3>
          <div className="space-y-4">
            {topProducts.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Nenhum produto vendido ainda</p>
              </div>
            ) : (
              topProducts.slice(0, 5).map((item, index) => (
                <div key={item.product.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                  <div className="flex items-center space-x-3">
                    <span className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    <div className="flex items-center space-x-3">
                      {item.product.image && (
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{item.product.name}</p>
                        <p className="text-xs text-gray-500">{item.quantity_sold} vendidos</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600 text-sm">{formatCurrency(item.revenue)}</p>
                    <p className="text-xs text-gray-500">Lucro: {formatCurrency(item.profit)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}