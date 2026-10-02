import { createFileRoute, Navigate } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import apiClient from '@/api/client'
import { RoleBasedLayout } from '@/components/RoleBasedLayout'
import type { User } from '@/types'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // ALL HOOKS MUST BE AT THE TOP LEVEL - before any conditional returns
  const { isLoading: isServerVerifying, error } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => {
      console.log('Verifying user with API URL:', import.meta.env.VITE_API_URL)
      return apiClient.getCurrentUser()
    },
    retry: 1,
    enabled: false, // Temporarily disable server verification
    onError: (error) => {
      console.error('getCurrentUser failed:', error)
      // Clear auth and redirect to login
      apiClient.clearAuth()
      window.location.href = '/login'
    }
  })

  useEffect(() => {
    console.log('Loading user from localStorage...')
    const storedUser = localStorage.getItem('pos_user')
    const token = localStorage.getItem('pos_token')
    
    console.log('Stored user:', storedUser)
    console.log('Stored token:', token ? 'exists' : 'missing')
    
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser)
        console.log('Parsed user:', parsedUser)
        setUser(parsedUser)
      } catch (error) {
        console.error('Failed to parse stored user:', error)
        localStorage.removeItem('pos_user')
        localStorage.removeItem('pos_token')
      }
    }
    setIsLoading(false)
  }, [])

  // Show loading while we check localStorage
  if (isLoading) {
    console.log('Still loading user data from localStorage...')
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading POS System...</p>
        </div>
      </div>
    )
  }

  // Check authentication - ONLY after localStorage is loaded
  console.log('Checking auth - isAuthenticated:', apiClient.isAuthenticated(), 'user:', user)
  if (!apiClient.isAuthenticated() || !user) {
    console.log('Not authenticated, redirecting to login')
    return <Navigate to="/login" />
  }

  // Redirect admin users to admin panel
  if (user.role === 'admin') {
    console.log('Admin user detected, redirecting to admin panel')
    return <Navigate to="/admin/dashboard" />
  }

  console.log('User authenticated, rendering role-based layout for user:', user)
  return <RoleBasedLayout user={user} />
}

