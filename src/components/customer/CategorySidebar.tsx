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
    <aside className="w-72 sm:w-80 lg:w-96 glassmorphism border-r border-white/10 flex flex-col animate-slideIn">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2 text-shadow">
            <Grid3X3 className="h-5 w-5 sm:h-6 sm:w-6" />
            <span>Categorias</span>
          </h2>
          <button
            onClick={toggleExpanded}
            className="p-2 hover:bg-white/15 rounded-lg transition-all duration-300 hover:scale-110"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            ) : (
              <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
            )}
          </button>
        </div>

        {/* Search */}
        {isExpanded && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-300" />
            <input
              type="text"
              placeholder="Buscar categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 sm:py-3 glassmorphism rounded-lg text-white placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent text-sm sm:text-base"
            />
          </div>
        )}
      </div>

      {/* Categories List */}
      {isExpanded && (
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="space-y-2">
            {/* Todos os Produtos */}
            <button
              onClick={() => setSelectedCategory(null)}
              className={`w-full text-left px-4 py-3 sm:py-4 rounded-xl transition-all duration-300 group animate-fadeIn ${
                selectedCategory === null
                  ? 'glassmorphism-card text-white border border-white/30 shadow-xl scale-105'
                  : 'text-slate-200 hover:bg-white/10 hover:text-white hover:scale-102'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm sm:text-base">Todos os Produtos</span>
                <div className={`w-2 h-2 rounded-full transition-colors ${
                  selectedCategory === null ? 'bg-white shadow-lg' : 'bg-slate-400 group-hover:bg-white'
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
                  className={`w-full text-left px-4 py-3 sm:py-4 rounded-xl transition-all duration-300 group animate-fadeIn ${
                    selectedCategory === category.id
                      ? 'glassmorphism-card text-white border border-white/30 shadow-xl scale-105'
                      : 'text-slate-200 hover:bg-white/10 hover:text-white hover:scale-102'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium text-sm sm:text-base">{category.name}</span>
                      {category.description && (
                        <p className="text-xs opacity-75 mt-1 hidden sm:block">{category.description}</p>
                      )}
                    </div>
                    <div className={`w-2 h-2 rounded-full transition-colors ${
                      selectedCategory === category.id ? 'bg-white shadow-lg' : 'bg-slate-400 group-hover:bg-white'
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
        <div className="p-4 sm:p-6">
          <div className="space-y-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`w-full p-3 sm:p-4 rounded-xl transition-all duration-300 hover:scale-110 ${
                selectedCategory === null
                  ? 'glassmorphism-card border border-white/30'
                  : 'hover:bg-white/15'
              }`}
              title="Todos os Produtos"
            >
              <Grid3X3 className={`h-5 w-5 sm:h-6 sm:w-6 mx-auto ${
                selectedCategory === null ? 'text-white' : 'text-slate-300'
              }`} />
            </button>
            
            {categories.slice(0, 6).map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`w-full p-3 sm:p-4 rounded-xl transition-all duration-300 hover:scale-110 ${
                  selectedCategory === category.id
                    ? 'glassmorphism-card border border-white/30'
                    : 'hover:bg-white/15'
                }`}
                title={category.name}
              >
                <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full mx-auto ${
                  selectedCategory === category.id ? 'bg-white shadow-lg' : 'bg-slate-400'
                }`} />
              </button>
            ))}
            
            {categories.length > 6 && (
              <button
                onClick={toggleExpanded}
                className="w-full p-3 sm:p-4 rounded-xl hover:bg-white/15 transition-all duration-300 hover:scale-110"
                title="Ver mais categorias"
              >
                <ChevronDown className="h-4 w-4 sm:h-5 sm:w-5 text-slate-300 mx-auto" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="p-4 sm:p-6 border-t border-white/10">
        <div className="text-center">
          <p className="text-slate-300 text-xs sm:text-sm">
            {filteredCategories.length} categoria{filteredCategories.length !== 1 ? 's' : ''}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-slate-400 hover:text-white text-xs sm:text-sm mt-1 underline hover:no-underline transition-all"
            >
              Limpar busca
            </button>
          )}
        </div>
      </div>
    </aside>
  )
}