import { supabase } from '../lib/supabase'
import { testConnection } from '../lib/supabase'
import { Order, CartItem, User } from '../types'
import { isConfigured as isSupabaseConfigured } from '../lib/supabase'

interface CreateOrderRequest {
  items: CartItem[]
  customer?: User
  payment_method: 'pix' | 'credit' | 'debit'
  subtotal: number
  discount: number
  total: number
}

class OrderService {
  private async checkConnection(): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase não está configurado. Verifique as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env')
    }

    try {
      const { error } = await supabase.from('orders').select('count', { count: 'exact', head: true }).limit(1)
      if (error) {
        console.error('Supabase connection test failed:', error)
        throw new Error(`Erro de conexão com o banco de dados: ${error.message}`)
      }
    } catch (error: any) {
      if (error.message.includes('Supabase não está configurado')) {
        throw error
      }
      console.error('Database connection error:', error)
      throw new Error('Não foi possível conectar ao banco de dados. Verifique sua conexão e configurações.')
    }
  }

  async createOrder(request: CreateOrderRequest): Promise<Order> {
    await this.checkConnection()

    // Criar o pedido
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        subtotal: request.subtotal,
        discount: request.discount,
        total: request.total,
        customer_id: request.customer?.id || null,
        customer_data: request.customer ? {
          name: request.customer.name,
          phone: request.customer.phone,
          email: request.customer.email,
          type: request.customer.type,
          discount_percentage: request.customer.discount_percentage
        } : null,
        payment_method: request.payment_method,
        payment_status: 'pending'
      })
      .select('*')
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      throw new Error('Erro ao criar pedido')
    }

    // Criar os itens do pedido
    const orderItems = request.items.map(item => ({
      order_id: orderData.id,
      product_id: item.product.id,
      product_data: {
        name: item.product.name,
        description: item.product.description,
        price: item.product.price,
        image: item.product.image,
        category_id: item.product.category_id
      },
      quantity: item.quantity,
      unit_price: item.product.price,
      total_price: item.product.price * item.quantity
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      console.error('Error creating order items:', itemsError)
      // Tentar reverter o pedido criado
      await supabase.from('orders').delete().eq('id', orderData.id)
      throw new Error('Erro ao criar itens do pedido')
    }

    // Atualizar estoque dos produtos
    for (const item of request.items) {
      const { error: stockError } = await supabase.rpc('decrease_product_stock', {
        product_id: item.product.id,
        quantity: item.quantity
      })

      if (stockError) {
        console.warn(`Warning: Could not update stock for product ${item.product.id}:`, stockError)
      }
    }

    return this.mapOrderFromDB(orderData, request.items, request.customer)
  }

  async updateOrderPaymentStatus(orderId: string, status: 'pending' | 'approved' | 'rejected', mpPaymentId?: string): Promise<Order | null> {
    await this.checkConnection()

    const updateData: any = { payment_status: status }
    if (mpPaymentId) {
      updateData.mp_payment_id = mpPaymentId
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating order status:', error)
      return null
    }

    // Buscar itens do pedido
    const { data: itemsData } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)

    const items: CartItem[] = itemsData?.map(item => ({
      product: {
        id: item.product_id,
        name: item.product_data.name,
        description: item.product_data.description,
        price: item.unit_price,
        cost_price: 0,
        margin_percentage: 0,
        image: item.product_data.image,
        category_id: item.product_data.category_id,
        stock: 0,
        active: true,
        created_at: '',
        updated_at: ''
      },
      quantity: item.quantity
    })) || []

    return this.mapOrderFromDB(data, items)
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    await this.checkConnection()

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError) {
      if (orderError.code === 'PGRST116') return null
      console.error('Error fetching order:', orderError)
      return null
    }

    // Buscar itens do pedido
    const { data: itemsData } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', orderId)

    const items: CartItem[] = itemsData?.map(item => ({
      product: {
        id: item.product_id,
        name: item.product_data.name,
        description: item.product_data.description,
        price: item.unit_price,
        cost_price: 0,
        margin_percentage: 0,
        image: item.product_data.image,
        category_id: item.product_data.category_id,
        stock: 0,
        active: true,
        created_at: '',
        updated_at: ''
      },
      quantity: item.quantity
    })) || []

    // Buscar dados do cliente se existir
    let customer: User | undefined
    if (orderData.customer_id) {
      const { data: customerData } = await supabase
        .from('users')
        .select('*')
        .eq('id', orderData.customer_id)
        .single()

      if (customerData) {
        customer = {
          id: customerData.id,
          name: customerData.name,
          phone: customerData.phone,
          email: customerData.email,
          type: customerData.type,
          discount_percentage: customerData.discount_percentage,
          active: customerData.active,
          created_at: customerData.created_at,
          updated_at: customerData.updated_at
        }
      }
    } else if (orderData.customer_data) {
      customer = {
        id: '',
        name: orderData.customer_data.name,
        phone: orderData.customer_data.phone,
        email: orderData.customer_data.email,
        type: orderData.customer_data.type,
        discount_percentage: orderData.customer_data.discount_percentage,
        active: true,
        created_at: '',
        updated_at: ''
      }
    }

    return this.mapOrderFromDB(orderData, items, customer)
  }

  async getAllOrders(): Promise<Order[]> {
    await this.checkConnection()

    const { data: ordersData, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders:', error)
      throw new Error('Erro ao carregar pedidos')
    }

    const orders: Order[] = []

    for (const orderData of ordersData) {
      // Buscar itens do pedido
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderData.id)

      const items: CartItem[] = itemsData?.map(item => ({
        product: {
          id: item.product_id,
          name: item.product_data.name,
          description: item.product_data.description,
          price: item.unit_price,
          cost_price: 0,
          margin_percentage: 0,
          image: item.product_data.image,
          category_id: item.product_data.category_id,
          stock: 0,
          active: true,
          created_at: '',
          updated_at: ''
        },
        quantity: item.quantity
      })) || []

      // Buscar dados do cliente se existir
      let customer: User | undefined
      if (orderData.customer_id) {
        const { data: customerData } = await supabase
          .from('users')
          .select('*')
          .eq('id', orderData.customer_id)
          .single()

        if (customerData) {
          customer = {
            id: customerData.id,
            name: customerData.name,
            phone: customerData.phone,
            email: customerData.email,
            type: customerData.type,
            discount_percentage: customerData.discount_percentage,
            active: customerData.active,
            created_at: customerData.created_at,
            updated_at: customerData.updated_at
          }
        }
      } else if (orderData.customer_data) {
        customer = {
          id: '',
          name: orderData.customer_data.name,
          phone: orderData.customer_data.phone,
          email: orderData.customer_data.email,
          type: orderData.customer_data.type,
          discount_percentage: orderData.customer_data.discount_percentage,
          active: true,
          created_at: '',
          updated_at: ''
        }
      }

      orders.push(this.mapOrderFromDB(orderData, items, customer))
    }

    return orders
  }

  async getOrdersByDateRange(startDate: string, endDate: string): Promise<Order[]> {
    await this.checkConnection()

    const { data: ordersData, error } = await supabase
      .from('orders')
      .select('*')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching orders by date range:', error)
      return []
    }

    const orders: Order[] = []

    for (const orderData of ordersData) {
      // Buscar itens do pedido
      const { data: itemsData } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderData.id)

      const items: CartItem[] = itemsData?.map(item => ({
        product: {
          id: item.product_id,
          name: item.product_data.name,
          description: item.product_data.description,
          price: item.unit_price,
          cost_price: 0,
          margin_percentage: 0,
          image: item.product_data.image,
          category_id: item.product_data.category_id,
          stock: 0,
          active: true,
          created_at: '',
          updated_at: ''
        },
        quantity: item.quantity
      })) || []

      orders.push(this.mapOrderFromDB(orderData, items))
    }

    return orders
  }

  // Analytics methods
  async getTotalSales(startDate?: string, endDate?: string): Promise<number> {
    await this.checkConnection()

    let query = supabase
      .from('orders')
      .select('total')
      .eq('payment_status', 'approved')

    if (startDate) query = query.gte('created_at', startDate)
    if (endDate) query = query.lte('created_at', endDate)

    const { data, error } = await query

    if (error) {
      console.error('Error calculating total sales:', error)
      return 0
    }

    return data.reduce((total, order) => total + parseFloat(order.total), 0)
  }

  async getOrdersCount(status?: 'pending' | 'approved' | 'rejected'): Promise<number> {
    await this.checkConnection()

    let query = supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })

    if (status) query = query.eq('payment_status', status)

    const { count, error } = await query

    if (error) {
      console.error('Error counting orders:', error)
      return 0
    }

    return count || 0
  }

  async getAverageTicket(): Promise<number> {
    await this.checkConnection()

    const { data, error } = await supabase
      .from('orders')
      .select('total')
      .eq('payment_status', 'approved')

    if (error) {
      console.error('Error calculating average ticket:', error)
      return 0
    }

    if (data.length === 0) return 0

    const totalSales = data.reduce((total, order) => total + parseFloat(order.total), 0)
    return totalSales / data.length
  }

  generateReceipt(order: Order): string {
    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(price)
    }

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleString('pt-BR')
    }

    let receipt = `
=================================
        MERCADINHO
     AUTO ATENDIMENTO
=================================

Pedido: ${order.id}
Data: ${formatDate(order.created_at)}

${order.customer ? `Cliente: ${order.customer.name}` : 'Cliente: Não identificado'}
${order.customer ? `Telefone: ${order.customer.phone}` : ''}

---------------------------------
ITENS:
`

    order.items.forEach(item => {
      const itemTotal = item.product.price * item.quantity
      receipt += `
${item.product.name}
${item.quantity}x ${formatPrice(item.product.price)} = ${formatPrice(itemTotal)}`
    })

    receipt += `

---------------------------------
Subtotal: ${formatPrice(order.subtotal)}`

    if (order.discount > 0) {
      receipt += `
Desconto: -${formatPrice(order.discount)}`
    }

    receipt += `
TOTAL: ${formatPrice(order.total)}

Forma de Pagamento: ${order.payment_method.toUpperCase()}
Status: ${order.payment_status.toUpperCase()}

=================================
    Obrigado pela preferência!
=================================
`

    return receipt
  }

  private mapOrderFromDB(dbOrder: any, items: CartItem[], customer?: User): Order {
    return {
      id: dbOrder.id,
      items,
      subtotal: parseFloat(dbOrder.subtotal),
      discount: parseFloat(dbOrder.discount),
      total: parseFloat(dbOrder.total),
      customer,
      payment_method: dbOrder.payment_method,
      payment_status: dbOrder.payment_status,
      created_at: dbOrder.created_at
    }
  }
}

export const orderService = new OrderService()