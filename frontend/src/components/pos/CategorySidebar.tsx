import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Grid3x3, Loader2 } from 'lucide-react'
import type { Category } from '@/types'

interface CategorySidebarProps {
  categories: Category[]
  selectedCategory: string
  onCategorySelect: (categoryId: string) => void
  isLoading: boolean
}

export function CategorySidebar({ 
  categories, 
  selectedCategory, 
  onCategorySelect, 
  isLoading 
}: CategorySidebarProps) {
  if (isLoading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Grid3x3 className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Categories</h3>
        </div>
      </div>

      {/* Categories List */}
      <div className="flex-1 overflow-auto p-4">
        <div className="space-y-2">
          {/* All Categories Option */}
          <button
            onClick={() => onCategorySelect('')}
            className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all ${
              selectedCategory === ''
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center">
                <Grid3x3 className="w-4 h-4 text-gray-600" />
              </div>
              <span className="font-medium">All Categories</span>
            </div>
            <Badge variant="outline" className="text-xs">
              All
            </Badge>
          </button>

          {/* Individual Categories */}
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => onCategorySelect(category.id)}
              className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all ${
                selectedCategory === category.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'hover:bg-gray-50 text-gray-700'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Category Color Indicator */}
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-medium"
                  style={{ backgroundColor: category.color || '#6B7280' }}
                >
                  {category.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="font-medium block">{category.name}</span>
                  {category.description && (
                    <span className="text-xs text-gray-500 block truncate max-w-[120px]">
                      {category.description}
                    </span>
                  )}
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                {category.sort_order}
              </Badge>
            </button>
          ))}
        </div>

        {/* Empty State */}
        {categories.length === 0 && (
          <div className="text-center py-8">
            <Grid3x3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-sm">No categories available</p>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-center">
          <p className="text-xs text-gray-500">
            {categories.length} categories available
          </p>
        </div>
      </div>
    </div>
  )
}

