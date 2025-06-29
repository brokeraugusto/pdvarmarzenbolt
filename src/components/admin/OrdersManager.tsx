import React, { useState, useEffect } from 'react'
import { Search, Eye, Download, ShoppingCart } from 'lucide-react'
import { orderService } from '../../services/orderService'
import { Order } from '../../types'

export const OrdersManager: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('')

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const allOrders = await orderService.getAllOrders()
      setOrders(allOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer?.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = !selectedStatus || order.payment_status === selectedStatus
    return matchesSearch && matchesStatus
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  const getStatusBadgeColor = (status: string) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const getStatusLabel = (status: string) => {
    const labels = {
      pending: 'Pendente',
      approved: 'Aprovado',
      rejected: 'Rejeitado'
    }
    return labels[status as keyof typeof labels] || status
  }

  const getPaymentMethodLabel = (method: string) => {
    const labels = {
      pix: 'PIX',
      credit: 'Cartão de Crédito',
      debit: 'Cartão de Débito'
    }
    return labels[method as keyof typeof labels] || method
  }

  const handleDownloadReceipt = (order: Order) => {
    const receipt = orderService.generateReceipt(order)
    const blob = new Blob([receipt], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `recibo-${order.id}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

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
        <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
        <p className="text-gray-600 mt-1">Acompanhe todos os pedidos realizados</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por ID ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Todos os status</option>
            <option value="pending">Pendente</option>
            <option value="approved">Aprovado</option>
            <option value="rejected">Rejeitado</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Pedido</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Cliente</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Itens</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Total</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Pagamento</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Data</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div className="font-medium text-gray-900">{order.id}</div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-gray-900">
                      {order.customer?.name || 'Cliente não identificado'}
                    </div>
                    {order.customer?.phone && (
                      <div className="text-sm text-gray-500">{order.customer.phone}</div>
                    )}
                  </td>
                  <td className="py-4 px-6 text-gray-900">
                    {order.items.length} item{order.items.length > 1 ? 's' : ''}
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-medium text-gray-900">{formatCurrency(order.total)}</div>
                    {order.discount > 0 && (
                      <div className="text-sm text-green-600">
                        Desconto: {formatCurrency(order.discount)}
                      </div>
                    )}
                  </td>
                  <td className="py-4 px-6 text-gray-900">
                    {getPaymentMethodLabel(order.payment_method)}
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeColor(order.payment_status)}`}>
                      {getStatusLabel(order.payment_status)}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-gray-900">
                    {formatDate(order.created_at)}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDownloadReceipt(order)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum pedido encontrado</p>
          </div>
        )}
      </div>
    </div>
  )
}