import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  Trash2,
  Package,
  DollarSign,
  Clock,
  Image,
  Tag
} from "lucide-react"
import type { Product, Category } from "@/types"

interface AdminMenuTableProps {
  data: Product[]
  categories: Category[]
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  isLoading?: boolean
}

export function AdminMenuTable({
  data,
  categories,
  onEdit,
  onDelete,
  isLoading = false
}: AdminMenuTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return "No Category"
    const category = categories.find(cat => cat.id === categoryId)
    return category?.name || "Unknown Category"
  }

  const getCategoryColor = (categoryId: string | null) => {
    if (!categoryId) return "bg-gray-100 text-gray-800"
    const category = categories.find(cat => cat.id === categoryId)
    return category?.color || "bg-gray-100 text-gray-800"
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        const isSorted = column.getIsSorted()
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            <Package className="mr-2 h-4 w-4" />
            Product
            {isSorted === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : isSorted === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        )
      },
      cell: ({ row }) => {
        const product = row.original
        return (
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              {product.image_url ? (
                <img 
                  src={product.image_url} 
                  alt={product.name}
                  className="h-12 w-12 rounded-lg object-cover"
                />
              ) : (
                <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-orange-400 to-pink-500 flex items-center justify-center">
                  <Package className="h-6 w-6 text-white" />
                </div>
              )}
            </div>
            <div>
              <div className="font-medium text-gray-900">
                {product.name}
              </div>
              <div className="text-sm text-gray-500 line-clamp-1">
                {product.description || "No description"}
              </div>
            </div>
          </div>
        )
      },
    },
    {
      accessorKey: "category_id",
      header: ({ column }) => {
        const isSorted = column.getIsSorted()
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            <Tag className="mr-2 h-4 w-4" />
            Category
            {isSorted === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : isSorted === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        )
      },
      cell: ({ getValue }) => {
        const categoryId = getValue() as string | null
        const categoryName = getCategoryName(categoryId)
        const categoryColor = getCategoryColor(categoryId)
        return (
          <Badge className={categoryColor}>
            {categoryName}
          </Badge>
        )
      },
    },
    {
      accessorKey: "price",
      header: ({ column }) => {
        const isSorted = column.getIsSorted()
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            <DollarSign className="mr-2 h-4 w-4" />
            Price
            {isSorted === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : isSorted === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        )
      },
      cell: ({ getValue }) => {
        const price = getValue() as number
        return (
          <div className="font-medium text-green-600">
            {formatCurrency(price)}
          </div>
        )
      },
    },
    {
      accessorKey: "preparation_time",
      header: ({ column }) => {
        const isSorted = column.getIsSorted()
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            <Clock className="mr-2 h-4 w-4" />
            Prep Time
            {isSorted === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : isSorted === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        )
      },
      cell: ({ getValue }) => {
        const time = getValue() as number
        return (
          <div className="text-gray-900">
            {time}min
          </div>
        )
      },
    },
    {
      accessorKey: "is_available",
      header: "Availability",
      cell: ({ getValue }) => {
        const isAvailable = getValue() as boolean
        return (
          <Badge variant={isAvailable ? "default" : "secondary"}>
            <div className={`w-2 h-2 rounded-full mr-2 ${isAvailable ? 'bg-green-400' : 'bg-red-400'}`} />
            {isAvailable ? "Available" : "Out of Stock"}
          </Badge>
        )
      },
    },
    {
      accessorKey: "sort_order",
      header: ({ column }) => {
        const isSorted = column.getIsSorted()
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-8 px-2 lg:px-3"
          >
            Order
            {isSorted === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : isSorted === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        )
      },
      cell: ({ getValue }) => {
        const order = getValue() as number
        return (
          <div className="text-gray-600">
            #{order}
          </div>
        )
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const product = row.original
        return (
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(product)}
              className="h-8 px-2 lg:px-3"
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only lg:not-sr-only lg:ml-2">Edit</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(product)}
              className="h-8 px-2 lg:px-3 text-red-600 hover:text-red-700 hover:border-red-300"
            >
              <Trash2 className="h-4 w-4" />
              <span className="sr-only lg:not-sr-only lg:ml-2">Delete</span>
            </Button>
          </div>
        )
      },
    },
  ]

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  })

  return (
    <div className="w-full">
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="px-4">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j}>
                      <div className="h-4 bg-gray-200 rounded animate-pulse" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-gray-50"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-500">No products found</p>
                    <p className="text-sm text-gray-400">Try adjusting your search or add a new product</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
