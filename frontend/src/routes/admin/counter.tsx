import { createFileRoute } from '@tanstack/react-router'
import { CounterInterface } from '@/components/counter/CounterInterface'

export const Route = createFileRoute('/admin/counter')({
  component: () => <CounterInterface />,
})