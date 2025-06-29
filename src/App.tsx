import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { CustomerApp } from './pages/CustomerApp'
import { AdminApp } from './pages/AdminApp'
import { AdminLogin } from './pages/AdminLogin'
import { useAdminStore } from './store/useAdminStore'

function App() {
  const { isAuthenticated } = useAdminStore()

  return (
    <Router>
      <Routes>
        {/* Customer Routes */}
        <Route path="/" element={<CustomerApp />} />
        
        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={isAuthenticated ? <AdminApp /> : <AdminLogin />} 
        />
        <Route 
          path="/admin/login" 
          element={<AdminLogin />} 
        />
      </Routes>
    </Router>
  )
}

export default App