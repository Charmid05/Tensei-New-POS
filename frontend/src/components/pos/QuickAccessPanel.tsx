import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Zap, 
  Clock, 
  Star, 
  TrendingUp, 
  ShoppingCart,
  RotateCcw,
  Plus
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Product } from '@/types'

interface QuickAccessPanelProps {
  products: Product[]
  recentOrders?: any[] // Recent order data
  onProductSelect: (product: Product) => void
  className?: string
}

export function QuickAccessPanel({ 
  products, 
  recentOrders = [],
  onProductSelect, 
  className 
}: QuickAccessPanelProps) {
  const [recentItems, setRecentItems] = useState<Product[]>([])
  const [popularItems, setPopularItems] = useState<Product[]>([])

  // Simulate recent items (in real app, this would come from order history)
  useEffect(() => {
    // Mock recent items - replace with actual recent order data
    const mockRecentIds = ['1', '3', '5', '7'] // Recently ordered product IDs
    const recent = products.filter(p => mockRecentIds.includes(p.id)).slice(0, 6)
    setRecentItems(recent)

    // Mock popular items - replace with actual sales data
    const popular = [...products]
      .sort(() => Math.random() - 0.5) // Random for demo
      .slice(0, 8)
    setPopularItems(popular)
  }, [products])

  const quickActions = [
    {
      id: 'popular',
      title: 'Popular Items',
      icon: TrendingUp,
      items: popularItems,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      id: 'recent',
      title: 'Recently Ordered',
      icon: Clock,
      items: recentItems,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    }
  ]

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Quick Stats */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-500" />
            Quick Access
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              size="sm"
              className="h-12 flex flex-col gap-1 text-xs"
              onClick={() => {
                // Add most popular item to cart
                if (popularItems[0]) {
                  onProductSelect(popularItems[0])
                }
              }}
            >
              <Star className="h-4 w-4 text-yellow-500" />
              <span>Most Popular</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-12 flex flex-col gap-1 text-xs"
              onClick={() => {
                // Add last ordered item
                if (recentItems[0]) {
                  onProductSelect(recentItems[0])
                }
              }}
            >
              <RotateCcw className="h-4 w-4 text-blue-500" />
              <span>Last Order</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quick Action Sections */}
      {quickActions.map((section) => {
        const Icon = section.icon
        
        return (
          <Card key={section.id}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-700 flex items-center gap-2">
                <Icon className={`h-4 w-4 ${section.color}`} />
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              {section.items.length > 0 ? (
                section.items.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer group"
                    onClick={() => onProductSelect(product)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {product.name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">
                          {formatCurrency(product.price)}
                        </span>
                        {product.available && (
                          <Badge variant="outline" className="text-xs py-0">
                            Available
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        onProductSelect(product)
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No {section.title.toLowerCase()} yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}

      {/* Quick Quantity Buttons */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-gray-700">
            Quick Quantities
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 5].map(qty => (
              <Button
                key={qty}
                variant="outline"
                size="sm"
                className="h-8 text-xs"
                onClick={() => {
                  // This would be used with a selected product to add multiple quantities
                  console.log(`Quick add quantity: ${qty}`)
                }}
              >
                ×{qty}
              </Button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2 text-center">
            Select a product first, then use quantity shortcuts
          </p>
        </CardContent>
      </Card>

      {/* Quick Tips */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50">
        <CardContent className="pt-4">
          <div className="text-center">
            <Zap className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-xs font-medium text-gray-700 mb-1">
              Power User Tips
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">
              • Use search (Ctrl+F) for instant product lookup<br/>
              • Click recent items for quick re-orders<br/>
              • Popular items update based on sales data
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
