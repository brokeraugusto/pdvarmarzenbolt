import { mercadoPagoCredentialsService } from './mercadoPagoCredentialsService'

interface PointDevice {
  id: string
  name: string
  status: 'online' | 'offline' | 'busy'
  battery_level?: number
  last_seen: string
  model: string
  serial_number: string
}

interface PointPaymentIntent {
  id: string
  amount: number
  description: string
  status: 'pending' | 'processing' | 'approved' | 'rejected' | 'cancelled'
  device_id: string
  external_reference?: string
  created_at: string
  updated_at: string
}

interface PointActivationResult {
  success: boolean
  device: PointDevice | null
  message: string
  error?: string
}

class MercadoPointService {
  private mockDevices: PointDevice[] = [
    {
      id: 'PAX_A910__SMARTPOS1234567890',
      name: 'Terminal Principal',
      status: 'online',
      battery_level: 85,
      last_seen: new Date().toISOString(),
      model: 'PAX A910',
      serial_number: 'SMARTPOS1234567890'
    },
    {
      id: 'PAX_A910__SMARTPOS0987654321',
      name: 'Terminal Backup',
      status: 'offline',
      battery_level: 45,
      last_seen: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      model: 'PAX A910',
      serial_number: 'SMARTPOS0987654321'
    }
  ]

  private mockPaymentIntents: Map<string, PointPaymentIntent> = new Map()

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // ==========================================
  // DEVICE MANAGEMENT
  // ==========================================

  async getAvailableDevices(): Promise<PointDevice[]> {
    await this.delay(1000)

    const credentials = await mercadoPagoCredentialsService.getPointCredentials()
    
    if (!credentials || !credentials.isActive) {
      throw new Error('Integração Point não está ativa. Configure as credenciais no painel administrativo.')
    }

    console.log('Buscando dispositivos Point disponíveis...')
    
    // Simular busca de dispositivos via API
    try {
      // Em produção seria: GET /point/integration-api/devices
      const baseUrl = mercadoPagoCredentialsService.getPointApiUrl()
      
      console.log('Mock: Simulando busca de dispositivos em:', baseUrl)
      
      // Simular resposta da API
      return this.mockDevices.map(device => ({
        ...device,
        last_seen: device.status === 'online' ? new Date().toISOString() : device.last_seen
      }))
    } catch (error) {
      console.error('Erro ao buscar dispositivos:', error)
      throw new Error('Falha ao conectar com a API do Point')
    }
  }

  async getDeviceStatus(deviceId: string): Promise<PointDevice | null> {
    await this.delay(500)

    const device = this.mockDevices.find(d => d.id === deviceId)
    
    if (!device) {
      return null
    }

    // Simular status em tempo real
    const randomStatus = Math.random()
    let status: 'online' | 'offline' | 'busy' = device.status

    if (randomStatus > 0.9) {
      status = 'busy'
    } else if (randomStatus > 0.8) {
      status = 'offline'
    } else {
      status = 'online'
    }

    return {
      ...device,
      status,
      last_seen: status === 'offline' ? device.last_seen : new Date().toISOString(),
      battery_level: Math.max(0, (device.battery_level || 100) - Math.floor(Math.random() * 5))
    }
  }

  async activateDevice(deviceId: string): Promise<PointActivationResult> {
    await this.delay(2000)

    console.log(`Ativando dispositivo Point: ${deviceId}`)

    const credentials = await mercadoPagoCredentialsService.getPointCredentials()
    
    if (!credentials || !credentials.isActive) {
      return {
        success: false,
        device: null,
        message: 'Integração Point não está configurada ou ativa',
        error: 'INTEGRATION_NOT_ACTIVE'
      }
    }

    const device = this.mockDevices.find(d => d.id === deviceId)
    
    if (!device) {
      return {
        success: false,
        device: null,
        message: 'Dispositivo não encontrado',
        error: 'DEVICE_NOT_FOUND'
      }
    }

    // Simular processo de ativação
    console.log('Mock: Enviando comando de ativação para o terminal...')
    await this.delay(1500)

    // Simular possíveis falhas
    const activationSuccess = Math.random() > 0.1 // 90% de sucesso

    if (!activationSuccess) {
      return {
        success: false,
        device: null,
        message: 'Falha na comunicação com o terminal. Verifique se está ligado e conectado.',
        error: 'ACTIVATION_FAILED'
      }
    }

    // Atualizar status do dispositivo
    const activatedDevice: PointDevice = {
      ...device,
      status: 'online',
      last_seen: new Date().toISOString(),
      battery_level: device.battery_level || 100
    }

    // Atualizar no mock
    const deviceIndex = this.mockDevices.findIndex(d => d.id === deviceId)
    if (deviceIndex >= 0) {
      this.mockDevices[deviceIndex] = activatedDevice
    }

    console.log('✅ Dispositivo ativado com sucesso!')

    return {
      success: true,
      device: activatedDevice,
      message: 'Terminal ativado e pronto para receber pagamentos'
    }
  }

