import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface OrderFiltersProps {
  selectedStatus: string
  onStatusChange: (status: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  orderCounts: {
    all: number
    confirmed: number
    preparing: number
    ready: number
  }
}

export function OrderFilters({ 
  selectedStatus, 
  onStatusChange, 
  searchQuery, 
  onSearchChange,
  orderCounts 
}: OrderFiltersProps) {
  const filterButtons = [
    { key: 'all', label: 'All Orders', count: orderCounts.all, color: 'bg-gray-500' },
    { key: 'confirmed', label: 'New', count: orderCounts.confirmed, color: 'bg-yellow-500' },
    { key: 'preparing', label: 'Preparing', count: orderCounts.preparing, color: 'bg-blue-500' },
    { key: 'ready', label: 'Ready', count: orderCounts.ready, color: 'bg-green-500' },
  ]

  return (
    <div className="space-y-4">
      {/* Status Filter Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {filterButtons.map((filter) => (
          <Button
            key={filter.key}
            variant={selectedStatus === filter.key ? "default" : "outline"}
            size="sm"
            onClick={() => onStatusChange(filter.key)}
            className="relative flex items-center space-x-2 h-9"
          >
            <div className={`w-2 h-2 rounded-full ${filter.color}`}></div>
            <span>{filter.label}</span>
            {filter.count > 0 && (
              <span className={`
                px-2 py-0.5 text-xs rounded-full min-w-[20px] text-center
                ${selectedStatus === filter.key 
                  ? 'bg-white/20 text-white' 
                  : 'bg-gray-100 text-gray-700'
                }
              `}>
                {filter.count}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <svg 
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <Input
            type="text"
            placeholder="Search orders by number, customer, or table..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Quick actions */}
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <span>Total: {orderCounts.all} orders</span>
        </div>
      </div>
    </div>
  )
}
