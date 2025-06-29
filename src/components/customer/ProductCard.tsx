import React from 'react'
import { Plus } from 'lucide-react'
import { Product } from '../../types'
import { useStore } from '../../store/useStore'

interface ProductCardProps {
  product: Product
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useStore()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 hover:bg-white/15 transition-all duration-300 hover:scale-105 hover:shadow-xl group">
      <div className="aspect-square mb-4 overflow-hidden rounded-xl">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
          loading="lazy"
        />
      </div>
      
      <div className="space-y-2">
        <h3 className="font-semibold text-white text-lg leading-tight">
          {product.name}
        </h3>
        
        <p className="text-blue-100 text-sm opacity-80">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between pt-2">
          <span className="text-2xl font-bold text-white">
            {formatPrice(product.price)}
          </span>
          
          <button
            onClick={() => addToCart(product)}
            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white p-3 rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-lg active:scale-95"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {product.stock < 10 && (
        <div className="mt-2 text-xs text-yellow-300 bg-yellow-500/20 px-2 py-1 rounded-lg">
          Estoque baixo: {product.stock} unidades
        </div>
      )}
    </div>
  )
}