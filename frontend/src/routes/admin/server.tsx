import { createFileRoute } from '@tanstack/react-router'
import { ServerInterface } from '@/components/server/ServerInterface'

export const Route = createFileRoute('/admin/server')({
  component: () => <ServerInterface />,
})