import { createFileRoute } from '@tanstack/react-router'
import { AdminStaffManagement } from '@/components/admin/AdminStaffManagement'

export const Route = createFileRoute('/admin/staff')({
  component: () => <AdminStaffManagement />,
})