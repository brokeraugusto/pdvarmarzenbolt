import React, { useState, useEffect } from 'react'
import { Save, TestTube, CheckCircle, XCircle, Eye, EyeOff, Wifi, WifiOff, Power, PowerOff, AlertTriangle } from 'lucide-react'
import { mercadoPagoCredentialsService } from '../../services/mercadoPagoCredentialsService'
import { MercadoPagoConfig, ConnectionTestResult, IntegrationStatus } from '../../types'

export const MercadoPagoSettings: React.FC = () => {
  const [config, setConfig] = useState<MercadoPagoConfig | null>(null)
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showTokens, setShowTokens] = useState({
    checkoutAccess: false,
    checkoutSecret: false,
    pointAccess: false
  })
  const [testResults, setTestResults] = useState<{
    checkout: ConnectionTestResult | null
    point: ConnectionTestResult | null
  }>({
    checkout: null,
    point: null
  })
  const [testing, setTesting] = useState({
    checkout: false,
    point: false
  })
  const [toggling, setToggling] = useState({
    checkout: false,
    point: false
  })

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const [currentConfig, status] = await Promise.all([
        mercadoPagoCredentialsService.getCredentials(),
        mercadoPagoCredentialsService.getIntegrationStatus()
      ])
      setConfig(currentConfig)
      setIntegrationStatus(status)
    } catch (error) {
      console.error('Error loading config:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (section: 'checkout' | 'point', field: string, value: string) => {
    if (!config) return

    setConfig(prev => ({
      ...prev!,
      [section]: {
        ...prev![section],
        [field]: value
      }
    }))
  }

  const handleSave = async () => {
    if (!config) return

    setSaving(true)
    try {
      await mercadoPagoCredentialsService.saveCredentials(config)
      await loadConfig() // Recarregar status
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving config:', error)
      alert('Erro ao salvar configurações: ' + (error instanceof Error ? error.message : 'Erro desconhecido'))
    } finally {
      setSaving(false)
    }
  }

  const toggleIntegration = async (type: 'checkout' | 'point') => {
    if (!config) return

    setToggling(prev => ({ ...prev, [type]: true }))
    
    try {
      const newStatus = !config[type].isActive
      await mercadoPagoCredentialsService.toggleIntegration(type, newStatus)
      await loadConfig() // Recarregar configuração e status
    } catch (error) {
      console.error(`Error toggling ${type} integration:`, error)
      alert(`Erro ao ${config[type].isActive ? 'desativar' : 'ativar'} integração: ` + 
            (error instanceof Error ? error.message : 'Erro desconhecido'))
    } finally {
      setToggling(prev => ({ ...prev, [type]: false }))
    }
  }

  const testConnection = async (type: 'checkout' | 'point') => {
    setTesting(prev => ({ ...prev, [type]: true }))
    
    try {
      let result: ConnectionTestResult
      
      if (type === 'checkout') {
        result = await mercadoPagoCredentialsService.testCheckoutConnection()
      } else {
        result = await mercadoPagoCredentialsService.testPointConnection()
      }
      
      setTestResults(prev => ({ ...prev, [type]: result }))
      await loadConfig() // Recarregar status para atualizar último teste
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [type]: {
          status: 'error',
          message: error instanceof Error ? error.message : 'Erro desconhecido'
        }
      }))
    } finally {
      setTesting(prev => ({ ...prev, [type]: false }))
    }
  }

  const toggleTokenVisibility = (token: keyof typeof showTokens) => {
    setShowTokens(prev => ({ ...prev, [token]: !prev[token] }))
  }

  const formatLastTested = (dateString?: string) => {
    if (!dateString) return 'Nunca testado'
    return new Date(dateString).toLocaleString('pt-BR')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!config || !integrationStatus) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Erro ao carregar configurações</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações Mercado Pago</h1>
          <p className="text-gray-600 mt-1">Configure as credenciais para PIX e Terminal Point</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          <span>{saving ? 'Salvando...' : 'Salvar'}</span>
        </button>
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <p className="text-green-700">Configurações salvas com sucesso!</p>
          </div>
        </div>
      )}

      {/* Status Overview */}
      <div className="bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Status das Integrações</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                integrationStatus.checkout.active && integrationStatus.checkout.configured
                  ? 'bg-green-100'
                  : 'bg-gray-100'
              }`}>
                <Wifi className={`h-5 w-5 ${
                  integrationStatus.checkout.active && integrationStatus.checkout.configured
                    ? 'text-green-600'
                    : 'text-gray-400'
                }`} />
              </div>
              <div>
                <p className="font-medium text-gray-900">PIX (Checkout)</p>
                <p className="text-sm text-gray-600">
                  {integrationStatus.checkout.configured 
                    ? (integrationStatus.checkout.active ? 'Ativo' : 'Inativo')
                    : 'Não configurado'
                  }
                </p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              integrationStatus.checkout.active && integrationStatus.checkout.configured
                ? 'bg-green-100 text-green-800'
                : integrationStatus.checkout.configured
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {integrationStatus.checkout.configured 
                ? (integrationStatus.checkout.active ? 'Funcionando' : 'Desativado')
                : 'Pendente'
              }
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${
                integrationStatus.point.active && integrationStatus.point.configured
                  ? 'bg-green-100'
                  : 'bg-gray-100'
              }`}>
                <WifiOff className={`h-5 w-5 ${
                  integrationStatus.point.active && integrationStatus.point.configured
                    ? 'text-green-600'
                    : 'text-gray-400'
                }`} />
              </div>
              <div>
                <p className="font-medium text-gray-900">Cartões (Point)</p>
                <p className="text-sm text-gray-600">
                  {integrationStatus.point.configured 
                    ? (integrationStatus.point.active ? 'Ativo' : 'Inativo')
                    : 'Não configurado'
                  }
                </p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              integrationStatus.point.active && integrationStatus.point.configured
                ? 'bg-green-100 text-green-800'
                : integrationStatus.point.configured
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {integrationStatus.point.configured 
                ? (integrationStatus.point.active ? 'Funcionando' : 'Desativado')
                : 'Pendente'
              }
            </div>
          </div>
        </div>
      </div>

      {/* Checkout Transparente (PIX) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              config.checkout.isActive ? 'bg-green-100' : 'bg-gray-100'
            }`}>
              <Wifi className={`h-5 w-5 ${
                config.checkout.isActive ? 'text-green-600' : 'text-gray-400'
              }`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Checkout Transparente (PIX)</h3>
              <p className="text-sm text-gray-600">Credenciais para processar pagamentos PIX</p>
              {integrationStatus.checkout.lastTested && (
                <p className="text-xs text-gray-500">
                  Último teste: {formatLastTested(integrationStatus.checkout.lastTested)}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Status do último teste */}
            {integrationStatus.checkout.testResult && (
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs ${
                integrationStatus.checkout.testResult.status === 'success'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {integrationStatus.checkout.testResult.status === 'success' ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                <span>{integrationStatus.checkout.testResult.message}</span>
              </div>
            )}

            {/* Botão de ativar/desativar */}
            <button
              onClick={() => toggleIntegration('checkout')}
              disabled={toggling.checkout || !integrationStatus.checkout.configured}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                config.checkout.isActive
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
              title={!integrationStatus.checkout.configured ? 'Configure as credenciais primeiro' : ''}
            >
              {config.checkout.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
              <span>
                {toggling.checkout 
                  ? 'Alterando...' 
                  : config.checkout.isActive 
                    ? 'Desativar' 
                    : 'Ativar'
                }
              </span>
            </button>
            
            {/* Botão de teste */}
            <button
              onClick={() => testConnection('checkout')}
              disabled={testing.checkout || !config.checkout.isActive}
              className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
              title={!config.checkout.isActive ? 'Ative a integração primeiro' : ''}
            >
              <TestTube className="h-4 w-4" />
              <span>{testing.checkout ? 'Testando...' : 'Testar'}</span>
            </button>
          </div>
        </div>

        {!config.checkout.isActive && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-yellow-800 font-medium">Integração Desativada</p>
                <p className="text-yellow-700 text-sm mt-1">
                  Os pagamentos PIX não estarão disponíveis para os clientes enquanto esta integração estiver desativada.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Access Token *
            </label>
            <div className="relative">
              <input
                type={showTokens.checkoutAccess ? 'text' : 'password'}
                value={config.checkout.accessToken}
                onChange={(e) => handleInputChange('checkout', 'accessToken', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-12"
                placeholder="TEST-1234567890-abcdef..."
                disabled={config.checkout.isActive}
              />
              <button
                type="button"
                onClick={() => toggleTokenVisibility('checkoutAccess')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showTokens.checkoutAccess ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {config.checkout.isActive && (
              <p className="text-xs text-gray-500 mt-1">Desative a integração para editar</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Public Key *
            </label>
            <input
              type="text"
              value={config.checkout.publicKey}
              onChange={(e) => handleInputChange('checkout', 'publicKey', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="TEST-abcdef12-3456..."
              disabled={config.checkout.isActive}
            />
            {config.checkout.isActive && (
              <p className="text-xs text-gray-500 mt-1">Desative a integração para editar</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client ID (opcional)
            </label>
            <input
              type="text"
              value={config.checkout.clientId || ''}
              onChange={(e) => handleInputChange('checkout', 'clientId', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="1234567890123456"
              disabled={config.checkout.isActive}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client Secret (opcional)
            </label>
            <div className="relative">
              <input
                type={showTokens.checkoutSecret ? 'text' : 'password'}
                value={config.checkout.clientSecret || ''}
                onChange={(e) => handleInputChange('checkout', 'clientSecret', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-12"
                placeholder="abcdefghijklmnopqrstuvwxyz123456"
                disabled={config.checkout.isActive}
              />
              <button
                type="button"
                onClick={() => toggleTokenVisibility('checkoutSecret')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showTokens.checkoutSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ambiente *
            </label>
            <select
              value={config.checkout.environment}
              onChange={(e) => handleInputChange('checkout', 'environment', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              disabled={config.checkout.isActive}
            >
              <option value="sandbox">Sandbox (Teste)</option>
              <option value="production">Production (Produção)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Point Terminal (Cartões) */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${
              config.point.isActive ? 'bg-blue-100' : 'bg-gray-100'
            }`}>
              <WifiOff className={`h-5 w-5 ${
                config.point.isActive ? 'text-blue-600' : 'text-gray-400'
              }`} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Point Terminal (Cartões)</h3>
              <p className="text-sm text-gray-600">Credenciais para terminal físico de cartões</p>
              {integrationStatus.point.lastTested && (
                <p className="text-xs text-gray-500">
                  Último teste: {formatLastTested(integrationStatus.point.lastTested)}
                </p>
              )}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Status do último teste */}
            {integrationStatus.point.testResult && (
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs ${
                integrationStatus.point.testResult.status === 'success'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-red-100 text-red-700'
              }`}>
                {integrationStatus.point.testResult.status === 'success' ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                <span>{integrationStatus.point.testResult.message}</span>
              </div>
            )}

            {/* Botão de ativar/desativar */}
            <button
              onClick={() => toggleIntegration('point')}
              disabled={toggling.point || !integrationStatus.point.configured}
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 ${
                config.point.isActive
                  ? 'bg-red-100 text-red-700 hover:bg-red-200'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
              title={!integrationStatus.point.configured ? 'Configure as credenciais primeiro' : ''}
            >
              {config.point.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
              <span>
                {toggling.point 
                  ? 'Alterando...' 
                  : config.point.isActive 
                    ? 'Desativar' 
                    : 'Ativar'
                }
              </span>
            </button>
            
            {/* Botão de teste */}
            <button
              onClick={() => testConnection('point')}
              disabled={testing.point || !config.point.isActive}
              className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
              title={!config.point.isActive ? 'Ative a integração primeiro' : ''}
            >
              <TestTube className="h-4 w-4" />
              <span>{testing.point ? 'Testando...' : 'Testar'}</span>
            </button>
          </div>
        </div>

        {!config.point.isActive && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-yellow-800 font-medium">Integração Desativada</p>
                <p className="text-yellow-700 text-sm mt-1">
                  Os pagamentos com cartão (crédito e débito) não estarão disponíveis para os clientes enquanto esta integração estiver desativada.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Point Access Token *
            </label>
            <div className="relative">
              <input
                type={showTokens.pointAccess ? 'text' : 'password'}
                value={config.point.accessToken}
                onChange={(e) => handleInputChange('point', 'accessToken', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12"
                placeholder="TEST-9876543210-zyxwvu..."
                disabled={config.point.isActive}
              />
              <button
                type="button"
                onClick={() => toggleTokenVisibility('pointAccess')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showTokens.pointAccess ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {config.point.isActive && (
              <p className="text-xs text-gray-500 mt-1">Desative a integração para editar</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Device ID *
            </label>
            <input
              type="text"
              value={config.point.deviceId}
              onChange={(e) => handleInputChange('point', 'deviceId', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="PAX_A910__SMARTPOS1234567890"
              disabled={config.point.isActive}
            />
            {config.point.isActive && (
              <p className="text-xs text-gray-500 mt-1">Desative a integração para editar</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              User ID *
            </label>
            <input
              type="text"
              value={config.point.userId}
              onChange={(e) => handleInputChange('point', 'userId', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="987654321"
              disabled={config.point.isActive}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Store ID (opcional)
            </label>
            <input
              type="text"
              value={config.point.storeId || ''}
              onChange={(e) => handleInputChange('point', 'storeId', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="store_123456"
              disabled={config.point.isActive}
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ambiente *
            </label>
            <select
              value={config.point.environment}
              onChange={(e) => handleInputChange('point', 'environment', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={config.point.isActive}
            >
              <option value="sandbox">Sandbox (Teste)</option>
              <option value="production">Production (Produção)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Configurações Gerais */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações Gerais</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook URL (opcional)
            </label>
            <input
              type="url"
              value={config.webhookUrl || ''}
              onChange={(e) => setConfig(prev => ({ ...prev!, webhookUrl: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              placeholder="https://seudominio.com/webhook/mercadopago"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notification URL (opcional)
            </label>
            <input
              type="url"
              value={config.notificationUrl || ''}
              onChange={(e) => setConfig(prev => ({ ...prev!, notificationUrl: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              placeholder="https://seudominio.com/notifications/mercadopago"
            />
          </div>
        </div>
      </div>

      {/* Instruções */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-blue-800 mb-4">Como obter as credenciais</h3>
        
        <div className="space-y-4 text-sm text-blue-700">
          <div>
            <h4 className="font-medium">Checkout Transparente (PIX):</h4>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Acesse o <a href="https://www.mercadopago.com.br/developers/panel" target="_blank" rel="noopener noreferrer" className="underline">Painel do Desenvolvedor</a></li>
              <li>Crie uma aplicação</li>
              <li>Obtenha Access Token e Public Key</li>
              <li>Configure as credenciais e ative a integração</li>
            </ol>
          </div>
          
          <div>
            <h4 className="font-medium">Point Terminal (Cartões):</h4>
            <ol className="list-decimal list-inside mt-2 space-y-1">
              <li>Configure o terminal Point fisicamente</li>
              <li>Vincule o terminal à sua conta no painel Point</li>
              <li>Obtenha Device ID e credenciais específicas</li>
              <li>Configure as credenciais e ative a integração</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  )
}