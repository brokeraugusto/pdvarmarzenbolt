import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { CartItem, Product, Category, User, Order } from '../types'
import { productService } from '../services/productService'

interface Store {
  // Cart state
  cart: CartItem[]
  addToCart: (product: Product) => void
  removeFromCart: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getCartTotal: () => number
  getCartItemsCount: () => number

  // Products state
  products: Product[]
  categories: Category[]
  selectedCategory: string | null
  setSelectedCategory: (categoryId: string | null) => void
  getFilteredProducts: () => Product[]
  loadProducts: () => Promise<void>

  // Customer state
  customer: User | null
  setCustomer: (customer: User | null) => void

  // Order state
  currentOrder: Order | null
  setCurrentOrder: (order: Order | null) => void

  // UI state
  showCheckout: boolean
  setShowCheckout: (show: boolean) => void
  showPaymentModal: boolean
  setShowPaymentModal: (show: boolean) => void
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      // Cart state
      cart: [],
      addToCart: (product) => {
        const cart = get().cart
        const existingItem = cart.find(item => item.product.id === product.id)
        
        if (existingItem) {
          set({
            cart: cart.map(item =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + 1 }
                : item
            )
          })
        } else {
          set({ cart: [...cart, { product, quantity: 1 }] })
        }
      },
      removeFromCart: (productId) => {
        set({ cart: get().cart.filter(item => item.product.id !== productId) })
      },
      updateQuantity: (productId, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(productId)
          return
        }
        
        set({
          cart: get().cart.map(item =>
            item.product.id === productId
              ? { ...item, quantity }
              : item
          )
        })
      },
      clearCart: () => set({ cart: [] }),
      getCartTotal: () => {
        return get().cart.reduce((total, item) => total + (item.product.price * item.quantity), 0)
      },
      getCartItemsCount: () => {
        return get().cart.reduce((count, item) => count + item.quantity, 0)
      },

      // Products state
      products: [],
      categories: [],
      selectedCategory: null,
      setSelectedCategory: (categoryId) => set({ selectedCategory: categoryId }),
      getFilteredProducts: () => {
        const { products, selectedCategory } = get()
        if (!selectedCategory) return products.filter(p => p.active)
        return products.filter(product => product.category_id === selectedCategory && product.active)
      },
      loadProducts: async () => {
        try {
          const [products, categories] = await Promise.all([
            productService.getAllProducts(),
            productService.getAllCategories()
          ])
          set({ products, categories })
        } catch (error) {
          console.error('Error loading products:', error)
        }
      },

      // Customer state
      customer: null,
      setCustomer: (customer) => set({ customer }),

      // Order state
      currentOrder: null,
      setCurrentOrder: (order) => set({ currentOrder: order }),

      // UI state
      showCheckout: false,
      setShowCheckout: (show) => set({ showCheckout: show }),
      showPaymentModal: false,
      setShowPaymentModal: (show) => set({ showPaymentModal: show })
    }),
    {
      name: 'pdv-store',
      partialize: (state) => ({
        // Persistir apenas dados essenciais
        cart: state.cart,
        customer: state.customer,
        selectedCategory: state.selectedCategory
      })
    }
  )
)