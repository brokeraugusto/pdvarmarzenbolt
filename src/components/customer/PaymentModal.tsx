import React, { useState, useEffect } from 'react'
import { X, CreditCard, Smartphone, QrCode, AlertTriangle } from 'lucide-react'
import { useStore } from '../../store/useStore'
import { orderService } from '../../services/orderService'
import { mercadoPagoService } from '../../services/mercadoPagoService'
import { PIXPaymentModal } from './PIXPaymentModal'
import { CardPaymentModal } from './CardPaymentModal'

export const PaymentModal: React.FC = () => {
  const { 
    showPaymentModal, 
    setShowPaymentModal, 
    getCartTotal, 
    customer, 
    cart,
    setCurrentOrder 
  } = useStore()

  const [showPIXModal, setShowPIXModal] = useState(false)
  const [showCardModal, setShowCardModal] = useState(false)
  const [cardType, setCardType] = useState<'credit' | 'debit'>('credit')
  const [currentOrderId, setCurrentOrderId] = useState<string>('')
  const [creating, setCreating] = useState(false)
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const subtotal = getCartTotal()
  const discount = customer?.discount_percentage ? (subtotal * customer.discount_percentage / 100) : 0
  const total = subtotal - discount

  useEffect(() => {
    if (showPaymentModal) {
      loadAvailablePaymentMethods()
    }
  }, [showPaymentModal])

  const loadAvailablePaymentMethods = async () => {
    setLoading(true)
    try {
      const methods = await mercadoPagoService.getAvailablePaymentMethods()
      setAvailablePaymentMethods(methods)
    } catch (error) {
      console.error('Error loading payment methods:', error)
      setAvailablePaymentMethods([])
    } finally {
      setLoading(false)
    }
  }

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const createOrder = async (paymentMethod: 'pix' | 'credit' | 'debit') => {
    if (cart.length === 0) {
      alert('Carrinho vazio')
      return null
    }

    setCreating(true)
    try {
      const order = await orderService.createOrder({
        items: cart,
        customer: customer || undefined,
        payment_method: paymentMethod,
        subtotal,
        discount,
        total
      })

      setCurrentOrder(order)
      setCurrentOrderId(order.id)
      return order.id
    } catch (error) {
      console.error('Error creating order:', error)
      alert('Erro ao criar pedido. Tente novamente.')
      return null
    } finally {
      setCreating(false)
    }
  }

  const handlePaymentMethod = async (method: 'pix' | 'credit' | 'debit') => {
    // Verificar se o método está disponível
    if (!availablePaymentMethods.includes(method)) {
      alert(`Pagamento via ${method === 'pix' ? 'PIX' : method === 'credit' ? 'cartão de crédito' : 'cartão de débito'} não está disponível no momento.`)
      return
    }

    const orderId = await createOrder(method)
    if (!orderId) return

    if (method === 'pix') {
      setShowPIXModal(true)
    } else {
      setCardType(method)
      setShowCardModal(true)
    }
  }

  const handleClosePaymentModals = () => {
    setShowPIXModal(false)
    setShowCardModal(false)
    setCurrentOrderId('')
  }

  const handleClose = () => {
    setShowPaymentModal(false)
    setShowPIXModal(false)
    setShowCardModal(false)
    setCurrentOrderId('')
  }

  const isMethodAvailable = (method: string) => {
    return availablePaymentMethods.includes(method)
  }

  if (!showPaymentModal) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 safe-area">
        <div className="bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl w-full max-w-md border border-white/20">
          {/* Header */}
          <div className="gradient-primary p-4 sm:p-6 text-white rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-shadow">Forma de Pagamento</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-all duration-300 hover:scale-110"
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>
            <div className="mt-4 text-center">
              <p className="text-slate-200 text-sm sm:text-base">Total a pagar:</p>
              <p className="text-2xl sm:text-3xl font-bold text-shadow">{formatPrice(total)}</p>
              {discount > 0 && (
                <p className="text-green-300 text-xs sm:text-sm mt-1">
                  Desconto de {formatPrice(discount)} aplicado
                </p>
              )}
            </div>
          </div>

          {/* Payment Options */}
          <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-slate-600 mx-auto mb-4"></div>
                <p className="text-gray-600 text-sm sm:text-base">Carregando métodos de pagamento...</p>
              </div>
            ) : cart.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 text-sm sm:text-base">Carrinho vazio</p>
                <button
                  onClick={handleClose}
                  className="mt-4 px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  Voltar
                </button>
              </div>
            ) : availablePaymentMethods.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-10 w-10 sm:h-12 sm:w-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-gray-800 font-medium mb-2 text-sm sm:text-base">Nenhum método de pagamento disponível</p>
                <p className="text-gray-600 text-xs sm:text-sm mb-4">
                  Configure as integrações do Mercado Pago no painel administrativo.
                </p>
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-all duration-300 hover:scale-105 shadow-lg"
                >
                  Voltar
                </button>
              </div>
            ) : (
              <>
                {/* PIX */}
                <button
                  onClick={() => handlePaymentMethod('pix')}
                  disabled={creating || !isMethodAvailable('pix')}
                  className={`w-full flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 border-2 rounded-xl transition-all duration-300 group hover:scale-105 ${
                    isMethodAvailable('pix')
                      ? 'border-gray-200 hover:border-green-500 hover:bg-green-50'
                      : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                  } ${creating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`p-3 rounded-xl transition-colors ${
                    isMethodAvailable('pix')
                      ? 'bg-green-100 group-hover:bg-green-200'
                      : 'bg-gray-100'
                  }`}>
                    <QrCode className={`h-6 w-6 sm:h-8 sm:w-8 ${
                      isMethodAvailable('pix') ? 'text-green-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className={`font-semibold ${
                      isMethodAvailable('pix') ? 'text-gray-800' : 'text-gray-500'
                    }`}>PIX</h3>
                    <p className={`text-sm ${
                      isMethodAvailable('pix') ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {isMethodAvailable('pix') 
                        ? 'Pagamento instantâneo via QR Code'
                        : 'Não disponível - Desabilitado pelo administrador'
                      }
                    </p>
                  </div>
                  {isMethodAvailable('pix') && (
                    <div className="text-right">
                      <p className="text-green-600 font-medium text-xs sm:text-sm">Recomendado</p>
                      <p className="text-gray-500 text-xs">Aprovação imediata</p>
                    </div>
                  )}
                </button>

                {/* Credit Card */}
                <button
                  onClick={() => handlePaymentMethod('credit')}
                  disabled={creating || !isMethodAvailable('credit')}
                  className={`w-full flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 border-2 rounded-xl transition-all duration-300 group hover:scale-105 ${
                    isMethodAvailable('credit')
                      ? 'border-gray-200 hover:border-slate-500 hover:bg-slate-50'
                      : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                  } ${creating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`p-3 rounded-xl transition-colors ${
                    isMethodAvailable('credit')
                      ? 'bg-slate-100 group-hover:bg-slate-200'
                      : 'bg-gray-100'
                  }`}>
                    <CreditCard className={`h-6 w-6 sm:h-8 sm:w-8 ${
                      isMethodAvailable('credit') ? 'text-slate-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className={`font-semibold ${
                      isMethodAvailable('credit') ? 'text-gray-800' : 'text-gray-500'
                    }`}>Cartão de Crédito</h3>
                    <p className={`text-sm ${
                      isMethodAvailable('credit') ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {isMethodAvailable('credit') 
                        ? 'Via terminal Mercado Point'
                        : 'Não disponível - Desabilitado pelo administrador'
                      }
                    </p>
                  </div>
                  {isMethodAvailable('credit') && (
                    <div className="text-right">
                      <p className="text-slate-600 font-medium text-xs sm:text-sm">Parcelável</p>
                      <p className="text-gray-500 text-xs">Insira no terminal</p>
                    </div>
                  )}
                </button>

                {/* Debit Card */}
                <button
                  onClick={() => handlePaymentMethod('debit')}
                  disabled={creating || !isMethodAvailable('debit')}
                  className={`w-full flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 border-2 rounded-xl transition-all duration-300 group hover:scale-105 ${
                    isMethodAvailable('debit')
                      ? 'border-gray-200 hover:border-purple-500 hover:bg-purple-50'
                      : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                  } ${creating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`p-3 rounded-xl transition-colors ${
                    isMethodAvailable('debit')
                      ? 'bg-purple-100 group-hover:bg-purple-200'
                      : 'bg-gray-100'
                  }`}>
                    <Smartphone className={`h-6 w-6 sm:h-8 sm:w-8 ${
                      isMethodAvailable('debit') ? 'text-purple-600' : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className={`font-semibold ${
                      isMethodAvailable('debit') ? 'text-gray-800' : 'text-gray-500'
                    }`}>Cartão de Débito</h3>
                    <p className={`text-sm ${
                      isMethodAvailable('debit') ? 'text-gray-600' : 'text-gray-400'
                    }`}>
                      {isMethodAvailable('debit') 
                        ? 'Via terminal Mercado Point'
                        : 'Não disponível - Desabilitado pelo administrador'
                      }
                    </p>
                  </div>
                  {isMethodAvailable('debit') && (
                    <div className="text-right">
                      <p className="text-purple-600 font-medium text-xs sm:text-sm">À vista</p>
                      <p className="text-gray-500 text-xs">Insira no terminal</p>
                    </div>
                  )}
                </button>

                {creating && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-slate-600 mx-auto mb-2"></div>
                    <p className="text-gray-600 text-xs sm:text-sm">Criando pedido...</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Customer Info */}
          {customer && cart.length > 0 && availablePaymentMethods.length > 0 && (
            <div className="px-4 sm:px-6 pb-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h3 className="font-medium text-green-800 mb-1 text-sm sm:text-base">Cliente Identificado</h3>
                <p className="text-green-700 text-xs sm:text-sm">{customer.name}</p>
                <p className="text-green-600 text-xs">
                  Desconto de {customer.discount_percentage}% aplicado ({customer.type})
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-4 sm:p-6 bg-gray-50 rounded-b-2xl">
            <button
              onClick={handleClose}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-all duration-300 hover:scale-105 text-sm sm:text-base"
            >
              Voltar ao Carrinho
            </button>
          </div>
        </div>
      </div>

      {/* Payment Modals */}
      <PIXPaymentModal
        isOpen={showPIXModal}
        onClose={handleClosePaymentModals}
        amount={total}
        orderId={currentOrderId}
      />

      <CardPaymentModal
        isOpen={showCardModal}
        onClose={handleClosePaymentModals}
        amount={total}
        orderId={currentOrderId}
        paymentType={cardType}
      />
    </>
  )
}