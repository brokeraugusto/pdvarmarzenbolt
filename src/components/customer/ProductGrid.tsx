import React, { useState } from 'react'
import { Search, Filter, SortAsc, SortDesc, Grid3X3, List } from 'lucide-react'
import { ProductCard } from './ProductCard'
import { useStore } from '../../store/useStore'

export const ProductGrid: React.FC = () => {
  const { getFilteredProducts, selectedCategory, categories } = useStore()
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = useState(false)

  const products = getFilteredProducts()

  // Filtrar por busca
  const searchedProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Ordenar produtos
  const sortedProducts = [...searchedProducts].sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
      case 'price':
        comparison = a.price - b.price
        break
      case 'stock':
        comparison = a.stock - b.stock
        break
    }
    
    return sortOrder === 'asc' ? comparison : -comparison
  })

  const getCategoryName = () => {
    if (!selectedCategory) return 'Todos os Produtos'
    const category = categories.find(c => c.id === selectedCategory)
    return category?.name || 'Categoria'
  }

  const toggleSort = (field: 'name' | 'price' | 'stock') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('asc')
    }
  }

  if (products.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center text-white/60">
          <div className="w-24 h-24 mx-auto mb-6 bg-white/10 rounded-full flex items-center justify-center">
            <Search className="h-12 w-12" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Nenhum produto encontrado</h3>
          <p className="text-sm">
            {selectedCategory 
              ? 'Esta categoria não possui produtos disponíveis'
              : 'Nenhum produto cadastrado no sistema'
            }
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col">
      {/* Header com busca e filtros */}
      <div className="p-6 border-b border-white/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Título e contador */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{getCategoryName()}</h2>
            <p className="text-blue-200 text-sm">
              {sortedProducts.length} produto{sortedProducts.length !== 1 ? 's' : ''} 
              {searchTerm && ` encontrado${sortedProducts.length !== 1 ? 's' : ''} para "${searchTerm}"`}
            </p>
          </div>

          {/* Controles */}
          <div className="flex items-center space-x-3">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-200" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent w-64"
              />
            </div>

            {/* Filtros */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${
                showFilters ? 'bg-white/20 text-white' : 'bg-white/10 text-blue-200 hover:bg-white/20 hover:text-white'
              }`}
            >
              <Filter className="h-4 w-4" />
            </button>

            {/* View Mode */}
            <div className="flex bg-white/10 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-blue-200 hover:text-white'
                }`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded transition-colors ${
                  viewMode === 'list' ? 'bg-white/20 text-white' : 'text-blue-200 hover:text-white'
                }`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filtros expandidos */}
        {showFilters && (
          <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-white text-sm font-medium">Ordenar por:</span>
              
              <button
                onClick={() => toggleSort('name')}
                className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                  sortBy === 'name' ? 'bg-white/20 text-white' : 'bg-white/10 text-blue-200 hover:bg-white/20 hover:text-white'
                }`}
              >
                <span>Nome</span>
                {sortBy === 'name' && (
                  sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                )}
              </button>

              <button
                onClick={() => toggleSort('price')}
                className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                  sortBy === 'price' ? 'bg-white/20 text-white' : 'bg-white/10 text-blue-200 hover:bg-white/20 hover:text-white'
                }`}
              >
                <span>Preço</span>
                {sortBy === 'price' && (
                  sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                )}
              </button>

              <button
                onClick={() => toggleSort('stock')}
                className={`flex items-center space-x-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                  sortBy === 'stock' ? 'bg-white/20 text-white' : 'bg-white/10 text-blue-200 hover:bg-white/20 hover:text-white'
                }`}
              >
                <span>Estoque</span>
                {sortBy === 'stock' && (
                  sortOrder === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
                )}
              </button>

              {(searchTerm || sortBy !== 'name' || sortOrder !== 'asc') && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSortBy('name')
                    setSortOrder('asc')
                  }}
                  className="px-3 py-1 bg-red-500/20 text-red-200 rounded-lg text-sm hover:bg-red-500/30 transition-colors"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Grid de produtos */}
      <div className="flex-1 p-6 overflow-y-auto">
        {sortedProducts.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-white/60">
              <Search className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Nenhum produto encontrado</h3>
              <p className="text-sm">
                Tente ajustar os filtros ou buscar por outros termos
              </p>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSortBy('name')
                  setSortOrder('asc')
                }}
                className="mt-4 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
              >
                Limpar busca
              </button>
            </div>
          </div>
        ) : (
          <div className={
            viewMode === 'grid'
              ? "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6"
              : "space-y-4"
          }>
            {sortedProducts.map((product) => (
              <ProductCard 
                key={product.id} 
                product={product} 
                viewMode={viewMode}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}