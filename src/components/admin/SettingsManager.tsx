import React, { useState, useEffect } from 'react'
import { Save, CreditCard, Percent, Store, Key, Upload, Database, Smartphone, ToggleLeft, ToggleRight } from 'lucide-react'
import { MercadoPagoSettings } from './MercadoPagoSettings'
import { ImageUpload } from './ImageUpload'
import { DatabaseStatus } from './DatabaseStatus'
import { PointDeviceManager } from './PointDeviceManager'
import { settingsService } from '../../services/settingsService'
import { PaymentFees, PaymentMethodSettings } from '../../types'

type SettingsTab = 'general' | 'database' | 'mercadopago' | 'point' | 'fees' | 'discounts' | 'payment-methods'

export const SettingsManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('database')
  const [settings, setSettings] = useState({
    // Store Settings
    storeName: import.meta.env.VITE_APP_NAME || 'Armarzen',
    storeVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
    storeLogo: '',
    
    // Discount Settings
    defaultEmployeeDiscount: 15,
    defaultResidentDiscount: 10,
    maxDiscount: 25
  })

  const [paymentFees, setPaymentFees] = useState<PaymentFees>({
    pix: 0.99,
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
  })

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodSettings>({
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
  })

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const [appSettings, fees, methods] = await Promise.all([
        settingsService.getSettings(),
        settingsService.getPaymentFees(),
        settingsService.getPaymentMethodSettings()
      ])
      
      setSettings({
        storeName: appSettings.storeName,
        storeVersion: appSettings.storeVersion,
        storeLogo: appSettings.storeLogo || '',
        defaultEmployeeDiscount: appSettings.discounts.defaultEmployeeDiscount,
        defaultResidentDiscount: appSettings.discounts.defaultResidentDiscount,
        maxDiscount: appSettings.discounts.maxDiscount
      })
      
      setPaymentFees(fees)
      setPaymentMethods(methods)
    } catch (error) {
      console.error('Error loading settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    
    try {
      await Promise.all([
        settingsService.updateSettings({
          storeName: settings.storeName,
          storeVersion: settings.storeVersion,
          storeLogo: settings.storeLogo,
          paymentMethods,
          mercadoPago: {
            accessToken: '',
            publicKey: '',
            deviceId: '',
            userId: '',
            environment: 'sandbox' as 'sandbox' | 'production'
          },
          discounts: {
            defaultEmployeeDiscount: settings.defaultEmployeeDiscount,
            defaultResidentDiscount: settings.defaultResidentDiscount,
            maxDiscount: settings.maxDiscount
          },
          paymentFees
        }),
        settingsService.updatePaymentFees(paymentFees),
        settingsService.updatePaymentMethodSettings(paymentMethods)
      ])
      
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleLogoChange = (logoUrl: string) => {
    setSettings(prev => ({
      ...prev,
      storeLogo: logoUrl
    }))
  }

  const handleFeeChange = (method: 'pix' | 'debit', value: number) => {
    setPaymentFees(prev => ({
      ...prev,
      [method]: value
    }))
  }

  const handleCreditFeeChange = (installment: keyof PaymentFees['credit'], value: number) => {
    setPaymentFees(prev => ({
      ...prev,
      credit: {
        ...prev.credit,
        [installment]: value
      }
    }))
  }

  const tabs = [
    { id: 'database' as const, label: 'Banco de Dados', icon: Database },
    { id: 'general' as const, label: 'Geral', icon: Store },
    { id: 'mercadopago' as const, label: 'Mercado Pago', icon: Key },
    { id: 'point' as const, label: 'Point Devices', icon: Smartphone },
    { id: 'fees' as const, label: 'Taxas', icon: CreditCard },
    { id: 'discounts' as const, label: 'Descontos', icon: Percent }
  ]

  const renderContent = () => {
    if (loading && activeTab !== 'database' && activeTab !== 'point') {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )
    }

    switch (activeTab) {
      case 'database':
        return <DatabaseStatus />
        
      case 'mercadopago':
        return <MercadoPagoSettings />

      case 'point':
        return <PointDeviceManager />
      
      case 'general':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <Store className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Configurações Gerais</h3>
                <p className="text-sm text-gray-600">Informações básicas da loja e personalização</p>
              </div>
            </div>

            <div className="space-y-8">
              {/* Logotipo */}
              <div>
                <ImageUpload
                  currentImage={settings.storeLogo}
                  onImageChange={handleLogoChange}
                  type="logo"
                  label="Logotipo da Loja"
                  description="Este logotipo aparecerá na loja e na tela de login. Recomendamos uma imagem quadrada."
                  maxWidth={200}
                  maxHeight={200}
                />
              </div>

              {/* Informações básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Loja
                  </label>
                  <input
                    type="text"
                    value={settings.storeName}
                    onChange={(e) => handleInputChange('storeName', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Nome da sua loja"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Este nome aparecerá no cabeçalho da loja
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Versão do Sistema
                  </label>
                  <input
                    type="text"
                    value={settings.storeVersion}
                    onChange={(e) => handleInputChange('storeVersion', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Versão atual do sistema
                  </p>
                </div>
              </div>

              {/* Preview do logotipo */}
              {settings.storeLogo && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  <h4 className="text-md font-medium text-gray-800 mb-4">Preview do Cabeçalho</h4>
                  <div className="bg-gradient-to-r from-blue-900 to-blue-700 p-4 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <img
                        src={settings.storeLogo}
                        alt="Logo"
                        className="h-10 w-10 rounded-lg object-cover bg-white/10"
                      />
                      <div>
                        <h1 className="text-xl font-bold text-white">{settings.storeName}</h1>
                        <p className="text-blue-200 text-sm">Auto Atendimento</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      
      case 'fees':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <CreditCard className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Taxas de Pagamento</h3>
                <p className="text-sm text-gray-600">Configure as taxas para cada forma de pagamento</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* PIX and Debit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Taxa PIX (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={paymentFees.pix}
                    onChange={(e) => handleFeeChange('pix', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Taxa Débito (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={paymentFees.debit}
                    onChange={(e) => handleFeeChange('debit', parseFloat(e.target.value) || 0)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Credit Card Installments */}
              <div>
                <h4 className="text-md font-medium text-gray-800 mb-4">Taxas Cartão de Crédito (%)</h4>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries(paymentFees.credit).map(([key, value]) => {
                    const installmentNumber = key.replace('installment_', '')
                    return (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {installmentNumber}x
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          max="100"
                          value={value}
                          onChange={(e) => handleCreditFeeChange(key as keyof PaymentFees['credit'], parseFloat(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )
      
      case 'discounts':
        return (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Percent className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Configurações de Desconto</h3>
                <p className="text-sm text-gray-600">Configure os descontos para funcionários e moradores</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Desconto Funcionários (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.defaultEmployeeDiscount}
                  onChange={(e) => handleInputChange('defaultEmployeeDiscount', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Desconto padrão para funcionários</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Desconto Moradores (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.defaultResidentDiscount}
                  onChange={(e) => handleInputChange('defaultResidentDiscount', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Desconto padrão para moradores</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Desconto Máximo (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={settings.maxDiscount}
                  onChange={(e) => handleInputChange('maxDiscount', parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Limite máximo de desconto permitido</p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Como funciona:</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Funcionários:</strong> Recebem desconto automático ao inserir telefone cadastrado</li>
                <li>• <strong>Moradores:</strong> Recebem desconto automático ao inserir telefone cadastrado</li>
                <li>• <strong>Desconto Máximo:</strong> Limite que não pode ser ultrapassado em nenhuma situação</li>
                <li>• <strong>Validação:</strong> Sistema verifica automaticamente o tipo de usuário pelo telefone</li>
              </ul>
            </div>
          </div>
        )
      
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600 mt-1">Gerencie as configurações do sistema</p>
        </div>
        {(activeTab === 'general' || activeTab === 'fees' || activeTab === 'discounts') && (
        {(activeTab === 'general' || activeTab === 'fees' || activeTab === 'discounts' || activeTab === 'payment-methods') && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Salvando...' : 'Salvar'}</span>
          </button>
        )}
      </div>

      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-green-700">Configurações salvas com sucesso!</p>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  isActive
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Content */}
      <div>
        {renderContent()}
      </div>
    </div>
  )
}