import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
  X, 
  MapPin, 
  Users, 
  Search,
  CheckCircle,
  Clock
} from 'lucide-react'
import type { DiningTable } from '@/types'

interface TableSelectionModalProps {
  tables: DiningTable[]
  selectedTable: DiningTable | null
  onTableSelect: (table: DiningTable) => void
  onClose: () => void
}

export function TableSelectionModal({ 
  tables, 
  selectedTable, 
  onTableSelect, 
  onClose 
}: TableSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLocation, setSelectedLocation] = useState<string>('')

  // Get unique locations
  const locations = [...new Set(tables.map(t => t.location || 'General'))]

  // Filter tables based on search and location
  const filteredTables = tables.filter(table => {
    const matchesSearch = table.table_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (table.location || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesLocation = !selectedLocation || (table.location || 'General') === selectedLocation
    
    return matchesSearch && matchesLocation
  })

  // Group tables by location
  const tablesByLocation = filteredTables.reduce((acc, table) => {
    const location = table.location || 'General'
    if (!acc[location]) acc[location] = []
    acc[location].push(table)
    return acc
  }, {} as Record<string, DiningTable[]>)

  const getTableStatusColor = (table: DiningTable) => {
    if (table.is_occupied) {
      return 'bg-red-100 border-red-200 text-red-800'
    }
    return 'bg-green-100 border-green-200 text-green-800'
  }

  const getTableStatusIcon = (table: DiningTable) => {
    if (table.is_occupied) {
      return <Clock className="w-4 h-4" />
    }
    return <CheckCircle className="w-4 h-4" />
  }

  const getTableStatusText = (table: DiningTable) => {
    return table.is_occupied ? 'Occupied' : 'Available'
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Select Table</h2>
            <p className="text-sm text-gray-500 mt-1">
              Choose an available table for dine-in service
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Search and Filters */}
        <div className="p-6 border-b border-gray-200 space-y-4">
          <div className="flex gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search tables..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Location Filter */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedLocation === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedLocation('')}
            >
              All Locations
            </Button>
            {locations.map(location => (
              <Button
                key={location}
                variant={selectedLocation === location ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedLocation(location)}
              >
                {location}
              </Button>
            ))}
          </div>
        </div>

        {/* Tables Grid */}
        <div className="flex-1 overflow-auto p-6">
          {Object.keys(tablesByLocation).length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No tables found</h3>
              <p className="text-gray-500">Try adjusting your search criteria.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(tablesByLocation).map(([location, locationTables]) => (
                <div key={location}>
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <h3 className="font-medium text-gray-900">{location}</h3>
                    <Badge variant="outline" className="text-xs">
                      {locationTables.length} tables
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {locationTables.map((table) => (
                      <Card
                        key={table.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedTable?.id === table.id
                            ? 'ring-2 ring-blue-500 border-blue-200'
                            : ''
                        } ${
                          table.is_occupied
                            ? 'opacity-60 cursor-not-allowed'
                            : ''
                        }`}
                        onClick={() => !table.is_occupied && onTableSelect(table)}
                      >
                        <CardContent className="p-4 text-center">
                          <div className="space-y-3">
                            {/* Table Number */}
                            <div>
                              <h4 className="text-lg font-bold text-gray-900">
                                {table.table_number}
                              </h4>
                            </div>

                            {/* Table Info */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                                <Users className="w-4 h-4" />
                                <span>{table.seating_capacity} seats</span>
                              </div>

                              {/* Status Badge */}
                              <Badge 
                                className={`text-xs flex items-center gap-1 justify-center ${
                                  getTableStatusColor(table)
                                }`}
                              >
                                {getTableStatusIcon(table)}
                                {getTableStatusText(table)}
                              </Badge>
                            </div>

                            {/* Selected Indicator */}
                            {selectedTable?.id === table.id && (
                              <div className="flex items-center justify-center">
                                <CheckCircle className="w-5 h-5 text-blue-600" />
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {selectedTable ? (
                <span>
                  Selected: Table {selectedTable.table_number} 
                  ({selectedTable.seating_capacity} seats, {selectedTable.location || 'General'})
                </span>
              ) : (
                <span>No table selected</span>
              )}
            </div>
            
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={onClose} 
                disabled={!selectedTable}
              >
                Confirm Selection
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

