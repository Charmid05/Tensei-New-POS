import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Package, CheckCircle, X, Volume2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { kitchenSoundService } from '@/services/soundService';
import apiClient from '@/api/client';
import type { Order } from '@/types';

interface TakeawayBoardProps {
  className?: string;
  autoRefresh?: boolean;
  onOrderComplete?: (orderId: string) => void;
}

interface TakeawayOrder extends Order {
  waitTime: number;
  isNewlyReady?: boolean;
}

export function TakeawayBoard({
  className,
  autoRefresh = true,
  onOrderComplete,
}: TakeawayBoardProps) {
  const [previousReadyOrders, setPreviousReadyOrders] = useState<Set<string>>(new Set());
  const [soundPlayed, setSoundPlayed] = useState<Set<string>>(new Set());

  // Fetch takeaway orders that are ready for pickup
  const { data: ordersResponse, refetch } = useQuery({
    queryKey: ['takeawayOrders'],
    queryFn: () => apiClient.getOrders({
      order_type: 'takeout',
      status: 'ready',
    }),
    refetchInterval: autoRefresh ? 2000 : false, // 2-second refresh for real-time updates
    select: (data) => data.data || [],
  });

  const orders: TakeawayOrder[] = (ordersResponse || []).map(order => ({
    ...order,
    waitTime: calculateWaitTime(order.created_at),
    isNewlyReady: !previousReadyOrders.has(order.id),
  }));

  // Calculate wait time in minutes
  function calculateWaitTime(createdAt: string): number {
    const created = new Date(createdAt);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / 1000 / 60);
  }

  // Handle new ready orders (sound notifications)
  useEffect(() => {
    const currentReadyIds = new Set(orders.map(order => order.id));
    const newReadyOrders = orders.filter(order => 
      !previousReadyOrders.has(order.id) && !soundPlayed.has(order.id)
    );

    // Play sound for newly ready takeaway orders
    newReadyOrders.forEach(async (order) => {
      try {
        await kitchenSoundService.playOrderReadySound(order.id, 'takeout');
        setSoundPlayed(prev => new Set([...prev, order.id]));
      } catch (error) {
        console.error('Failed to play takeaway ready sound:', error);
      }
    });

    setPreviousReadyOrders(currentReadyIds);
  }, [orders, previousReadyOrders, soundPlayed]);

  // Handle order completion
  const handleOrderComplete = useCallback(async (orderId: string) => {
    try {
      await apiClient.updateOrderStatus(orderId, 'served');
      refetch();
      onOrderComplete?.(orderId);
      
      // Remove from sound played set
      setSoundPlayed(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    } catch (error) {
      console.error('Failed to mark order as served:', error);
    }
  }, [refetch, onOrderComplete]);

  // Sort orders by wait time (longest first)
  const sortedOrders = [...orders].sort((a, b) => b.waitTime - a.waitTime);

  if (orders.length === 0) {
    return (
      <Card className={cn("text-center", className)}>
        <CardContent className="py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Takeaway Orders Ready</h3>
          <p className="text-muted-foreground">
            Completed takeaway orders will appear here for customer pickup
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Ready for Pickup ({orders.length})
          {orders.some(order => order.isNewlyReady) && (
            <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 animate-pulse">
              <Volume2 className="h-3 w-3 mr-1" />
              New!
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {sortedOrders.map((order) => (
            <TakeawayOrderCard
              key={order.id}
              order={order}
              onComplete={() => handleOrderComplete(order.id)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface TakeawayOrderCardProps {
  order: TakeawayOrder;
  onComplete: () => void;
}

function TakeawayOrderCard({ order, onComplete }: TakeawayOrderCardProps) {
  const getUrgencyLevel = (waitTime: number) => {
    if (waitTime >= 20) return { level: 'critical', color: 'bg-red-500', text: 'Very Urgent' };
    if (waitTime >= 15) return { level: 'high', color: 'bg-orange-500', text: 'Urgent' };
    if (waitTime >= 10) return { level: 'medium', color: 'bg-yellow-500', text: 'Ready' };
    return { level: 'normal', color: 'bg-green-500', text: 'Fresh' };
  };

  const urgency = getUrgencyLevel(order.waitTime);

  return (
    <Card 
      className={cn(
        "relative transition-all duration-200",
        order.isNewlyReady && "ring-2 ring-green-400 shadow-lg animate-pulse",
        urgency.level === 'critical' && "ring-2 ring-red-400",
        urgency.level === 'high' && "ring-2 ring-orange-400"
      )}
    >
      {/* Urgency Indicator */}
      <div className={cn("absolute top-0 right-0 w-3 h-3 rounded-full m-2", urgency.color)} />
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              #{order.order_number}
            </h3>
            <p className="text-sm text-muted-foreground">
              {order.customer_name || 'Customer'}
            </p>
          </div>
          <Badge 
            variant={urgency.level === 'critical' ? 'destructive' : 'secondary'}
            className="text-xs"
          >
            {urgency.text}
          </Badge>
        </div>

        {/* Wait Time Display */}
        <div className="flex items-center gap-2 mb-3 text-sm">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <span className={cn(
            "font-medium",
            urgency.level === 'critical' && "text-red-600",
            urgency.level === 'high' && "text-orange-600",
            urgency.level === 'medium' && "text-yellow-600",
            urgency.level === 'normal' && "text-green-600"
          )}>
            {order.waitTime === 0 ? 'Just ready' : `${order.waitTime} min waiting`}
          </span>
        </div>

        {/* Order Items Preview */}
        <div className="mb-4">
          <div className="text-xs text-muted-foreground mb-1">
            {order.items?.length || 0} items
          </div>
          <div className="space-y-1">
            {order.items?.slice(0, 3).map((item) => (
              <div key={item.id} className="flex items-center text-sm">
                <span className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs mr-2">
                  {item.quantity}
                </span>
                <span className="flex-1 truncate">{item.product?.name}</span>
              </div>
            ))}
            {(order.items?.length || 0) > 3 && (
              <div className="text-xs text-muted-foreground">
                +{(order.items?.length || 0) - 3} more items
              </div>
            )}
          </div>
        </div>

        {/* Total Amount */}
        <div className="flex justify-between items-center mb-3 text-sm">
          <span className="text-muted-foreground">Total:</span>
          <span className="font-semibold">${order.total_amount.toFixed(2)}</span>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={onComplete}
            size="sm"
            className="flex-1"
            variant={urgency.level === 'critical' ? 'destructive' : 'default'}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Mark Served
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default TakeawayBoard;