  // ==========================================
  // PAYMENT PROCESSING
  // ==========================================

  async createPaymentIntent(request: {
    amount: number
    description: string
    deviceId: string
    externalReference?: string
  }): Promise<PointPaymentIntent> {
    await this.delay(1000)

    const credentials = await mercadoPagoCredentialsService.getPointCredentials()
    
    if (!credentials || !credentials.isActive) {
      throw new Error('Integração Point não está ativa')
    }

    const device = await this.getDeviceStatus(request.deviceId)
    
    if (!device) {
      throw new Error('Dispositivo não encontrado')
    }

    if (device.status !== 'online') {
      throw new Error(`Dispositivo está ${device.status}. Verifique a conexão.`)
    }

    const paymentIntent: PointPaymentIntent = {
      id: `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      amount: request.amount,
      description: request.description,
      status: 'pending',
      device_id: request.deviceId,
      external_reference: request.externalReference,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    // Salvar no mock
    this.mockPaymentIntents.set(paymentIntent.id, paymentIntent)

    console.log('Mock: Intenção de pagamento criada:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      device: request.deviceId
    })

    // Simular envio para o terminal
    this.simulateTerminalPayment(paymentIntent.id)

    return paymentIntent
  }

  async getPaymentIntentStatus(paymentIntentId: string): Promise<PointPaymentIntent | null> {
    await this.delay(300)

    const paymentIntent = this.mockPaymentIntents.get(paymentIntentId)
    
    if (!paymentIntent) {
      return null
    }

    return { ...paymentIntent }
  }

  async cancelPaymentIntent(paymentIntentId: string): Promise<boolean> {
    await this.delay(800)

    const paymentIntent = this.mockPaymentIntents.get(paymentIntentId)
    
    if (!paymentIntent) {
      return false
    }

    if (paymentIntent.status !== 'pending' && paymentIntent.status !== 'processing') {
      throw new Error('Não é possível cancelar um pagamento já processado')
    }

    // Atualizar status
    paymentIntent.status = 'cancelled'
    paymentIntent.updated_at = new Date().toISOString()
    
    this.mockPaymentIntents.set(paymentIntentId, paymentIntent)

    console.log('Mock: Pagamento cancelado:', paymentIntentId)

    return true
  }

  // ==========================================
  // SIMULATION HELPERS
  // ==========================================

  private async simulateTerminalPayment(paymentIntentId: string): Promise<void> {
    // Simular processamento no terminal
    setTimeout(async () => {
      const paymentIntent = this.mockPaymentIntents.get(paymentIntentId)
      
      if (!paymentIntent || paymentIntent.status !== 'pending') {
        return
      }

      // Atualizar para processando
      paymentIntent.status = 'processing'
      paymentIntent.updated_at = new Date().toISOString()
      this.mockPaymentIntents.set(paymentIntentId, paymentIntent)

      console.log('Mock: Terminal processando pagamento...')

      // Simular tempo de processamento (5-15 segundos)
      const processingTime = 5000 + Math.random() * 10000
      
      setTimeout(() => {
        const finalPaymentIntent = this.mockPaymentIntents.get(paymentIntentId)
        
        if (!finalPaymentIntent || finalPaymentIntent.status !== 'processing') {
          return
        }

        // Simular resultado (90% aprovado, 10% rejeitado)
        const isApproved = Math.random() > 0.1

        finalPaymentIntent.status = isApproved ? 'approved' : 'rejected'
        finalPaymentIntent.updated_at = new Date().toISOString()
        
        this.mockPaymentIntents.set(paymentIntentId, finalPaymentIntent)

        console.log(`Mock: Pagamento ${isApproved ? 'aprovado' : 'rejeitado'}:`, paymentIntentId)
      }, processingTime)
    }, 2000) // 2 segundos para começar o processamento
  }

  // ==========================================
  // DEVICE CONFIGURATION
  // ==========================================

  async configureDevice(deviceId: string, config: {
    name?: string
    timeout?: number
    autoConfirm?: boolean
  }): Promise<boolean> {
    await this.delay(1500)

    const device = this.mockDevices.find(d => d.id === deviceId)
    
    if (!device) {
      throw new Error('Dispositivo não encontrado')
    }

    console.log('Mock: Configurando dispositivo:', {
      deviceId,
      config
    })

    // Simular configuração
    if (config.name) {
      device.name = config.name
    }

    console.log('✅ Dispositivo configurado com sucesso!')

    return true
  }

  async testDeviceConnection(deviceId: string): Promise<{
    success: boolean
    latency: number
    message: string
  }> {
    await this.delay(2000)

    const device = this.mockDevices.find(d => d.id === deviceId)
    
    if (!device) {
      return {
        success: false,
        latency: 0,
        message: 'Dispositivo não encontrado'
      }
    }

    // Simular teste de conexão
    const latency = 50 + Math.random() * 200 // 50-250ms
    const success = Math.random() > 0.05 // 95% de sucesso

    if (!success) {
      return {
        success: false,
        latency: 0,
        message: 'Falha na comunicação com o terminal'
      }
    }

    // Atualizar status do dispositivo
    device.status = 'online'
    device.last_seen = new Date().toISOString()

    return {
      success: true,
      latency: Math.round(latency),
      message: `Conexão estabelecida com sucesso (${Math.round(latency)}ms)`
    }
  }

  // ==========================================
  // MONITORING
  // ==========================================

  async getDeviceHealth(deviceId: string): Promise<{
    battery: number
    temperature: number
    connectivity: 'excellent' | 'good' | 'poor' | 'offline'
    lastTransaction: string | null
    uptime: number
  }> {
    await this.delay(500)

    const device = this.mockDevices.find(d => d.id === deviceId)
    
    if (!device) {
      throw new Error('Dispositivo não encontrado')
    }

    // Simular dados de saúde
    const battery = device.battery_level || Math.floor(Math.random() * 100)
    const temperature = 25 + Math.random() * 15 // 25-40°C
    
    let connectivity: 'excellent' | 'good' | 'poor' | 'offline' = 'offline'
    if (device.status === 'online') {
      const signal = Math.random()
      if (signal > 0.8) connectivity = 'excellent'
      else if (signal > 0.6) connectivity = 'good'
      else connectivity = 'poor'
    }

    const uptime = Math.floor(Math.random() * 86400) // 0-24 horas em segundos

    return {
      battery,
      temperature: Math.round(temperature * 10) / 10,
      connectivity,
      lastTransaction: device.status === 'online' ? new Date(Date.now() - Math.random() * 3600000).toISOString() : null,
      uptime
    }
  }

  // ==========================================
  // UTILITIES
  // ==========================================

  formatDeviceId(deviceId: string): string {
    // Formatar ID do dispositivo para exibição
    const parts = deviceId.split('__')
    if (parts.length === 2) {
      return `${parts[0]} (${parts[1]})`
    }
    return deviceId
  }

  getDeviceStatusColor(status: string): string {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-100'
      case 'busy': return 'text-yellow-600 bg-yellow-100'
      case 'offline': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  getDeviceStatusLabel(status: string): string {
    switch (status) {
      case 'online': return 'Online'
      case 'busy': return 'Ocupado'
      case 'offline': return 'Offline'
      default: return 'Desconhecido'
    }
  }
}

export const mercadoPointService = new MercadoPointService()
export type { PointDevice, PointPaymentIntent, PointActivationResult }