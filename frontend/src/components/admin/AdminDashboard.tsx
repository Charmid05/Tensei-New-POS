import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import apiClient from '@/api/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  DollarSign, 
  ShoppingCart, 
  Users, 
  Table, 
  TrendingUp,
  Plus,
  Settings,
  BarChart3
} from 'lucide-react'

interface IncomeBreakdownItem {
  period: string
  orders: number
  gross: number
  tax: number
  net: number
}

export function AdminDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today')

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => apiClient.getDashboardStats().then(res => res.data)
  })

  // Fetch income report
  const { data: income, isLoading: incomeLoading } = useQuery({
    queryKey: ['incomeReport', selectedPeriod],
    queryFn: () => apiClient.getIncomeReport(selectedPeriod).then(res => res.data)
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your restaurant operations and monitor performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" size="sm">
            <BarChart3 className="w-4 h-4 mr-2" />
            Reports
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.today_orders || 0}</div>
            <p className="text-xs text-muted-foreground">
              +12% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats?.today_revenue || 0)}</div>
            <p className="text-xs text-muted-foreground">
              +8% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Orders</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active_orders || 0}</div>
            <p className="text-xs text-muted-foreground">
              Currently being processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupied Tables</CardTitle>
            <Table className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.occupied_tables || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tables currently in use
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Income Report */}
      <Card className="col-span-4">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Income Report
              </CardTitle>
              <CardDescription>
                Detailed breakdown of revenue and performance
              </CardDescription>
            </div>
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
                Week
              </Button>
              <Button 
                variant={selectedPeriod === 'month' ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setSelectedPeriod('month')}
              >
                Month
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {incomeLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : income ? (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {income.summary.total_orders}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Orders</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(income.summary.gross_income)}
                  </div>
                  <div className="text-sm text-muted-foreground">Gross Income</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {formatCurrency(income.summary.tax_collected)}
                  </div>
                  <div className="text-sm text-muted-foreground">Tax Collected</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {formatCurrency(income.summary.net_income)}
                  </div>
                  <div className="text-sm text-muted-foreground">Net Income</div>
                </div>
              </div>

              {/* Breakdown Table */}
              {income.breakdown && income.breakdown.length > 0 && (
                <div className="border rounded-lg">
                  <div className="grid grid-cols-5 gap-4 p-4 bg-muted/50 font-medium text-sm">
                    <div>Period</div>
                    <div className="text-center">Orders</div>
                    <div className="text-center">Gross</div>
                    <div className="text-center">Tax</div>
                    <div className="text-center">Net</div>
                  </div>
                  {income.breakdown.slice(0, 10).map((item: IncomeBreakdownItem, index: number) => (
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
              No income data available
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="text-center">
            <Plus className="h-8 w-8 mx-auto text-blue-600" />
            <CardTitle className="text-lg">Manage Menu</CardTitle>
            <CardDescription>Add, edit, or remove menu items and categories</CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="text-center">
            <Table className="h-8 w-8 mx-auto text-green-600" />
            <CardTitle className="text-lg">Manage Tables</CardTitle>
            <CardDescription>Configure dining tables and seating arrangements</CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="text-center">
            <Users className="h-8 w-8 mx-auto text-purple-600" />
            <CardTitle className="text-lg">Manage Staff</CardTitle>
            <CardDescription>Add, edit staff accounts and manage permissions</CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardHeader className="text-center">
            <BarChart3 className="h-8 w-8 mx-auto text-orange-600" />
            <CardTitle className="text-lg">View Reports</CardTitle>
            <CardDescription>Detailed analytics and performance reports</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  )
}
