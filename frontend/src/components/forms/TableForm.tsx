import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import { Button } from '@/components/ui/button'
import { 
  TextInputField, 
  TextareaField,
  NumberInputField,
  SelectField,
  FormSubmitButton,
  tableStatusOptions 
} from '@/components/forms/FormComponents'
import { createTableSchema, updateTableSchema, type CreateTableData, type UpdateTableData } from '@/lib/form-schemas'
import { toastHelpers } from '@/lib/toast-helpers'
import apiClient from '@/api/client'
import type { DiningTable } from '@/types'
import { X } from 'lucide-react'

interface TableFormProps {
  table?: DiningTable // If provided, we're editing; otherwise creating
  onSuccess?: () => void
  onCancel?: () => void
  mode?: 'create' | 'edit'
}

export function TableForm({ table, onSuccess, onCancel, mode = 'create' }: TableFormProps) {
  const queryClient = useQueryClient()
  const isEditing = mode === 'edit' && table

  // Choose the appropriate schema and default values
  const schema = isEditing ? updateTableSchema : createTableSchema
  const defaultValues = isEditing 
    ? {
        id: table.id,
        table_number: table.table_number,
        seats: table.seats,
        status: table.status as any,
        location: table.location || '',
      }
    : {
        table_number: '',
        seats: 4,
        status: 'available' as const,
        location: '',
      }

  const form = useForm<CreateTableData | UpdateTableData>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateTableData) => apiClient.createTable(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-tables'] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      queryClient.invalidateQueries({ queryKey: ['tables-summary'] })
      toastHelpers.tableCreated(form.getValues('table_number'))
      form.reset()
      onSuccess?.()
    },
    onError: (error) => {
      toastHelpers.apiError('Create table', error)
    },
  })

  // Update mutation  
  const updateMutation = useMutation({
    mutationFn: (data: UpdateTableData) => apiClient.updateTable(data.id.toString(), data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-tables'] })
      queryClient.invalidateQueries({ queryKey: ['tables'] })
      queryClient.invalidateQueries({ queryKey: ['tables-summary'] })
      toastHelpers.apiSuccess('Update', `Table ${form.getValues('table_number')}`)
      onSuccess?.()
    },
    onError: (error) => {
      toastHelpers.apiError('Update table', error)
    },
  })

  const onSubmit = (data: CreateTableData | UpdateTableData) => {
    if (isEditing) {
      updateMutation.mutate(data as UpdateTableData)
    } else {
      createMutation.mutate(data as CreateTableData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          {isEditing ? 'Edit Table' : 'Create New Table'}
        </CardTitle>
        {onCancel && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            disabled={isLoading}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Table Identification */}
            <div className="space-y-4">
              <TextInputField
                control={form.control}
                name="table_number"
                label="Table Number"
                placeholder="Enter table number (e.g., T1, Table 5, A1)"
                description="Unique identifier for this table"
              />
              
              <TextareaField
                control={form.control}
                name="location"
                label="Location/Notes"
                placeholder="Describe table location (e.g., 'By the window', 'Near kitchen', 'Private section')"
                rows={2}
                description="Optional location description or special notes"
              />
            </div>

            {/* Table Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NumberInputField
                control={form.control}
                name="seats"
                label="Number of Seats"
                min={1}
                max={20}
                description="Maximum seating capacity"
              />
              
              <SelectField
                control={form.control}
                name="status"
                label="Table Status"
                options={tableStatusOptions}
                description="Current operational status"
              />
            </div>

            {/* Status Information */}
            <div className="bg-muted/30 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Table Status Guide:</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li><strong>Available:</strong> Table is ready for new guests</li>
                <li><strong>Occupied:</strong> Table currently has guests</li>
                <li><strong>Reserved:</strong> Table is reserved for future guests</li>
                <li><strong>Maintenance:</strong> Table is out of service for cleaning/repair</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <FormSubmitButton
                isLoading={isLoading}
                loadingText={isEditing ? "Updating..." : "Creating..."}
                className="flex-1"
              >
                {isEditing ? 'Update Table' : 'Create Table'}
              </FormSubmitButton>
              
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isLoading}
                  className="flex-1"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
