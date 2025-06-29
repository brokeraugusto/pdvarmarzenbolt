import React, { useState } from 'react'
import { X, Minus, Plus, ShoppingBag } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { PhoneInput } from './PhoneInput'

export const CheckoutModal: React.FC = () => {
  const {
    cart,
    showCheckout,
    setShowCheckout,
    updateQuantity,
    removeFromCart,
    getCartTotal,
    customer,
    setCustomer,
    setShowPaymentModal
  } = useStore()

  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')

  const subtotal = getCartTotal()
  const discount = customer?.discount_percentage ? (subtotal * customer.discount_percentage / 100) : 0
  const total = subtotal - discount

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const handleContinueToPayment = () => {
    if (cart.length === 0) {
      alert('Adicione produtos ao carrinho antes de continuar')
      return
    }
    setShowPaymentModal(true)
  }

  const handleClose = () => {
    setShowCheckout(false)
  }

  if (!showCheckout) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ShoppingBag className="h-6 w-6" />
              <h2 className="text-2xl font-bold">Finalizar Pedido</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Empty Cart Message */}
          {cart.length === 0 && (
            <div className="text-center py-12">
              <ShoppingBag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Carrinho vazio</h3>
              <p className="text-gray-600 mb-6">Adicione produtos ao carrinho para continuar</p>
              <button
                onClick={handleClose}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
              >
                Continuar Comprando
              </button>
            </div>
          )}

          {cart.length > 0 && (
            <>
              {/* Customer Info */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Informações do Cliente</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <PhoneInput
                    value={phone}
                    onChange={setPhone}
                    onCustomerFound={setCustomer}
                  />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      E-mail (opcional)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>

                {customer && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                    <p className="text-green-800 font-medium">
                      Cliente identificado: {customer.name}
                    </p>
                    <p className="text-green-600 text-sm">
                      Desconto de {customer.discount_percentage}% aplicado ({customer.type})
                    </p>
                  </div>
                )}
              </div>

              {/* Cart Items */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Itens do Pedido</h3>
                <div className="space-y-4 max-h-64 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.product.id} className="flex items-center space-x-4 bg-gray-50 p-4 rounded-xl">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-800 truncate">{item.product.name}</h4>
                        <p className="text-gray-600">{formatPrice(item.product.price)}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">
                          {formatPrice(item.product.price * item.quantity)}
                        </p>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="bg-gray-50 p-6 rounded-xl">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Resumo do Pedido</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Desconto ({customer?.discount_percentage}%):</span>
                      <span className="font-medium">-{formatPrice(discount)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="p-6 bg-gray-50 border-t flex space-x-4">
            <button
              onClick={handleClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Continuar Comprando
            </button>
            <button
              onClick={handleContinueToPayment}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all"
            >
              Escolher Forma de Pagamento
            </button>
          </div>
        )}
      </div>
    </div>
  )
}