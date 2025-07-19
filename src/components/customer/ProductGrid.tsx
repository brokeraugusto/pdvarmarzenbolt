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
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="text-center text-slate-300 animate-fadeIn">
          <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-6 glassmorphism rounded-full flex items-center justify-center">
            <Search className="h-10 w-10 sm:h-12 sm:w-12" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold mb-2 text-shadow">Nenhum produto encontrado</h3>
          <p className="text-sm sm:text-base opacity-80">
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
      <div className="p-4 sm:p-6 border-b border-white/10">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 animate-fadeIn">
          {/* Título e contador */}
          <div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 text-shadow">
              {getCategoryName()}
            </h2>
            <p className="text-slate-300 text-sm sm:text-base opacity-90">
              {sortedProducts.length} produto{sortedProducts.length !== 1 ? 's' : ''} 
              {searchTerm && ` encontrado${sortedProducts.length !== 1 ? 's' : ''} para "${searchTerm}"`}
            </p>
          </div>

          {/* Controles */}
          <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap gap-2">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-300" />
              <input
                type="text"
                placeholder="Buscar produtos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 sm:py-3 glassmorphism rounded-lg text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent w-48 sm:w-64 text-sm sm:text-base"
              />
            </div>

            {/* Filtros */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 sm:p-3 rounded-lg transition-all duration-300 hover:scale-110 ${
                showFilters ? 'glassmorphism-card text-white' : 'glassmorphism text-slate-300 hover:bg-white/20 hover:text-white'
              }`}
            >
              <Filter className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>

            {/* View Mode */}
            <div className="flex glassmorphism rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 sm:p-3 rounded transition-all duration-300 hover:scale-110 ${
                  viewMode === 'grid' ? 'bg-white/20 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Grid3X3 className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 sm:p-3 rounded transition-all duration-300 hover:scale-110 ${
                  viewMode === 'list' ? 'bg-white/20 text-white' : 'text-slate-300 hover:text-white'
                }`}
              >
                <List className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Filtros expandidos */}
        {showFilters && (
          <div className="mt-4 p-4 glassmorphism rounded-lg border border-white/10 animate-fadeIn">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-white text-sm sm:text-base font-medium">Ordenar por:</span>
              
              <button
                onClick={() => toggleSort('name')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm transition-all duration-300 hover:scale-105 ${
                  sortBy === 'name' ? 'glassmorphism-card text-white' : 'glassmorphism text-slate-300 hover:bg-white/20 hover:text-white'
                }`}
              >
                <span>Nome</span>
                {sortBy === 'name' && (
                  sortOrder === 'asc' ? <SortAsc className="h-3 w-3 sm:h-4 sm:w-4" /> : <SortDesc className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </button>

              <button
                onClick={() => toggleSort('price')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm transition-all duration-300 hover:scale-105 ${
                  sortBy === 'price' ? 'glassmorphism-card text-white' : 'glassmorphism text-slate-300 hover:bg-white/20 hover:text-white'
                }`}
              >
                <span>Preço</span>
                {sortBy === 'price' && (
                  sortOrder === 'asc' ? <SortAsc className="h-3 w-3 sm:h-4 sm:w-4" /> : <SortDesc className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </button>

              <button
                onClick={() => toggleSort('stock')}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-sm transition-all duration-300 hover:scale-105 ${
                  sortBy === 'stock' ? 'glassmorphism-card text-white' : 'glassmorphism text-slate-300 hover:bg-white/20 hover:text-white'
                }`}
              >
                <span>Estoque</span>
                {sortBy === 'stock' && (
                  sortOrder === 'asc' ? <SortAsc className="h-3 w-3 sm:h-4 sm:w-4" /> : <SortDesc className="h-3 w-3 sm:h-4 sm:w-4" />
                )}
              </button>

              {(searchTerm || sortBy !== 'name' || sortOrder !== 'asc') && (
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setSortBy('name')
                    setSortOrder('asc')
                  }}
                  className="px-3 py-2 bg-red-500/20 text-red-200 rounded-lg text-sm hover:bg-red-500/30 transition-all duration-300 hover:scale-105"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Grid de produtos */}
      <div className="flex-1 p-4 sm:p-6 overflow-y-auto">
        {sortedProducts.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center text-slate-300 animate-fadeIn">
              <Search className="h-12 w-12 sm:h-16 sm:w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg sm:text-xl font-medium mb-2 text-shadow">Nenhum produto encontrado</h3>
              <p className="text-sm sm:text-base opacity-80">
                Tente ajustar os filtros ou buscar por outros termos
              </p>
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSortBy('name')
                  setSortOrder('asc')
                }}
                className="mt-4 px-4 py-2 sm:px-6 sm:py-3 glassmorphism text-white rounded-lg hover:bg-white/20 transition-all duration-300 hover:scale-105"
              >
                Limpar busca
              </button>
            </div>
          </div>
        ) : (
          <div className={
            viewMode === 'grid'
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 animate-fadeIn"
              : "space-y-3 sm:space-y-4 animate-fadeIn"
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