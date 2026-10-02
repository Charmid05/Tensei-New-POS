import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { UserMenu } from '@/components/ui/user-menu'
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card' // Removed - not used in simplified layout
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  ChefHat,
  ShoppingCart,
  Settings,
  User,
  Menu,
  BarChart3,
  UserCog,
  Store,
  LayoutGrid
} from 'lucide-react'
import type { User as UserType } from '@/types'
import apiClient from '@/api/client'

// Import components for different sections
import { AdminDashboard } from './AdminDashboard'
import { POSLayout } from '@/components/pos/POSLayout'
import { ServerInterface } from '@/components/server/ServerInterface'
import { CounterInterface } from '@/components/counter/CounterInterface'
import { NewEnhancedKitchenLayout } from '@/components/kitchen/NewEnhancedKitchenLayout'
import { ToastDemo } from '@/components/ui/demo-toast'
import { FormDemo } from '@/components/forms/FormDemo'
import { AdminStaffManagement } from './AdminStaffManagement'
import { AdminSettings } from './AdminSettings'
import { AdminMenuManagement } from './AdminMenuManagement'
import { AdminTableManagement } from './AdminTableManagement'
import { AdminReports } from './AdminReports'

interface AdminLayoutProps {
  user: UserType
}

const adminSections = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    description: 'Overview and statistics'
  },

  {
    id: 'server',
    label: 'Server Interface',
    icon: <Users className="w-5 h-5" />,
    description: 'Server order interface'
  },
  {
    id: 'counter',
    label: 'Counter/Checkout',
    icon: <CreditCard className="w-5 h-5" />,
    description: 'Payment processing'
  },
  {
    id: 'kitchen',
    label: 'Kitchen Display',
    icon: <ChefHat className="w-5 h-5" />,
    description: 'Kitchen order display'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="w-5 h-5" />,
    description: 'System configuration'
  },
  {
    id: 'staff',
    label: 'Manage Staff',
    icon: <UserCog className="w-5 h-5" />,
    description: 'User and role management'
  },
  {
    id: 'menu',
    label: 'Manage Menu',
    icon: <Menu className="w-5 h-5" />,
    description: 'Categories and products'
  },
  {
    id: 'tables',
    label: 'Manage Tables',
    icon: <LayoutGrid className="w-5 h-5" />,
    description: 'Dining table setup'
  },
  {
    id: 'reports',
    label: 'View Reports',
    icon: <BarChart3 className="w-5 h-5" />,
    description: 'Sales and analytics'
  }
]

export function AdminLayout({ user }: AdminLayoutProps) {
  const [currentSection, setCurrentSection] = useState('dashboard')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)

  // Responsive breakpoint detection
  useEffect(() => {
    const checkScreenSize = () => {
      const width = window.innerWidth
      setIsMobile(width < 768) // md breakpoint
      setIsTablet(width >= 768 && width < 1024) // md to lg breakpoint
      
      // Auto-collapse sidebar on mobile and tablet for better UX
      if (width < 1024) {
        setSidebarCollapsed(true)
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 'dashboard':
        return <AdminDashboard />
      case 'server':
        return <ServerInterface />
      case 'counter':
        return <CounterInterface />
      case 'kitchen':
        return <NewEnhancedKitchenLayout user={user} />
      case 'settings':
        return (
          <div className="space-y-8">
            <AdminSettings />
            <ToastDemo />
            <FormDemo />
          </div>
        )
      case 'staff':
        return <AdminStaffManagement />
      case 'menu':
        return <AdminMenuManagement />
      case 'tables':
        return <AdminTableManagement />
      case 'reports':
        return <AdminReports />
      default:
        return <AdminDashboard />
    }
  }

  // const currentSectionInfo = adminSections.find(s => s.id === currentSection) // Removed with top header

  return (
    <div className="min-h-screen bg-background flex relative">
      {/* Mobile/Tablet Overlay */}
      {(isMobile || isTablet) && !sidebarCollapsed && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
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
        <div className="p-4">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`bg-primary rounded-lg flex items-center justify-center ${
                (isMobile || isTablet) ? 'w-10 h-10' : 'w-8 h-8'
              }`}>
                <ShoppingCart className={`text-primary-foreground ${
                  (isMobile || isTablet) ? 'w-6 h-6' : 'w-5 h-5'
                }`} />
              </div>
              {(!sidebarCollapsed || (isMobile || isTablet)) && (
                <div>
                  <span className={`font-bold ${
                    (isMobile || isTablet) ? 'text-2xl' : 'text-xl'
                  }`}>POS Admin</span>
                  <p className={`text-muted-foreground ${
                    (isMobile || isTablet) ? 'text-sm' : 'text-xs'
                  }`}>Restaurant Management</p>
                </div>
              )}
            </div>
            
            {/* Toggle Button - Larger on tablet */}
            <Button
              variant="ghost"
              size={isTablet ? "default" : "sm"}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className={isTablet ? "p-2 h-10 w-10" : "p-1 h-8 w-8"}
            >
              <Menu className={isTablet ? "w-5 h-5" : "w-4 h-4"} />
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col flex-1 px-4 pb-4">
            <div className={isTablet ? "space-y-3" : "space-y-2"}>
              {adminSections.map((section) => (
                <Button
                  key={section.id}
                  variant={currentSection === section.id ? 'default' : 'ghost'}
                  className={`w-full justify-start transition-colors ${
                    sidebarCollapsed && !isMobile && !isTablet ? 'px-2' : 'px-4'
                  } ${
                    isTablet ? 'h-12 text-base' : 'h-10 text-sm'
                  }`}
                  onClick={() => {
                    setCurrentSection(section.id)
                    // Auto-close sidebar on mobile/tablet after selection
                    if (isMobile || isTablet) {
                      setSidebarCollapsed(true)
                    }
                  }}
                  title={sidebarCollapsed && !isMobile && !isTablet ? section.label : undefined}
                >
                  <span className={isTablet ? "w-6 h-6 flex items-center justify-center" : "w-5 h-5 flex items-center justify-center"}>
                    {section.icon}
                  </span>
                  {(!sidebarCollapsed || isMobile || isTablet) && (
                    <span className={`${isTablet ? 'ml-4' : 'ml-3'}`}>{section.label}</span>
                  )}
                </Button>
              ))}
            </div>
            
            {/* Spacer to push logout to bottom */}
            <div className="flex-1"></div>
            
            {/* User Menu */}
            <div className={isTablet ? 'mt-6' : 'mt-4'}>
              <UserMenu 
                user={user} 
                collapsed={sidebarCollapsed && !isMobile && !isTablet}
                size={isTablet ? 'lg' : 'md'}
              />
            </div>
          </nav>
      </div>

      {/* Main Content */}
      <div className={`flex-1 overflow-auto ${
        (isMobile || isTablet) ? 'w-full' : ''
      }`}>
        {renderCurrentSection()}
      </div>
    </div>
  )
}
