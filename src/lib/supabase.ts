import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false // PDV não precisa de sessões persistentes
  }
})

// Função para testar conexão
export const testConnection = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('categories').select('count').limit(1)
    return !error
  } catch {
    return false
  }
}

// Função para verificar se as tabelas existem
export const checkTables = async (): Promise<boolean> => {
  try {
    const tables = ['categories', 'products', 'users', 'orders', 'order_items', 'expenses', 'mp_transactions', 'settings']
    
    for (const table of tables) {
      const { error } = await supabase.from(table).select('count').limit(1)
      if (error) {
        console.error(`Table ${table} not found:`, error)
        return false
      }
    }
    
    return true
  } catch (error) {
    console.error('Error checking tables:', error)
    return false
  }
}