import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import apiClient from '@/api/client'
import { toastHelpers } from '@/lib/toast-helpers'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  Minus, 
  ShoppingCart, 
  Users, 
  User,
  Check,
  Clock,
  Table as TableIcon,
  Search,
  Settings,
  Package
} from 'lucide-react'
import type { Product, DiningTable } from '@/types'

interface CartItem {
  product: Product
  quantity: number
  special_instructions?: string
}

interface CreateOrderRequest {
  order_type: 'dine_in' | 'takeout' | 'delivery'
  table_id: string
  customer_name?: string
  items: Array<{
    product_id: string
    quantity: number
    special_instructions?: string
  }>
  notes?: string
}

export function ServerInterface() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedTable, setSelectedTable] = useState<DiningTable | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [cart, setCart] = useState<CartItem[]>([])
  const [orderNotes, setOrderNotes] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showTableView, setShowTableView] = useState(false)
  
  const queryClient = useQueryClient()

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const response = await apiClient.getCategories()
        return response.data || []
      } catch (error) {
        console.error('Failed to fetch categories:', error)
        return []
      }
    }
  })

  // Fetch products
  const { data: products = [] } = useQuery({
    queryKey: ['products', selectedCategory],
    queryFn: async () => {
      try {
        let response
        if (selectedCategory === 'all') {
          response = await apiClient.getProducts()
        } else {
          response = await apiClient.getProductsByCategory(selectedCategory)
        }
        return response.data || []
      } catch (error) {
        console.error('Failed to fetch products:', error)
        return []
      }
    }
  })

  // Fetch available tables (not occupied)
  const { data: tables = [] } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      try {
        const response = await apiClient.getTables()
        return response.data || []
      } catch (error) {
        console.error('Failed to fetch tables:', error)
        return []
      }
    }
  })

  // Fetch active orders to show table status
  const { data: activeOrders = [] } = useQuery({
    queryKey: ['active-orders'],
    queryFn: async () => {
      try {
        const response = await apiClient.getOrders({ status: 'pending,confirmed,preparing,ready' })
        return response.data || []
      } catch (error) {
        console.error('Failed to fetch active orders:', error)
        return []
      }
    }
  })

  // Create order mutation (server endpoint - dine-in only)
  const createOrderMutation = useMutation({
    mutationFn: (orderData: CreateOrderRequest) => 
      apiClient.createServerOrder(orderData),
    onSuccess: (data) => {
      const orderNumber = data.data?.order_number
      // Reset form
      setCart([])
      setSelectedTable(null)
      setCustomerName('')
      setOrderNotes('')
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['orders'] })
      queryClient.invalidateQueries({ queryKey: ['active-orders'] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      
      toastHelpers.orderCreated(orderNumber)
    },
    onError: (error: any) => {
      toastHelpers.apiError('Create order', error)
    }
  })

  // Filter products based on search
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
  )

  // Helper function to get table status
  const getTableStatus = (table: DiningTable) => {
    // Ensure activeOrders is always an array
    const orders = Array.isArray(activeOrders) ? activeOrders : []
    const hasActiveOrder = orders.some(order => order.table_id === table.id)
    
    if (table.is_occupied && hasActiveOrder) {
      return { status: 'occupied', label: 'Occupied', color: 'bg-red-100 text-red-800 border-red-200' }
    } else if (hasActiveOrder) {
      return { status: 'pending', label: 'Order Pending', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' }
    } else if (table.is_occupied) {
      return { status: 'seated', label: 'Seated', color: 'bg-blue-100 text-blue-800 border-blue-200' }
    } else {
      return { status: 'available', label: 'Available', color: 'bg-green-100 text-green-800 border-green-200' }
    }
  }

  // Available tables (not occupied or ready for new orders)
  const availableTables = tables.filter(table => !table.is_occupied)
  
  // All tables with status for restaurant view
  const tablesWithStatus = tables.map(table => {
    const orders = Array.isArray(activeOrders) ? activeOrders : []
    return {
      ...table,
      statusInfo: getTableStatus(table),
      activeOrder: orders.find(order => order.table_id === table.id)
    }
  })

  const addToCart = (product: Product) => {
    const existingItem = cart.find(item => item.product.id === product.id)
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
    } else {
      setCart([...cart, { product, quantity: 1 }])
    }
  }

  const removeFromCart = (productId: string) => {
    const existingItem = cart.find(item => item.product.id === productId)
    
    if (existingItem && existingItem.quantity > 1) {
      setCart(cart.map(item =>
        item.product.id === productId
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ))
    } else {
      setCart(cart.filter(item => item.product.id !== productId))
    }
  }

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.product.price * item.quantity), 0)
  }

  const handleCreateOrder = () => {
    if (!selectedTable || cart.length === 0) return

    const orderData: CreateOrderRequest = {
      order_type: 'dine_in',
      table_id: selectedTable.id,
      customer_name: customerName || undefined,
      items: cart.map(item => ({
        product_id: item.product.id,
        quantity: item.quantity,
        special_instructions: item.special_instructions
      })),
      notes: orderNotes || undefined
    }

    createOrderMutation.mutate(orderData)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-background">
      {/* Left Sidebar - Categories and Products */}
      <div className="flex-1 lg:w-2/3 border-r border-border overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b border-border bg-card">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold flex items-center truncate">
                <span className="hidden sm:inline">🍽️ Server Station</span>
                <span className="sm:hidden">🍽️ Server</span>
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1 hidden sm:block">Take orders for your tables • Provide excellent service</p>
              <p className="text-xs text-muted-foreground mt-1 sm:hidden">Dine-in orders</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs px-2 py-1">
                <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span className="hidden sm:inline">Dine-In Service</span>
                <span className="sm:hidden">Dine-In</span>
              </Badge>
              {Array.isArray(activeOrders) && activeOrders.length > 0 && (
                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs px-2 py-1">
                  {activeOrders.length} <span className="hidden sm:inline">Active Orders</span><span className="sm:hidden">Orders</span>
                </Badge>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-3 sm:mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 sm:h-11 text-sm sm:text-base touch-manipulation"
            />
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className="whitespace-nowrap min-h-[44px] px-4 text-xs sm:text-sm touch-manipulation flex-shrink-0"
            >
              All Items
            </Button>
            {categories.map(category => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="whitespace-nowrap min-h-[44px] px-4 text-xs sm:text-sm touch-manipulation flex-shrink-0"
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {filteredProducts.map(product => {
              const cartItem = cart.find(item => item.product.id === product.id)
              return (
                <Card key={product.id} className="hover:shadow-md active:scale-95 transition-all duration-150 touch-manipulation">
                  <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-sm sm:text-base lg:text-lg leading-tight truncate">{product.name}</CardTitle>
                        {product.description && (
                          <CardDescription className="text-xs sm:text-sm mt-1 line-clamp-2">
                            {product.description.substring(0, 50)}
                            {product.description.length > 50 ? '...' : ''}
                          </CardDescription>
                        )}
                      </div>
                      <div className="text-sm sm:text-base lg:text-lg font-bold text-primary flex-shrink-0">
                        {formatCurrency(product.price)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 p-3 sm:p-6 sm:pt-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
                        {product.preparation_time > 0 && (
                          <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                            <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                            {product.preparation_time}min
                          </Badge>
                        )}
                        {!product.is_available && (
                          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                            Unavailable
                          </Badge>
                        )}
                      </div>

                      {product.is_available && (
                        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                          {cartItem ? (
                            <div className="flex items-center gap-1 sm:gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeFromCart(product.id)}
                                className="min-h-[36px] min-w-[36px] p-1.5 sm:min-h-[44px] sm:min-w-[44px] sm:p-2 touch-manipulation"
                              >
                                <Minus className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                              <span className="w-6 sm:w-8 text-center font-medium text-sm sm:text-base">
                                {cartItem.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => addToCart(product)}
                                className="min-h-[36px] min-w-[36px] p-1.5 sm:min-h-[44px] sm:min-w-[44px] sm:p-2 touch-manipulation"
                              >
                                <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => addToCart(product)}
                              className="min-h-[36px] px-3 sm:min-h-[44px] sm:px-4 text-xs sm:text-sm touch-manipulation"
                            >
                              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              <span className="hidden sm:inline">Add</span>
                              <span className="sm:hidden">+</span>
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Cart and Order */}
      <div className="w-full lg:w-1/3 flex flex-col bg-card max-h-screen lg:max-h-none">
        {/* Table Selection */}
        <div className="p-3 sm:p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold flex items-center text-sm sm:text-base">
              <TableIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Select Table</span>
              <span className="sm:hidden">Table</span>
            </h3>
            <div className="flex gap-1">
              <Button
                variant={!showTableView ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowTableView(false)}
                className="min-h-[36px] px-3 text-xs sm:text-sm sm:min-h-[44px] sm:px-4 touch-manipulation"
              >
                List
              </Button>
              <Button
                variant={showTableView ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowTableView(true)}
                className="min-h-[36px] px-3 text-xs sm:text-sm sm:min-h-[44px] sm:px-4 touch-manipulation"
              >
                Floor
              </Button>
            </div>
          </div>

          {!showTableView ? (
            // Simple List View - Only Available Tables
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableTables.slice(0, 9).map(table => (
                  <Button
                    key={table.id}
                    variant={selectedTable?.id === table.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedTable(table)}
                    className="h-12 sm:h-14 flex flex-col text-xs sm:text-sm min-h-[48px] touch-manipulation"
                  >
                    <span className="font-semibold">{table.table_number}</span>
                    <span className="text-[10px] sm:text-xs opacity-75">{table.seating_capacity} seats</span>
                  </Button>
                ))}
              </div>
              {availableTables.length > 9 && (
                <p className="text-xs text-muted-foreground mt-2">
                  +{availableTables.length - 9} more tables available
                </p>
              )}
            </>
          ) : (
            // Restaurant Floor View - All Tables with Status
            <div className="space-y-3">
              {/* Status Legend */}
              <div className="grid grid-cols-2 gap-2 text-[10px] sm:text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500 flex-shrink-0"></div>
                  <span className="truncate">Available</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-blue-500 flex-shrink-0"></div>
                  <span className="truncate">Seated</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-yellow-500 flex-shrink-0"></div>
                  <span className="truncate">Pending</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-red-500 flex-shrink-0"></div>
                  <span className="truncate">Occupied</span>
                </div>
              </div>

              {/* Table Grid */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 sm:max-h-48 overflow-y-auto">
                {tablesWithStatus.map(table => {
                  const canSelect = table.statusInfo.status === 'available' || table.statusInfo.status === 'seated'
                  return (
                    <Button
                      key={table.id}
                      onClick={() => canSelect && setSelectedTable(table)}
                      disabled={!canSelect}
                      className={`h-12 sm:h-14 flex flex-col p-1.5 sm:p-2 relative min-h-[48px] touch-manipulation ${
                        canSelect ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                      } ${
                        selectedTable?.id === table.id ? 'ring-2 ring-primary' : ''
                      }`}
                    >
                      <div className="font-semibold text-xs sm:text-sm">T{table.table_number}</div>
                      <div className="text-[10px] sm:text-xs">{table.seating_capacity} seats</div>
                      
                      {/* Status indicator */}
                      <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${
                        table.statusInfo.status === 'available' ? 'bg-green-500' :
                        table.statusInfo.status === 'seated' ? 'bg-blue-500' :
                        table.statusInfo.status === 'pending' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`} />
                      
                      {/* Active order indicator */}
                      {table.activeOrder && (
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-[9px] sm:text-[10px] bg-yellow-200 text-yellow-800 px-1 py-0.5 rounded truncate max-w-full">
                          #{table.activeOrder.order_number?.slice(-4)}
                        </div>
                      )}
                    </Button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Selected Table Info */}
          {selectedTable && (
            <div className="mt-3 p-2 sm:p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-xs sm:text-sm font-medium text-blue-900">
                Selected: Table {selectedTable.table_number}
              </div>
              <div className="text-[10px] sm:text-xs text-blue-700">
                {selectedTable.seating_capacity} seats • {selectedTable.location || 'Main floor'}
              </div>
            </div>
          )}
        </div>

        {/* Guest Information */}
        <div className="p-3 sm:p-4 border-b border-border flex-shrink-0">
          <h3 className="font-semibold mb-3 flex items-center text-sm sm:text-base">
            <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Guest Information</span>
            <span className="sm:hidden">Guest Info</span>
          </h3>
          <Input
            placeholder="Guest name (optional)"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            className="h-10 sm:h-11 text-sm sm:text-base touch-manipulation"
          />
          <div className="text-xs text-muted-foreground mt-2 hidden sm:block">
            💡 Tip: Adding guest names helps with personalized service
          </div>
        </div>

        {/* Quick Server Actions */}
        <div className="p-3 sm:p-4 border-b border-border flex-shrink-0">
          <h3 className="font-semibold mb-3 text-xs sm:text-sm">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="h-8 sm:h-10 text-xs touch-manipulation min-h-[36px]">
              <Settings className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">Table Settings</span>
              <span className="sm:hidden">Settings</span>
            </Button>
            <Button variant="outline" size="sm" className="h-8 sm:h-10 text-xs touch-manipulation min-h-[36px]">
              <Package className="w-3 h-3 mr-1" />
              <span className="hidden sm:inline">Specials</span>
              <span className="sm:hidden">Specials</span>
            </Button>
          </div>
        </div>

        {/* Cart */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3 sm:p-4">
            <h3 className="font-semibold mb-3 flex items-center text-sm sm:text-base">
              <ShoppingCart className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Order Items ({cart.length})</span>
              <span className="sm:hidden">Items ({cart.length})</span>
            </h3>
            
            {cart.length === 0 ? (
              <div className="text-center py-6 sm:py-8 text-muted-foreground">
                <ShoppingCart className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm sm:text-base font-medium">Ready to take an order</p>
                <p className="text-xs sm:text-sm mt-1">
                  {selectedTable 
                    ? `Table ${selectedTable.table_number}`
                    : 'Select a table and add items'
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {cart.map(item => (
                  <div key={item.product.id} className="flex items-center justify-between p-2 sm:p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1 min-w-0 mr-2">
                      <div className="font-medium truncate text-sm sm:text-base">{item.product.name}</div>
                      <div className="text-xs sm:text-sm text-muted-foreground">
                        {formatCurrency(item.product.price)} × {item.quantity}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                      <div className="font-medium text-sm sm:text-base">
                        {formatCurrency(item.product.price * item.quantity)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.product.id)}
                          className="min-h-[32px] min-w-[32px] p-1 sm:min-h-[36px] sm:min-w-[36px] sm:p-2 touch-manipulation"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 sm:w-8 text-center text-sm sm:text-base font-medium">{item.quantity}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => addToCart(item.product)}
                          className="min-h-[32px] min-w-[32px] p-1 sm:min-h-[36px] sm:min-w-[36px] sm:p-2 touch-manipulation"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Order Notes */}
            {cart.length > 0 && (
              <div className="mt-4">
                <label className="text-xs sm:text-sm font-medium">Order Notes</label>
                <Input
                  placeholder="Special requests or notes..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="mt-1 h-10 sm:h-11 text-sm sm:text-base touch-manipulation"
                />
              </div>
            )}
          </div>
        </div>

        {/* Order Summary and Actions */}
        {cart.length > 0 ? (
          <div className="p-3 sm:p-4 border-t border-border bg-card flex-shrink-0">
            <div className="space-y-3">
              {/* Order Summary */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs sm:text-sm text-blue-700">
                    {selectedTable ? `Table ${selectedTable.table_number}` : 'No table selected'}
                  </span>
                  <span className="text-xs sm:text-sm text-blue-700">
                    {cart.length} item{cart.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="flex justify-between text-base sm:text-lg font-semibold text-blue-900">
                  <span>Order Total:</span>
                  <span>{formatCurrency(getTotalAmount())}</span>
                </div>
              </div>

              {/* Action Button */}
              <Button
                className="w-full min-h-[48px] sm:min-h-[52px] text-sm sm:text-base font-semibold touch-manipulation"
                size="lg"
                onClick={handleCreateOrder}
                disabled={!selectedTable || cart.length === 0 || createOrderMutation.isPending}
              >
                {createOrderMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    <span className="hidden sm:inline">Sending to Kitchen...</span>
                    <span className="sm:hidden">Sending...</span>
                  </>
                ) : !selectedTable ? (
                  <>
                    <TableIcon className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Select a Table First</span>
                    <span className="sm:hidden">Select Table</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Send Order to Kitchen</span>
                    <span className="sm:hidden">Send Order</span>
                  </>
                )}
              </Button>

              {/* Server Tips */}
              <div className="text-xs text-center text-muted-foreground hidden sm:block">
                💡 Double-check the order with guests before submitting
              </div>
            </div>
          </div>
        ) : (
          <div className="p-3 sm:p-4 border-t border-border bg-card flex-shrink-0">
            <div className="text-center text-muted-foreground">
              <p className="text-sm sm:text-base font-medium">No items selected</p>
              <p className="text-xs sm:text-sm mt-1">
                {selectedTable ? 'Add items to start taking an order' : 'Select a table to begin'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
