import { toast } from "@/hooks/use-toast"
import { CheckCircle, XCircle, AlertTriangle, Info } from "lucide-react"

export const toastHelpers = {
  success: (title: string, description?: string) => {
    return toast({
      title,
      description,
      variant: "success",
      duration: 4000,
    })
  },

  error: (title: string, description?: string) => {
    return toast({
      title,
      description,
      variant: "destructive",
      duration: 6000,
    })
  },

  warning: (title: string, description?: string) => {
    return toast({
      title,
      description,
      variant: "warning", 
      duration: 5000,
    })
  },

  info: (title: string, description?: string) => {
    return toast({
      title,
      description,
      variant: "default",
      duration: 4000,
    })
  },

  // API Response helpers
  apiSuccess: (action: string, entity?: string) => {
    return toastHelpers.success(
      `${action} successful`,
      entity ? `${entity} has been ${action.toLowerCase()} successfully.` : undefined
    )
  },

  apiError: (action: string, error?: any, entity?: string) => {
    const errorMessage = error?.message || error?.toString() || 'An unexpected error occurred'
    return toastHelpers.error(
      `${action} failed`,
      entity ? `Failed to ${action.toLowerCase()} ${entity}. ${errorMessage}` : errorMessage
    )
  },

  // Common POS operations
  orderCreated: (orderNumber?: string) => {
    return toastHelpers.success(
      "Order Created",
      orderNumber ? `Order ${orderNumber} has been created successfully.` : "Order has been created successfully."
    )
  },

  paymentProcessed: (amount?: number) => {
    return toastHelpers.success(
      "Payment Processed",
      amount ? `Payment of $${amount.toFixed(2)} processed successfully.` : "Payment processed successfully."
    )
  },

  userCreated: (username: string) => {
    return toastHelpers.success(
      "User Created",
      `User "${username}" has been created successfully.`
    )
  },

  userDeleted: (username: string) => {
    return toastHelpers.success(
      "User Deleted", 
      `User "${username}" has been deleted successfully.`
    )
  },

  productCreated: (productName: string) => {
    return toastHelpers.success(
      "Product Added",
      `"${productName}" has been added to the menu.`
    )
  },

  categoryCreated: (categoryName: string) => {
    return toastHelpers.success(
      "Category Created",
      `Category "${categoryName}" has been created successfully.`
    )
  },

  productUpdated: (productName: string) => {
    return toastHelpers.success(
      "Product Updated",
      `"${productName}" has been updated successfully.`
    )
  },

  categoryUpdated: (categoryName: string) => {
    return toastHelpers.success(
      "Category Updated", 
      `Category "${categoryName}" has been updated successfully.`
    )
  },

  tableCreated: (tableNumber: string) => {
    return toastHelpers.success(
      "Table Created",
      `Table ${tableNumber} has been created successfully.`
    )
  },

  tableUpdated: (tableNumber: string) => {
    return toastHelpers.success(
      "Table Updated", 
      `Table ${tableNumber} has been updated successfully.`
    )
  },

  // Validation and form errors
  validationError: (message: string) => {
    return toastHelpers.error(
      "Validation Error",
      message
    )
  },

  networkError: () => {
    return toastHelpers.error(
      "Network Error",
      "Please check your connection and try again."
    )
  },

  permissionDenied: () => {
    return toastHelpers.error(
      "Permission Denied",
      "You don't have permission to perform this action."
    )
  }
}

