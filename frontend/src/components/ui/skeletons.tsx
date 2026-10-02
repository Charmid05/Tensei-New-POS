import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

// Basic skeleton building blocks
export function SkeletonText({ className = "h-4 w-full" }: { className?: string }) {
  return <Skeleton className={className} />
}

export function SkeletonCircle({ className = "h-10 w-10 rounded-full" }: { className?: string }) {
  return <Skeleton className={className} />
}

export function SkeletonButton({ className = "h-9 w-20" }: { className?: string }) {
  return <Skeleton className={className} />
}

// Admin Card Skeletons
export function UserCardSkeleton() {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <SkeletonCircle />
            <div className="space-y-2">
              <SkeletonText className="h-4 w-32" />
              <SkeletonText className="h-3 w-24" />
              <SkeletonText className="h-3 w-20" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-6 w-16 rounded-full" /> {/* Badge */}
            <SkeletonButton className="h-8 w-16" />
            <SkeletonButton className="h-8 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ProductCardSkeleton() {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <Skeleton className="w-16 h-16 rounded-lg" /> {/* Product image */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-3">
                <SkeletonText className="h-5 w-32" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
              <SkeletonText className="h-3 w-full max-w-md" />
              <div className="flex items-center gap-4">
                <SkeletonText className="h-3 w-16" />
                <SkeletonText className="h-3 w-20" />
                <SkeletonText className="h-3 w-12" />
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <SkeletonButton className="h-8 w-16" />
            <SkeletonButton className="h-8 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function CategoryCardSkeleton() {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <Skeleton className="w-16 h-16 rounded-lg" /> {/* Category image */}
            <div className="space-y-2">
              <SkeletonText className="h-5 w-28" />
              <SkeletonText className="h-3 w-full max-w-xs" />
              <div className="flex items-center gap-2">
                <SkeletonText className="h-3 w-16" />
                <Skeleton className="h-5 w-8 rounded-full" />
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <SkeletonButton className="h-8 w-16" />
            <SkeletonButton className="h-8 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function TableCardSkeleton() {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <SkeletonText className="h-5 w-24" /> {/* Table number */}
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-20 rounded-full" /> {/* Status badge */}
            </div>
          </div>
          <div className="text-right space-y-1">
            <SkeletonText className="h-4 w-16" /> {/* Seats info */}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-4">
        <SkeletonText className="h-3 w-full max-w-xs" /> {/* Location */}
        <div className="flex items-center justify-between pt-2">
          <SkeletonText className="h-3 w-24" /> {/* Created date */}
          <div className="flex items-center space-x-2">
            <SkeletonButton className="h-8 w-16" />
            <SkeletonButton className="h-8 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// List Skeleton Components  
export function UserListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, i) => (
        <UserCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function ProductListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid gap-4">
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function CategoryListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="grid gap-4">
      {Array.from({ length: count }, (_, i) => (
        <CategoryCardSkeleton key={i} />
      ))}
    </div>
  )
}

export function TableGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <TableCardSkeleton key={i} />
      ))}
    </div>
  )
}

// Form Skeleton Components
export function FormSkeleton() {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader className="flex flex-row items-center justify-between">
        <SkeletonText className="h-6 w-32" />
        <SkeletonButton className="h-8 w-8" />
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Form fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <SkeletonText className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <SkeletonText className="h-4 w-20" />
            <Skeleton className="h-20 w-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <SkeletonText className="h-4 w-16" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <SkeletonText className="h-4 w-12" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
        
        {/* Form buttons */}
        <div className="flex justify-end space-x-2">
          <SkeletonButton className="h-10 w-20" />
          <SkeletonButton className="h-10 w-24" />
        </div>
      </CardContent>
    </Card>
  )
}

// Dashboard Skeletons
export function StatsCardSkeleton() {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <SkeletonText className="h-3 w-24" />
            <SkeletonText className="h-8 w-20" />
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      </CardContent>
    </Card>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <SkeletonText className="h-8 w-64" />
        <SkeletonText className="h-4 w-96" />
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
      
      {/* Main content */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <SkeletonText className="h-6 w-32" />
          <div className="flex gap-2">
            <SkeletonButton />
            <SkeletonButton />
          </div>
        </div>
        
        <div className="grid gap-4">
          {Array.from({ length: 6 }, (_, i) => (
            <Card key={i} className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <SkeletonText className="h-4 w-32" />
                  <SkeletonText className="h-3 w-48" />
                </div>
                <SkeletonText className="h-6 w-16" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

// Search & Filter Skeletons
export function SearchingSkeleton() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center space-x-3">
        <Skeleton className="h-4 w-4 rounded-full animate-pulse" />
        <SkeletonText className="h-4 w-32 animate-pulse" />
      </div>
    </div>
  )
}

export function FilteringSkeleton() {
  return (
    <div className="flex items-center space-x-2">
      <Skeleton className="h-4 w-4 rounded-full animate-pulse" />
      <SkeletonText className="h-4 w-24 animate-pulse" />
    </div>
  )
}
