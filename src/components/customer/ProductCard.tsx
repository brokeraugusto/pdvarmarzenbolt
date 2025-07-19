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
      <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 hover:bg-white/15 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl group">
        <div className="flex items-center space-x-4">
          {/* Imagem */}
          <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-xl">
            {product.image ? (
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-white/10 flex items-center justify-center">
                <Package className="h-8 w-8 text-white/50" />
              </div>
            )}
          </div>

          {/* Informações */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-lg leading-tight truncate">
              {product.name}
            </h3>
            
            <p className="text-blue-100 text-sm opacity-80 line-clamp-2 mt-1">
              {product.description}
            </p>

            <div className="flex items-center space-x-4 mt-2">
              <span className="text-2xl font-bold text-white">
                {formatPrice(product.price)}
              </span>
              
              <span className={`text-sm ${stockStatus.color}`}>
                {stockStatus.label}
              </span>
            </div>
          </div>

          {/* Botão de adicionar */}
          <div className="flex-shrink-0">
            <button
              onClick={() => addToCart(product)}
              disabled={product.stock === 0}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-3 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-xl group">
      {/* Imagem */}
      <div className="aspect-square mb-4 overflow-hidden rounded-xl relative">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-white/10 flex items-center justify-center">
            <Package className="h-12 w-12 text-white/50" />
          </div>
        )}
        
        {/* Badge de estoque */}
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium bg-black/50 backdrop-blur-sm ${stockStatus.color}`}>
            {stockStatus.label}
          </span>
        </div>
      </div>
      
      {/* Informações */}
      <div className="space-y-2">
        <h3 className="font-semibold text-white text-lg leading-tight line-clamp-2">
          {product.name}
        </h3>
        
        <p className="text-blue-100 text-sm opacity-80 line-clamp-2">
          {product.description}
        </p>
        
        {/* Preço e botão */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <span className="text-2xl font-bold text-white">
              {formatPrice(product.price)}
            </span>
          </div>
          
          <button
            onClick={() => addToCart(product)}
            disabled={product.stock === 0}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-3 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* Indicador de estoque baixo */}
      {product.stock > 0 && product.stock < 10 && (
        <div className="mt-3 text-xs text-yellow-300 bg-yellow-500/20 px-2 py-1 rounded-lg text-center">
          Últimas {product.stock} unidades!
        </div>
      )}
    </div>
  )
}