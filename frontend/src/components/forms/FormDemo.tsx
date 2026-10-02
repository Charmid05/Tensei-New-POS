import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form } from '@/components/ui/form'
import { 
  TextInputField,
  NumberInputField,
  PriceInputField,
  SelectField,
  TextareaField,
  SwitchField,
  FormSubmitButton,
  roleOptions,
  productStatusOptions 
} from '@/components/forms/FormComponents'
import { createProductSchema, type CreateProductData } from '@/lib/form-schemas'
import { toastHelpers } from '@/lib/toast-helpers'

const categoryOptions = [
  { value: '1', label: 'Appetizers' },
  { value: '2', label: 'Main Course' },
  { value: '3', label: 'Desserts' },
  { value: '4', label: 'Beverages' },
]

export function FormDemo() {
  const form = useForm<CreateProductData>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: '',
      description: '',
      price: 0,
      category_id: 1,
      image_url: '',
      status: 'active',
      preparation_time: 5,
    },
  })

  const onSubmit = (data: CreateProductData) => {
    console.log('Form submitted:', data)
    toastHelpers.success('Demo Form Submitted!', JSON.stringify(data, null, 2))
  }

  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-bold">Advanced Form Components Demo</h2>
        <p className="text-muted-foreground">
          Showcasing all available form components with validation and toast integration
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Product Form Example */}
        <Card>
          <CardHeader>
            <CardTitle>Product Form Example</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <TextInputField
                  control={form.control}
                  name="name"
                  label="Product Name"
                  placeholder="Enter product name"
                />
                
                <TextareaField
                  control={form.control}
                  name="description"
                  label="Description"
                  placeholder="Describe the product..."
                  rows={3}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <PriceInputField
                    control={form.control}
                    name="price"
                    label="Price"
                    currency="$"
                  />
                  
                  <NumberInputField
                    control={form.control}
                    name="preparation_time"
                    label="Prep Time (mins)"
                    min={1}
                    max={120}
                  />
                </div>
                
                <SelectField
                  control={form.control}
                  name="category_id"
                  label="Category"
                  options={categoryOptions.map(cat => ({
                    value: cat.value,
                    label: cat.label
                  }))}
                />
                
                <TextInputField
                  control={form.control}
                  name="image_url"
                  label="Image URL"
                  placeholder="https://example.com/image.jpg"
                  description="Optional product image"
                />
                
                <SelectField
                  control={form.control}
                  name="status"
                  label="Status"
                  options={productStatusOptions}
                />
                
                <FormSubmitButton className="w-full">
                  Create Product
                </FormSubmitButton>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Form Components Showcase */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Form Components Library</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <h4 className="font-medium">Available Components:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• TextInputField - Text, email, password inputs</li>
                  <li>• NumberInputField - Numeric inputs with min/max</li>
                  <li>• PriceInputField - Currency inputs with symbol</li>
                  <li>• SelectField - Dropdown selections</li>
                  <li>• TextareaField - Multi-line text input</li>
                  <li>• SwitchField - Boolean toggle switch</li>
                  <li>• FormSubmitButton - Button with loading states</li>
                </ul>
              </div>
              
              <div className="grid gap-2">
                <h4 className="font-medium">Built-in Features:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Zod schema validation</li>
                  <li>• Toast notification integration</li>
                  <li>• Loading states and error handling</li>
                  <li>• Responsive design patterns</li>
                  <li>• Accessibility support</li>
                  <li>• TypeScript type safety</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>POS-Specific Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">User Roles:</h4>
                <div className="flex flex-wrap gap-2">
                  {roleOptions.map(role => (
                    <span key={role.value} className="text-xs px-2 py-1 bg-secondary rounded">
                      {role.label}
                    </span>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Product Status:</h4>
                <div className="flex gap-2">
                  {productStatusOptions.map(status => (
                    <span key={status.value} className="text-xs px-2 py-1 bg-secondary rounded">
                      {status.label}
                    </span>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
