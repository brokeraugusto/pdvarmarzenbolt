import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, Receipt, Calendar } from 'lucide-react'
import { Expense } from '../../types'
import { expenseService } from '../../services/expenseService'
import { ExpenseModal } from './ExpenseModal'

export const ExpensesManager: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

  useEffect(() => {
    loadExpenses()
  }, [])

  const loadExpenses = async () => {
    try {
      const data = await expenseService.getAllExpenses()
      setExpenses(data)
    } catch (error) {
      console.error('Error loading expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || expense.category === selectedCategory
    const matchesMonth = !selectedMonth || expense.date.startsWith(selectedMonth)
    return matchesSearch && matchesCategory && matchesMonth
  })

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense)
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingExpense(null)
    setShowModal(true)
  }

  const handleDelete = async (expense: Expense) => {
    if (window.confirm(`Tem certeza que deseja excluir "${expense.description}"?`)) {
      try {
        await expenseService.deleteExpense(expense.id)
        loadExpenses()
      } catch (error) {
        console.error('Error deleting expense:', error)
        alert('Erro ao excluir despesa')
      }
    }
  }

  const handleModalSave = () => {
    loadExpenses()
  }

  const getTotalExpenses = () => {
    return filteredExpenses.reduce((total, expense) => total + expense.amount, 0)
  }

  const getCategoryBadgeColor = (category: string) => {
    const colors = {
      operational: 'bg-blue-100 text-blue-800',
      administrative: 'bg-purple-100 text-purple-800',
      marketing: 'bg-green-100 text-green-800',
      maintenance: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Despesas</h1>
          <p className="text-gray-600 mt-1">Controle financeiro de despesas</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Despesa</span>
        </button>
      </div>

      {/* Summary Card */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-red-100">Total de Despesas (Filtradas)</p>
            <p className="text-3xl font-bold">{formatPrice(getTotalExpenses())}</p>
          </div>
          <Receipt className="h-12 w-12 text-red-200" />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar despesas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
          >
            <option value="">Todas as categorias</option>
            <option value="operational">Operacional</option>
            <option value="administrative">Administrativo</option>
            <option value="marketing">Marketing</option>
            <option value="maintenance">Manutenção</option>
            <option value="other">Outros</option>
          </select>

          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Descrição</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Categoria</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Valor</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Data</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Pagamento</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div>
                      <p className="font-medium text-gray-900">{expense.description}</p>
                      {expense.notes && (
                        <p className="text-sm text-gray-500">{expense.notes}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryBadgeColor(expense.category)}`}>
                      {expenseService.getCategoryLabel(expense.category)}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-medium text-gray-900">
                    {formatPrice(expense.amount)}
                  </td>
                  <td className="py-4 px-6 text-gray-900">
                    {formatDate(expense.date)}
                  </td>
                  <td className="py-4 px-6 text-gray-900">
                    {expenseService.getPaymentMethodLabel(expense.payment_method)}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(expense)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredExpenses.length === 0 && (
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma despesa encontrada</p>
          </div>
        )}
      </div>

      <ExpenseModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        expense={editingExpense}
        onSave={handleModalSave}
      />
    </div>
  )
}