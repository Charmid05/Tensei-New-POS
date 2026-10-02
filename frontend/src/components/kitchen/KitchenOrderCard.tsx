import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Order, OrderItem } from '@/types'

interface KitchenOrderCardProps {
  order: Order
  onStatusUpdate: (orderId: string, newStatus: string) => void
  onItemStatusUpdate: (orderId: string, itemId: string, newStatus: string) => void
}

export function KitchenOrderCard({ order, onStatusUpdate, onItemStatusUpdate }: KitchenOrderCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Calculate time since order was created
  const getTimeElapsed = () => {
    const createdAt = new Date(order.created_at)
    const now = new Date()
    const diff = Math.floor((now.getTime() - createdAt.getTime()) / 1000 / 60) // minutes
    
    if (diff < 1) return 'Just now'
    if (diff < 60) return `${diff}m ago`
    const hours = Math.floor(diff / 60)
    const minutes = diff % 60
    return `${hours}h ${minutes}m ago`
  }

  // Get status color and next actions
  const getStatusInfo = () => {
    switch (order.status) {
      case 'confirmed':
        return {
          color: 'bg-yellow-500',
          textColor: 'text-yellow-700',
          bgColor: 'bg-yellow-50',
          nextAction: 'Start Preparing',
          nextStatus: 'preparing'
        }
      case 'preparing':
        return {
          color: 'bg-blue-500',
          textColor: 'text-blue-700',
          bgColor: 'bg-blue-50',
          nextAction: 'Mark Ready',
          nextStatus: 'ready'
        }
      case 'ready':
        return {
          color: 'bg-green-500',
          textColor: 'text-green-700',
          bgColor: 'bg-green-50',
          nextAction: 'Mark Served',
          nextStatus: 'served'
        }
      default:
        return {
          color: 'bg-gray-500',
          textColor: 'text-gray-700',
          bgColor: 'bg-gray-50',
          nextAction: 'Update',
          nextStatus: 'confirmed'
        }
    }
  }

  const statusInfo = getStatusInfo()
  const timeElapsed = getTimeElapsed()

  // Calculate estimated completion time based on preparation times
  const getEstimatedTime = () => {
    if (!order.items || order.items.length === 0) return null
    const maxPrepTime = Math.max(...order.items.map((item: OrderItem) => item.product?.preparation_time || 0))
    return maxPrepTime > 0 ? `${maxPrepTime} min` : null
  }

  const estimatedTime = getEstimatedTime()

  return (
    <Card className={`${statusInfo.bgColor} border-l-4 border-l-${statusInfo.color.replace('bg-', '')}`}>
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-semibold text-gray-900">#{order.order_number}</h3>
              <Badge 
                variant="secondary" 
                className={`${statusInfo.textColor} ${statusInfo.bgColor} border-0 capitalize`}
              >
                {order.status}
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <span className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {timeElapsed}
              </span>
              
              {order.table && (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m0 0H7m2 0v-5a2 2 0 012-2h2a2 2 0 012 2v5m-4 0V9a2 2 0 012-2h2a2 2 0 012 2v7.5" />
                  </svg>
                  Table {order.table.table_number}
                </span>
              )}
              
              {order.customer_name && (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {order.customer_name}
                </span>
              )}
            </div>

            {estimatedTime && (
              <div className="text-sm text-gray-500 mt-1">
                Est. {estimatedTime} prep time
              </div>
            )}
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-400 hover:text-gray-600 ml-2"
          >
            <svg 
              className={`w-5 h-5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Order Items Preview */}
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-1">
            {order.items?.length || 0} items
          </div>
          
          {/* Quick preview of items */}
          <div className="space-y-1">
            {(order.items || []).slice(0, isExpanded ? undefined : 3).map((item: OrderItem) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center">
                  <span className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-xs mr-2">
                    {item.quantity}
                  </span>
                  <span className="font-medium">{item.product?.name}</span>
                </span>
                
                {order.status === 'preparing' && (
                  <Badge
                    variant={item.status === 'ready' ? 'default' : 'secondary'}
                    className="text-xs cursor-pointer"
                    onClick={() => onItemStatusUpdate(
                      order.id, 
                      item.id, 
                      item.status === 'ready' ? 'pending' : 'ready'
                    )}
                  >
                    {item.status === 'ready' ? '✓ Ready' : 'Preparing'}
                  </Badge>
                )}
              </div>
            ))}
            
            {!isExpanded && (order.items?.length || 0) > 3 && (
              <div className="text-xs text-gray-500 text-center">
                +{(order.items?.length || 0) - 3} more items
              </div>
            )}
          </div>
        </div>

        {/* Expanded details */}
        {isExpanded && (
          <div className="space-y-3 mb-4 pt-3 border-t border-gray-200">
            {/* Special instructions */}
            {order.notes && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-1">Special Instructions:</h4>
                <p className="text-sm text-gray-600 bg-white p-2 rounded border">{order.notes}</p>
              </div>
            )}

            {/* Item details */}
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-2">Order Details:</h4>
              <div className="space-y-2">
                {(order.items || []).map((item: OrderItem) => (
                  <div key={item.id} className="bg-white p-3 rounded border">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{item.product?.name}</span>
                      <span className="text-sm text-gray-500">×{item.quantity}</span>
                    </div>
                    
                    {item.special_instructions && (
                      <p className="text-xs text-gray-600 italic">Note: {item.special_instructions}</p>
                    )}
                    
                    {item.product?.preparation_time && (
                      <p className="text-xs text-gray-500">Prep time: {item.product.preparation_time} min</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-2">
          <Button
            onClick={() => onStatusUpdate(order.id, statusInfo.nextStatus)}
            className="flex-1"
            size="sm"
          >
            {statusInfo.nextAction}
          </Button>
          
          {order.status !== 'confirmed' && (
            <Button
              variant="outline"
              onClick={() => onStatusUpdate(order.id, 'confirmed')}
              size="sm"
            >
              Reset
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
