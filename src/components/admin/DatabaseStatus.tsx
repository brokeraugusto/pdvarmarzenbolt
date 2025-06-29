import React, { useState, useEffect } from 'react'
import { Database, CheckCircle, XCircle, RefreshCw, Plus } from 'lucide-react'
import { verifyDatabaseSetup, createSampleData } from '../../utils/databaseCheck'

export const DatabaseStatus: React.FC = () => {
  const [checking, setChecking] = useState(false)
  const [creating, setCreating] = useState(false)
  const [status, setStatus] = useState<'unknown' | 'connected' | 'error'>('unknown')
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const checkDatabase = async () => {
    setChecking(true)
    setLogs([])
    
    // Interceptar console.log para capturar logs
    const originalLog = console.log
    const originalError = console.error
    
    console.log = (...args) => {
      addLog(args.join(' '))
      originalLog(...args)
    }
    
    console.error = (...args) => {
      addLog(`ERROR: ${args.join(' ')}`)
      originalError(...args)
    }
    
    try {
      const result = await verifyDatabaseSetup()
      setStatus(result ? 'connected' : 'error')
    } catch (error) {
      setStatus('error')
      addLog(`ERRO: ${error}`)
    } finally {
      // Restaurar console original
      console.log = originalLog
      console.error = originalError
      setChecking(false)
    }
  }

  const createSamples = async () => {
    setCreating(true)
    
    // Interceptar console.log para capturar logs
    const originalLog = console.log
    const originalError = console.error
    
    console.log = (...args) => {
      addLog(args.join(' '))
      originalLog(...args)
    }
    
    console.error = (...args) => {
      addLog(`ERROR: ${args.join(' ')}`)
      originalError(...args)
    }
    
    try {
      await createSampleData()
      addLog('✅ Dados de exemplo criados!')
    } catch (error) {
      addLog(`ERRO: ${error}`)
    } finally {
      // Restaurar console original
      console.log = originalLog
      console.error = originalError
      setCreating(false)
    }
  }

  useEffect(() => {
    checkDatabase()
  }, [])

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${
            status === 'connected' ? 'bg-green-100' : 
            status === 'error' ? 'bg-red-100' : 'bg-gray-100'
          }`}>
            <Database className={`h-5 w-5 ${
              status === 'connected' ? 'text-green-600' : 
              status === 'error' ? 'text-red-600' : 'text-gray-600'
            }`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Status do Banco de Dados</h3>
            <p className="text-sm text-gray-600">Verificação da conexão e estrutura do Supabase</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {status === 'connected' && (
            <div className="flex items-center space-x-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Conectado</span>
            </div>
          )}
          
          {status === 'error' && (
            <div className="flex items-center space-x-1 text-red-600">
              <XCircle className="h-4 w-4" />
              <span className="text-sm font-medium">Erro</span>
            </div>
          )}
          
          <button
            onClick={checkDatabase}
            disabled={checking}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />
            <span>{checking ? 'Verificando...' : 'Verificar'}</span>
          </button>
          
          <button
            onClick={createSamples}
            disabled={creating || status !== 'connected'}
            className="flex items-center space-x-2 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            <span>{creating ? 'Criando...' : 'Dados Exemplo'}</span>
          </button>
        </div>
      </div>

      {/* Logs */}
      <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Logs de Verificação:</h4>
        {logs.length === 0 ? (
          <p className="text-gray-500 text-sm">Nenhum log disponível</p>
        ) : (
          <div className="space-y-1">
            {logs.map((log, index) => (
              <div key={index} className={`text-xs font-mono ${
                log.includes('ERROR') ? 'text-red-600' : 
                log.includes('✅') ? 'text-green-600' : 
                log.includes('❌') ? 'text-red-600' : 'text-gray-600'
              }`}>
                {log}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Instruções */}
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h4 className="text-sm font-medium text-blue-800 mb-2">Instruções:</h4>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>1. <strong>Verificar:</strong> Clique em "Verificar" para testar a conexão com o banco</li>
          <li>2. <strong>Dados Exemplo:</strong> Se conectado, clique em "Dados Exemplo" para criar categorias e produtos iniciais</li>
          <li>3. <strong>Configuração:</strong> Certifique-se de que o arquivo .env está configurado corretamente</li>
        </ol>
      </div>
    </div>
  )
}