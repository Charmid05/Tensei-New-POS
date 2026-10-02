import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  Wallet, 
  Banknote, 
  Smartphone, 
  ArrowLeft,
  CheckCircle
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export type PaymentMethod = 'cash' | 'credit_card' | 'debit_card' | 'digital_wallet'

interface PaymentMethodSelectionProps {
  totalAmount: number
  onMethodSelect: (method: PaymentMethod, data: PaymentData) => void
  onCancel: () => void
}

export interface PaymentData {
  method: PaymentMethod
  amount: number
  reference_number?: string
  // For cash payments
  cash_tendered?: number
  change_amount?: number
}

export function PaymentMethodSelection({ 
  totalAmount, 
  onMethodSelect, 
  onCancel 
}: PaymentMethodSelectionProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [cashTendered, setCashTendered] = useState(totalAmount.toString())
  const [referenceNumber, setReferenceNumber] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)

  const paymentMethods = [
    {
      id: 'cash' as PaymentMethod,
      name: 'Cash',
      description: 'Physical cash payment',
      icon: Banknote,
      color: 'bg-green-500',
      available: true
    },
    {
      id: 'credit_card' as PaymentMethod,
      name: 'Credit Card',
      description: 'Visa, Mastercard, Amex',
      icon: CreditCard,
      color: 'bg-blue-500',
      available: true
    },
    {
      id: 'debit_card' as PaymentMethod,
      name: 'Debit Card',
      description: 'Direct bank payment',
      icon: Wallet,
      color: 'bg-purple-500',
      available: true
    },
    {
      id: 'digital_wallet' as PaymentMethod,
      name: 'Digital Wallet',
      description: 'Apple Pay, Google Pay, etc.',
      icon: Smartphone,
      color: 'bg-orange-500',
      available: true
    }
  ]

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method)
    if (method === 'cash') {
      setCashTendered(totalAmount.toString())
    } else {
      setReferenceNumber('')
    }
  }

  const handleConfirmPayment = () => {
    if (!selectedMethod) return

    setIsProcessing(true)

    const paymentData: PaymentData = {
      method: selectedMethod,
      amount: totalAmount
    }

    if (selectedMethod === 'cash') {
      const tendered = parseFloat(cashTendered) || 0
      if (tendered < totalAmount) {
        alert('Cash tendered must be at least the total amount')
        setIsProcessing(false)
        return
      }
      paymentData.cash_tendered = tendered
      paymentData.change_amount = tendered - totalAmount
    } else {
      if (referenceNumber.trim()) {
        paymentData.reference_number = referenceNumber.trim()
      }
    }

    // Simulate processing delay for better UX
    setTimeout(() => {
      onMethodSelect(selectedMethod, paymentData)
      setIsProcessing(false)
    }, 1000)
  }

  const cashTenderedAmount = parseFloat(cashTendered) || 0
  const changeAmount = cashTenderedAmount - totalAmount
  const canProceed = selectedMethod && 
    (selectedMethod !== 'cash' || cashTenderedAmount >= totalAmount)

  if (!selectedMethod) {
    return (
      <div className="bg-white rounded-lg shadow-lg max-w-md mx-auto">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Select Payment Method</CardTitle>
            <Button variant="ghost" size="sm" onClick={onCancel}>
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(totalAmount)}
            </p>
            <p className="text-sm text-gray-500">Total Amount</p>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="grid gap-3">
            {paymentMethods.map((method) => (
              <Card 
                key={method.id}
                className={`cursor-pointer border-2 transition-all hover:shadow-md ${
                  method.available 
                    ? 'hover:border-blue-300 border-gray-200' 
                    : 'opacity-50 cursor-not-allowed border-gray-100'
                }`}
                onClick={() => method.available && handleMethodSelect(method.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${method.color} text-white`}>
                      <method.icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{method.name}</h3>
                      <p className="text-sm text-gray-500">{method.description}</p>
                    </div>
                    {method.available && (
                      <Badge variant="outline" className="text-xs">
                        Available
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-md mx-auto">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setSelectedMethod(null)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <CardTitle className="text-lg font-semibold">
            {paymentMethods.find(m => m.id === selectedMethod)?.name} Payment
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            ×
          </Button>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(totalAmount)}
          </p>
          <p className="text-sm text-gray-500">Total Amount</p>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {selectedMethod === 'cash' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cash Tendered
              </label>
              <Input
                type="number"
                step="0.01"
                min={totalAmount}
                value={cashTendered}
                onChange={(e) => setCashTendered(e.target.value)}
                placeholder="Enter amount received"
                className="text-lg font-semibold text-right"
              />
            </div>
            
            {changeAmount > 0 && (
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-green-800">Change Due:</span>
                  <span className="text-lg font-bold text-green-900">
                    {formatCurrency(changeAmount)}
                  </span>
                </div>
              </div>
            )}

            {changeAmount < 0 && (
              <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                <p className="text-sm font-medium text-red-800">
                  Insufficient amount. Need {formatCurrency(Math.abs(changeAmount))} more.
                </p>
              </div>
            )}
          </div>
        )}

        {selectedMethod !== 'cash' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Number (Optional)
              </label>
              <Input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Transaction ID, confirmation number, etc."
                className="font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter any reference number from the payment terminal
              </p>
            </div>

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                📱 Process the payment on your {selectedMethod.replace('_', ' ')} terminal, 
                then click confirm below.
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            onClick={() => setSelectedMethod(null)}
            className="flex-1"
            disabled={isProcessing}
          >
            Back
          </Button>
          <Button
            onClick={handleConfirmPayment}
            disabled={!canProceed || isProcessing}
            className="flex-1"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm Payment
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </div>
  )
}
