import React, { useState, useEffect } from 'react'
import { Calendar, Download, TrendingUp, DollarSign, ShoppingCart, Users } from 'lucide-react'
import { orderService } from '../../services/orderService'

interface ReportData {
  totalSales: number
  totalOrders: number
  averageTicket: number
  approvedOrders: number
  pendingOrders: number
  rejectedOrders: number
}

export const ReportsManager: React.FC = () => {
  const [reportData, setReportData] = useState<ReportData>({
    totalSales: 0,
    totalOrders: 0,
    averageTicket: 0,
    approvedOrders: 0,
    pendingOrders: 0,
    rejectedOrders: 0
  })
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    // Set default dates (last 30 days)
    const end = new Date()
    const start = new Date()
    start.setDate(start.getDate() - 30)
    
    setStartDate(start.toISOString().split('T')[0])
    setEndDate(end.toISOString().split('T')[0])
    
    loadReportData()
  }, [])

  const loadReportData = async () => {
    setLoading(true)
    try {
      const [
        totalSales,
        totalOrders,
        averageTicket,
        approvedOrders,
        pendingOrders,
        rejectedOrders
      ] = await Promise.all([
        orderService.getTotalSales(startDate, endDate),
        orderService.getOrdersCount(),
        orderService.getAverageTicket(),
        orderService.getOrdersCount('approved'),
        orderService.getOrdersCount('pending'),
        orderService.getOrdersCount('rejected')
      ])

      setReportData({
        totalSales,
        totalOrders,
        averageTicket,
        approvedOrders,
        pendingOrders,
        rejectedOrders
      })
    } catch (error) {
      console.error('Error loading report data:', error)
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

  const generateReport = async () => {
    try {
      const orders = await orderService.getOrdersByDateRange(startDate, endDate)
      
      let reportContent = `RELATÓRIO DE VENDAS\n`
      reportContent += `Período: ${new Date(startDate).toLocaleDateString('pt-BR')} a ${new Date(endDate).toLocaleDateString('pt-BR')}\n`
      reportContent += `Gerado em: ${new Date().toLocaleString('pt-BR')}\n\n`
      
      reportContent += `RESUMO:\n`
      reportContent += `Total de Vendas: ${formatCurrency(reportData.totalSales)}\n`
      reportContent += `Total de Pedidos: ${reportData.totalOrders}\n`
      reportContent += `Ticket Médio: ${formatCurrency(reportData.averageTicket)}\n`
      reportContent += `Pedidos Aprovados: ${reportData.approvedOrders}\n`
      reportContent += `Pedidos Pendentes: ${reportData.pendingOrders}\n`
      reportContent += `Pedidos Rejeitados: ${reportData.rejectedOrders}\n\n`
      
      reportContent += `DETALHAMENTO DOS PEDIDOS:\n`
      orders.forEach(order => {
        reportContent += `\nPedido: ${order.id}\n`
        reportContent += `Data: ${new Date(order.created_at).toLocaleString('pt-BR')}\n`
        reportContent += `Cliente: ${order.customer?.name || 'Não identificado'}\n`
        reportContent += `Total: ${formatCurrency(order.total)}\n`
        reportContent += `Status: ${order.payment_status}\n`
        reportContent += `Forma de Pagamento: ${order.payment_method}\n`
        reportContent += `Itens:\n`
        order.items.forEach(item => {
          reportContent += `  - ${item.product.name} (${item.quantity}x) = ${formatCurrency(item.product.price * item.quantity)}\n`
        })
      })

      const blob = new Blob([reportContent], { type: 'text/plain' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `relatorio-vendas-${startDate}-${endDate}.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error generating report:', error)
    }
  }

  const StatCard: React.FC<{
    title: string
    value: string | number
    icon: React.ReactNode
    color: string
  }> = ({ title, value, icon, color }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-1">Análise de vendas e performance</p>
        </div>
        <button
          onClick={generateReport}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          <span>Exportar Relatório</span>
        </button>
      </div>

      {/* Date Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Período:</span>
          </div>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <span className="text-gray-500">até</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={loadReportData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Atualizar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <StatCard
              title="Vendas Totais"
              value={formatCurrency(reportData.totalSales)}
              icon={<DollarSign className="h-6 w-6 text-green-600" />}
              color="bg-green-100"
            />
            
            <StatCard
              title="Total de Pedidos"
              value={reportData.totalOrders}
              icon={<ShoppingCart className="h-6 w-6 text-blue-600" />}
              color="bg-blue-100"
            />
            
            <StatCard
              title="Ticket Médio"
              value={formatCurrency(reportData.averageTicket)}
              icon={<TrendingUp className="h-6 w-6 text-purple-600" />}
              color="bg-purple-100"
            />
          </div>

          {/* Status Breakdown */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status dos Pedidos</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-600">{reportData.approvedOrders}</p>
                <p className="text-sm text-green-700">Aprovados</p>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <p className="text-2xl font-bold text-yellow-600">{reportData.pendingOrders}</p>
                <p className="text-sm text-yellow-700">Pendentes</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-600">{reportData.rejectedOrders}</p>
                <p className="text-sm text-red-700">Rejeitados</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}