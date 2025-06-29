import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, FolderOpen } from 'lucide-react'
import { Category } from '../../types'
import { productService } from '../../services/productService'
import { CategoryModal } from './CategoryModal'

export const CategoriesManager: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const data = await productService.getAllCategories()
      setCategories(data.sort((a, b) => a.order - b.order))
    } catch (error) {
      console.error('Error loading categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditingCategory(null)
    setShowModal(true)
  }

  const handleDelete = async (category: Category) => {
    if (window.confirm(`Tem certeza que deseja excluir "${category.name}"?`)) {
      try {
        await productService.deleteCategory(category.id)
        loadCategories()
      } catch (error: any) {
        console.error('Error deleting category:', error)
        alert(error.message || 'Erro ao excluir categoria')
      }
    }
  }

  const handleModalSave = () => {
    loadCategories()
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
          <h1 className="text-2xl font-bold text-gray-900">Categorias</h1>
          <p className="text-gray-600 mt-1">Organize seus produtos por categorias</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Nova Categoria</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div key={category.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FolderOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEdit(category)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(category)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{category.name}</h3>
            <p className="text-gray-600 text-sm mb-4">{category.description}</p>
            
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                category.active
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {category.active ? 'Ativa' : 'Inativa'}
              </span>
              <span className="text-sm text-gray-500">Ordem: {category.order}</span>
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="text-center py-12">
          <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhuma categoria encontrada</p>
        </div>
      )}

      <CategoryModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        category={editingCategory}
        onSave={handleModalSave}
      />
    </div>
  )
}