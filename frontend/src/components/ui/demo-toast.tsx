import { Button } from "@/components/ui/button"
import { toastHelpers } from "@/lib/toast-helpers"

export function ToastDemo() {
  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold">Toast Notifications Demo</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Button
          variant="default"
          onClick={() => toastHelpers.success("Success!", "This is a success message.")}
        >
          Success Toast
        </Button>
        
        <Button
          variant="destructive"
          onClick={() => toastHelpers.error("Error!", "Something went wrong.")}
        >
          Error Toast
        </Button>
        
        <Button
          variant="outline"
          onClick={() => toastHelpers.warning("Warning!", "Please check your input.")}
        >
          Warning Toast
        </Button>
        
        <Button
          variant="secondary"
          onClick={() => toastHelpers.info("Info", "Here's some useful information.")}
        >
          Info Toast
        </Button>
        
        <Button
          onClick={() => toastHelpers.userCreated("John Doe")}
        >
          User Created
        </Button>
        
        <Button
          onClick={() => toastHelpers.orderCreated("ORD-12345")}
        >
          Order Created
        </Button>
        
        <Button
          onClick={() => toastHelpers.paymentProcessed(25.99)}
        >
          Payment Processed
        </Button>
        
        <Button
          onClick={() => toastHelpers.validationError("Invalid email format")}
        >
          Validation Error
        </Button>
      </div>
    </div>
  )
}

