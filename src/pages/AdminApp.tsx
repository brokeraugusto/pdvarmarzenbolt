import React, { useState } from 'react'
import { AdminSidebar } from '../components/admin/AdminSidebar'
import { AdminHeader } from '../components/admin/AdminHeader'
import { Dashboard } from '../components/admin/Dashboard'
import { ProductsManager } from '../components/admin/ProductsManager'
import { CategoriesManager } from '../components/admin/CategoriesManager'
import { UsersManager } from '../components/admin/UsersManager'
import { OrdersManager } from '../components/admin/OrdersManager'
import { ExpensesManager } from '../components/admin/ExpensesManager'
import { ReportsManager } from '../components/admin/ReportsManager'
import { SettingsManager } from '../components/admin/SettingsManager'

export const AdminApp: React.FC = () => {
  const [activeSection, setActiveSection] = useState('dashboard')

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />
      case 'products':
        return <ProductsManager />
      case 'categories':
        return <CategoriesManager />
      case 'users':
        return <UsersManager />
      case 'orders':
        return <OrdersManager />
      case 'expenses':
        return <ExpensesManager />
      case 'reports':
        return <ReportsManager />
      case 'settings':
        return <SettingsManager />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminHeader />
      
      <div className="flex h-[calc(100vh-64px)]">
        <AdminSidebar 
          activeSection={activeSection} 
          onSectionChange={setActiveSection} 
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  )
}