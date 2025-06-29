import { supabase, testConnection, checkTables } from '../lib/supabase'

export const verifyDatabaseSetup = async () => {
  console.log('🔍 Verificando configuração do banco de dados...')
  
  // 1. Testar conexão
  console.log('📡 Testando conexão com Supabase...')
  const connectionOk = await testConnection()
  
  if (!connectionOk) {
    console.error('❌ Falha na conexão com Supabase')
    return false
  }
  
  console.log('✅ Conexão com Supabase estabelecida')
  
  // 2. Verificar se as tabelas existem
  console.log('📋 Verificando tabelas...')
  const tablesOk = await checkTables()
  
  if (!tablesOk) {
    console.error('❌ Algumas tabelas não foram encontradas')
    return false
  }
  
  console.log('✅ Todas as tabelas encontradas')
  
  // 3. Verificar dados de exemplo
  console.log('📊 Verificando dados existentes...')
  
  try {
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .select('*')
      .limit(5)
    
    if (catError) {
      console.error('❌ Erro ao buscar categorias:', catError)
      return false
    }
    
    console.log(`📁 Categorias encontradas: ${categories?.length || 0}`)
    
    const { data: products, error: prodError } = await supabase
      .from('products')
      .select('*')
      .limit(5)
    
    if (prodError) {
      console.error('❌ Erro ao buscar produtos:', prodError)
      return false
    }
    
    console.log(`📦 Produtos encontrados: ${products?.length || 0}`)
    
    const { data: users, error: userError } = await supabase
      .from('users')
      .select('*')
      .limit(5)
    
    if (userError) {
      console.error('❌ Erro ao buscar usuários:', userError)
      return false
    }
    
    console.log(`👥 Usuários encontrados: ${users?.length || 0}`)
    
    const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .limit(5)
    
    if (orderError) {
      console.error('❌ Erro ao buscar pedidos:', orderError)
      return false
    }
    
    console.log(`🛒 Pedidos encontrados: ${orders?.length || 0}`)
    
    const { data: expenses, error: expError } = await supabase
      .from('expenses')
      .select('*')
      .limit(5)
    
    if (expError) {
      console.error('❌ Erro ao buscar despesas:', expError)
      return false
    }
    
    console.log(`💰 Despesas encontradas: ${expenses?.length || 0}`)
    
    const { data: transactions, error: transError } = await supabase
      .from('mp_transactions')
      .select('*')
      .limit(5)
    
    if (transError) {
      console.error('❌ Erro ao buscar transações MP:', transError)
      return false
    }
    
    console.log(`💳 Transações MP encontradas: ${transactions?.length || 0}`)
    
    const { data: settings, error: settError } = await supabase
      .from('settings')
      .select('*')
      .limit(5)
    
    if (settError) {
      console.error('❌ Erro ao buscar configurações:', settError)
      return false
    }
    
    console.log(`⚙️ Configurações encontradas: ${settings?.length || 0}`)
    
    console.log('✅ Verificação do banco de dados concluída com sucesso!')
    return true
    
  } catch (error) {
    console.error('❌ Erro durante verificação:', error)
    return false
  }
}

export const createSampleData = async () => {
  console.log('🌱 Criando dados de exemplo...')
  
  try {
    // Criar categorias de exemplo
    const { data: categories, error: catError } = await supabase
      .from('categories')
      .upsert([
        {
          name: 'Bebidas',
          description: 'Refrigerantes, sucos e águas',
          order_index: 1,
          active: true
        },
        {
          name: 'Snacks',
          description: 'Salgadinhos, biscoitos e doces',
          order_index: 2,
          active: true
        },
        {
          name: 'Higiene',
          description: 'Produtos de higiene pessoal',
          order_index: 3,
          active: true
        },
        {
          name: 'Limpeza',
          description: 'Produtos de limpeza doméstica',
          order_index: 4,
          active: true
        }
      ], { onConflict: 'name' })
      .select()
    
    if (catError) {
      console.error('❌ Erro ao criar categorias:', catError)
      return false
    }
    
    console.log(`✅ Categorias criadas: ${categories?.length || 0}`)
    
    // Criar usuários de exemplo
    const { data: users, error: userError } = await supabase
      .from('users')
      .upsert([
        {
          name: 'João Silva',
          phone: '11987654321',
          email: 'joao@email.com',
          type: 'funcionario',
          discount_percentage: 20,
          active: true
        },
        {
          name: 'Maria Santos',
          phone: '11876543210',
          email: 'maria@email.com',
          type: 'morador',
          discount_percentage: 10,
          active: true
        }
      ], { onConflict: 'phone' })
      .select()
    
    if (userError) {
      console.error('❌ Erro ao criar usuários:', userError)
      return false
    }
    
    console.log(`✅ Usuários criados: ${users?.length || 0}`)
    
    // Criar produtos de exemplo se temos categorias
    if (categories && categories.length > 0) {
      const bebidasCategory = categories.find(c => c.name === 'Bebidas')
      const snacksCategory = categories.find(c => c.name === 'Snacks')
      
      if (bebidasCategory && snacksCategory) {
        const { data: products, error: prodError } = await supabase
          .from('products')
          .upsert([
            {
              name: 'Coca-Cola 350ml',
              description: 'Refrigerante de cola gelado',
              price: 4.50,
              cost_price: 2.80,
              margin_percentage: 60.71,
              image: 'https://images.pexels.com/photos/50593/coca-cola-cold-drink-soft-drink-coke-50593.jpeg?auto=compress&cs=tinysrgb&w=400',
              category_id: bebidasCategory.id,
              stock: 50,
              active: true
            },
            {
              name: 'Água Mineral 500ml',
              description: 'Água mineral natural',
              price: 2.00,
              cost_price: 1.20,
              margin_percentage: 66.67,
              image: 'https://images.pexels.com/photos/416528/pexels-photo-416528.jpeg?auto=compress&cs=tinysrgb&w=400',
              category_id: bebidasCategory.id,
              stock: 100,
              active: true
            },
            {
              name: 'Chips Batata 100g',
              description: 'Batata chips sabor original',
              price: 6.90,
              cost_price: 4.20,
              margin_percentage: 64.29,
              image: 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=400',
              category_id: snacksCategory.id,
              stock: 30,
              active: true
            },
            {
              name: 'Chocolate ao Leite',
              description: 'Barra de chocolate ao leite 90g',
              price: 5.50,
              cost_price: 3.30,
              margin_percentage: 66.67,
              image: 'https://images.pexels.com/photos/65882/chocolate-dark-coffee-confiserie-65882.jpeg?auto=compress&cs=tinysrgb&w=400',
              category_id: snacksCategory.id,
              stock: 25,
              active: true
            }
          ], { onConflict: 'name' })
          .select()
        
        if (prodError) {
          console.error('❌ Erro ao criar produtos:', prodError)
          return false
        }
        
        console.log(`✅ Produtos criados: ${products?.length || 0}`)
      }
    }
    
    console.log('✅ Dados de exemplo criados com sucesso!')
    return true
    
  } catch (error) {
    console.error('❌ Erro ao criar dados de exemplo:', error)
    return false
  }
}