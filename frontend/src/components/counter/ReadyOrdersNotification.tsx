import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellRing, CheckCircle, Clock, MapPin, User, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { kitchenSoundService } from '@/services/soundService';
import apiClient from '@/api/client';
import type { Order } from '@/types';

interface ReadyOrdersNotificationProps {
  className?: string;
  autoRefresh?: boolean;
  onOrderServed?: (orderId: string) => void;
}

interface ReadyOrder extends Order {
  readyTime: number; // minutes since ready
  isNewlyReady?: boolean;
}

export function ReadyOrdersNotification({ 
  className, 
  autoRefresh = true,
  onOrderServed 
}: ReadyOrdersNotificationProps) {
  const [previousReadyOrders, setPreviousReadyOrders] = useState<Set<string>>(new Set());
  const [soundPlayed, setSoundPlayed] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(true);

  // Fetch ready orders for pickup
  const { data: ordersResponse, refetch } = useQuery({
    queryKey: ['counterReadyOrders'],
    queryFn: () => apiClient.getOrders({ status: 'ready' }),
    refetchInterval: autoRefresh ? 2000 : false, // 2-second refresh for real-time
    select: (data) => data.data || [],
  });

  const orders: ReadyOrder[] = (ordersResponse || []).map(order => ({
    ...order,
    readyTime: calculateReadyTime(order.updated_at || order.created_at),
    isNewlyReady: !previousReadyOrders.has(order.id),
  }));

  // Calculate time since order became ready
  function calculateReadyTime(updatedAt: string): number {
    const updated = new Date(updatedAt);
    const now = new Date();
    return Math.floor((now.getTime() - updated.getTime()) / 1000 / 60);
  }

  // Handle new ready orders (sound notifications)
  useEffect(() => {
    const currentReadyIds = new Set(orders.map(order => order.id));
    const newReadyOrders = orders.filter(order => 
      !previousReadyOrders.has(order.id) && !soundPlayed.has(order.id)
    );

    // Play sound for newly ready orders
    newReadyOrders.forEach(async (order) => {
      try {
        await kitchenSoundService.playOrderReadySound(order.id, order.order_type);
        setSoundPlayed(prev => new Set([...prev, order.id]));
      } catch (error) {
        console.error('Failed to play order ready sound:', error);
      }
    });

    setPreviousReadyOrders(currentReadyIds);
  }, [orders, previousReadyOrders, soundPlayed]);

  // Handle order served
  const handleOrderServed = useCallback(async (orderId: string) => {
    try {
      await apiClient.updateOrderStatus(orderId, 'served');
      refetch();
      onOrderServed?.(orderId);
      
      // Remove from sound played set
      setSoundPlayed(prev => {
        const newSet = new Set(prev);
        newSet.delete(orderId);
        return newSet;
      });
    } catch (error) {
      console.error('Failed to mark order as served:', error);
    }
  }, [refetch, onOrderServed]);

  // Sort orders by ready time (longest waiting first)
  const sortedOrders = [...orders].sort((a, b) => b.readyTime - a.readyTime);
  const urgentOrders = sortedOrders.filter(order => order.readyTime >= 10);
  const newOrders = sortedOrders.filter(order => order.isNewlyReady);

  if (orders.length === 0) {
    return (
      <Card className={cn("border-green-200", className)}>
        <CardContent className="p-4 text-center">
          <Bell className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">No orders ready for pickup</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "border-green-500 shadow-md",
      newOrders.length > 0 && "ring-2 ring-green-400",
      className
    )}>
      <CardHeader 
        className="pb-3 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {newOrders.length > 0 ? (
              <BellRing className="h-5 w-5 text-green-600 animate-pulse" />
            ) : (
              <Bell className="h-5 w-5 text-green-600" />
            )}
            <span>Ready for Pickup ({orders.length})</span>
            {newOrders.length > 0 && (
              <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                {newOrders.length} New!
              </Badge>
            )}
            {urgentOrders.length > 0 && (
              <Badge variant="destructive">
                {urgentOrders.length} Urgent
              </Badge>
            )}
          </div>
          <span className={cn(
            "text-sm transition-transform",
            isExpanded ? "rotate-180" : ""
          )}>
            ▼
          </span>
        </CardTitle>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-3">
          {sortedOrders.map((order) => (
            <ReadyOrderCard
              key={order.id}
              order={order}
              onServed={() => handleOrderServed(order.id)}
            />
          ))}
        </CardContent>
      )}
    </Card>
  );
}

interface ReadyOrderCardProps {
  order: ReadyOrder;
  onServed: () => void;
}

function ReadyOrderCard({ order, onServed }: ReadyOrderCardProps) {
  const getUrgencyLevel = (readyTime: number) => {
    if (readyTime >= 15) return { level: 'critical', color: 'bg-red-500', text: 'Very Urgent' };
    if (readyTime >= 10) return { level: 'high', color: 'bg-orange-500', text: 'Urgent' };
    if (readyTime >= 5) return { level: 'medium', color: 'bg-yellow-500', text: 'Waiting' };
    return { level: 'normal', color: 'bg-green-500', text: 'Fresh' };
  };

  const urgency = getUrgencyLevel(order.readyTime);

  return (
    <Card className={cn(
      "relative transition-all duration-200",
      order.isNewlyReady && "ring-2 ring-green-400 animate-pulse",
      urgency.level === 'critical' && "ring-2 ring-red-400",
      urgency.level === 'high' && "ring-2 ring-orange-400"
    )}>
      {/* Urgency Indicator */}
      <div className={cn("absolute top-2 right-2 w-3 h-3 rounded-full", urgency.color)} />
      
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-lg">#{order.order_number}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
              {order.order_type === 'dine_in' && order.table && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  Table {order.table.table_number}
                </span>
              )}
              {order.order_type === 'takeout' && (
                <span className="flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  Takeaway
                </span>
              )}
              {order.customer_name && (
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {order.customer_name}
                </span>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <Badge 
              variant={urgency.level === 'critical' ? 'destructive' : 
                      urgency.level === 'high' ? 'secondary' : 'outline'}
              className="text-xs mb-1"
            >
              {urgency.text}
            </Badge>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {order.readyTime === 0 ? 'Just ready' : `${order.readyTime}m waiting`}
            </div>
          </div>
        </div>

        {/* Order Summary */}
        <div className="mb-3">
          <div className="text-sm text-muted-foreground mb-1">
            {order.items?.length || 0} items • ${order.total_amount.toFixed(2)}
          </div>
          
          {/* Item Preview */}
          <div className="space-y-1">
            {order.items?.slice(0, 2).map((item) => (
              <div key={item.id} className="flex items-center text-sm">
                <span className="w-5 h-5 bg-green-100 text-green-800 rounded-full flex items-center justify-center text-xs mr-2">
                  {item.quantity}
                </span>
                <span className="flex-1 truncate">{item.product?.name}</span>
              </div>
            ))}
            {(order.items?.length || 0) > 2 && (
              <div className="text-xs text-muted-foreground ml-7">
                +{(order.items?.length || 0) - 2} more items
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={onServed}
          size="sm"
          className={cn(
            "w-full",
            urgency.level === 'critical' 
              ? "bg-red-600 hover:bg-red-700"
              : "bg-green-600 hover:bg-green-700"
          )}
        >
          <CheckCircle className="h-4 w-4 mr-2" />
          Mark as Served
        </Button>
      </CardContent>
    </Card>
  );
}

export default ReadyOrdersNotification;
