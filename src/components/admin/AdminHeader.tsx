import React from 'react'
import { LogOut, User, Settings } from 'lucide-react'
import { useAdminStore } from '../../store/useAdminStore'
import { useNavigate } from 'react-router-dom'

export const AdminHeader: React.FC = () => {
  const { user, logout } = useAdminStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Painel Administrativo</h1>
            <p className="text-sm text-gray-600">Mercadinho Auto Atendimento</p>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <User className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-gray-700">{user?.name}</span>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm">Sair</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}