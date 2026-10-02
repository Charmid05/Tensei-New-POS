import * as React from "react"
import { User, Settings, Bell, LogOut } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import apiClient from "@/api/client"
import type { User as UserType } from "@/types"

interface UserMenuProps {
  user: UserType
  collapsed?: boolean
  size?: "sm" | "md" | "lg"
}

export function UserMenu({ user, collapsed = false, size = "md" }: UserMenuProps) {
  const handleLogout = () => {
    apiClient.clearAuth()
    window.location.href = '/login'
  }

  const sizeClasses = {
    sm: {
      avatar: "w-6 h-6",
      icon: "w-3 h-3",
      text: "text-xs",
      name: "text-xs",
      email: "text-xs"
    },
    md: {
      avatar: "w-8 h-8", 
      icon: "w-4 h-4",
      text: "text-sm",
      name: "text-sm",
      email: "text-xs"
    },
    lg: {
      avatar: "w-10 h-10",
      icon: "w-5 h-5", 
      text: "text-base",
      name: "text-base",
      email: "text-sm"
    }
  }

  const currentSize = sizeClasses[size]

  if (collapsed) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-auto p-1.5 rounded-full">
            <div className={`bg-primary rounded-full flex items-center justify-center ${currentSize.avatar}`}>
              <User className={`text-primary-foreground ${currentSize.icon}`} />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" side="right" className="w-56">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.first_name} {user.last_name}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Bell className="mr-2 h-4 w-4" />
            <span>Notifications</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="w-full justify-start p-3 h-auto bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3 w-full">
            <div className={`bg-primary rounded-full flex items-center justify-center ${currentSize.avatar}`}>
              <User className={`text-primary-foreground ${currentSize.icon}`} />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className={`font-medium truncate ${currentSize.name}`}>
                {user.first_name} {user.last_name}
              </p>
              <p className={`text-muted-foreground truncate ${currentSize.email}`}>
                {user.email}
              </p>
            </div>
            <Badge variant="outline" className={currentSize.text}>
              {user.role.toUpperCase()}
            </Badge>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.first_name} {user.last_name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>Profile</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Bell className="mr-2 h-4 w-4" />
          <span>Notifications</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
