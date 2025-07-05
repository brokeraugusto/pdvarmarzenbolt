import React, { useState } from 'react'
import { ChevronDown, ChevronUp, Grid3X3, Search } from 'lucide-react'
import { useStore } from '../../store/useStore'

export const CategorySidebar: React.FC = () => {
  const { categories, selectedCategory, setSelectedCategory } = useStore()
  const [isExpanded, setIsExpanded] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded)
  }

  return (
    <aside className="w-80 bg-white/10 backdrop-blur-md border-r border-white/20 flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center space-x-2">
            <Grid3X3 className="h-5 w-5" />
            <span>Categorias</span>
          </h2>
          <button
            onClick={toggleExpanded}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-white" />
            ) : (
              <ChevronDown className="h-4 w-4 text-white" />
            )}
          </button>
        </div>

        {/* Search */}
        {isExpanded && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-blue-200" />
            <input
              type="text"
              placeholder="Buscar categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
            />
          </div>
        )}
      </div>

      {/* Categories List */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-2">
            {/* Todos os Produtos */}
            <button
              onClick={() => setSelectedCategory(null)}
              className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 group ${
                selectedCategory === null
                  ? 'bg-white/20 text-white border border-white/30 shadow-lg'
                  : 'text-blue-100 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">Todos os Produtos</span>
                <div className={`w-2 h-2 rounded-full transition-colors ${
                  selectedCategory === null ? 'bg-white' : 'bg-blue-300 group-hover:bg-white'
                }`} />
              </div>
            </button>

            {/* Categories */}
            {filteredCategories.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-blue-200 text-sm">
                  {searchTerm ? 'Nenhuma categoria encontrada' : 'Nenhuma categoria disponível'}
                </p>
              </div>
            ) : (
              filteredCategories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 group ${
                    selectedCategory === category.id
                      ? 'bg-white/20 text-white border border-white/30 shadow-lg'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{category.name}</span>
                      {category.description && (
                        <p className="text-xs opacity-80 mt-1">{category.description}</p>
                      )}
                    </div>
                    <div className={`w-2 h-2 rounded-full transition-colors ${
                      selectedCategory === category.id ? 'bg-white' : 'bg-blue-300 group-hover:bg-white'
                    }`} />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Collapsed State */}
      {!isExpanded && (
        <div className="p-6">
          <div className="space-y-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`w-full p-3 rounded-xl transition-all duration-300 ${
                selectedCategory === null
                  ? 'bg-white/20 border border-white/30'
                  : 'hover:bg-white/10'
              }`}
              title="Todos os Produtos"
            >
              <Grid3X3 className={`h-5 w-5 mx-auto ${
                selectedCategory === null ? 'text-white' : 'text-blue-200'
              }`} />
            </button>
            
            {categories.slice(0, 6).map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`w-full p-3 rounded-xl transition-all duration-300 ${
                  selectedCategory === category.id
                    ? 'bg-white/20 border border-white/30'
                    : 'hover:bg-white/10'
                }`}
                title={category.name}
              >
                <div className={`w-2 h-2 rounded-full mx-auto ${
                  selectedCategory === category.id ? 'bg-white' : 'bg-blue-300'
                }`} />
              </button>
            ))}
            
            {categories.length > 6 && (
              <button
                onClick={toggleExpanded}
                className="w-full p-3 rounded-xl hover:bg-white/10 transition-all duration-300"
                title="Ver mais categorias"
              >
                <ChevronDown className="h-4 w-4 text-blue-200 mx-auto" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="p-6 border-t border-white/20">
        <div className="text-center">
          <p className="text-blue-200 text-xs">
            {filteredCategories.length} categoria{filteredCategories.length !== 1 ? 's' : ''}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-blue-300 hover:text-white text-xs mt-1 underline"
            >
              Limpar busca
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}