export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          order_index: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          order_index?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          order_index?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          cost_price: number
          margin_percentage: number
          image: string | null
          category_id: string | null
          stock: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          cost_price?: number
          margin_percentage?: number
          image?: string | null
          category_id?: string | null
          stock?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          cost_price?: number
          margin_percentage?: number
          image?: string | null
          category_id?: string | null
          stock?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          name: string
          phone: string
          email: string | null
          type: 'funcionario' | 'morador' | 'cliente'
          discount_percentage: number
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          phone: string
          email?: string | null
          type?: 'funcionario' | 'morador' | 'cliente'
          discount_percentage?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          phone?: string
          email?: string | null
          type?: 'funcionario' | 'morador' | 'cliente'
          discount_percentage?: number
          active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          subtotal: number
          discount: number
          total: number
          customer_id: string | null
          customer_data: any | null
          payment_method: 'pix' | 'credit' | 'debit'
          payment_status: 'pending' | 'approved' | 'rejected'
          mp_payment_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          subtotal: number
          discount?: number
          total: number
          customer_id?: string | null
          customer_data?: any | null
          payment_method: 'pix' | 'credit' | 'debit'
          payment_status?: 'pending' | 'approved' | 'rejected'
          mp_payment_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          subtotal?: number
          discount?: number
          total?: number
          customer_id?: string | null
          customer_data?: any | null
          payment_method?: 'pix' | 'credit' | 'debit'
          payment_status?: 'pending' | 'approved' | 'rejected'
          mp_payment_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          product_data: any
          quantity: number
          unit_price: number
          total_price: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          product_data: any
          quantity: number
          unit_price: number
          total_price: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          product_data?: any
          quantity?: number
          unit_price?: number
          total_price?: number
          created_at?: string
        }
      }
      expenses: {
        Row: {
          id: string
          description: string
          amount: number
          category: 'operational' | 'administrative' | 'marketing' | 'maintenance' | 'other'
          date: string
          payment_method: 'cash' | 'pix' | 'credit' | 'debit' | 'transfer'
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          description: string
          amount: number
          category: 'operational' | 'administrative' | 'marketing' | 'maintenance' | 'other'
          date: string
          payment_method: 'cash' | 'pix' | 'credit' | 'debit' | 'transfer'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          description?: string
          amount?: number
          category?: 'operational' | 'administrative' | 'marketing' | 'maintenance' | 'other'
          date?: string
          payment_method?: 'cash' | 'pix' | 'credit' | 'debit' | 'transfer'
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      mp_transactions: {
        Row: {
          id: string
          mp_payment_id: string | null
          internal_order_id: string | null
          payment_type: 'pix' | 'credit_card' | 'debit_card'
          integration_type: 'checkout' | 'point'
          amount: number
          currency: string
          status: 'pending' | 'approved' | 'rejected' | 'cancelled'
          status_detail: string | null
          qr_code: string | null
          qr_code_base64: string | null
          ticket_url: string | null
          device_id: string | null
          terminal_number: string | null
          mp_response: any | null
          processed_at: string
          webhook_received_at: string | null
        }
        Insert: {
          id?: string
          mp_payment_id?: string | null
          internal_order_id?: string | null
          payment_type: 'pix' | 'credit_card' | 'debit_card'
          integration_type: 'checkout' | 'point'
          amount: number
          currency?: string
          status: 'pending' | 'approved' | 'rejected' | 'cancelled'
          status_detail?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          ticket_url?: string | null
          device_id?: string | null
          terminal_number?: string | null
          mp_response?: any | null
          processed_at?: string
          webhook_received_at?: string | null
        }
        Update: {
          id?: string
          mp_payment_id?: string | null
          internal_order_id?: string | null
          payment_type?: 'pix' | 'credit_card' | 'debit_card'
          integration_type?: 'checkout' | 'point'
          amount?: number
          currency?: string
          status?: 'pending' | 'approved' | 'rejected' | 'cancelled'
          status_detail?: string | null
          qr_code?: string | null
          qr_code_base64?: string | null
          ticket_url?: string | null
          device_id?: string | null
          terminal_number?: string | null
          mp_response?: any | null
          processed_at?: string
          webhook_received_at?: string | null
        }
      }
      settings: {
        Row: {
          id: string
          key: string
          value: any
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          key: string
          value: any
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          key?: string
          value?: any
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}