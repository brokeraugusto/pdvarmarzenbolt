import React, { useEffect } from 'react'
import { Header } from '../components/customer/Header'
import { CategorySidebar } from '../components/customer/CategorySidebar'
import { ProductGrid } from '../components/customer/ProductGrid'
import { CheckoutModal } from '../components/customer/CheckoutModal'
import { PaymentModal } from '../components/customer/PaymentModal'
import { useStore } from '../store/useStore'

export const CustomerApp: React.FC = () => {
  const { loadProducts } = useStore()

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  return (
    <div className="min-h-screen gradient-primary safe-area">
      <Header />
      
      <div className="flex h-[calc(100vh-80px)] sm:h-[calc(100vh-88px)]">
        <CategorySidebar />
        <ProductGrid />
      </div>

      <CheckoutModal />
      <PaymentModal />
    </div>
  )
}