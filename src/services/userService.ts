import { supabase } from '../lib/supabase'
import { User } from '../types'

class UserService {
  async findUserByPhone(phone: string): Promise<User | null> {
    const cleanPhone = phone.replace(/\D/g, '')
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone', cleanPhone)
      .eq('active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      console.error('Error finding user by phone:', error)
      return null
    }

    return this.mapUserFromDB(data)
  }

  async findUserById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .eq('active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      console.error('Error finding user by id:', error)
      return null
    }

    return this.mapUserFromDB(data)
  }

  async validateUserDiscount(user: User): Promise<boolean> {
    return user.active && (user.type === 'funcionario' || user.type === 'morador')
  }

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('active', true)
      .order('name')

    if (error) {
      console.error('Error fetching users:', error)
      throw new Error('Erro ao carregar usuários')
    }

    return data.map(this.mapUserFromDB)
  }

  async createUser(userData: Omit<User, 'id' | 'created_at' | 'updated_at'>): Promise<User> {
    const { data, error } = await supabase
      .from('users')
      .insert({
        name: userData.name,
        phone: userData.phone.replace(/\D/g, ''),
        email: userData.email,
        type: userData.type,
        discount_percentage: userData.discount_percentage,
        active: userData.active
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating user:', error)
      if (error.code === '23505') {
        throw new Error('Telefone já cadastrado')
      }
      throw new Error('Erro ao criar usuário')
    }

    return this.mapUserFromDB(data)
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const updateData: any = {}
    
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.phone !== undefined) updateData.phone = updates.phone.replace(/\D/g, '')
    if (updates.email !== undefined) updateData.email = updates.email
    if (updates.type !== undefined) updateData.type = updates.type
    if (updates.discount_percentage !== undefined) updateData.discount_percentage = updates.discount_percentage
    if (updates.active !== undefined) updateData.active = updates.active

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating user:', error)
      if (error.code === '23505') {
        throw new Error('Telefone já cadastrado')
      }
      throw new Error('Erro ao atualizar usuário')
    }

    return this.mapUserFromDB(data)
  }

  async deactivateUser(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('users')
      .update({ active: false })
      .eq('id', id)

    if (error) {
      console.error('Error deactivating user:', error)
      throw new Error('Erro ao desativar usuário')
    }

    return true
  }

  // Phone number utilities
  formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '')
    const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/)
    if (match) {
      return `(${match[1]}) ${match[2]}-${match[3]}`
    }
    return phone
  }

  validatePhoneFormat(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '')
    return cleaned.length === 11 && /^[1-9]\d{10}$/.test(cleaned)
  }

  // Discount calculation utilities
  calculateDiscount(subtotal: number, discountPercentage: number): number {
    return subtotal * (discountPercentage / 100)
  }

  calculateTotal(subtotal: number, discountPercentage: number): number {
    const discount = this.calculateDiscount(subtotal, discountPercentage)
    return subtotal - discount
  }

  private mapUserFromDB(dbUser: any): User {
    return {
      id: dbUser.id,
      name: dbUser.name,
      phone: dbUser.phone,
      email: dbUser.email,
      type: dbUser.type,
      discount_percentage: dbUser.discount_percentage,
      active: dbUser.active,
      created_at: dbUser.created_at,
      updated_at: dbUser.updated_at
    }
  }
}

export const userService = new UserService()