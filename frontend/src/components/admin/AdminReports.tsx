import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3,
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Calendar,
  Download,
  Search,
  Filter,
  FileBarChart,
  Users,
  Clock
} from 'lucide-react'
import apiClient from '@/api/client'

interface SalesReportItem {
  date: string
  order_count: number
  revenue: number
}

interface OrdersReportItem {
  status: string
  count: number
  avg_amount: number
}

export function AdminReports() {
  const [activeTab, setActiveTab] = useState<'sales' | 'orders' | 'analytics'>('sales')
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today')

  // Real API calls for reports data
  const { data: salesData, isLoading: salesLoading, error: salesError } = useQuery({
    queryKey: ['salesReport', selectedPeriod],
    queryFn: () => apiClient.getSalesReport(selectedPeriod).then(res => res.data),
  })

  const { data: ordersData, isLoading: ordersLoading, error: ordersError } = useQuery({
    queryKey: ['ordersReport'],
    queryFn: () => apiClient.getOrdersReport().then(res => res.data),
  })

  const { data: incomeData, isLoading: incomeLoading } = useQuery({
    queryKey: ['incomeReport', selectedPeriod],
    queryFn: () => apiClient.getIncomeReport(selectedPeriod).then(res => res.data),
  })

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  // Calculate totals from real data
  const totalRevenue = salesData?.reduce((sum: number, item: SalesReportItem) => sum + item.revenue, 0) || 0
  const totalOrders = salesData?.reduce((sum: number, item: SalesReportItem) => sum + item.order_count, 0) || 0
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

  const LoadingState = () => (
    <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Detailed insights into your restaurant performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Custom Range
          </Button>
        </div>
      </div>

      {/* Period Selection */}
      <div className="flex gap-2">
        <Button 
          variant={selectedPeriod === 'today' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setSelectedPeriod('today')}
        >
          Today
        </Button>
        <Button 
          variant={selectedPeriod === 'week' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setSelectedPeriod('week')}
        >
          This Week
        </Button>
        <Button 
          variant={selectedPeriod === 'month' ? 'default' : 'outline'} 
          size="sm"
          onClick={() => setSelectedPeriod('month')}
        >
          This Month
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {salesLoading ? '...' : formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedPeriod === 'today' ? 'Today' : `This ${selectedPeriod}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {salesLoading ? '...' : totalOrders}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedPeriod === 'today' ? 'Today' : `This ${selectedPeriod}`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Order</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {salesLoading ? '...' : formatCurrency(averageOrderValue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Per order value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+12.5%</div>
            <p className="text-xs text-muted-foreground">
              Compared to previous period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)}>
        <TabsList>
          <TabsTrigger value="sales">Sales Report</TabsTrigger>
          <TabsTrigger value="orders">Orders Report</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Sales Report Tab */}
        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Sales Report - {selectedPeriod}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {salesLoading ? (
                <LoadingState />
              ) : salesError ? (
                <div className="text-center py-8 text-red-600">
                  Error loading sales data: {(salesError as any).message}
                </div>
              ) : salesData && salesData.length > 0 ? (
                <div className="space-y-4">
                  <div className="border rounded-lg">
                    <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 font-medium text-sm">
                      <div>Date/Period</div>
                      <div className="text-center">Orders</div>
                      <div className="text-center">Revenue</div>
                    </div>
                    {salesData.map((item: SalesReportItem, index: number) => (
                      <div key={index} className="grid grid-cols-3 gap-4 p-4 border-t text-sm">
                        <div className="font-medium">
                          {new Date(item.date).toLocaleDateString()}
                        </div>
                        <div className="text-center">{item.order_count}</div>
                        <div className="text-center font-medium">
                          {formatCurrency(item.revenue)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No sales data available for this period
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Report Tab */}
        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Orders by Status - Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              {ordersLoading ? (
                <LoadingState />
              ) : ordersError ? (
                <div className="text-center py-8 text-red-600">
                  Error loading orders data: {(ordersError as any).message}
                </div>
              ) : ordersData && ordersData.length > 0 ? (
                <div className="space-y-4">
                  <div className="border rounded-lg">
                    <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 font-medium text-sm">
                      <div>Status</div>
                      <div className="text-center">Count</div>
                      <div className="text-center">Avg Amount</div>
                    </div>
                    {ordersData.map((item: OrdersReportItem, index: number) => (
                      <div key={index} className="grid grid-cols-3 gap-4 p-4 border-t text-sm">
                        <div className="font-medium">
                          <Badge variant={item.status === 'completed' ? 'default' : 'secondary'}>
                            {item.status}
                          </Badge>
                        </div>
                        <div className="text-center">{item.count}</div>
                        <div className="text-center font-medium">
                          {formatCurrency(item.avg_amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No orders data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileBarChart className="h-5 w-5" />
                Income Analysis - {selectedPeriod}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {incomeLoading ? (
                <LoadingState />
              ) : incomeData ? (
                <div className="space-y-6">
                  {/* Summary */}
                  <div className="grid gap-4 md:grid-cols-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {incomeData.summary?.total_orders || 0}
                      </div>
                      <div className="text-sm text-muted-foreground">Total Orders</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(incomeData.summary?.gross_income || 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Gross Income</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {formatCurrency(incomeData.summary?.tax_collected || 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Tax Collected</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {formatCurrency(incomeData.summary?.net_income || 0)}
                      </div>
                      <div className="text-sm text-muted-foreground">Net Income</div>
                    </div>
                  </div>

                  {/* Breakdown */}
                  {incomeData.breakdown && incomeData.breakdown.length > 0 && (
                    <div className="border rounded-lg">
                      <div className="grid grid-cols-5 gap-4 p-4 bg-muted/50 font-medium text-sm">
                        <div>Period</div>
                        <div className="text-center">Orders</div>
                        <div className="text-center">Gross</div>
                        <div className="text-center">Tax</div>
                        <div className="text-center">Net</div>
                      </div>
                      {incomeData.breakdown.slice(0, 10).map((item: any, index: number) => (
                        <div key={index} className="grid grid-cols-5 gap-4 p-4 border-t text-sm">
                          <div className="font-medium">
                            {new Date(item.period).toLocaleDateString()}
                          </div>
                          <div className="text-center">{item.orders}</div>
                          <div className="text-center">{formatCurrency(item.gross)}</div>
                          <div className="text-center">{formatCurrency(item.tax)}</div>
                          <div className="text-center font-medium">{formatCurrency(item.net)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No analytics data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}