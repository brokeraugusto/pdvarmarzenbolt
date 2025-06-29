import React from 'react'
import { ShoppingCart, Store } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { settingsService } from '../../services/settingsService'

export const Header: React.FC = () => {
  const { getCartItemsCount, setShowCheckout } = useStore()
  const itemsCount = getCartItemsCount()

  // Obter configurações da loja (em produção seria via hook ou context)
  const [storeSettings, setStoreSettings] = React.useState({
    name: 'Mercadinho',
    logo: ''
  })

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

  return (
    <header className="bg-gradient-to-r from-blue-900 to-blue-700 backdrop-blur-md bg-opacity-95 shadow-lg border-b border-blue-600/20">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm">
              {storeSettings.logo ? (
                <img
                  src={storeSettings.logo}
                  alt="Logo"
                  className="h-8 w-8 object-cover rounded-lg"
                />
              ) : (
                <Store className="h-8 w-8 text-white" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{storeSettings.name}</h1>
              <p className="text-blue-200 text-sm">Auto Atendimento</p>
            </div>
          </div>

          {/* Cart Button */}
          <button
            onClick={() => setShowCheckout(true)}
            className="relative flex items-center space-x-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl px-6 py-3 transition-all duration-300 hover:scale-105"
          >
            <ShoppingCart className="h-6 w-6 text-white" />
            <span className="text-white font-medium">Carrinho</span>
            {itemsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
                {itemsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}