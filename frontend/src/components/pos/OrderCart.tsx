import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  X, 
  Trash2, 
  CreditCard,
  Receipt,
  MapPin
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { PaymentConfirmationModal } from './PaymentConfirmationModal'
import type { CartItem, DiningTable } from '@/types'

interface OrderCartProps {
  items: CartItem[]
  subtotal: number
  taxAmount: number
  totalAmount: number
  selectedTable: DiningTable | null
  orderType: 'dine_in' | 'takeout' | 'delivery'
  customerName: string
  onUpdateQuantity: (productId: string, quantity: number) => void
  onRemoveItem: (productId: string) => void
  onClearCart: () => void
}

export function OrderCart({
  items,
  subtotal,
  taxAmount,
  totalAmount,
  selectedTable,
  orderType,
  customerName,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart
}: OrderCartProps) {
  const [notes, setNotes] = useState('')
  const [showPaymentModal, setShowPaymentModal] = useState(false)

  const handleProceedToPayment = () => {
    if (items.length === 0) {
      alert('Please add items to the cart')
      return
    }

    if (orderType === 'dine_in' && !selectedTable) {
      alert('Please select a table for dine-in orders')
      return
    }

    if (orderType !== 'dine_in' && !customerName.trim()) {
      alert(`Please enter customer ${orderType === 'delivery' ? 'address' : 'name'}`)
      return
    }

    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = () => {
    // Clear cart and notes after successful payment
    onClearCart()
    setNotes('')
    setShowPaymentModal(false)
  }

  const canProceedToPayment = items.length > 0 && 
    (orderType !== 'dine_in' || selectedTable) && 
    (orderType === 'dine_in' || customerName.trim())

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Current Order</h3>
          </div>
          {items.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClearCart}
              className="text-gray-500 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Order Info */}
      {(selectedTable || customerName || orderType !== 'dine_in') && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className="capitalize">{orderType.replace('_', ' ')}</Badge>
              {selectedTable && (
                <Badge variant="outline" className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  Table {selectedTable.table_number}
                </Badge>
              )}
            </div>
            {customerName && (
              <p className="text-sm text-gray-600">
                {orderType === 'delivery' ? 'Address' : 'Customer'}: {customerName}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Cart Items */}
      <div className="flex-1 overflow-auto">
        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Cart is empty</h3>
              <p className="text-gray-500">
                Select products from the menu to start building an order.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 space-y-3">
            {items.map((item) => (
              <Card key={item.product.id} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm">
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatCurrency(item.product.price)} each
                      </p>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(item.product.id)}
                      className="p-1 h-6 w-6 text-gray-400 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity - 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      
                      <span className="w-12 text-center font-medium">
                        {item.quantity}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(item.product.id, item.quantity + 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Item Total */}
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(item.product.price * item.quantity)}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Order Notes */}
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Notes (Optional)
              </label>
              <Input
                placeholder="Special instructions..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="text-sm"
              />
            </div>
          </div>
        )}
      </div>

      {/* Order Summary & Checkout */}
      {items.length > 0 && (
        <div className="border-t border-gray-200 p-4">
          {/* Order Totals */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Tax (10%)</span>
              <span className="font-medium">{formatCurrency(taxAmount)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t border-gray-200 pt-2">
              <span>Total</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
          </div>

          {/* Item Count */}
          <p className="text-sm text-gray-500 mb-4">
            {items.reduce((sum, item) => sum + item.quantity, 0)} items in cart
          </p>

          {/* Payment Button */}
          <Button
            onClick={handleProceedToPayment}
            disabled={!canProceedToPayment}
            className="w-full"
            size="lg"
          >
            <CreditCard className="w-4 h-4 mr-2" />
            Proceed to Payment
          </Button>

          {!canProceedToPayment && items.length > 0 && (
            <p className="text-xs text-red-600 mt-2 text-center">
              {orderType === 'dine_in' && !selectedTable && 'Please select a table'}
              {orderType !== 'dine_in' && !customerName.trim() && `Please enter customer ${orderType === 'delivery' ? 'address' : 'name'}`}
            </p>
          )}
        </div>
      )}

      {/* Payment Confirmation Modal */}
      <PaymentConfirmationModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        items={items}
        subtotal={subtotal}
        taxAmount={taxAmount}
        totalAmount={totalAmount}
        selectedTable={selectedTable}
        orderType={orderType}
        customerName={customerName}
        orderNotes={notes}
        onSuccess={handlePaymentSuccess}
      />
    </div>
  )
}

