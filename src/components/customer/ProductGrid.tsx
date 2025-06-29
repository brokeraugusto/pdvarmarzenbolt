import React from 'react'
import { ProductCard } from './ProductCard'
import { useStore } from '../../store/useStore'

export const ProductGrid: React.FC = () => {
  const { getFilteredProducts } = useStore()
  const products = getFilteredProducts()

  if (products.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-white/60">
          <p className="text-xl">Nenhum produto encontrado</p>
          <p className="text-sm mt-2">Tente selecionar uma categoria diferente</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}