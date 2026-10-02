import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Settings, 
  RefreshCw, 
  Volume2, 
  VolumeX, 
  Clock,
  ChefHat,
  Package,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EnhancedKitchenOrderCard } from './EnhancedKitchenOrderCard';
import { TakeawayBoard } from './TakeawayBoard';
import { SoundSettings } from './SoundSettings';
import { kitchenSoundService } from '@/services/soundService';
import apiClient from '@/api/client';
import type { User, Order } from '@/types';

interface EnhancedKitchenLayoutProps {
  user: User;
}

export function EnhancedKitchenLayout({ user }: EnhancedKitchenLayoutProps) {
  const [selectedTab, setSelectedTab] = useState('active-orders');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [showSoundSettings, setShowSoundSettings] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [previousOrderIds, setPreviousOrderIds] = useState<Set<string>>(new Set());
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Initialize sound service
  useEffect(() => {
    kitchenSoundService.initialize().catch(error => {
      console.warn('Sound service initialization failed:', error);
    });
    
    const settings = kitchenSoundService.getSettings();
    setSoundEnabled(settings.enabled);
  }, []);

  // Fetch kitchen orders with smart polling
  const { data: ordersResponse, isLoading, refetch, error } = useQuery({
    queryKey: ['enhancedKitchenOrders'],
    queryFn: () => apiClient.getKitchenOrders('all'),
    refetchInterval: autoRefresh ? 3000 : false, // 3-second refresh for balance
    select: (data) => data.data || [],
    onSuccess: (data) => {
      setLastRefresh(new Date());
      
      // Check for new orders and play sound
      const currentOrders = data || [];
      const currentOrderIds = new Set(currentOrders.map((order: Order) => order.id));
      const newOrderIds = currentOrders
        .filter((order: Order) => !previousOrderIds.has(order.id) && order.status === 'confirmed')
        .map((order: Order) => order.id);
      
      // Play sound for new orders
      newOrderIds.forEach(async (orderId) => {
        try {
          await kitchenSoundService.playNewOrderSound(orderId);
        } catch (error) {
          console.error('Failed to play new order sound:', error);
        }
      });
      
      setPreviousOrderIds(currentOrderIds);
    },
  });

  const orders = ordersResponse || [];

  // Group orders by status for better organization
  const ordersByStatus = {
    confirmed: orders.filter((order: Order) => order.status === 'confirmed'),
    preparing: orders.filter((order: Order) => order.status === 'preparing'),
    ready: orders.filter((order: Order) => order.status === 'ready'),
  };

  // Calculate statistics
  const stats = {
    total: orders.length,
    newOrders: ordersByStatus.confirmed.length,
    preparing: ordersByStatus.preparing.length,
    ready: ordersByStatus.ready.length,
    urgent: orders.filter((order: Order) => {
      const created = new Date(order.created_at);
      const now = new Date();
      const minutesWaiting = Math.floor((now.getTime() - created.getTime()) / 1000 / 60);
      return minutesWaiting > 15;
    }).length,
  };

  // Handle order status updates
  const handleOrderStatusUpdate = useCallback(async (orderId: string, newStatus: string) => {
    try {
      await apiClient.updateOrderStatus(orderId, newStatus);
      refetch();
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  }, [refetch]);

  // Handle order item status updates
  const handleOrderItemStatusUpdate = useCallback(async (orderId: string, itemId: string, newStatus: string) => {
    try {
      await apiClient.updateOrderItemStatus(orderId, itemId, newStatus);
      refetch();
    } catch (error) {
      console.error('Failed to update order item status:', error);
    }
  }, [refetch]);

  // Manual refresh
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Toggle sound
  const toggleSound = useCallback(() => {
    const newEnabled = !soundEnabled;
    setSoundEnabled(newEnabled);
    kitchenSoundService.updateSettings({ enabled: newEnabled });
  }, [soundEnabled]);

  // Get time since last refresh
  const getTimeSinceRefresh = useCallback(() => {
    const seconds = Math.floor((Date.now() - lastRefresh.getTime()) / 1000);
    return seconds < 60 ? `${seconds}s ago` : `${Math.floor(seconds / 60)}m ago`;
  }, [lastRefresh]);

  return (
    <div className="h-screen flex flex-col bg-gray-50 touch-manipulation">
      {/* Minimalistic Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* Title and User */}
          <div className="flex items-center gap-3">
            <ChefHat className="h-6 w-6 text-primary" />
            <div>
              <h1 className="text-xl font-bold">Kitchen Display</h1>
              <p className="text-sm text-muted-foreground">
                {user.first_name} • {getTimeSinceRefresh()}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="hidden md:flex items-center gap-3 text-sm">
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              {stats.newOrders} New
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              {stats.preparing} Preparing
            </Badge>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {stats.ready} Ready
            </Badge>
            {stats.urgent > 0 && (
              <Badge variant="destructive">
                {stats.urgent} Urgent
              </Badge>
            )}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSound}
              className="h-10 w-10 p-0"
            >
              {soundEnabled ? 
                <Volume2 className="h-4 w-4" /> : 
                <VolumeX className="h-4 w-4 text-muted-foreground" />
              }
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-10 w-10 p-0"
            >
              <RefreshCw className={cn(
                "h-4 w-4",
                isLoading && "animate-spin"
              )} />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSoundSettings(true)}
              className="h-10 w-10 p-0"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Stats */}
        <div className="md:hidden flex items-center gap-2 mt-3">
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 text-xs">
            {stats.newOrders} New
          </Badge>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-xs">
            {stats.preparing} Preparing  
          </Badge>
          <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
            {stats.ready} Ready
          </Badge>
          {stats.urgent > 0 && (
            <Badge variant="destructive" className="text-xs">
              {stats.urgent} Urgent
            </Badge>
          )}
        </div>

        {/* Auto-refresh indicator */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className={cn(
              "w-2 h-2 rounded-full",
              autoRefresh ? "bg-green-500 animate-pulse" : "bg-gray-300"
            )} />
            {autoRefresh ? "Auto-refreshing" : "Manual refresh"}
            {error && (
              <Badge variant="destructive" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                Connection Error
              </Badge>
            )}
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="h-6 px-2 text-xs"
          >
            {autoRefresh ? 'Disable Auto-refresh' : 'Enable Auto-refresh'}
          </Button>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="h-full flex flex-col">
          {/* Tab Navigation - Touch Optimized */}
          <TabsList className="grid w-full grid-cols-2 h-14 mx-4 mt-4 mb-2">
            <TabsTrigger value="active-orders" className="flex items-center gap-2 text-base font-medium">
              <ChefHat className="h-4 w-4" />
              Kitchen Orders
              {stats.total > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {stats.total}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="takeaway" className="flex items-center gap-2 text-base font-medium">
              <Package className="h-4 w-4" />
              Takeaway Ready
            </TabsTrigger>
          </TabsList>

          {/* Active Orders Tab */}
          <TabsContent value="active-orders" className="flex-1 overflow-auto px-4 pb-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading kitchen orders...</p>
                </div>
              </div>
            ) : orders.length === 0 ? (
              <Card className="h-64 flex items-center justify-center">
                <CardContent className="text-center">
                  <ChefHat className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Active Orders</h3>
                  <p className="text-muted-foreground">
                    New orders will appear here automatically
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {/* New Orders Section */}
                {ordersByStatus.confirmed.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3 animate-pulse"></div>
                      New Orders ({ordersByStatus.confirmed.length})
                    </h2>
                    <div className="grid gap-4 lg:grid-cols-2">
                      {ordersByStatus.confirmed.map((order: Order) => (
                        <EnhancedKitchenOrderCard
                          key={order.id}
                          order={order}
                          onStatusUpdate={handleOrderStatusUpdate}
                          onItemStatusUpdate={handleOrderItemStatusUpdate}
                          isMinimalistic={true}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Preparing Orders Section */}
                {ordersByStatus.preparing.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                      Preparing ({ordersByStatus.preparing.length})
                    </h2>
                    <div className="grid gap-4 lg:grid-cols-2">
                      {ordersByStatus.preparing.map((order: Order) => (
                        <EnhancedKitchenOrderCard
                          key={order.id}
                          order={order}
                          onStatusUpdate={handleOrderStatusUpdate}
                          onItemStatusUpdate={handleOrderItemStatusUpdate}
                          isMinimalistic={true}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Ready Orders Section */}
                {ordersByStatus.ready.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                      Ready for Service ({ordersByStatus.ready.length})
                    </h2>
                    <div className="grid gap-4 lg:grid-cols-2">
                      {ordersByStatus.ready.map((order: Order) => (
                        <EnhancedKitchenOrderCard
                          key={order.id}
                          order={order}
                          onStatusUpdate={handleOrderStatusUpdate}
                          onItemStatusUpdate={handleOrderItemStatusUpdate}
                          isMinimalistic={true}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Takeaway Board Tab */}
          <TabsContent value="takeaway" className="flex-1 overflow-auto px-4 pb-4">
            <TakeawayBoard
              autoRefresh={autoRefresh}
              onOrderComplete={() => refetch()}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Sound Settings Modal */}
      {showSoundSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <SoundSettings
            className="max-w-md w-full"
            onClose={() => setShowSoundSettings(false)}
          />
        </div>
      )}
    </div>
  );
}
