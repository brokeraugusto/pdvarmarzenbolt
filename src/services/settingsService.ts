import { PaymentFees } from '../types'

interface AppSettings {
  paymentFees: PaymentFees
  storeName: string
  storeVersion: string
  storeLogo: string
  paymentMethods: PaymentMethodSettings
  mercadoPago: {
    accessToken: string
    publicKey: string
    deviceId: string
    userId: string
    environment: 'sandbox' | 'production'
  }
  discounts: {
    defaultEmployeeDiscount: number
    defaultResidentDiscount: number
    maxDiscount: number
  }
}

class SettingsService {
  private settings: AppSettings

  constructor() {
    this.settings = {
      paymentFees: {
        pix: 0.99, // Taxa fixa em %
        debit: 1.99,
        credit: {
          installment_1: 2.99,
          installment_2: 3.49,
          installment_3: 3.99,
          installment_4: 4.49,
          installment_5: 4.99,
          installment_6: 5.49,
          installment_7: 5.99,
          installment_8: 6.49,
          installment_9: 6.99,
          installment_10: 7.49
        }
      },
      storeName: import.meta.env.VITE_APP_NAME || 'Mercadinho',
      storeVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
      storeLogo: '',
      paymentMethods: {
        pix: {
          enabled: true,
          name: 'PIX',
          description: 'Pagamento instantâneo via QR Code'
        },
        credit: {
          enabled: true,
          name: 'Cartão de Crédito',
          description: 'Via terminal Mercado Point'
        },
        debit: {
          enabled: true,
          name: 'Cartão de Débito',
          description: 'Via terminal Mercado Point'
        }
      },
      mercadoPago: {
        accessToken: import.meta.env.VITE_MERCADO_PAGO_ACCESS_TOKEN || '',
        publicKey: import.meta.env.VITE_MERCADO_PAGO_PUBLIC_KEY || '',
        deviceId: import.meta.env.VITE_MERCADO_PAGO_DEVICE_ID || '',
        userId: import.meta.env.VITE_MERCADO_PAGO_USER_ID || '',
        environment: (import.meta.env.VITE_MERCADO_PAGO_ENV as 'sandbox' | 'production') || 'sandbox'
      },
      discounts: {
        defaultEmployeeDiscount: 15,
        defaultResidentDiscount: 10,
        maxDiscount: 25
      }
    }

    // Carregar configurações salvas do localStorage
    this.loadFromStorage()
  }

  private loadFromStorage() {
    try {
      const saved = localStorage.getItem('app_settings')
      if (saved) {
        const parsedSettings = JSON.parse(saved)
        this.settings = { ...this.settings, ...parsedSettings }
      }
    } catch (error) {
      console.error('Error loading settings from storage:', error)
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('app_settings', JSON.stringify(this.settings))
    } catch (error) {
      console.error('Error saving settings to storage:', error)
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async getSettings(): Promise<AppSettings> {
    await this.delay(300)
    return { ...this.settings }
  }

  async updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    await this.delay(600)
    
    this.settings = {
      ...this.settings,
      ...updates
    }
    
    this.saveToStorage()
    return { ...this.settings }
  }

  async getPaymentMethodSettings(): Promise<PaymentMethodSettings> {
    await this.delay(200)
    return { ...this.settings.paymentMethods }
  }

  async updatePaymentMethodSettings(settings: PaymentMethodSettings): Promise<PaymentMethodSettings> {
    await this.delay(400)
    
    this.settings.paymentMethods = { ...settings }
    this.saveToStorage()
    return { ...this.settings.paymentMethods }
  }

  async togglePaymentMethod(method: 'pix' | 'credit' | 'debit', enabled: boolean): Promise<PaymentMethodSettings> {
    await this.delay(300)
    
    this.settings.paymentMethods[method].enabled = enabled
    this.saveToStorage()
    return { ...this.settings.paymentMethods }
  }

  async getPaymentFees(): Promise<PaymentFees> {
    await this.delay(200)
    return { ...this.settings.paymentFees }
  }

  async updatePaymentFees(fees: PaymentFees): Promise<PaymentFees> {
    await this.delay(400)
    
    this.settings.paymentFees = { ...fees }
    this.saveToStorage()
    return { ...this.settings.paymentFees }
  }

  calculatePaymentFee(amount: number, method: 'pix' | 'debit' | 'credit', installments: number = 1): number {
    const fees = this.settings.paymentFees
    
    switch (method) {
      case 'pix':
        return amount * (fees.pix / 100)
      case 'debit':
        return amount * (fees.debit / 100)
      case 'credit':
        const installmentKey = `installment_${installments}` as keyof typeof fees.credit
        const feePercentage = fees.credit[installmentKey] || fees.credit.installment_1
        return amount * (feePercentage / 100)
      default:
        return 0
    }
  }

  getInstallmentFeePercentage(installments: number): number {
    const installmentKey = `installment_${installments}` as keyof typeof this.settings.paymentFees.credit
    return this.settings.paymentFees.credit[installmentKey] || this.settings.paymentFees.credit.installment_1
  }
}

export const settingsService = new SettingsService()