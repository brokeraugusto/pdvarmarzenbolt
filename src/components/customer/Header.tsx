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
    <header className="gradient-primary backdrop-blur-xl bg-opacity-95 shadow-2xl border-b border-white/10 safe-area sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3 animate-slideIn">
            <div className="p-2 sm:p-3 glassmorphism rounded-xl">
              {storeSettings.logo ? (
                <img
                  src={storeSettings.logo}
                  alt="Logo"
                  className="h-8 w-8 sm:h-10 sm:w-10 object-cover rounded-lg"
                />
              ) : (
                <Store className="h-8 w-8 sm:h-10 sm:w-10 text-white drop-shadow-lg" />
              )}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white text-shadow">
                {storeSettings.name}
              </h1>
              <p className="text-slate-300 text-xs sm:text-sm opacity-90">Auto Atendimento</p>
            </div>
          </div>

          {/* Cart Button */}
          <button
            onClick={() => setShowCheckout(true)}
            className="relative flex items-center space-x-2 sm:space-x-3 glassmorphism hover:bg-white/20 rounded-xl px-4 sm:px-6 py-3 sm:py-4 transition-all duration-300 hover:scale-105 hover:shadow-xl group"
          >
            <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-white group-hover:scale-110 transition-transform" />
            <span className="text-white font-medium text-sm sm:text-base hidden sm:inline">Carrinho</span>
            <span className="text-white font-medium text-sm sm:hidden">
              {itemsCount > 0 ? itemsCount : ''}
            </span>
            {itemsCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full h-6 w-6 sm:h-7 sm:w-7 flex items-center justify-center animate-pulse shadow-lg border-2 border-white/20">
                {itemsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}