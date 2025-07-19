import React from 'react'
import { Plus, Package, Star } from 'lucide-react'
import { Product } from '../../types'
import { useStore } from '../../store/useStore'

interface ProductCardProps {
  product: Product
  viewMode?: 'grid' | 'list'
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, viewMode = 'grid' }) => {
  const { addToCart } = useStore()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const getStockStatus = () => {
    if (product.stock === 0) return { color: 'text-red-400', label: 'Esgotado' }
    if (product.stock < 10) return { color: 'text-yellow-400', label: `Restam ${product.stock}` }
    return { color: 'text-green-400', label: 'Disponível' }
  }

  const stockStatus = getStockStatus()

  if (viewMode === 'list') {
    return (
      <div className="glassmorphism-card rounded-2xl p-4 sm:p-6 hover:scale-[1.02] hover:shadow-2xl group animate-fadeIn">
        <div className="flex items-center space-x-3 sm:space-x-4">
          {/* Imagem */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 overflow-hidden rounded-xl shadow-lg">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full glassmorphism flex items-center justify-center">
                <Package className="h-6 w-6 sm:h-8 sm:w-8 text-white/50" />
              </div>
            )}
          </div>

          {/* Informações */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-base sm:text-lg leading-tight truncate text-shadow">
              {product.name}
            </h3>
            
            <p className="text-slate-200 text-xs sm:text-sm opacity-80 line-clamp-2 mt-1">
              {product.description}
            </p>

            <div className="flex items-center space-x-2 sm:space-x-4 mt-2">
              <span className="text-lg sm:text-2xl font-bold text-white text-shadow">
                {formatPrice(product.price)}
              </span>
              
              <span className={`text-xs sm:text-sm font-medium ${stockStatus.color}`}>
                {stockStatus.label}
              </span>
            </div>
          </div>

          {/* Botão de adicionar */}
          <div className="flex-shrink-0">
            <button
              onClick={() => addToCart(product)}
              disabled={product.stock === 0}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-3 sm:p-4 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
            >
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="glassmorphism-card rounded-2xl p-4 sm:p-6 hover:scale-105 hover:shadow-2xl group animate-fadeIn">
      {/* Imagem */}
      <div className="aspect-square mb-4 overflow-hidden rounded-xl relative shadow-lg">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full glassmorphism flex items-center justify-center">
            <Package className="h-10 w-10 sm:h-12 sm:w-12 text-white/50" />
          </div>
        )}
        
        {/* Badge de estoque */}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium glassmorphism-dark ${stockStatus.color} shadow-lg`}>
            {stockStatus.label}
          </span>
        </div>
      </div>
      
      {/* Informações */}
      <div className="space-y-2">
        <h3 className="font-semibold text-white text-base sm:text-lg leading-tight line-clamp-2 text-shadow">
          {product.name}
        </h3>
        
        <p className="text-slate-200 text-xs sm:text-sm opacity-80 line-clamp-2">
          {product.description}
        </p>
        
        {/* Preço e botão */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <span className="text-lg sm:text-2xl font-bold text-white text-shadow">
              {formatPrice(product.price)}
            </span>
          </div>
          
          <button
            onClick={() => addToCart(product)}
            disabled={product.stock === 0}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-3 sm:p-4 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-lg"
          >
            <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>
      </div>
      
      {/* Indicador de estoque baixo */}
      {product.stock > 0 && product.stock < 10 && (
        <div className="mt-3 text-xs sm:text-sm text-yellow-300 bg-yellow-500/20 backdrop-blur-sm px-2 py-1 rounded-lg text-center border border-yellow-500/30 shadow-lg">
          Últimas {product.stock} unidades!
        </div>
      )}
    </div>
  )
}