import React, { useState, useEffect } from 'react'
import { X, CreditCard, CheckCircle, XCircle, Loader, AlertTriangle } from 'lucide-react'
import { mercadoPagoService } from '../../services/mercadoPagoService'
import { orderService } from '../../services/orderService'
import { useStore } from '../../store/useStore'

interface CardPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  amount: number
  orderId: string
  paymentType: 'credit' | 'debit'
}

export const CardPaymentModal: React.FC<CardPaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  orderId,
  paymentType
}) => {
  const [paymentIntentId, setPaymentIntentId] = useState<string>('')
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [processingStep, setProcessingStep] = useState<string>('')

  const { customer, clearCart, setShowCheckout, setShowPaymentModal } = useStore()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const showSuccessNotification = (message: string) => {
    // Criar notificação customizada
    const notification = document.createElement('div')
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg z-[9999] flex items-center space-x-2'
    notification.innerHTML = `
      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>
      <span>${message}</span>
    `
    
    document.body.appendChild(notification)
    
    // Remover após 5 segundos
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 5000)
  }

  const createCardPayment = async () => {
    setLoading(true)
    setError('')
    setProcessingStep('Conectando com o terminal...')

    try {
      const paymentRequest = {
        amount,
        description: `Compra Mercadinho - Pedido ${orderId}`,
        orderId,
        paymentType
      }

      setProcessingStep('Criando intenção de pagamento...')
      const paymentIntent = await mercadoPagoService.createPointPayment(paymentRequest)
      
      setPaymentIntentId(paymentIntent.id)
      setProcessingStep('Aguardando pagamento no terminal...')
      
      // Start polling for payment status
      startPaymentPolling(paymentIntent.id)
      
    } catch (err) {
      console.error('Card Payment Error:', err)
      let errorMessage = 'Erro ao processar pagamento no cartão'
      
      if (err instanceof Error) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      setLoading(false)
    }
  }

  const startPaymentPolling = async (paymentIntentId: string) => {
    const maxAttempts = 60 // 2 minutes with 2-second intervals
    let attempts = 0

    const poll = async () => {
      try {
        attempts++
        setProcessingStep(`Verificando pagamento... (${attempts}/${maxAttempts})`)
        
        const payment = await mercadoPagoService.getPointPaymentStatus(paymentIntentId)
        
        if (payment.status === 'approved' || payment.status === 'rejected') {
          setPaymentStatus(payment.status)
          setLoading(false)
          
          // Update order status
          await orderService.updateOrderPaymentStatus(orderId, payment.status, payment.id)
          
          if (payment.status === 'approved') {
            handlePaymentSuccess()
          } else {
            setError('Pagamento rejeitado. Verifique os dados do cartão e tente novamente.')
          }
          return
        }

        if (attempts < maxAttempts) {
          setTimeout(poll, 2000) // Poll every 2 seconds
        } else {
          setLoading(false)
          setError('Tempo limite excedido. Verifique se o pagamento foi processado no terminal.')
        }
      } catch (err) {
        console.error('Polling error:', err)
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000)
        } else {
          setLoading(false)
          setError('Erro ao verificar status do pagamento')
        }
      }
    }

    poll()
  }

  const handlePaymentSuccess = () => {
    clearCart()
    setTimeout(() => {
      setShowCheckout(false)
      setShowPaymentModal(false)
      onClose()
      showSuccessNotification('Pagamento aprovado! Obrigado pela compra.')
    }, 2000)
  }

  const handleRetry = () => {
    setError('')
    setPaymentIntentId('')
    setPaymentStatus('pending')
    setProcessingStep('')
    createCardPayment()
  }

  const handleClose = () => {
    setError('')
    setPaymentIntentId('')
    setPaymentStatus('pending')
    setProcessingStep('')
    setLoading(false)
    onClose()
  }

  // Initialize payment when modal opens
  useEffect(() => {
    if (isOpen && !paymentIntentId && !loading && !error) {
      createCardPayment()
    }
  }, [isOpen])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError('')
      setPaymentIntentId('')
      setPaymentStatus('pending')
      setProcessingStep('')
      setLoading(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${
          paymentType === 'credit' 
            ? 'from-blue-600 to-blue-700' 
            : 'from-purple-600 to-purple-700'
        } p-6 text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CreditCard className="h-6 w-6" />
              <h2 className="text-xl font-bold">
                Cartão de {paymentType === 'credit' ? 'Crédito' : 'Débito'}
              </h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 text-center">
            <p className={`${paymentType === 'credit' ? 'text-blue-100' : 'text-purple-100'}`}>
              Valor a pagar:
            </p>
            <p className="text-3xl font-bold">{formatPrice(amount)}</p>
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading && !error && (
            <div className="text-center py-8">
              <div className="flex items-center justify-center mb-4">
                <Loader className="animate-spin h-12 w-12 text-blue-600" />
              </div>
              <p className="text-gray-800 font-medium mb-2">Processando pagamento...</p>
              <p className="text-gray-600 text-sm">{processingStep}</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <p className="text-red-700 font-medium">Erro no Pagamento</p>
              </div>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              
              {error.includes('credenciais') || error.includes('conexão') || error.includes('configuradas') || error.includes('Device ID') ? (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="text-yellow-800 font-medium">Configuração necessária:</p>
                      <p className="text-yellow-700 mt-1">
                        Configure suas credenciais do Mercado Pago Point e Device ID no painel administrativo para usar pagamentos com cartão.
                      </p>
                      <p className="text-yellow-600 text-xs mt-2">
                        Acesse /admin → Configurações → Mercado Pago para configurar as credenciais.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleRetry}
                  className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
                >
                  Tentar novamente
                </button>
              )}
            </div>
          )}

          {paymentStatus === 'approved' && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <p className="text-green-700 font-medium">Pagamento Aprovado!</p>
              </div>
              <p className="text-green-600 text-sm mt-1">Obrigado pela compra.</p>
            </div>
          )}

          {loading && !error && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <h3 className="font-medium text-blue-800 mb-3">Instruções:</h3>
              <ol className="text-sm text-blue-700 space-y-2">
                <li className="flex items-start space-x-2">
                  <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">1</span>
                  <span>Insira ou aproxime seu cartão no terminal</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">2</span>
                  <span>Digite sua senha quando solicitado</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">3</span>
                  <span>Aguarde a confirmação do pagamento</span>
                </li>
              </ol>
            </div>
          )}

          {customer && (
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="font-medium text-gray-800 mb-2">Dados do Cliente:</h3>
              <p className="text-sm text-gray-600">Nome: {customer.name}</p>
              <p className="text-sm text-gray-600">Telefone: {customer.phone}</p>
              {customer.discount_percentage > 0 && (
                <p className="text-sm text-green-600 font-medium">
                  Desconto aplicado: {customer.discount_percentage}%
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t">
          <button
            onClick={handleClose}
            disabled={loading && paymentStatus === 'pending'}
            className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {paymentStatus === 'approved' ? 'Fechar' : loading ? 'Processando...' : 'Cancelar'}
          </button>
        </div>
      </div>
    </div>
  )
}