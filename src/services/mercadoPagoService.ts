import { supabase } from '../lib/supabase'
import { PixPaymentData, CardPaymentData, MercadoPagoTransaction } from '../types'
import { mercadoPagoCredentialsService } from './mercadoPagoCredentialsService'

interface PIXPaymentRequest {
  transaction_amount: number
  description: string
  payment_method_id: 'pix'
  payer: {
    email?: string
    first_name?: string
    last_name?: string
    identification?: {
      type: string
      number: string
    }
  }
  notification_url?: string
  external_reference?: string
}

interface PIXPaymentResponse {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  status_detail: string
  transaction_amount: number
  point_of_interaction: {
    transaction_data: {
      qr_code: string
      qr_code_base64: string
      ticket_url: string
    }
  }
  date_created: string
  date_of_expiration: string
}

interface PointPaymentRequest {
  amount: number
  description?: string
  external_reference?: string
}

interface PointPaymentResponse {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  amount: number
  device_id: string
}

class MercadoPagoService {
  private generateIdempotencyKey(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9)
  }

  // ==========================================
  // VERIFICAÇÕES DE DISPONIBILIDADE
  // ==========================================

  async isPaymentMethodAvailable(method: 'pix' | 'credit' | 'debit'): Promise<boolean> {
    const availableMethods = mercadoPagoCredentialsService.getAvailablePaymentMethods()
    return availableMethods.includes(method)
  }

  async getAvailablePaymentMethods(): Promise<string[]> {
    return mercadoPagoCredentialsService.getAvailablePaymentMethods()
  }

  // ==========================================
  // CHECKOUT TRANSPARENTE (PIX)
  // ==========================================

  async createPIXPayment(request: PixPaymentData): Promise<PIXPaymentResponse> {
    try {
      // Verificar se PIX está disponível
      if (!await this.isPaymentMethodAvailable('pix')) {
        throw new Error('Pagamento PIX não está disponível. Verifique se a integração Checkout Transparente está ativa no painel administrativo.')
      }

      const credentials = await mercadoPagoCredentialsService.getCheckoutCredentials()
      
      if (!credentials || !credentials.accessToken || !credentials.isActive) {
        throw new Error('Credenciais do Checkout Transparente não configuradas ou integração desativada. Configure no painel administrativo.')
      }

      const baseUrl = mercadoPagoCredentialsService.getCheckoutApiUrl()
      
      // Estrutura correta conforme documentação do Mercado Pago para PIX
      const paymentRequest: PIXPaymentRequest = {
        transaction_amount: request.amount,
        description: request.description,
        payment_method_id: 'pix',
        payer: {
          email: request.email || 'cliente@mercadinho.com',
          first_name: 'Cliente',
          last_name: 'Mercadinho'
        },
        external_reference: request.orderId
      }

      // Adicionar notification_url se configurado
      const config = await mercadoPagoCredentialsService.getCredentials()
      if (config?.notificationUrl) {
        paymentRequest.notification_url = config.notificationUrl
      }

      console.log('Creating PIX payment with request:', {
        ...paymentRequest,
        // Mascarar dados sensíveis no log
        payer: {
          ...paymentRequest.payer,
          email: paymentRequest.payer.email?.replace(/(.{2}).*(@.*)/, '$1***$2')
        }
      })

      const response = await fetch(`${baseUrl}/v1/payments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': this.generateIdempotencyKey(),
          'User-Agent': 'PDV-Auto-Atendimento/1.0'
        },
        body: JSON.stringify(paymentRequest)
      })

      console.log('PIX payment response status:', response.status)

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        
        try {
          const errorData = await response.json()
          console.error('PIX payment error response:', errorData)
          
          if (errorData.message) {
            errorMessage = errorData.message
          } else if (errorData.cause && errorData.cause.length > 0) {
            const cause = errorData.cause[0]
            errorMessage = cause.description || cause.code || errorMessage
          } else if (errorData.error) {
            errorMessage = errorData.error
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError)
        }

        throw new Error(`Erro da API Mercado Pago: ${errorMessage}`)
      }

      const paymentResponse = await response.json()
      console.log('PIX payment created successfully:', {
        id: paymentResponse.id,
        status: paymentResponse.status,
        amount: paymentResponse.transaction_amount
      })
      
      // Validar se a resposta contém os dados necessários para PIX
      if (!paymentResponse.point_of_interaction?.transaction_data?.qr_code) {
        throw new Error('Resposta da API não contém dados PIX válidos. Verifique se o método de pagamento PIX está habilitado em sua conta.')
      }
      
      // Registrar transação no banco
      await this.logTransaction({
        mp_payment_id: paymentResponse.id,
        internal_order_id: request.orderId,
        payment_type: 'pix',
        integration_type: 'checkout',
        amount: request.amount,
        currency: 'BRL',
        status: paymentResponse.status,
        status_detail: paymentResponse.status_detail,
        qr_code: paymentResponse.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: paymentResponse.point_of_interaction?.transaction_data?.qr_code_base64,
        ticket_url: paymentResponse.point_of_interaction?.transaction_data?.ticket_url,
        mp_response: paymentResponse
      })

      return paymentResponse
    } catch (error) {
      console.error('Error creating PIX payment:', error)
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Erro de conexão com Mercado Pago. Verifique sua conexão com a internet e as credenciais da API.')
      }
      
      throw error
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PIXPaymentResponse> {
    try {
      const credentials = await mercadoPagoCredentialsService.getCheckoutCredentials()
      
      if (!credentials || !credentials.accessToken || !credentials.isActive) {
        throw new Error('Credenciais do Checkout não configuradas ou integração desativada')
      }

      const baseUrl = mercadoPagoCredentialsService.getCheckoutApiUrl()

      const response = await fetch(`${baseUrl}/v1/payments/${paymentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'PDV-Auto-Atendimento/1.0'
        }
      })

      if (!response.ok) {
        throw new Error(`Falha ao obter status do pagamento: ${response.statusText}`)
      }

      const paymentData = await response.json()
      
      // Atualizar log da transação com novo status
      await this.updateTransactionStatus(paymentId, paymentData.status, paymentData.status_detail)

      return paymentData
    } catch (error) {
      console.error('Error getting payment status:', error)
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Erro de conexão ao verificar status do pagamento.')
      }
      
      throw error
    }
  }

  // ==========================================
  // POINT TERMINAL (CARTÕES)
  // ==========================================

  async createPointPayment(request: CardPaymentData): Promise<PointPaymentResponse> {
    try {
      // Verificar se cartões estão disponíveis
      if (!await this.isPaymentMethodAvailable(request.paymentType)) {
        throw new Error(`Pagamento com ${request.paymentType === 'credit' ? 'cartão de crédito' : 'cartão de débito'} não está disponível. Verifique se a integração Point está ativa no painel administrativo.`)
      }

      const credentials = await mercadoPagoCredentialsService.getPointCredentials()
      
      if (!credentials || !credentials.accessToken || !credentials.deviceId || !credentials.isActive) {
        throw new Error('Credenciais do Point não configuradas ou integração desativada. Configure Device ID e Access Token no painel administrativo.')
      }

      const baseUrl = mercadoPagoCredentialsService.getPointApiUrl()
      
      const paymentRequest: PointPaymentRequest = {
        amount: Math.round(request.amount * 100), // Converter para centavos
        description: request.description,
        external_reference: request.orderId
      }

      const response = await fetch(`${baseUrl}/point/integration-api/payment-intents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json',
          'X-Idempotency-Key': this.generateIdempotencyKey(),
          'User-Agent': 'PDV-Auto-Atendimento/1.0'
        },
        body: JSON.stringify({
          ...paymentRequest,
          device_id: credentials.deviceId
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(`Erro da API Point: ${error.message || response.statusText}`)
      }

      const paymentResponse = await response.json()
      
      // Registrar transação no banco
      await this.logTransaction({
        mp_payment_id: paymentResponse.id,
        internal_order_id: request.orderId,
        payment_type: request.paymentType === 'credit' ? 'credit_card' : 'debit_card',
        integration_type: 'point',
        amount: request.amount,
        currency: 'BRL',
        status: paymentResponse.status,
        device_id: credentials.deviceId,
        mp_response: paymentResponse
      })

      return paymentResponse
    } catch (error) {
      console.error('Error creating Point payment:', error)
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Erro de conexão com Point API.')
      }
      
      throw error
    }
  }

  async getPointPaymentStatus(paymentIntentId: string): Promise<PointPaymentResponse> {
    try {
      const credentials = await mercadoPagoCredentialsService.getPointCredentials()
      
      if (!credentials || !credentials.accessToken || !credentials.isActive) {
        throw new Error('Credenciais do Point não configuradas ou integração desativada')
      }

      const baseUrl = mercadoPagoCredentialsService.getPointApiUrl()

      const response = await fetch(`${baseUrl}/point/integration-api/payment-intents/${paymentIntentId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${credentials.accessToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'PDV-Auto-Atendimento/1.0'
        }
      })

      if (!response.ok) {
        throw new Error(`Falha ao obter status do pagamento Point: ${response.statusText}`)
      }

      const paymentData = await response.json()
      
      // Atualizar log da transação
      await this.updateTransactionStatus(paymentIntentId, paymentData.status)

      return paymentData
    } catch (error) {
      console.error('Error getting Point payment status:', error)
      
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Erro de conexão ao verificar status do pagamento Point.')
      }
      
      throw error
    }
  }

  // ==========================================
  // POLLING E UTILITÁRIOS
  // ==========================================

  async pollPaymentStatus(
    paymentId: string, 
    maxAttempts: number = 30, 
    intervalMs: number = 2000
  ): Promise<PIXPaymentResponse> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const payment = await this.getPaymentStatus(paymentId)
        
        if (payment.status === 'approved' || payment.status === 'rejected') {
          return payment
        }

        await new Promise(resolve => setTimeout(resolve, intervalMs))
      } catch (error) {
        console.error(`Polling attempt ${attempt + 1} failed:`, error)
        if (attempt === maxAttempts - 1) throw error
      }
    }

    throw new Error('Timeout ao verificar status do pagamento')
  }

  // ==========================================
  // LOG DE TRANSAÇÕES E PERSISTÊNCIA
  // ==========================================

  private async logTransaction(transaction: Omit<MercadoPagoTransaction, 'id' | 'processed_at'>): Promise<void> {
    try {
      const { error } = await supabase
        .from('mp_transactions')
        .insert({
          mp_payment_id: transaction.mp_payment_id,
          internal_order_id: transaction.internal_order_id,
          payment_type: transaction.payment_type,
          integration_type: transaction.integration_type,
          amount: transaction.amount,
          currency: transaction.currency,
          status: transaction.status,
          status_detail: transaction.status_detail,
          qr_code: transaction.qr_code,
          qr_code_base64: transaction.qr_code_base64,
          ticket_url: transaction.ticket_url,
          device_id: transaction.device_id,
          terminal_number: transaction.terminal_number,
          mp_response: transaction.mp_response,
          webhook_received_at: transaction.webhook_received_at
        })

      if (error) {
        console.error('Error logging transaction:', error)
      } else {
        console.log('Transaction logged successfully:', {
          mp_payment_id: transaction.mp_payment_id,
          amount: transaction.amount,
          status: transaction.status
        })
      }
    } catch (error) {
      console.error('Error logging transaction:', error)
    }
  }

  private async updateTransactionStatus(mpPaymentId: string, status: string, statusDetail?: string): Promise<void> {
    try {
      const updateData: any = { status }
      if (statusDetail) {
        updateData.status_detail = statusDetail
      }
      
      // Adicionar timestamp de webhook se o status mudou
      if (status === 'approved' || status === 'rejected') {
        updateData.webhook_received_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('mp_transactions')
        .update(updateData)
        .eq('mp_payment_id', mpPaymentId)

      if (error) {
        console.error('Error updating transaction status:', error)
      } else {
        console.log('Transaction status updated:', {
          mpPaymentId,
          newStatus: status,
          statusDetail
        })
      }
    } catch (error) {
      console.error('Error updating transaction status:', error)
    }
  }

  async getTransactionLogs(): Promise<MercadoPagoTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('mp_transactions')
        .select('*')
        .order('processed_at', { ascending: false })

      if (error) {
        console.error('Error getting transaction logs:', error)
        return []
      }

      return data.map(this.mapTransactionFromDB)
    } catch (error) {
      console.error('Error getting transaction logs:', error)
      return []
    }
  }

  // ==========================================
  // VERIFICAÇÕES DE CONFIGURAÇÃO
  // ==========================================

  isConfigured(): boolean {
    return mercadoPagoCredentialsService.isCheckoutConfigured() || 
           mercadoPagoCredentialsService.isPointConfigured()
  }

  isCheckoutConfigured(): boolean {
    return mercadoPagoCredentialsService.isCheckoutConfigured()
  }

  isPointConfigured(): boolean {
    return mercadoPagoCredentialsService.isPointConfigured()
  }

  isCheckoutActive(): boolean {
    return mercadoPagoCredentialsService.isCheckoutActive()
  }

  isPointActive(): boolean {
    return mercadoPagoCredentialsService.isPointActive()
  }

  // ==========================================
  // UTILITÁRIOS PARA AUDITORIA
  // ==========================================

  async exportTransactionLogs(startDate?: string, endDate?: string): Promise<string> {
    let query = supabase
      .from('mp_transactions')
      .select('*')
      .order('processed_at', { ascending: false })

    if (startDate) query = query.gte('processed_at', startDate)
    if (endDate) query = query.lte('processed_at', endDate)

    const { data: logs, error } = await query

    if (error) {
      console.error('Error exporting transaction logs:', error)
      return ''
    }
    
    // Gerar CSV
    const headers = [
      'ID', 'MP Payment ID', 'Order ID', 'Payment Type', 'Integration Type',
      'Amount', 'Currency', 'Status', 'Status Detail', 'Processed At', 'Webhook Received At'
    ]
    
    const csvContent = [
      headers.join(','),
      ...logs.map(log => [
        log.id,
        log.mp_payment_id || '',
        log.internal_order_id || '',
        log.payment_type,
        log.integration_type,
        log.amount,
        log.currency,
        log.status,
        log.status_detail || '',
        log.processed_at,
        log.webhook_received_at || ''
      ].join(','))
    ].join('\n')
    
    return csvContent
  }

  async getTransactionStats(): Promise<{
    total: number
    byStatus: Record<string, number>
    byPaymentType: Record<string, number>
    totalAmount: number
    averageAmount: number
  }> {
    const { data: logs, error } = await supabase
      .from('mp_transactions')
      .select('*')

    if (error) {
      console.error('Error getting transaction stats:', error)
      return {
        total: 0,
        byStatus: {},
        byPaymentType: {},
        totalAmount: 0,
        averageAmount: 0
      }
    }
    
    const stats = {
      total: logs.length,
      byStatus: {} as Record<string, number>,
      byPaymentType: {} as Record<string, number>,
      totalAmount: 0,
      averageAmount: 0
    }
    
    logs.forEach(log => {
      // Contar por status
      stats.byStatus[log.status] = (stats.byStatus[log.status] || 0) + 1
      
      // Contar por tipo de pagamento
      stats.byPaymentType[log.payment_type] = (stats.byPaymentType[log.payment_type] || 0) + 1
      
      // Somar valores
      stats.totalAmount += parseFloat(log.amount)
    })
    
    stats.averageAmount = stats.total > 0 ? stats.totalAmount / stats.total : 0
    
    return stats
  }

  private mapTransactionFromDB(dbTransaction: any): MercadoPagoTransaction {
    return {
      id: dbTransaction.id,
      mpPaymentId: dbTransaction.mp_payment_id,
      internalOrderId: dbTransaction.internal_order_id,
      paymentType: dbTransaction.payment_type,
      integrationType: dbTransaction.integration_type,
      amount: parseFloat(dbTransaction.amount),
      currency: dbTransaction.currency,
      status: dbTransaction.status,
      statusDetail: dbTransaction.status_detail,
      qrCode: dbTransaction.qr_code,
      qrCodeBase64: dbTransaction.qr_code_base64,
      ticketUrl: dbTransaction.ticket_url,
      deviceId: dbTransaction.device_id,
      terminalNumber: dbTransaction.terminal_number,
      mpResponse: dbTransaction.mp_response,
      processedAt: dbTransaction.processed_at,
      webhookReceivedAt: dbTransaction.webhook_received_at
    }
  }
}

export const mercadoPagoService = new MercadoPagoService()
export type { PIXPaymentRequest, PIXPaymentResponse, PointPaymentRequest, PointPaymentResponse }