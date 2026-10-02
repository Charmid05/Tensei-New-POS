import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Receipt, 
  Printer, 
  Download, 
  X,
  MapPin,
  Clock,
  User,
  CreditCard,
  Banknote,
  Wallet,
  Smartphone
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Order, Payment, CartItem, DiningTable } from '@/types'

interface ReceiptDisplayProps {
  isOpen: boolean
  onClose: () => void
  order: Order
  payment: Payment
  items: CartItem[]
  subtotal: number
  taxAmount: number
  totalAmount: number
  selectedTable?: DiningTable | null
  orderType: 'dine_in' | 'takeout' | 'delivery'
  customerName?: string
  cashTendered?: number
  changeAmount?: number
}

export function ReceiptDisplay({
  isOpen,
  onClose,
  order,
  payment,
  items,
  subtotal,
  taxAmount,
  totalAmount,
  selectedTable,
  orderType,
  customerName,
  cashTendered,
  changeAmount
}: ReceiptDisplayProps) {
  if (!isOpen) return null

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash': return Banknote
      case 'credit_card': return CreditCard
      case 'debit_card': return Wallet
      case 'digital_wallet': return Smartphone
      default: return CreditCard
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handlePrint = () => {
    // TODO: Implement actual receipt printing
    const printContent = document.getElementById('receipt-content')
    if (printContent) {
      const printWindow = window.open('', '', 'width=400,height=600')
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Receipt - Order #${order.id.slice(-8).toUpperCase()}</title>
              <style>
                body { font-family: 'Courier New', monospace; margin: 20px; }
                .receipt { max-width: 300px; margin: 0 auto; }
                .center { text-align: center; }
                .bold { font-weight: bold; }
                .line { border-top: 1px dashed #000; margin: 10px 0; }
                .item { display: flex; justify-content: space-between; margin: 5px 0; }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `)
        printWindow.document.close()
        printWindow.print()
      }
    }
  }

  const handleDownload = () => {
    // Create a simple text receipt for download
    const receiptText = `
================================
         RESTAURANT POS
         RECEIPT #${order.id.slice(-8).toUpperCase()}
================================
Date: ${formatDate(order.created_at)}
Order Type: ${orderType.replace('_', ' ').toUpperCase()}
${selectedTable ? `Table: ${selectedTable.table_number}` : ''}
${customerName ? `Customer: ${customerName}` : ''}

--------------------------------
ITEMS:
${items.map(item => 
  `${item.quantity}x ${item.product.name.padEnd(20)} ${formatCurrency(item.product.price * item.quantity)}`
).join('\n')}

--------------------------------
Subtotal:        ${formatCurrency(subtotal)}
Tax (10%):       ${formatCurrency(taxAmount)}
Total:           ${formatCurrency(totalAmount)}

Payment Method:  ${payment.payment_method.replace('_', ' ').toUpperCase()}
${cashTendered ? `Cash Tendered:   ${formatCurrency(cashTendered)}` : ''}
${changeAmount && changeAmount > 0 ? `Change:          ${formatCurrency(changeAmount)}` : ''}
${payment.reference_number ? `Reference:       ${payment.reference_number}` : ''}

================================
Thank you for your business!
================================
    `.trim()

    const blob = new Blob([receiptText], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `receipt-${order.id.slice(-8)}.txt`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white">
        <CardHeader className="text-center pb-4">
          <div className="flex items-center justify-between">
            <Receipt className="w-6 h-6 text-gray-600" />
            <CardTitle className="text-lg font-semibold">Receipt</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Receipt Content - for printing */}
          <div id="receipt-content" className="px-6 pb-6">
            {/* Header */}
            <div className="text-center border-b pb-4 mb-4">
              <h2 className="text-xl font-bold">Restaurant POS</h2>
              <p className="text-sm text-gray-600">Receipt #{order.id.slice(-8).toUpperCase()}</p>
              <p className="text-xs text-gray-500">{formatDate(order.created_at)}</p>
            </div>

            {/* Order Info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2">
                <Badge className="capitalize text-xs">
                  {orderType.replace('_', ' ')}
                </Badge>
                {selectedTable && (
                  <Badge variant="outline" className="flex items-center gap-1 text-xs">
                    <MapPin className="w-3 h-3" />
                    Table {selectedTable.table_number}
                  </Badge>
                )}
              </div>
              
              {customerName && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>{orderType === 'delivery' ? 'Delivery Address' : 'Customer'}: {customerName}</span>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="border-t border-b py-4 mb-4">
              <h3 className="font-semibold mb-3">Items Ordered:</h3>
              <div className="space-y-2">
                {items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div>
                      <span className="font-medium">{item.quantity}x</span> {item.product.name}
                      <div className="text-xs text-gray-500">
                        @ {formatCurrency(item.product.price)} each
                      </div>
                    </div>
                    <span className="font-semibold">
                      {formatCurrency(item.product.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Tax (10%):</span>
                <span>{formatCurrency(taxAmount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            </div>

            {/* Payment Info */}
            <div className="border-t pt-4 mb-4">
              <h3 className="font-semibold mb-2">Payment Information:</h3>
              <div className="space-y-1 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = getPaymentIcon(payment.payment_method)
                      return <Icon className="w-4 h-4" />
                    })()}
                    <span className="capitalize">{payment.payment_method.replace('_', ' ')}</span>
                  </div>
                  <span className="font-semibold">{formatCurrency(payment.amount)}</span>
                </div>
                
                {cashTendered && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cash Tendered:</span>
                      <span>{formatCurrency(cashTendered)}</span>
                    </div>
                    {changeAmount && changeAmount > 0 && (
                      <div className="flex justify-between font-semibold text-green-700">
                        <span>Change Due:</span>
                        <span>{formatCurrency(changeAmount)}</span>
                      </div>
                    )}
                  </>
                )}
                
                {payment.reference_number && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Reference:</span>
                    <span className="font-mono">{payment.reference_number}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-xs">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant="outline" className="text-xs">
                    {payment.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-xs text-gray-500 border-t pt-4">
              <p>Thank you for your business!</p>
              <p>Visit us again soon</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 p-6 border-t">
            <Button variant="outline" onClick={handlePrint} className="flex-1">
              <Printer className="w-4 h-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={handleDownload} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
