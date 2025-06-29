import { CashFlowData } from '../types'
import { orderService } from './orderService'
import { expenseService } from './expenseService'
import { productService } from './productService'
import { settingsService } from './settingsService'

class CashFlowService {
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  async getCashFlowData(startDate: string, endDate: string): Promise<CashFlowData> {
    await this.delay(800)

    // Get orders in date range
    const orders = await orderService.getOrdersByDateRange(startDate, endDate)
    const approvedOrders = orders.filter(o => o.payment_status === 'approved')

    // Calculate revenue
    const revenue = approvedOrders.reduce((total, order) => total + order.total, 0)

    // Calculate costs (cost of goods sold)
    let costs = 0
    for (const order of approvedOrders) {
      for (const item of order.items) {
        const product = await productService.getProductById(item.product.id)
        if (product) {
          costs += product.cost_price * item.quantity
        }
      }
    }

    // Calculate expenses
    const expenses = await expenseService.getTotalExpenses(startDate, endDate)

    // Calculate payment fees
    let fees = 0
    for (const order of approvedOrders) {
      const fee = settingsService.calculatePaymentFee(
        order.total,
        order.payment_method as 'pix' | 'debit' | 'credit',
        1 // Assuming 1 installment for now
      )
      fees += fee
    }

    // Calculate net profit
    const netProfit = revenue - costs - expenses - fees

    // Calculate margin percentage
    const marginPercentage = revenue > 0 ? (netProfit / revenue) * 100 : 0

    return {
      revenue,
      costs,
      expenses,
      fees,
      net_profit: netProfit,
      margin_percentage: marginPercentage,
      period: `${startDate} - ${endDate}`
    }
  }

  async getMonthlyComparison(): Promise<{
    current: CashFlowData
    previous: CashFlowData
    growth: {
      revenue: number
      profit: number
      margin: number
    }
  }> {
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
    
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]

    const [current, previous] = await Promise.all([
      this.getCashFlowData(currentMonthStart, currentMonthEnd),
      this.getCashFlowData(previousMonthStart, previousMonthEnd)
    ])

    const growth = {
      revenue: previous.revenue > 0 ? ((current.revenue - previous.revenue) / previous.revenue) * 100 : 0,
      profit: previous.net_profit > 0 ? ((current.net_profit - previous.net_profit) / previous.net_profit) * 100 : 0,
      margin: current.margin_percentage - previous.margin_percentage
    }

    return { current, previous, growth }
  }

  async getDailyRevenue(days: number = 7): Promise<Array<{ date: string; revenue: number; profit: number }>> {
    await this.delay(600)

    const data = []
    const now = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const cashFlow = await this.getCashFlowData(dateStr, dateStr)
      
      data.push({
        date: dateStr,
        revenue: cashFlow.revenue,
        profit: cashFlow.net_profit
      })
    }

    return data
  }

  async getTopSellingProducts(limit: number = 5): Promise<Array<{
    product: any
    quantity_sold: number
    revenue: number
    profit: number
  }>> {
    await this.delay(500)

    const orders = await orderService.getAllOrders()
    const approvedOrders = orders.filter(o => o.payment_status === 'approved')

    const productStats = new Map()

    for (const order of approvedOrders) {
      for (const item of order.items) {
        const productId = item.product.id
        const existing = productStats.get(productId) || {
          product: item.product,
          quantity_sold: 0,
          revenue: 0,
          profit: 0
        }

        const itemRevenue = item.product.price * item.quantity
        const itemCost = item.product.cost_price * item.quantity
        const itemProfit = itemRevenue - itemCost

        productStats.set(productId, {
          ...existing,
          quantity_sold: existing.quantity_sold + item.quantity,
          revenue: existing.revenue + itemRevenue,
          profit: existing.profit + itemProfit
        })
      }
    }

    return Array.from(productStats.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit)
  }
}

export const cashFlowService = new CashFlowService()