import React, { useState, useEffect } from 'react'
import { X, QrCode, Copy, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'
import { mercadoPagoService } from '../../services/mercadoPagoService'
import { orderService } from '../../services/orderService'
import { useStore } from '../../store/useStore'

interface PIXPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  amount: number
  orderId: string
}

export const PIXPaymentModal: React.FC<PIXPaymentModalProps> = ({
  isOpen,
  onClose,
  amount,
  orderId
}) => {
  const [qrCode, setQrCode] = useState<string>('')
  const [qrCodeBase64, setQrCodeBase64] = useState<string>('')
  const [paymentId, setPaymentId] = useState<string>('')
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  const [copied, setCopied] = useState(false)
  const [timeLeft, setTimeLeft] = useState(300) // 5 minutes

  const { customer, clearCart, setShowCheckout, setShowPaymentModal } = useStore()

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price)
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const createPIXPayment = async () => {
    setLoading(true)
    setError('')

    try {
      const paymentRequest = {
        amount,
        description: `Compra Mercadinho - Pedido ${orderId}`,
        email: customer?.email || 'cliente@mercadinho.com',
        orderId
      }

      console.log('Creating PIX payment with data:', paymentRequest)

      const payment = await mercadoPagoService.createPIXPayment(paymentRequest)
      
      console.log('PIX payment created:', payment)
      
      setPaymentId(payment.id)
      setQrCode(payment.point_of_interaction.transaction_data.qr_code)
      setQrCodeBase64(payment.point_of_interaction.transaction_data.qr_code_base64)
      
      // Start polling for payment status
      startPaymentPolling(payment.id)
      
    } catch (err) {
      console.error('PIX Payment Error:', err)
      let errorMessage = 'Erro ao criar pagamento PIX'
      
      if (err instanceof Error) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const startPaymentPolling = async (paymentId: string) => {
    try {
      const payment = await mercadoPagoService.pollPaymentStatus(paymentId)
      setPaymentStatus(payment.status)
      
      // Update order status
      await orderService.updateOrderPaymentStatus(orderId, payment.status, payment.id)
      
      if (payment.status === 'approved') {
        handlePaymentSuccess()
      } else if (payment.status === 'rejected') {
        setError('Pagamento rejeitado. Tente novamente.')
      }
    } catch (err) {
      console.error('Payment polling error:', err)
      setError('Erro ao verificar status do pagamento')
    }
  }

  const handlePaymentSuccess = () => {
    clearCart()
    setTimeout(() => {
      setShowCheckout(false)
      setShowPaymentModal(false)
      onClose()
      // Usar notificação customizada do sistema ao invés de alert
      showSuccessNotification('Pagamento aprovado! Obrigado pela compra.')
    }, 2000)
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

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(qrCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Erro ao copiar:', err)
      // Fallback para navegadores que não suportam clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = qrCode
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleRetry = () => {
    setError('')
    setPaymentId('')
    setQrCode('')
    setQrCodeBase64('')
    setPaymentStatus('pending')
    setTimeLeft(300)
    createPIXPayment()
  }

  const handleClose = () => {
    setError('')
    setPaymentId('')
    setQrCode('')
    setQrCodeBase64('')
    setPaymentStatus('pending')
    setTimeLeft(300)
    setLoading(false)
    onClose()
  }

  // Timer countdown
  useEffect(() => {
    if (!isOpen || paymentStatus !== 'pending' || error) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setError('Tempo para pagamento expirado')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOpen, paymentStatus, error])

  // Initialize payment when modal opens
  useEffect(() => {
    if (isOpen && !paymentId && !loading && !error) {
      createPIXPayment()
      setTimeLeft(300) // Reset timer
    }
  }, [isOpen])

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setError('')
      setPaymentId('')
      setQrCode('')
      setQrCodeBase64('')
      setPaymentStatus('pending')
      setTimeLeft(300)
      setLoading(false)
      setCopied(false)
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <QrCode className="h-6 w-6" />
              <h2 className="text-xl font-bold">Pagamento PIX</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-4 text-center">
            <p className="text-green-100">Valor a pagar:</p>
            <p className="text-3xl font-bold">{formatPrice(amount)}</p>
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading && !error && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Gerando código PIX...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-center space-x-2">
                <XCircle className="h-5 w-5 text-red-500" />
                <p className="text-red-700 font-medium">Erro</p>
              </div>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              
              {error.includes('credenciais') || error.includes('conexão') || error.includes('configuradas') || error.includes('PIX válidos') ? (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="text-yellow-800 font-medium">Configuração necessária:</p>
                      <p className="text-yellow-700 mt-1">
                        Configure suas credenciais do Mercado Pago no painel administrativo para usar os pagamentos PIX.
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

          {qrCodeBase64 && paymentStatus === 'pending' && !error && (
            <>
              {/* Timer */}
              {timeLeft > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-center space-x-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <p className="text-blue-700 font-medium">
                      Tempo restante: {formatTime(timeLeft)}
                    </p>
                  </div>
                </div>
              )}

              {/* QR Code */}
              <div className="text-center mb-6">
                <div className="bg-white p-4 rounded-xl border-2 border-gray-200 inline-block">
                  <img
                    src={`data:image/png;base64,${qrCodeBase64}`}
                    alt="QR Code PIX"
                    className="w-48 h-48 mx-auto"
                  />
                </div>
                <p className="text-gray-600 text-sm mt-2">
                  Escaneie o código QR com seu app de banco
                </p>
              </div>

              {/* Copy Code */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ou copie o código PIX:
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={qrCode}
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-mono"
                  />
                  <button
                    onClick={copyToClipboard}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      copied
                        ? 'bg-green-100 text-green-700 border border-green-300'
                        : 'bg-blue-100 text-blue-700 border border-blue-300 hover:bg-blue-200'
                    }`}
                  >
                    {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                {copied && (
                  <p className="text-green-600 text-xs mt-1">Código copiado!</p>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h3 className="font-medium text-gray-800 mb-2">Como pagar:</h3>
                <ol className="text-sm text-gray-600 space-y-1">
                  <li>1. Abra o app do seu banco</li>
                  <li>2. Escolha a opção PIX</li>
                  <li>3. Escaneie o QR Code ou cole o código</li>
                  <li>4. Confirme o pagamento</li>
                </ol>
              </div>
            </>
          )}

          {/* Customer Info */}
          {customer && (
            <div className="mt-4 bg-gray-50 rounded-xl p-4">
              <h3 className="font-medium text-gray-800 mb-2">Cliente:</h3>
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
            className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
          >
            {paymentStatus === 'approved' ? 'Fechar' : 'Cancelar'}
          </button>
        </div>
      </div>
    </div>
  )
}