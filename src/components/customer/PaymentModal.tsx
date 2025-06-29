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
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl w-full max-w-md">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-6 text-white rounded-t-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Forma de Pagamento</h2>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 text-center">
              <p className="text-blue-100">Total a pagar:</p>
              <p className="text-3xl font-bold">{formatPrice(total)}</p>
              {discount > 0 && (
                <p className="text-green-300 text-sm mt-1">
                  Desconto de {formatPrice(discount)} aplicado
                </p>
              )}
            </div>
          </div>

          {/* Payment Options */}
          <div className="p-6 space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando métodos de pagamento...</p>
              </div>
            ) : cart.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Carrinho vazio</p>
                <button
                  onClick={handleClose}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Voltar
                </button>
              </div>
            ) : availablePaymentMethods.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <p className="text-gray-800 font-medium mb-2">Nenhum método de pagamento disponível</p>
                <p className="text-gray-600 text-sm mb-4">
                  Configure as integrações do Mercado Pago no painel administrativo.
                </p>
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
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
                  className={`w-full flex items-center space-x-4 p-4 border-2 rounded-xl transition-all group ${
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
                    <QrCode className={`h-8 w-8 ${
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
                        : 'Não disponível - Configure no admin'
                      }
                    </p>
                  </div>
                  {isMethodAvailable('pix') && (
                    <div className="text-right">
                      <p className="text-green-600 font-medium text-sm">Recomendado</p>
                      <p className="text-gray-500 text-xs">Aprovação imediata</p>
                    </div>
                  )}
                </button>

                {/* Credit Card */}
                <button
                  onClick={() => handlePaymentMethod('credit')}
                  disabled={creating || !isMethodAvailable('credit')}
                  className={`w-full flex items-center space-x-4 p-4 border-2 rounded-xl transition-all group ${
                    isMethodAvailable('credit')
                      ? 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                      : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                  } ${creating ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className={`p-3 rounded-xl transition-colors ${
                    isMethodAvailable('credit')
                      ? 'bg-blue-100 group-hover:bg-blue-200'
                      : 'bg-gray-100'
                  }`}>
                    <CreditCard className={`h-8 w-8 ${
                      isMethodAvailable('credit') ? 'text-blue-600' : 'text-gray-400'
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
                        : 'Não disponível - Configure no admin'
                      }
                    </p>
                  </div>
                  {isMethodAvailable('credit') && (
                    <div className="text-right">
                      <p className="text-blue-600 font-medium text-sm">Parcelável</p>
                      <p className="text-gray-500 text-xs">Insira no terminal</p>
                    </div>
                  )}
                </button>

                {/* Debit Card */}
                <button
                  onClick={() => handlePaymentMethod('debit')}
                  disabled={creating || !isMethodAvailable('debit')}
                  className={`w-full flex items-center space-x-4 p-4 border-2 rounded-xl transition-all group ${
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
                    <Smartphone className={`h-8 w-8 ${
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
                        : 'Não disponível - Configure no admin'
                      }
                    </p>
                  </div>
                  {isMethodAvailable('debit') && (
                    <div className="text-right">
                      <p className="text-purple-600 font-medium text-sm">À vista</p>
                      <p className="text-gray-500 text-xs">Insira no terminal</p>
                    </div>
                  )}
                </button>

                {creating && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600 text-sm">Criando pedido...</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Customer Info */}
          {customer && cart.length > 0 && availablePaymentMethods.length > 0 && (
            <div className="px-6 pb-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h3 className="font-medium text-green-800 mb-1">Cliente Identificado</h3>
                <p className="text-green-700 text-sm">{customer.name}</p>
                <p className="text-green-600 text-xs">
                  Desconto de {customer.discount_percentage}% aplicado ({customer.type})
                </p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="p-6 bg-gray-50 rounded-b-2xl">
            <button
              onClick={handleClose}
              className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
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