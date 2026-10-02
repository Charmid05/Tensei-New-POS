import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Plus,
  Search,
  Edit,
  Trash2,
  Users,
  MapPin,
  AlertCircle,
  CheckCircle,
  Clock,
  Settings
} from 'lucide-react'
import apiClient from '@/api/client'
import { toastHelpers } from '@/lib/toast-helpers'
import { TableForm } from '@/components/forms/TableForm'
import { PaginationControlsComponent } from '@/components/ui/pagination-controls'
import { usePagination } from '@/hooks/usePagination'
import { TableGridSkeleton, SearchingSkeleton, FilteringSkeleton, StatsCardSkeleton } from '@/components/ui/skeletons'
import { InlineLoading } from '@/components/ui/loading-spinner'
import type { DiningTable } from '@/types'

type ViewMode = 'list' | 'table-form'

export function AdminTableManagement() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [editingTable, setEditingTable] = useState<DiningTable | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isSearching, setIsSearching] = useState(false)
  const [isFiltering, setIsFiltering] = useState(false)

  const queryClient = useQueryClient()

  // Pagination hook
  const pagination = usePagination({ 
    initialPage: 1, 
    initialPageSize: 12,
    total: 0 
  })

  // Debounce search term
  useEffect(() => {
    if (searchTerm !== debouncedSearch) {
      setIsSearching(true)
    }
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm)
      pagination.goToFirstPage()
      setIsSearching(false)
    }, 500)
    return () => clearTimeout(timer)
  }, [searchTerm, debouncedSearch])

  // Reset pagination when status filter changes
  useEffect(() => {
    if (filterStatus !== 'all') {
      setIsFiltering(true)
      setTimeout(() => setIsFiltering(false), 300)
    }
    pagination.goToFirstPage()
  }, [filterStatus])

  // Fetch tables with pagination
  const { data: tablesData, isLoading, isFetching } = useQuery({
    queryKey: ['admin-tables', pagination.page, pagination.pageSize, debouncedSearch, filterStatus],
    queryFn: () => apiClient.getAdminTables({
      page: pagination.page,
      limit: pagination.pageSize,
      search: debouncedSearch || undefined,
      status: filterStatus !== 'all' ? filterStatus : undefined
    }).then(res => res.data),
  })

  // Also fetch summary stats (all tables for stats calculation)
  const { data: allTables = [] } = useQuery({
    queryKey: ['tables-summary'],
    queryFn: () => apiClient.getTables().then(res => res.data)
  })

  // Extract data and pagination info
  const tables = Array.isArray(tablesData) ? tablesData : (tablesData as any)?.data || []
  const paginationInfo = (tablesData as any)?.pagination || { total: 0 }

  // Update pagination total
  useEffect(() => {
    if (paginationInfo.total !== undefined) {
      pagination.goToPage(pagination.page)
    }
  }, [paginationInfo.total])

  // Delete table mutation
  const deleteTableMutation = useMutation({
    mutationFn: ({ id }: { id: string, tableNumber: string }) => apiClient.deleteTable(id),
    onSuccess: (_, { tableNumber }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-tables'] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      queryClient.invalidateQueries({ queryKey: ['tables-summary'] })
      toastHelpers.apiSuccess('Delete', `Table ${tableNumber}`)
    },
    onError: (error: any) => {
      toastHelpers.apiError('Delete table', error)
    }
  })

  // Form handlers
  const handleFormSuccess = () => {
    setViewMode('list')
    setEditingTable(null)
  }

  const handleCancelForm = () => {
    setViewMode('list')
    setEditingTable(null)
  }

  // Delete handler
  const handleDeleteTable = (table: DiningTable) => {
    // Note: DiningTable type may need to be updated to include status field
    const tableStatus = (table as any).status
    if (tableStatus === 'occupied') {
      toastHelpers.warning(
        'Cannot Delete Table',
        `Table ${table.table_number} is currently occupied. Please clear the table first.`
      )
      return
    }

    if (confirm(`Are you sure you want to delete Table ${table.table_number}? This action cannot be undone.`)) {
      deleteTableMutation.mutate({ 
        id: table.id.toString(), 
        tableNumber: table.table_number 
      })
    }
  }

  // Data is already filtered on the server side
  const filteredTables = tables

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'available':
        return { 
          icon: <CheckCircle className="h-3 w-3" />,
          className: 'bg-green-100 text-green-800 hover:bg-green-200'
        }
      case 'occupied':
        return { 
          icon: <Users className="h-3 w-3" />,
          className: 'bg-blue-100 text-blue-800 hover:bg-blue-200'
        }
      case 'reserved':
        return { 
          icon: <Clock className="h-3 w-3" />,
          className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
        }
      case 'maintenance':
        return { 
          icon: <AlertCircle className="h-3 w-3" />,
          className: 'bg-red-100 text-red-800 hover:bg-red-200'
        }
      default:
        return { 
          icon: <Settings className="h-3 w-3" />,
          className: 'bg-gray-100 text-gray-800 hover:bg-gray-200'
        }
    }
  }

  // Calculate stats from all tables (for accurate totals)
  const stats = {
    total: allTables.length,
    available: allTables.filter(t => (t as any).status === 'available').length,
    occupied: allTables.filter(t => (t as any).status === 'occupied').length,
    reserved: allTables.filter(t => (t as any).status === 'reserved').length,
    maintenance: allTables.filter(t => (t as any).status === 'maintenance').length,
  }

  // Show form
  if (viewMode === 'table-form') {
    return (
      <div className="p-6">
        <TableForm
          table={editingTable || undefined}
          mode={editingTable ? 'edit' : 'create'}
          onSuccess={handleFormSuccess}
          onCancel={handleCancelForm}
        />
      </div>
    )
  }

  // Main list view
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Table Management</h2>
          <p className="text-muted-foreground">
            Manage your restaurant's dining tables and seating arrangements
          </p>
        </div>
        <Button 
          onClick={() => {
            setEditingTable(null)
            setViewMode('table-form')
          }} 
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Table
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {isLoading ? (
          <>
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
            <StatsCardSkeleton />
          </>
        ) : (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">Total Tables</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{stats.available}</div>
                  <p className="text-xs text-muted-foreground">Available</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{stats.occupied}</div>
                  <p className="text-xs text-muted-foreground">Occupied</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{stats.reserved}</div>
                  <p className="text-xs text-muted-foreground">Reserved</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{stats.maintenance}</div>
                  <p className="text-xs text-muted-foreground">Maintenance</p>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tables by number or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
          {isSearching && (
            <div className="absolute right-2 top-2.5">
              <InlineLoading size="sm" />
            </div>
          )}
        </div>
        <div className="flex gap-2">
          {isFiltering && (
            <div className="flex items-center mr-2">
              <FilteringSkeleton />
            </div>
          )}
          <Button
            variant={filterStatus === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('all')}
          >
            All ({stats.total})
          </Button>
          <Button
            variant={filterStatus === 'available' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('available')}
          >
            Available ({stats.available})
          </Button>
          <Button
            variant={filterStatus === 'occupied' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('occupied')}
          >
            Occupied ({stats.occupied})
          </Button>
          <Button
            variant={filterStatus === 'reserved' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('reserved')}
          >
            Reserved ({stats.reserved})
          </Button>
          <Button
            variant={filterStatus === 'maintenance' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilterStatus('maintenance')}
          >
            Maintenance ({stats.maintenance})
          </Button>
        </div>
      </div>

      {/* Tables List */}
      {isLoading ? (
        <TableGridSkeleton count={pagination.pageSize} />
      ) : isSearching && searchTerm ? (
        <SearchingSkeleton />
      ) : filteredTables.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Settings className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No tables found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || filterStatus !== 'all' 
                  ? 'No tables match your current filters.' 
                  : 'Get started by adding your first table.'}
              </p>
              {!searchTerm && filterStatus === 'all' && (
                <div className="mt-6">
                  <Button onClick={() => setViewMode('table-form')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Table
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTables.map((table: any) => {
            const statusBadge = getStatusBadge(table.status)
            return (
              <Card key={table.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">Table {table.table_number}</CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`gap-1 ${statusBadge.className}`}>
                          {statusBadge.icon}
                          {table.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        {table.capacity} seats
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {table.location_notes && (
                    <div className="flex items-start gap-2 mb-4">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-muted-foreground">{table.location_notes}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2">
                    <div className="text-xs text-muted-foreground">
                      Created {new Date(table.created_at).toLocaleDateString()}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingTable(table)
                          setViewMode('table-form')
                        }}
                        className="gap-2"
                      >
                        <Edit className="h-4 w-4" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteTable(table)}
                        disabled={deleteTableMutation.isPending || table.status === 'occupied'}
                        className="gap-2 text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {filteredTables.length > 0 && (
        <div className="mt-6 space-y-4">
          {isFetching && !isLoading && (
            <div className="flex justify-center">
              <InlineLoading text="Updating tables..." />
            </div>
          )}
          <PaginationControlsComponent
            pagination={pagination}
            total={paginationInfo.total || tables.length}
            pageSizeOptions={[6, 12, 24, 48]}
          />
        </div>
      )}
    </div>
  )
}
