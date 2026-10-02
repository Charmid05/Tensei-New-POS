import { createFileRoute } from '@tanstack/react-router'
import { AdminReports } from '@/components/admin/AdminReports'

export const Route = createFileRoute('/admin/reports')({
  component: () => <AdminReports />,
})