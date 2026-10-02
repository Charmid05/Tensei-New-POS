import { useState, useEffect } from 'react'
import { Link, useRouter, useLocation } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserMenu } from '@/components/ui/user-menu'
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  ChefHat,
  Settings,
  User,
  Menu,
  BarChart3,
  UserCog,
  LayoutGrid,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import type { User as UserType } from '@/types'
import apiClient from '@/api/client'

interface AdminSidebarProps {
  user: UserType
}

const adminSections = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    description: 'Overview and statistics',
    href: '/admin/dashboard'
  },
  {
    id: 'server',
    label: 'Server Interface',
    icon: <Users className="w-5 h-5" />,
    description: 'Server order interface',
    href: '/admin/server'
  },
  {
    id: 'counter',
    label: 'Counter/Checkout',
    icon: <CreditCard className="w-5 h-5" />,
    description: 'Payment processing',
    href: '/admin/counter'
  },
  {
    id: 'kitchen',
    label: 'Kitchen Display',
    icon: <ChefHat className="w-5 h-5" />,
    description: 'Kitchen order display',
    href: '/admin/kitchen'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="w-5 h-5" />,
    description: 'System configuration',
    href: '/admin/settings'
  },
  {
    id: 'staff',
    label: 'Manage Staff',
    icon: <UserCog className="w-5 h-5" />,
    description: 'User and role management',
    href: '/admin/staff'
  },
  {
    id: 'menu',
    label: 'Manage Menu',
    icon: <Menu className="w-5 h-5" />,
    description: 'Categories and products',
    href: '/admin/menu'
  },
  {
    id: 'tables',
    label: 'Manage Tables',
    icon: <LayoutGrid className="w-5 h-5" />,
    description: 'Dining table management',
    href: '/admin/tables'
  },
  {
    id: 'reports',
    label: 'View Reports',
    icon: <BarChart3 className="w-5 h-5" />,
    description: 'Analytics and reports',
    href: '/admin/reports'
  }
]

export function AdminSidebar({ user }: AdminSidebarProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const router = useRouter()
  const location = useLocation()

  // Responsive checks
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      setIsMobile(width < 768)
      setIsTablet(width >= 768 && width < 1024)

      if (width < 1024) {
        setSidebarCollapsed(true)
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const isActiveRoute = (href: string) => {
    return location.pathname === href
  }

  return (
    <>
      {/* Backdrop for mobile */}
      {(isMobile || isTablet) && !sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 xl:hidden"
          onClick={() => setSidebarCollapsed(true)}
        />
      )}

      {/* Sidebar */}
      <div className={`bg-card border-r border-border transition-all duration-300 flex flex-col z-50 ${
        (isMobile || isTablet) 
          ? `fixed left-0 top-0 h-full ${sidebarCollapsed ? '-translate-x-full w-0' : 'translate-x-0 w-80'}` 
          : `relative ${sidebarCollapsed ? 'w-16' : 'w-64'}`
      }`}>
        
        {/* Header */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <LayoutDashboard className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="font-bold text-foreground">Admin Panel</h1>
                  <p className="text-xs text-muted-foreground">Restaurant Management</p>
                </div>
              </div>
            )}
            
            {/* Collapse/Expand Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="h-8 w-8 p-0"
            >
              {sidebarCollapsed ? 
                <ChevronRight className="h-4 w-4" /> : 
                <ChevronLeft className="h-4 w-4" />
              }
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {adminSections.map((section) => (
            <Link
              key={section.id}
              to={section.href}
              className="block"
            >
              <Button
                variant={isActiveRoute(section.href) ? "default" : "ghost"}
                className={`w-full justify-start transition-colors ${
                  sidebarCollapsed && !isMobile && !isTablet ? 'px-2' : 'px-4'
                } ${
                  isTablet ? 'h-12 text-base' : 'h-10 text-sm'
                }`}
              >
                {section.icon}
                {(!sidebarCollapsed || isMobile || isTablet) && (
                  <span className="ml-3">{section.label}</span>
                )}
              </Button>
            </Link>
          ))}
        </div>

        {/* User Menu */}
        <div className="p-4 border-t border-border">
          <UserMenu 
            user={user} 
            collapsed={sidebarCollapsed && !isMobile && !isTablet}
            size={isTablet ? 'lg' : 'md'}
          />
        </div>
      </div>
    </>
  )
}
