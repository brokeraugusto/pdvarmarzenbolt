import React, { useState } from 'react'
import { Shield, Eye, EyeOff } from 'lucide-react'
import { useAdminStore } from '../store/useAdminStore'
import { useNavigate } from 'react-router-dom'
import { settingsService } from '../services/settingsService'

export const AdminLogin: React.FC = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [storeSettings, setStoreSettings] = useState({
    name: 'Mercadinho',
    logo: ''
  })

  const { login } = useAdminStore()
  const navigate = useNavigate()

  React.useEffect(() => {
    const loadStoreSettings = async () => {
      try {
        const settings = await settingsService.getSettings()
        setStoreSettings({
          name: settings.storeName,
          logo: settings.storeLogo || ''
        })
      } catch (error) {
        console.error('Error loading store settings:', error)
      }
    }
    
    loadStoreSettings()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const success = await login(username, password)
      if (success) {
        navigate('/admin')
      } else {
        setError('Credenciais inválidas')
      }
    } catch (err) {
      setError('Erro ao fazer login')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            {storeSettings.logo ? (
              <img
                src={storeSettings.logo}
                alt="Logo"
                className="h-10 w-10 object-cover rounded-lg"
              />
            ) : (
              <Shield className="h-8 w-8 text-blue-600" />
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Painel Administrativo</h1>
          <p className="text-gray-600 mt-2">{storeSettings.name}</p>
          <p className="text-gray-500 text-sm">Faça login para acessar o sistema</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usuário
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Digite seu usuário"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                placeholder="Digite sua senha"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            ← Voltar para a loja
          </button>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-xl">
          <p className="text-xs text-blue-700 text-center">
            <strong>Demo:</strong> admin / admin123
          </p>
        </div>
      </div>
    </div>
  )
}