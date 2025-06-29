import React, { useState, useEffect } from 'react'
import { X, Save, Calculator } from 'lucide-react'
import { Product, Category } from '../../types'
import { productService } from '../../services/productService'
import { ImageUpload } from './ImageUpload'

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  product?: Product | null
  categories: Category[]
  onSave: () => void
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  product,
  categories,
  onSave
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    cost_price: 0,
    margin_percentage: 0,
    image: '',
    category_id: '',
    stock: 0,
    active: true
  })
  const [loading, setSaving] = useState(false)
  const [calculationMode, setCalculationMode] = useState<'price' | 'margin'>('price')

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        description: product.description,
        price: product.price,
        cost_price: product.cost_price,
        margin_percentage: product.margin_percentage,
        image: product.image,
        category_id: product.category_id,
        stock: product.stock,
        active: product.active
      })
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        cost_price: 0,
        margin_percentage: 0,
        image: '',
        category_id: '',
        stock: 0,
        active: true
      })
    }
  }, [product, isOpen])

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Auto-calculate based on mode
    if (field === 'cost_price' || field === 'price' || field === 'margin_percentage') {
      const newData = { ...formData, [field]: value }
      
      if (calculationMode === 'price' && field !== 'price') {
        // Calculate price from cost and margin
        if (newData.cost_price > 0 && newData.margin_percentage > 0) {
          const calculatedPrice = productService.calculateSalePrice(newData.cost_price, newData.margin_percentage)
          setFormData(prev => ({ ...prev, [field]: value, price: calculatedPrice }))
        }
      } else if (calculationMode === 'margin' && field !== 'margin_percentage') {
        // Calculate margin from cost and price
        if (newData.cost_price > 0 && newData.price > 0) {
          const calculatedMargin = productService.calculateMargin(newData.cost_price, newData.price)
          setFormData(prev => ({ ...prev, [field]: value, margin_percentage: calculatedMargin }))
        }
      }
    }
  }

  const handleImageChange = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, image: imageUrl }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (product) {
        await productService.updateProduct(product.id, formData)
      } else {
        await productService.createProduct(formData)
      }
      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving product:', error)
      alert('Erro ao salvar produto')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              {product ? 'Editar Produto' : 'Novo Produto'}
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Coluna Esquerda - Informações Básicas */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Produto *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria *
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => handleInputChange('category_id', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Pricing Section */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-blue-800">Precificação</h3>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modo de Cálculo
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="margin"
                        checked={calculationMode === 'margin'}
                        onChange={(e) => setCalculationMode(e.target.value as 'price' | 'margin')}
                        className="mr-2"
                      />
                      Calcular Margem
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="price"
                        checked={calculationMode === 'price'}
                        onChange={(e) => setCalculationMode(e.target.value as 'price' | 'margin')}
                        className="mr-2"
                      />
                      Calcular Preço
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preço de Custo (R$) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.cost_price}
                      onChange={(e) => handleInputChange('cost_price', parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {calculationMode === 'price' ? 'Margem (%) *' : 'Margem (%)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.margin_percentage.toFixed(2)}
                      onChange={(e) => handleInputChange('margin_percentage', parseFloat(e.target.value) || 0)}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        calculationMode === 'margin' ? 'bg-gray-100' : ''
                      }`}
                      readOnly={calculationMode === 'margin'}
                      required={calculationMode === 'price'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {calculationMode === 'margin' ? 'Preço de Venda (R$) *' : 'Preço de Venda (R$)'}
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price.toFixed(2)}
                      onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                      className={`w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        calculationMode === 'price' ? 'bg-gray-100' : ''
                      }`}
                      readOnly={calculationMode === 'price'}
                      required={calculationMode === 'margin'}
                    />
                  </div>
                </div>

                {formData.cost_price > 0 && formData.price > 0 && (
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700">
                      <strong>Lucro por unidade:</strong> R$ {(formData.price - formData.cost_price).toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              {/* Other Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estoque Inicial
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => handleInputChange('stock', parseInt(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={formData.active ? 'true' : 'false'}
                    onChange={(e) => handleInputChange('active', e.target.value === 'true')}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="true">Ativo</option>
                    <option value="false">Inativo</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Coluna Direita - Imagem */}
            <div className="space-y-6">
              <ImageUpload
                currentImage={formData.image}
                onImageChange={handleImageChange}
                type="product"
                label="Imagem do Produto"
                description="Adicione uma imagem atrativa do produto. Ela aparecerá na loja para os clientes."
                maxWidth={800}
                maxHeight={600}
              />

              {/* Preview do produto */}
              {(formData.name || formData.image) && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  <h4 className="text-md font-medium text-gray-800 mb-4">Preview na Loja</h4>
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700">
                    <div className="aspect-square mb-4 overflow-hidden rounded-xl bg-white/10">
                      {formData.image ? (
                        <img
                          src={formData.image}
                          alt={formData.name || 'Produto'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white/60">
                          <span className="text-sm">Sem imagem</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="font-semibold text-white text-lg leading-tight">
                        {formData.name || 'Nome do Produto'}
                      </h3>
                      
                      <p className="text-blue-100 text-sm opacity-80">
                        {formData.description || 'Descrição do produto'}
                      </p>
                      
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-2xl font-bold text-white">
                          R$ {formData.price.toFixed(2)}
                        </span>
                        
                        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-3 rounded-xl">
                          <span className="text-sm">+</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-4 mt-8 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              <span>{loading ? 'Salvando...' : 'Salvar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}