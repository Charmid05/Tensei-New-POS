import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search,
  Filter,
  Calendar,
  CreditCard,
  Banknote,
  Wallet,
  Smartphone,
  Receipt,
  Eye,
  RefreshCw,
  Clock
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { ReceiptDisplay } from './ReceiptDisplay'
import apiClient from '@/api/client'
import type { Order, Payment } from '@/types'

interface PaymentHistoryProps {
  isOpen: boolean
  onClose: () => void
}

interface PaymentWithOrder extends Payment {
  order?: Order
}

export function PaymentHistory({ isOpen, onClose }: PaymentHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithOrder | null>(null)
  const [showReceipt, setShowReceipt] = useState(false)

  // Fetch payments - in a real app, this would be paginated
  const { data: paymentsResponse, isLoading, refetch } = useQuery({
    queryKey: ['payments', 'history'],
    queryFn: async () => {
      // Note: This is a simplified approach. In practice, you'd have a dedicated endpoint for payment history
      const ordersResponse = await apiClient.getOrders({ 
        status: undefined,
        limit: 100,
        offset: 0 
      })
      
      if (!ordersResponse.success) {
        throw new Error('Failed to fetch orders')
      }

      // Get payments for each order
      const paymentsPromises = ordersResponse.data?.map(async (order) => {
        try {
          const paymentResponse = await apiClient.getPayments(order.id)
          if (paymentResponse.success && paymentResponse.data) {
            return paymentResponse.data.map(payment => ({ ...payment, order }))
          }
        } catch (error) {
          console.warn(`Failed to get payments for order ${order.id}:`, error)
        }
        return []
      }) || []

      const allPayments = await Promise.all(paymentsPromises)
      return allPayments.flat()
    },
    enabled: isOpen,
  })

  const payments = paymentsResponse || []

  // Filter payments
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = !searchTerm || 
      payment.order?.id.includes(searchTerm.toLowerCase()) ||
      payment.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.order?.customer_name?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter
    const matchesMethod = methodFilter === 'all' || payment.payment_method === methodFilter

    return matchesSearch && matchesStatus && matchesMethod
  })

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash': return Banknote
      case 'credit_card': return CreditCard
      case 'debit_card': return Wallet
      case 'digital_wallet': return Smartphone
      default: return CreditCard
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'failed': return 'bg-red-100 text-red-800 border-red-200'
      case 'refunded': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleViewReceipt = (payment: PaymentWithOrder) => {
    if (payment.order) {
      setSelectedPayment(payment)
      setShowReceipt(true)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] bg-white flex flex-col">
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment History
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={onClose}>
                ×
              </Button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mt-4">
            {/* Search */}
            <div className="relative flex-1 min-w-60">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search by order ID, reference, or customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>

            {/* Method Filter */}
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Methods</option>
              <option value="cash">Cash</option>
              <option value="credit_card">Credit Card</option>
              <option value="debit_card">Debit Card</option>
              <option value="digital_wallet">Digital Wallet</option>
            </select>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-auto p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-2 text-gray-500">
                <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                <span>Loading payment history...</span>
              </div>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== 'all' || methodFilter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'Payment history will appear here as transactions are processed'
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-3">
                {filteredPayments.map((payment) => (
                  <Card key={payment.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {/* Order ID */}
                            <div>
                              <span className="text-sm font-medium text-gray-900">
                                Order #{payment.order?.id.slice(-8).toUpperCase() || 'N/A'}
                              </span>
                              {payment.order?.customer_name && (
                                <span className="text-sm text-gray-500 ml-2">
                                  • {payment.order.customer_name}
                                </span>
                              )}
                            </div>

                            {/* Status */}
                            <Badge className={`text-xs ${getStatusColor(payment.status)}`}>
                              {payment.status}
                            </Badge>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            {/* Payment Method */}
                            <div className="flex items-center gap-1">
                              {(() => {
                                const Icon = getPaymentIcon(payment.payment_method)
                                return <Icon className="w-4 h-4" />
                              })()}
                              <span className="capitalize">
                                {payment.payment_method.replace('_', ' ')}
                              </span>
                            </div>

                            {/* Date */}
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{formatDate(payment.created_at)}</span>
                            </div>

                            {/* Reference */}
                            {payment.reference_number && (
                              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
                                {payment.reference_number}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          {/* Amount */}
                          <div className="text-right">
                            <div className="text-lg font-semibold text-gray-900">
                              {formatCurrency(payment.amount)}
                            </div>
                            {payment.processed_at && (
                              <div className="text-xs text-gray-500">
                                {formatDate(payment.processed_at)}
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewReceipt(payment)}
                              disabled={!payment.order}
                              className="p-2"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>

        {/* Summary */}
        {!isLoading && filteredPayments.length > 0 && (
          <div className="flex-shrink-0 border-t bg-gray-50 px-6 py-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">
                {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''} found
              </span>
              <span className="font-semibold">
                Total: {formatCurrency(
                  filteredPayments.reduce((sum, payment) => sum + payment.amount, 0)
                )}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Receipt Modal */}
      {showReceipt && selectedPayment && selectedPayment.order && (
        <ReceiptDisplay
          isOpen={showReceipt}
          onClose={() => {
            setShowReceipt(false)
            setSelectedPayment(null)
          }}
          order={selectedPayment.order}
          payment={selectedPayment}
          items={selectedPayment.order.order_items?.map(item => ({
            product: {
              id: item.product_id,
              name: item.product_name || 'Unknown Product',
              price: item.unit_price
            },
            quantity: item.quantity
          })) || []}
          subtotal={selectedPayment.amount / 1.1} // Rough estimate, adjust based on your tax calculation
          taxAmount={selectedPayment.amount - (selectedPayment.amount / 1.1)}
          totalAmount={selectedPayment.amount}
          selectedTable={undefined} // Would need to fetch table info if needed
          orderType={selectedPayment.order.order_type}
          customerName={selectedPayment.order.customer_name}
        />
      )}
    </div>
  )
}
