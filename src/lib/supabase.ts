import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env file.')
  console.error('Required variables: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: false // PDV não precisa de sessões persistentes
    },
    global: {
      headers: {
        'apikey': supabaseAnonKey || 'placeholder-key'
      }
    }
  }
)

// Função para testar conexão
export const testConnection = async (): Promise<boolean> => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase credentials not configured')
      return false
    }

    const { data, error } = await supabase
      .from('categories')
      .select('count')
      .limit(1)

    if (error) {
      console.error('Supabase connection test failed:', error)
      return false
    }

    console.log('Supabase connection test successful')
    return true
  } catch (err) {
    console.error('Supabase connection test error:', err)
    return false
  }
}

// Função para verificar se as tabelas existem
export const checkTables = async (): Promise<boolean> => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Supabase credentials not configured')
      return false
    }

    const tables = ['categories', 'products', 'users', 'orders', 'order_items', 'expenses', 'mp_transactions', 'settings']
    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('count').limit(1)
        if (error) {
          console.error(`Table ${table} not found or accessible:`, error)
          return false
        }
      } catch (err) {
        console.error(`Error checking table ${table}:`, err)
        return false
      }
    }
    
    console.log('All required tables found and accessible')
    return true
  } catch (error) {
    console.error('Error checking tables:', error)
    return false
  }
}

// Função para verificar se as credenciais estão configuradas
export const isConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey && 
           supabaseUrl !== 'https://placeholder.supabase.co' && 
           supabaseAnonKey !== 'placeholder-key')
}