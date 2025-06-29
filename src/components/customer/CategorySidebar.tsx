import React from 'react'
import { useStore } from '../../store/useStore'

export const CategorySidebar: React.FC = () => {
  const { categories, selectedCategory, setSelectedCategory } = useStore()

  return (
    <aside className="w-64 bg-white/10 backdrop-blur-md border-r border-white/20 p-6">
      <h2 className="text-xl font-bold text-white mb-6">Categorias</h2>
      
      <div className="space-y-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 ${
            selectedCategory === null
              ? 'bg-white/20 text-white border border-white/30'
              : 'text-blue-100 hover:bg-white/10 hover:text-white'
          }`}
        >
          Todos os Produtos
        </button>
        
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 ${
              selectedCategory === category.id
                ? 'bg-white/20 text-white border border-white/30'
                : 'text-blue-100 hover:bg-white/10 hover:text-white'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </aside>
  )
}