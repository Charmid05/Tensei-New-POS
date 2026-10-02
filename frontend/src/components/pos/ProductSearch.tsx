import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Search, 
  X, 
  ShoppingCart, 
  DollarSign,
  Package,
  Zap,
  Clock
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import type { Product } from '@/types'

interface ProductSearchProps {
  products: Product[]
  categories: any[]
  onProductSelect: (product: Product) => void
  onClose: () => void
  className?: string
}

export function ProductSearch({ 
  products, 
  categories, 
  onProductSelect, 
  onClose, 
  className 
}: ProductSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [showResults, setShowResults] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  // Filter products based on search query
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    categories.find(cat => cat.id === product.category_id)?.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).slice(0, 8) // Limit to 8 results for performance

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!showResults || filteredProducts.length === 0) return

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault()
          setSelectedIndex(prev => 
            prev < filteredProducts.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          event.preventDefault()
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredProducts.length - 1
          )
          break
        case 'Enter':
          event.preventDefault()
          if (filteredProducts[selectedIndex]) {
            handleProductSelect(filteredProducts[selectedIndex])
          }
          break
        case 'Escape':
          event.preventDefault()
          handleClose()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showResults, filteredProducts, selectedIndex])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Update search results visibility
  useEffect(() => {
    setShowResults(searchQuery.length > 0)
    setSelectedIndex(0)
  }, [searchQuery])

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && selectedIndex >= 0) {
      const selectedElement = resultsRef.current.children[selectedIndex] as HTMLElement
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        })
      }
    }
  }, [selectedIndex])

  const handleProductSelect = (product: Product) => {
    onProductSelect(product)
    setSearchQuery('')
    setShowResults(false)
    // Keep focus on search for quick consecutive additions
    inputRef.current?.focus()
  }

  const handleClose = () => {
    setSearchQuery('')
    setShowResults(false)
    onClose()
  }

  const getCategoryName = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.name || 'Unknown'
  }

  const getStockStatus = (product: Product) => {
    // Mock stock levels - replace with real data
    const mockStock = Math.floor(Math.random() * 50) + 1
    if (mockStock <= 5) return { status: 'low', count: mockStock, color: 'bg-red-100 text-red-700' }
    if (mockStock <= 15) return { status: 'medium', count: mockStock, color: 'bg-yellow-100 text-yellow-700' }
    return { status: 'good', count: mockStock, color: 'bg-green-100 text-green-700' }
  }

  return (
    <div className={`relative w-full max-w-2xl ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search products by name, description, or category... (Press ESC to close)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10 h-12 text-base border-2 border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery('')}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Results */}
      {showResults && (
        <Card className="absolute top-full left-0 right-0 mt-2 border-2 border-gray-200 shadow-xl z-50 max-h-96 overflow-hidden">
          <CardContent className="p-0">
            {filteredProducts.length > 0 ? (
              <div ref={resultsRef} className="max-h-96 overflow-auto">
                <div className="p-3 bg-gray-50 border-b text-sm text-gray-600 flex items-center justify-between">
                  <span>Found {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''}</span>
                  <span className="text-xs">Use ↑↓ arrows, Enter to select</span>
                </div>
                {filteredProducts.map((product, index) => {
                  const stock = getStockStatus(product)
                  const isSelected = index === selectedIndex
                  
                  return (
                    <div
                      key={product.id}
                      onClick={() => handleProductSelect(product)}
                      className={`p-4 border-b border-gray-100 cursor-pointer transition-all duration-150 ${
                        isSelected 
                          ? 'bg-blue-50 border-blue-200' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3">
                            <h3 className={`font-medium text-gray-900 ${isSelected ? 'text-blue-900' : ''}`}>
                              {product.name}
                            </h3>
                            <Badge variant="secondary" className="text-xs">
                              {getCategoryName(product.category_id)}
                            </Badge>
                            <Badge className={`text-xs ${stock.color}`}>
                              {stock.count} left
                            </Badge>
                          </div>
                          {product.description && (
                            <p className="text-sm text-gray-600 mt-1 line-clamp-1">
                              {product.description}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2">
                            <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
                              <DollarSign className="h-3 w-3" />
                              {formatCurrency(product.price)}
                            </span>
                            {product.available && (
                              <Badge variant="outline" className="text-xs">
                                <Package className="h-3 w-3 mr-1" />
                                Available
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Button
                            size="sm"
                            className={`gap-2 ${isSelected ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              handleProductSelect(product)
                            }}
                          >
                            <ShoppingCart className="h-4 w-4" />
                            Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Package className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="font-medium">No products found</p>
                <p className="text-sm">Try searching with different keywords</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Quick Help */}
      {!showResults && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          <span>💡 Pro tip: Use keyboard shortcuts - ↑↓ to navigate, Enter to select, ESC to close</span>
        </div>
      )}
    </div>
  )
}
