import React, { useState, useEffect } from 'react'
import { 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Battery, 
  Thermometer, 
  Activity,
  Power,
  Settings,
  TestTube,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock
} from 'lucide-react'
import { mercadoPointService, PointDevice, PointActivationResult } from '../../services/mercadoPointService'

export const PointDeviceManager: React.FC = () => {
  const [devices, setDevices] = useState<PointDevice[]>([])
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState<string | null>(null)
  const [testing, setTesting] = useState<string | null>(null)
  const [deviceHealth, setDeviceHealth] = useState<Record<string, any>>({})
  const [error, setError] = useState<string>('')

  useEffect(() => {
    loadDevices()
    
    // Atualizar status dos dispositivos a cada 30 segundos
    const interval = setInterval(loadDevices, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadDevices = async () => {
    try {
      setError('')
      const availableDevices = await mercadoPointService.getAvailableDevices()
      setDevices(availableDevices)
      
      // Carregar saúde dos dispositivos
      const healthData: Record<string, any> = {}
      for (const device of availableDevices) {
        try {
          const health = await mercadoPointService.getDeviceHealth(device.id)
          healthData[device.id] = health
        } catch (err) {
          console.warn(`Erro ao carregar saúde do dispositivo ${device.id}:`, err)
        }
      }
      setDeviceHealth(healthData)
    } catch (err) {
      console.error('Erro ao carregar dispositivos:', err)
      setError(err instanceof Error ? err.message : 'Erro ao carregar dispositivos')
    } finally {
      setLoading(false)
    }
  }

  const handleActivateDevice = async (deviceId: string) => {
    setActivating(deviceId)
    setError('')
    
    try {
      const result: PointActivationResult = await mercadoPointService.activateDevice(deviceId)
      
      if (result.success) {
        // Atualizar lista de dispositivos
        await loadDevices()
        showNotification('success', result.message)
      } else {
        setError(result.message)
        showNotification('error', result.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao ativar dispositivo'
      setError(errorMessage)
      showNotification('error', errorMessage)
    } finally {
      setActivating(null)
    }
  }

  const handleTestConnection = async (deviceId: string) => {
    setTesting(deviceId)
    
    try {
      const result = await mercadoPointService.testDeviceConnection(deviceId)
      
      if (result.success) {
        showNotification('success', result.message)
        await loadDevices() // Atualizar status
      } else {
        showNotification('error', result.message)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao testar conexão'
      showNotification('error', errorMessage)
    } finally {
      setTesting(null)
    }
  }

  const showNotification = (type: 'success' | 'error', message: string) => {
    // Implementar notificação toast
    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
      type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
    }`
    notification.textContent = message
    
    document.body.appendChild(notification)
    
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 5000)
  }

  const formatLastSeen = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    
    if (diffMins < 1) return 'Agora'
    if (diffMins < 60) return `${diffMins}min atrás`
    
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h atrás`
    
    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays}d atrás`
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Dispositivos Point</h2>
          <p className="text-gray-600 mt-1">Gerencie terminais de pagamento</p>
        </div>
        <button
          onClick={loadDevices}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar</span>
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-500" />
            <p className="text-red-700 font-medium">Erro</p>
          </div>
          <p className="text-red-600 text-sm mt-1">{error}</p>
        </div>
      )}

      {devices.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Smartphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum dispositivo encontrado</h3>
          <p className="text-gray-600 mb-4">
            Configure as credenciais do Point no painel de configurações para ver os dispositivos disponíveis.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {devices.map((device) => {
            const health = deviceHealth[device.id]
            const isActivating = activating === device.id
            const isTesting = testing === device.id
            
            return (
              <div key={device.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${
                      device.status === 'online' ? 'bg-green-100' :
                      device.status === 'busy' ? 'bg-yellow-100' : 'bg-gray-100'
                    }`}>
                      <Smartphone className={`h-5 w-5 ${
                        device.status === 'online' ? 'text-green-600' :
                        device.status === 'busy' ? 'text-yellow-600' : 'text-gray-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{device.name}</h3>
                      <p className="text-sm text-gray-500">{device.model}</p>
                    </div>
                  </div>
                  
                  <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                    mercadoPointService.getDeviceStatusColor(device.status)
                  }`}>
                    {mercadoPointService.getDeviceStatusLabel(device.status)}
                  </div>
                </div>

                {/* Device Info */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Serial:</span>
                    <span className="font-mono text-gray-900">{device.serial_number}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Última conexão:</span>
                    <span className="text-gray-900">{formatLastSeen(device.last_seen)}</span>
                  </div>

                  {device.battery_level !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 flex items-center space-x-1">
                        <Battery className="h-4 w-4" />
                        <span>Bateria:</span>
                      </span>
                      <span className={`font-medium ${
                        device.battery_level > 50 ? 'text-green-600' :
                        device.battery_level > 20 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {device.battery_level}%
                      </span>
                    </div>
                  )}
                </div>

                {/* Health Metrics */}
                {health && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Status do Sistema</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center space-x-2">
                        <Thermometer className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-600">Temp:</span>
                        <span className="font-medium">{health.temperature}°C</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Wifi className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-600">Sinal:</span>
                        <span className={`font-medium ${
                          health.connectivity === 'excellent' ? 'text-green-600' :
                          health.connectivity === 'good' ? 'text-blue-600' :
                          health.connectivity === 'poor' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {health.connectivity}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Clock className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-600">Uptime:</span>
                        <span className="font-medium">{formatUptime(health.uptime)}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Activity className="h-3 w-3 text-gray-500" />
                        <span className="text-gray-600">Última transação:</span>
                        <span className="font-medium">
                          {health.lastTransaction ? formatLastSeen(health.lastTransaction) : 'Nenhuma'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex space-x-2">
                  {device.status === 'offline' ? (
                    <button
                      onClick={() => handleActivateDevice(device.id)}
                      disabled={isActivating}
                      className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      {isActivating ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Ativando...</span>
                        </>
                      ) : (
                        <>
                          <Power className="h-4 w-4" />
                          <span>Ativar</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => handleTestConnection(device.id)}
                      disabled={isTesting}
                      className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                      {isTesting ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>Testando...</span>
                        </>
                      ) : (
                        <>
                          <TestTube className="h-4 w-4" />
                          <span>Testar</span>
                        </>
                      )}
                    </button>
                  )}
                  
                  <button
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    title="Configurações do dispositivo"
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                </div>

                {/* Status Messages */}
                {device.status === 'offline' && (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="text-yellow-800 font-medium">Terminal Offline</p>
                        <p className="text-yellow-700 mt-1">
                          Clique em "Ativar" para estabelecer conexão com o terminal.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {device.status === 'busy' && (
                  <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <Activity className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="text-blue-800 font-medium">Terminal Ocupado</p>
                        <p className="text-blue-700 mt-1">
                          O terminal está processando uma transação.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {device.status === 'online' && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="text-sm">
                        <p className="text-green-800 font-medium">Terminal Pronto</p>
                        <p className="text-green-700 mt-1">
                          O terminal está online e pronto para receber pagamentos.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-4">Como usar o MercadoPoint</h3>
        <div className="space-y-3 text-sm text-blue-700">
          <div className="flex items-start space-x-2">
            <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">1</span>
            <p><strong>Ativação:</strong> Certifique-se de que o terminal está ligado e conectado à internet.</p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">2</span>
            <p><strong>Configuração:</strong> Configure as credenciais do Point nas configurações do sistema.</p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">3</span>
            <p><strong>Teste:</strong> Use o botão "Testar" para verificar a comunicação com o terminal.</p>
          </div>
          <div className="flex items-start space-x-2">
            <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold mt-0.5">4</span>
            <p><strong>Pagamentos:</strong> Com o terminal online, os clientes poderão pagar com cartão no PDV.</p>
          </div>
        </div>
      </div>
    </div>
  )
}