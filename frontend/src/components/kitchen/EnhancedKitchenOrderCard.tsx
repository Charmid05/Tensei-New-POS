import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Clock, User, MapPin, CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { kitchenSoundService } from '@/services/soundService';
import type { Order, OrderItem } from '@/types';

interface EnhancedKitchenOrderCardProps {
  order: Order;
  onStatusUpdate: (orderId: string, newStatus: string) => void;
  onItemStatusUpdate: (orderId: string, itemId: string, newStatus: string) => void;
  className?: string;
  isMinimalistic?: boolean;
}

export function EnhancedKitchenOrderCard({
  order,
  onStatusUpdate,
  onItemStatusUpdate,
  className,
  isMinimalistic = false,
}: EnhancedKitchenOrderCardProps) {
  const [completedItems, setCompletedItems] = useState<Set<string>>(new Set());
  const [isExpanded, setIsExpanded] = useState(false);

  // Calculate progress
  const totalItems = order.items?.length || 0;
  const readyItems = order.items?.filter(item => item.status === 'ready').length || 0;
  const progressPercentage = totalItems > 0 ? (readyItems / totalItems) * 100 : 0;

  // Calculate time elapsed
  const getTimeElapsed = useCallback(() => {
    const createdAt = new Date(order.created_at);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - createdAt.getTime()) / 1000 / 60);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}m ago`;
  }, [order.created_at]);

  // Get status styling
  const getStatusStyling = useCallback(() => {
    const statusMap = {
      confirmed: {
        color: 'bg-yellow-500',
        textColor: 'text-yellow-700',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-l-yellow-500',
        badge: 'secondary',
      },
      preparing: {
        color: 'bg-blue-500',
        textColor: 'text-blue-700',
        bgColor: 'bg-blue-50',
        borderColor: 'border-l-blue-500',
        badge: 'default',
      },
      ready: {
        color: 'bg-green-500',
        textColor: 'text-green-700',
        bgColor: 'bg-green-50',
        borderColor: 'border-l-green-500',
        badge: 'outline',
      },
    };

    return statusMap[order.status as keyof typeof statusMap] || statusMap.confirmed;
  }, [order.status]);

  const statusStyling = getStatusStyling();

  // Handle item status toggle
  const handleItemToggle = useCallback(async (item: OrderItem, isChecked: boolean) => {
    const newStatus = isChecked ? 'ready' : 'preparing';
    
    try {
      await onItemStatusUpdate(order.id, item.id, newStatus);
      
      // Update local state for immediate feedback
      setCompletedItems(prev => {
        const newSet = new Set(prev);
        if (isChecked) {
          newSet.add(item.id);
        } else {
          newSet.delete(item.id);
        }
        return newSet;
      });
    } catch (error) {
      console.error('Failed to update item status:', error);
    }
  }, [order.id, onItemStatusUpdate]);

  // Auto-complete order when all items are ready
  useEffect(() => {
    const allItemsReady = order.items?.every(item => 
      item.status === 'ready' || completedItems.has(item.id)
    );
    
    if (allItemsReady && totalItems > 0 && order.status === 'preparing') {
      // Automatically move order to ready status
      setTimeout(async () => {
        try {
          await onStatusUpdate(order.id, 'ready');
          // Play sound notification
          await kitchenSoundService.playOrderReadySound(order.id, order.order_type);
        } catch (error) {
          console.error('Failed to auto-complete order:', error);
        }
      }, 500); // Small delay for user feedback
    }
  }, [completedItems, order.items, order.id, order.status, order.order_type, onStatusUpdate, totalItems]);

  // Handle manual status update
  const handleStatusUpdate = useCallback(async (newStatus: string) => {
    try {
      await onStatusUpdate(order.id, newStatus);
      
      if (newStatus === 'preparing') {
        // Reset item completion state
        setCompletedItems(new Set());
      }
    } catch (error) {
      console.error('Failed to update order status:', error);
    }
  }, [order.id, onStatusUpdate]);

  // Get next action based on current status
  const getNextAction = useCallback(() => {
    switch (order.status) {
      case 'confirmed':
        return { label: 'Start Preparing', status: 'preparing', icon: <Circle className="h-4 w-4" /> };
      case 'preparing':
        return { 
          label: 'Mark Ready', 
          status: 'ready', 
          icon: <CheckCircle className="h-4 w-4" />,
          disabled: progressPercentage < 100
        };
      case 'ready':
        return { label: 'Mark Served', status: 'served', icon: <CheckCircle className="h-4 w-4" /> };
      default:
        return null;
    }
  }, [order.status, progressPercentage]);

  const nextAction = getNextAction();

  if (isMinimalistic) {
    return (
      <Card className={cn(
        "touch-manipulation",
        statusStyling.bgColor,
        `border-l-4 ${statusStyling.borderColor}`,
        className
      )}>
        <CardContent className="p-4">
          {/* Minimal Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold">#{order.order_number}</h3>
              <Badge variant={statusStyling.badge as any} className="text-xs">
                {order.status}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              {getTimeElapsed()}
            </div>
          </div>

          {/* Progress Bar */}
          {order.status === 'preparing' && (
            <div className="mb-3">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Progress</span>
                <span>{readyItems}/{totalItems} items</span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>
          )}

          {/* Order Info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
            {order.table && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                Table {order.table.table_number}
              </span>
            )}
            {order.customer_name && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {order.customer_name}
              </span>
            )}
          </div>

          {/* Item Checklist (Touch-Optimized) */}
          {order.status === 'preparing' && (
            <div className="space-y-2 mb-4">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-2 bg-white/50 rounded-md">
                  <Checkbox
                    id={`item-${item.id}`}
                    checked={item.status === 'ready' || completedItems.has(item.id)}
                    onCheckedChange={(checked) => handleItemToggle(item, checked as boolean)}
                    className="h-5 w-5" // Larger for touch
                  />
                  <label
                    htmlFor={`item-${item.id}`}
                    className={cn(
                      "flex-1 text-sm font-medium cursor-pointer",
                      (item.status === 'ready' || completedItems.has(item.id)) &&
                        "text-muted-foreground line-through"
                    )}
                  >
                    {item.quantity}× {item.product?.name}
                    {item.special_instructions && (
                      <span className="block text-xs text-muted-foreground italic">
                        {item.special_instructions}
                      </span>
                    )}
                  </label>
                </div>
              ))}
            </div>
          )}

          {/* Action Button */}
          {nextAction && (
            <Button
              onClick={() => handleStatusUpdate(nextAction.status)}
              disabled={nextAction.disabled}
              size="lg"
              className="w-full h-12 text-base font-medium"
            >
              <div className="flex items-center gap-2">
                {nextAction.icon}
                {nextAction.label}
              </div>
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full detailed view (original with enhancements)
  return (
    <Card className={cn(
      "touch-manipulation",
      statusStyling.bgColor,
      `border-l-4 ${statusStyling.borderColor}`,
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold">#{order.order_number}</h3>
              <Badge variant={statusStyling.badge as any}>
                {order.status}
              </Badge>
              {order.status === 'preparing' && progressPercentage === 100 && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Ready to serve
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {getTimeElapsed()}
              </span>
              {order.table && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Table {order.table.table_number}
                </span>
              )}
              {order.customer_name && (
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  {order.customer_name}
                </span>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="ml-2"
          >
            <span className={cn(
              "transition-transform duration-200",
              isExpanded ? "rotate-180" : ""
            )}>
              ▼
            </span>
          </Button>
        </div>

        {/* Progress Indicator */}
        {order.status === 'preparing' && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Completion Progress</span>
              <span>{readyItems}/{totalItems} items ready</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Item Checklist */}
        <div className="space-y-2 mb-4">
          {order.items?.slice(0, isExpanded ? undefined : 3).map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-md border",
                order.status === 'preparing'
                  ? "bg-white border-gray-200"
                  : "bg-gray-50 border-gray-100"
              )}
            >
              {order.status === 'preparing' ? (
                <Checkbox
                  id={`item-${item.id}`}
                  checked={item.status === 'ready' || completedItems.has(item.id)}
                  onCheckedChange={(checked) => handleItemToggle(item, checked as boolean)}
                  className="h-5 w-5"
                />
              ) : (
                <div className={cn(
                  "h-5 w-5 rounded border-2 flex items-center justify-center",
                  item.status === 'ready'
                    ? "bg-green-500 border-green-500 text-white"
                    : "border-gray-300"
                )}>
                  {item.status === 'ready' && <CheckCircle className="h-3 w-3" />}
                </div>
              )}

              <div className="flex-1">
                <label
                  htmlFor={`item-${item.id}`}
                  className={cn(
                    "block font-medium cursor-pointer",
                    (item.status === 'ready' || completedItems.has(item.id)) &&
                      "text-muted-foreground line-through"
                  )}
                >
                  {item.quantity}× {item.product?.name}
                </label>
                
                {item.special_instructions && (
                  <p className="text-sm text-muted-foreground italic mt-1">
                    Note: {item.special_instructions}
                  </p>
                )}
                
                {item.product?.preparation_time && (
                  <p className="text-xs text-muted-foreground">
                    Est. prep time: {item.product.preparation_time} min
                  </p>
                )}
              </div>

              <Badge
                variant={item.status === 'ready' ? 'default' : 'secondary'}
                className="text-xs"
              >
                {item.status === 'ready' ? 'Ready' : 'Preparing'}
              </Badge>
            </div>
          ))}
          
          {!isExpanded && (order.items?.length || 0) > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(true)}
              className="w-full"
            >
              Show {(order.items?.length || 0) - 3} more items
            </Button>
          )}
        </div>

        {/* Expanded Details */}
        {isExpanded && order.notes && (
          <div className="p-3 bg-white rounded-md border mb-4">
            <h4 className="font-medium mb-1">Special Instructions:</h4>
            <p className="text-sm text-muted-foreground">{order.notes}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {nextAction && (
            <Button
              onClick={() => handleStatusUpdate(nextAction.status)}
              disabled={nextAction.disabled}
              className="flex-1 h-12"
              size="lg"
            >
              <div className="flex items-center gap-2">
                {nextAction.icon}
                {nextAction.label}
                {nextAction.disabled && (
                  <AlertCircle className="h-4 w-4 ml-1" />
                )}
              </div>
            </Button>
          )}
          
          {order.status !== 'confirmed' && (
            <Button
              variant="outline"
              onClick={() => handleStatusUpdate('confirmed')}
              size="lg"
              className="h-12"
            >
              Reset
            </Button>
          )}
        </div>

        {nextAction?.disabled && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            Complete all items before marking order as ready
          </p>
        )}
      </CardContent>
    </Card>
  );
}
