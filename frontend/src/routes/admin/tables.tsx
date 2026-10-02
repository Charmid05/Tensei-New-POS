import { createFileRoute } from '@tanstack/react-router'
import { AdminTableManagement } from '@/components/admin/AdminTableManagement'

export const Route = createFileRoute('/admin/tables')({
  component: () => <AdminTableManagement />,
})