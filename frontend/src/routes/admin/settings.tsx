import { createFileRoute } from '@tanstack/react-router'
import { AdminSettings } from '@/components/admin/AdminSettings'
import { ToastDemo } from '@/components/ui/demo-toast'
import { FormDemo } from '@/components/forms/FormDemo'

export const Route = createFileRoute('/admin/settings')({
  component: () => (
    <div className="space-y-8">
      <AdminSettings />
      <ToastDemo />
      <FormDemo />
    </div>
  ),
})