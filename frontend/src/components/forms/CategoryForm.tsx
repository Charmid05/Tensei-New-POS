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
  FormSubmitButton
} from '@/components/forms/FormComponents'
import { createCategorySchema, updateCategorySchema, type CreateCategoryData, type UpdateCategoryData } from '@/lib/form-schemas'
import { toastHelpers } from '@/lib/toast-helpers'
import apiClient from '@/api/client'
import type { Category } from '@/types'
import { X } from 'lucide-react'

interface CategoryFormProps {
  category?: Category // If provided, we're editing; otherwise creating
  onSuccess?: () => void
  onCancel?: () => void
  mode?: 'create' | 'edit'
}

export function CategoryForm({ category, onSuccess, onCancel, mode = 'create' }: CategoryFormProps) {
  const queryClient = useQueryClient()
  const isEditing = mode === 'edit' && category

  // Choose the appropriate schema and default values
  const schema = isEditing ? updateCategorySchema : createCategorySchema
  const defaultValues = isEditing 
    ? {
        id: category.id,
        name: category.name,
        description: category.description || '',
        image_url: category.image_url || '',
        sort_order: category.sort_order || 0,
      }
    : {
        name: '',
        description: '',
        image_url: '',
        sort_order: 0,
      }

  const form = useForm<CreateCategoryData | UpdateCategoryData>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateCategoryData) => apiClient.createCategory(data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      toastHelpers.categoryCreated(form.getValues('name'))
      form.reset()
      onSuccess?.()
    },
    onError: (error) => {
      toastHelpers.apiError('Create category', error)
    },
  })

  // Update mutation  
  const updateMutation = useMutation({
    mutationFn: (data: UpdateCategoryData) => apiClient.updateCategory(data.id.toString(), data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      toastHelpers.apiSuccess('Update', `Category "${form.getValues('name')}"`)
      onSuccess?.()
    },
    onError: (error) => {
      toastHelpers.apiError('Update category', error)
    },
  })

  const onSubmit = (data: CreateCategoryData | UpdateCategoryData) => {
    if (isEditing) {
      updateMutation.mutate(data as UpdateCategoryData)
    } else {
      createMutation.mutate(data as CreateCategoryData)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          {isEditing ? 'Edit Category' : 'Create New Category'}
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
            {/* Basic Information */}
            <div className="space-y-4">
              <TextInputField
                control={form.control}
                name="name"
                label="Category Name"
                placeholder="Enter category name"
                description="The name that will appear in the menu sections"
              />
              
              <TextareaField
                control={form.control}
                name="description"
                label="Description"
                placeholder="Describe this category..."
                rows={3}
                description="Optional description for menu organization"
              />

              <TextInputField
                control={form.control}
                name="image_url"
                label="Image URL"
                placeholder="https://example.com/image.jpg"
                description="Optional category image URL"
              />
            </div>

            {/* Sorting */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <NumberInputField
                control={form.control}
                name="sort_order"
                label="Sort Order"
                min={0}
                max={999}
                description="Lower numbers appear first in menus"
              />
              
              {/* Empty column for layout balance */}
              <div />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <FormSubmitButton
                isLoading={isLoading}
                loadingText={isEditing ? "Updating..." : "Creating..."}
                className="flex-1"
              >
                {isEditing ? 'Update Category' : 'Create Category'}
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
