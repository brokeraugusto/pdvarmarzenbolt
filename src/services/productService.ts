import { supabase } from '../lib/supabase'
import { isConfigured } from '../lib/supabase'
import { Product, Category } from '../types'

class ProductService {
  private async checkConnection(): Promise<void> {
    if (!isConfigured()) {
      throw new Error('Supabase não está configurado. Verifique as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no arquivo .env')
    }
  }

  // ==========================================
  // PRODUCT CRUD
  // ==========================================

  async getAllProducts(): Promise<Product[]> {
    await this.checkConnection()
    
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name
        )
      `)
      .order('name')

    if (error) {
      console.error('Error fetching products:', error)
      throw new Error(`Erro ao carregar produtos: ${error.message}`)
    }

    return data.map(this.mapProductFromDB)
  }

  async getProductById(id: string): Promise<Product | null> {
    await this.checkConnection()
    
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      console.error('Error fetching product:', error)
      throw new Error(`Erro ao carregar produto: ${error.message}`)
    }

    return this.mapProductFromDB(data)
  }

  async createProduct(productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    await this.checkConnection()
    
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: productData.name,
        description: productData.description,
        price: productData.price,
        cost_price: productData.cost_price,
        margin_percentage: productData.margin_percentage,
        image: productData.image,
        category_id: productData.category_id,
        stock: productData.stock,
        active: productData.active
      })
      .select(`
        *,
        categories (
          id,
          name
        )
      `)
      .single()

    if (error) {
      console.error('Error creating product:', error)
      throw new Error(`Erro ao criar produto: ${error.message}`)
    }

    return this.mapProductFromDB(data)
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    await this.checkConnection()
    
    const { data, error } = await supabase
      .from('products')
      .update({
        name: updates.name,
        description: updates.description,
        price: updates.price,
        cost_price: updates.cost_price,
        margin_percentage: updates.margin_percentage,
        image: updates.image,
        category_id: updates.category_id,
        stock: updates.stock,
        active: updates.active
      })
      .eq('id', id)
      .select(`
        *,
        categories (
          id,
          name
        )
      `)
      .single()

    if (error) {
      console.error('Error updating product:', error)
      throw new Error(`Erro ao atualizar produto: ${error.message}`)
    }

    return this.mapProductFromDB(data)
  }

  async deleteProduct(id: string): Promise<boolean> {
    await this.checkConnection()
    
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting product:', error)
      throw new Error(`Erro ao excluir produto: ${error.message}`)
    }

    return true
  }

  async updateStock(id: string, newStock: number): Promise<Product | null> {
    return this.updateProduct(id, { stock: newStock })
  }

  async decreaseStock(id: string, quantity: number): Promise<Product | null> {
    const product = await this.getProductById(id)
    if (!product) return null

    const newStock = Math.max(0, product.stock - quantity)
    return this.updateStock(id, newStock)
  }

  // ==========================================
  // CATEGORY CRUD
  // ==========================================

  async getAllCategories(): Promise<Category[]> {
    await this.checkConnection()
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('order_index')

    if (error) {
      console.error('Error fetching categories:', error)
      throw new Error(`Erro ao carregar categorias: ${error.message}`)
    }

    return data.map(this.mapCategoryFromDB)
  }

  async getCategoryById(id: string): Promise<Category | null> {
    await this.checkConnection()
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      console.error('Error fetching category:', error)
      throw new Error(`Erro ao carregar categoria: ${error.message}`)
    }

    return this.mapCategoryFromDB(data)
  }

  async createCategory(categoryData: Omit<Category, 'id' | 'created_at' | 'updated_at'>): Promise<Category> {
    await this.checkConnection()
    
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: categoryData.name,
        description: categoryData.description,
        order_index: categoryData.order,
        active: categoryData.active
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating category:', error)
      throw new Error(`Erro ao criar categoria: ${error.message}`)
    }

    return this.mapCategoryFromDB(data)
  }

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category | null> {
    await this.checkConnection()
    
    const { data, error } = await supabase
      .from('categories')
      .update({
        name: updates.name,
        description: updates.description,
        order_index: updates.order,
        active: updates.active
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating category:', error)
      throw new Error(`Erro ao atualizar categoria: ${error.message}`)
    }

    return this.mapCategoryFromDB(data)
  }

  async deleteCategory(id: string): Promise<boolean> {
    await this.checkConnection()
    
    // Verificar se categoria tem produtos
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', id)

    if (count && count > 0) {
      throw new Error('Não é possível excluir categoria com produtos associados. Remova os produtos primeiro.')
    }

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting category:', error)
      throw new Error(`Erro ao excluir categoria: ${error.message}`)
    }

    return true
  }

  // ==========================================
  // PRICING CALCULATIONS
  // ==========================================

  calculateMargin(costPrice: number, salePrice: number): number {
    if (costPrice === 0) return 0
    return ((salePrice - costPrice) / costPrice) * 100
  }

  calculateSalePrice(costPrice: number, marginPercentage: number): number {
    return costPrice * (1 + marginPercentage / 100)
  }

  calculateProfit(costPrice: number, salePrice: number): number {
    return salePrice - costPrice
  }

  // ==========================================
  // ANALYTICS
  // ==========================================

  async getAverageMargin(): Promise<number> {
    await this.checkConnection()
    
    const { data, error } = await supabase
      .from('products')
      .select('margin_percentage')
      .eq('active', true)

    if (error) {
      console.error('Error calculating average margin:', error)
      return 0
    }

    if (data.length === 0) return 0

    const totalMargin = data.reduce((sum, product) => sum + product.margin_percentage, 0)
    return totalMargin / data.length
  }

  async getTotalCostValue(): Promise<number> {
    await this.checkConnection()
    
    const { data, error } = await supabase
      .from('products')
      .select('cost_price, stock')

    if (error) {
      console.error('Error calculating total cost value:', error)
      return 0
    }

    return data.reduce((total, product) => total + (product.cost_price * product.stock), 0)
  }

  async getTotalSaleValue(): Promise<number> {
    await this.checkConnection()
    
    const { data, error } = await supabase
      .from('products')
      .select('price, stock')

    if (error) {
      console.error('Error calculating total sale value:', error)
      return 0
    }

    return data.reduce((total, product) => total + (product.price * product.stock), 0)
  }

  async getLowStockProducts(threshold: number = 10): Promise<Product[]> {
    await this.checkConnection()
    
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name
        )
      `)
      .eq('active', true)
      .lte('stock', threshold)
      .order('stock')

    if (error) {
      console.error('Error fetching low stock products:', error)
      return []
    }

    return data.map(this.mapProductFromDB)
  }

  // ==========================================
  // SEARCH AND FILTERS
  // ==========================================

  async searchProducts(query: string): Promise<Product[]> {
    await this.checkConnection()
    
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name
        )
      `)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .eq('active', true)
      .order('name')

    if (error) {
      console.error('Error searching products:', error)
      return []
    }

    return data.map(this.mapProductFromDB)
  }

  async getProductsByCategory(categoryId: string): Promise<Product[]> {
    await this.checkConnection()
    
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories (
          id,
          name
        )
      `)
      .eq('category_id', categoryId)
      .eq('active', true)
      .order('name')

    if (error) {
      console.error('Error fetching products by category:', error)
      return []
    }

    return data.map(this.mapProductFromDB)
  }

  // ==========================================
  // MAPPERS
  // ==========================================

  private mapProductFromDB(dbProduct: any): Product {
    return {
      id: dbProduct.id,
      name: dbProduct.name,
      description: dbProduct.description || '',
      price: parseFloat(dbProduct.price),
      cost_price: parseFloat(dbProduct.cost_price),
      margin_percentage: parseFloat(dbProduct.margin_percentage),
      image: dbProduct.image || '',
      category_id: dbProduct.category_id || '',
      stock: dbProduct.stock,
      active: dbProduct.active,
      created_at: dbProduct.created_at,
      updated_at: dbProduct.updated_at
    }
  }

  private mapCategoryFromDB(dbCategory: any): Category {
    return {
      id: dbCategory.id,
      name: dbCategory.name,
      description: dbCategory.description || '',
      order: dbCategory.order_index,
      active: dbCategory.active,
      created_at: dbCategory.created_at,
      updated_at: dbCategory.updated_at
    }
  }
}

export const productService = new ProductService()