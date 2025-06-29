export interface Product {
  id: string
  name: string
  description: string
  price: number
  cost_price: number
  margin_percentage: number
  image: string
  category_id: string
  stock: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  description: string
  order: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface CartItem {
  product: Product
  quantity: number
}

export interface User {
  id: string
  name: string
  phone: string
  email?: string
  type: 'funcionario' | 'morador' | 'cliente'
  discount_percentage: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  items: CartItem[]
  subtotal: number
  discount: number
  total: number
  customer?: User
  payment_method: 'pix' | 'credit' | 'debit'
  payment_status: 'pending' | 'approved' | 'rejected'
  created_at: string
}

export interface PaymentIntent {
  id: string
  amount: number
  payment_method: string
  status: string
  qr_code?: string
  qr_code_base64?: string
}

export interface Expense {
  id: string
  description: string
  amount: number
  category: 'operational' | 'administrative' | 'marketing' | 'maintenance' | 'other'
  date: string
  payment_method: 'cash' | 'pix' | 'credit' | 'debit' | 'transfer'
  notes?: string
  created_at: string
  updated_at: string
}

export interface PaymentFees {
  pix: number
  debit: number
  credit: {
    installment_1: number
    installment_2: number
    installment_3: number
    installment_4: number
    installment_5: number
    installment_6: number
    installment_7: number
    installment_8: number
    installment_9: number
    installment_10: number
  }
}

export interface CashFlowData {
  revenue: number
  costs: number
  expenses: number
  fees: number
  net_profit: number
  margin_percentage: number
  period: string
}

// Novas interfaces para credenciais duplas Mercado Pago
export interface CheckoutCredentials {
  accessToken: string
  publicKey: string
  clientId?: string
  clientSecret?: string
  environment: 'sandbox' | 'production'
  isActive: boolean // Nova propriedade para ativar/desativar
}

export interface PointCredentials {
  accessToken: string
  deviceId: string
  userId: string
  storeId?: string
  environment: 'sandbox' | 'production'
  isActive: boolean // Nova propriedade para ativar/desativar
}

export interface MercadoPagoConfig {
  // Checkout Transparente (PIX)
  checkout: CheckoutCredentials
  
  // Point Terminal (Cartões)
  point: PointCredentials
  
  // Configurações Gerais
  webhookUrl?: string
  notificationUrl?: string
  isActive: boolean
  
  // Auditoria
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
}

export interface MercadoPagoTransaction {
  id: string
  mpPaymentId?: string
  internalOrderId: string
  
  // Tipo de Pagamento
  paymentType: 'pix' | 'credit_card' | 'debit_card'
  integrationType: 'checkout' | 'point'
  
  // Dados da Transação
  amount: number
  currency: string
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  statusDetail?: string
  
  // Dados do Pagamento
  paymentMethodId?: string
  paymentTypeId?: string
  
  // PIX Específico
  qrCode?: string
  qrCodeBase64?: string
  ticketUrl?: string
  
  // Point Específico
  deviceId?: string
  terminalNumber?: string
  
  // Resposta Completa da API
  mpResponse?: any
  
  // Auditoria
  processedAt: string
  webhookReceivedAt?: string
}

export interface PixPaymentData {
  amount: number
  description: string
  email?: string
  orderId: string
}

export interface CardPaymentData {
  amount: number
  description: string
  orderId: string
  paymentType: 'credit' | 'debit'
}

export interface ConnectionTestResult {
  status: 'success' | 'error'
  message: string
  details?: any
}

// Nova interface para status das integrações
export interface IntegrationStatus {
  checkout: {
    configured: boolean
    active: boolean
    lastTested?: string
    testResult?: ConnectionTestResult
  }
  point: {
    configured: boolean
    active: boolean
    lastTested?: string
    testResult?: ConnectionTestResult
  }
}