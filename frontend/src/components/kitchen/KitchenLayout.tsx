import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { KitchenHeader } from './KitchenHeader'
import { KitchenOrderCard } from './KitchenOrderCard'
import { OrderFilters } from './OrderFilters'
import apiClient from '@/api/client'
import type { User, Order } from '@/types'

interface KitchenLayoutProps {
  user: User
}

export function KitchenLayout({ user }: KitchenLayoutProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [isTabletOptimized, setIsTabletOptimized] = useState(true) // Kitchen is primarily tablet-focused
  const [searchQuery, setSearchQuery] = useState('')
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Fetch kitchen orders with real-time updates
  const { data: ordersResponse, isLoading, refetch } = useQuery({
    queryKey: ['kitchenOrders', selectedStatus],
    queryFn: () => apiClient.getKitchenOrders(selectedStatus === 'all' ? undefined : selectedStatus),
    refetchInterval: autoRefresh ? 5000 : false, // Auto-refresh every 5 seconds
  })

  const orders = ordersResponse?.data || []

  // Filter orders by search query
  const filteredOrders = orders.filter((order: Order) => {
    if (!searchQuery) return true
    const searchLower = searchQuery.toLowerCase()
    return (
      order.order_number?.toLowerCase().includes(searchLower) ||
      order.customer_name?.toLowerCase().includes(searchLower) ||
      order.table?.table_number?.toLowerCase().includes(searchLower)
    )
  })

  // Group orders by status for better organization
  const ordersByStatus = {
    confirmed: filteredOrders.filter((order: Order) => order.status === 'confirmed'),
    preparing: filteredOrders.filter((order: Order) => order.status === 'preparing'),
    ready: filteredOrders.filter((order: Order) => order.status === 'ready')
  }

  // Handle order status update
  const handleOrderStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await apiClient.updateOrderStatus(orderId, newStatus)
      refetch() // Refresh the orders list
    } catch (error) {
      console.error('Failed to update order status:', error)
      // TODO: Add proper error handling/toast notification
    }
  }

  // Handle order item status update
  const handleOrderItemStatusUpdate = async (orderId: string, itemId: string, newStatus: string) => {
    try {
      await apiClient.updateOrderItemStatus(orderId, itemId, newStatus)
      refetch() // Refresh the orders list
    } catch (error) {
      console.error('Failed to update order item status:', error)
      // TODO: Add proper error handling/toast notification
    }
  }

  // Manual refresh
  const handleRefresh = () => {
    refetch()
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Kitchen Header */}
      <KitchenHeader 
        user={user}
        autoRefresh={autoRefresh}
        onToggleAutoRefresh={setAutoRefresh}
        onRefresh={handleRefresh}
        isLoading={isLoading}
      />

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 p-4">
        <OrderFilters
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          orderCounts={{
            all: orders.length,
            confirmed: ordersByStatus.confirmed.length,
            preparing: ordersByStatus.preparing.length,
            ready: ordersByStatus.ready.length
          }}
        />
      </div>

      {/* Orders Display */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading kitchen orders...</p>
            </div>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders</h3>
              <p className="text-gray-500">
                {searchQuery ? 'No orders match your search criteria.' : 'No active kitchen orders at the moment.'}
              </p>
            </div>
          </div>
        ) : selectedStatus === 'all' ? (
          // Show orders grouped by status
          <div className="p-6 space-y-8">
            {/* Confirmed Orders */}
            {ordersByStatus.confirmed.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                  New Orders ({ordersByStatus.confirmed.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {ordersByStatus.confirmed.map((order: Order) => (
                    <KitchenOrderCard
                      key={order.id}
                      order={order}
                      onStatusUpdate={handleOrderStatusUpdate}
                      onItemStatusUpdate={handleOrderItemStatusUpdate}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Preparing Orders */}
            {ordersByStatus.preparing.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  Preparing ({ordersByStatus.preparing.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {ordersByStatus.preparing.map((order: Order) => (
                    <KitchenOrderCard
                      key={order.id}
                      order={order}
                      onStatusUpdate={handleOrderStatusUpdate}
                      onItemStatusUpdate={handleOrderItemStatusUpdate}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Ready Orders */}
            {ordersByStatus.ready.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  Ready for Service ({ordersByStatus.ready.length})
                </h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {ordersByStatus.ready.map((order: Order) => (
                    <KitchenOrderCard
                      key={order.id}
                      order={order}
                      onStatusUpdate={handleOrderStatusUpdate}
                      onItemStatusUpdate={handleOrderItemStatusUpdate}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          // Show filtered orders
          <div className="p-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredOrders.map((order: Order) => (
                <KitchenOrderCard
                  key={order.id}
                  order={order}
                  onStatusUpdate={handleOrderStatusUpdate}
                  onItemStatusUpdate={handleOrderItemStatusUpdate}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
