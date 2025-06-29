import { supabase } from '../lib/supabase'
import { Expense } from '../types'

class ExpenseService {
  async getAllExpenses(): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching expenses:', error)
      throw new Error('Erro ao carregar despesas')
    }

    return data.map(this.mapExpenseFromDB)
  }

  async getExpenseById(id: string): Promise<Expense | null> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      console.error('Error fetching expense:', error)
      throw new Error('Erro ao carregar despesa')
    }

    return this.mapExpenseFromDB(data)
  }

  async createExpense(expenseData: Omit<Expense, 'id' | 'created_at' | 'updated_at'>): Promise<Expense> {
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        description: expenseData.description,
        amount: expenseData.amount,
        category: expenseData.category,
        date: expenseData.date,
        payment_method: expenseData.payment_method,
        notes: expenseData.notes
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating expense:', error)
      throw new Error('Erro ao criar despesa')
    }

    return this.mapExpenseFromDB(data)
  }

  async updateExpense(id: string, updates: Partial<Expense>): Promise<Expense | null> {
    const updateData: any = {}
    
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.amount !== undefined) updateData.amount = updates.amount
    if (updates.category !== undefined) updateData.category = updates.category
    if (updates.date !== undefined) updateData.date = updates.date
    if (updates.payment_method !== undefined) updateData.payment_method = updates.payment_method
    if (updates.notes !== undefined) updateData.notes = updates.notes

    const { data, error } = await supabase
      .from('expenses')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating expense:', error)
      throw new Error('Erro ao atualizar despesa')
    }

    return this.mapExpenseFromDB(data)
  }

  async deleteExpense(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting expense:', error)
      throw new Error('Erro ao excluir despesa')
    }

    return true
  }

  async getExpensesByDateRange(startDate: string, endDate: string): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching expenses by date range:', error)
      return []
    }

    return data.map(this.mapExpenseFromDB)
  }

  async getTotalExpenses(startDate?: string, endDate?: string): Promise<number> {
    let query = supabase
      .from('expenses')
      .select('amount')

    if (startDate) query = query.gte('date', startDate)
    if (endDate) query = query.lte('date', endDate)

    const { data, error } = await query

    if (error) {
      console.error('Error calculating total expenses:', error)
      return 0
    }

    return data.reduce((total, expense) => total + parseFloat(expense.amount), 0)
  }

  async getExpensesByCategory(category: string): Promise<Expense[]> {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('category', category)
      .order('date', { ascending: false })

    if (error) {
      console.error('Error fetching expenses by category:', error)
      return []
    }

    return data.map(this.mapExpenseFromDB)
  }

  getCategoryLabel(category: string): string {
    const labels = {
      operational: 'Operacional',
      administrative: 'Administrativo',
      marketing: 'Marketing',
      maintenance: 'Manutenção',
      other: 'Outros'
    }
    return labels[category as keyof typeof labels] || category
  }

  getPaymentMethodLabel(method: string): string {
    const labels = {
      cash: 'Dinheiro',
      pix: 'PIX',
      credit: 'Cartão de Crédito',
      debit: 'Cartão de Débito',
      transfer: 'Transferência'
    }
    return labels[method as keyof typeof labels] || method
  }

  private mapExpenseFromDB(dbExpense: any): Expense {
    return {
      id: dbExpense.id,
      description: dbExpense.description,
      amount: parseFloat(dbExpense.amount),
      category: dbExpense.category,
      date: dbExpense.date,
      payment_method: dbExpense.payment_method,
      notes: dbExpense.notes,
      created_at: dbExpense.created_at,
      updated_at: dbExpense.updated_at
    }
  }
}

export const expenseService = new ExpenseService()