import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AdminUser {
  id: string
  username: string
  name: string
  role: 'admin' | 'manager'
}

interface AdminStore {
  isAuthenticated: boolean
  user: AdminUser | null
  login: (username: string, password: string) => Promise<boolean>
  logout: () => void
}

export const useAdminStore = create<AdminStore>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,

      login: async (username: string, password: string) => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Demo credentials
        if (username === 'admin' && password === 'admin123') {
          const user: AdminUser = {
            id: '1',
            username: 'admin',
            name: 'Administrador',
            role: 'admin'
          }
          
          set({ isAuthenticated: true, user })
          return true
        }
        
        return false
      },

      logout: () => {
        set({ isAuthenticated: false, user: null })
      }
    }),
    {
      name: 'admin-auth'
    }
  )
)