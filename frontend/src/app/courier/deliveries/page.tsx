"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  AlertTriangle,
  CheckCircle2,
  ChefHat,
  ChevronDown,
  ChevronUp,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  MessageCircle,
  Navigation,
  Package,
  Phone,
  Store,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { chatService } from "@/services/chat.service";
import { ChatInterface } from "@/components/chat/ChatInterface";
import {
  CurrentLocationDisplay,
  LocationPicker,
} from "@/components/LocationPicker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MapControls,
  MapMarker,
  MapRoute,
  MarkerContent,
  Map as UIMap,
} from "@/components/ui/map";
import { useGeolocation } from "@/hooks/useGeolocation";
import { api } from "@/lib/axios";
import { formatRupiah } from "@/lib/utils";
import { courierService } from "@/services/courier.service";
import type {
  ApiResponse,
  Order,
  OrderStatus,
  PaginatedResponse,
} from "@/types";

const STATUS_TABS = [
  {
    value: "active",
    label: "Active",
    statuses: [
      "confirmed",
      "preparing",
      "ready_for_pickup",
      "picked_up",
      "on_delivery",
    ],
  },
  { value: "completed", label: "Completed", statuses: ["delivered"] },
];

export default function CourierDeliveriesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("active");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    order: Order | null;
    type: "pickup" | "on_delivery" | "deliver";
  }>({ open: false, order: null, type: "deliver" });

  // Chat state
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [activeChatRoomId, setActiveChatRoomId] = useState<string | null>(null);
  const [activeChatOrder, setActiveChatOrder] = useState<Order | null>(null);
  const [isStartingChat, setIsStartingChat] = useState(false);

  const handleStartChat = async (
    order: Order,
    type: "customer_courier" | "merchant_courier",
  ) => {
    if (!order.id) return;
    try {
      setIsStartingChat(true);
      const res = await chatService.startRoom(order.id, type);
      setActiveChatRoomId(res.room.id);
      setActiveChatOrder(order);
      setChatDialogOpen(true);
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } catch (err: any) {
      toast.error(
        err.response?.data?.error?.message || "Failed to start chat.",
      );
    } finally {
      setIsStartingChat(false);
    }
  };

  // Get courier's real-time location
  const {
    position: courierPosition,
    isLoading: isLocationLoading,
    error: locationError,
    refetch: refetchLocation,
  } = useGeolocation({
    watch: true,
    enableHighAccuracy: true,
  });

  const currentTab =
    STATUS_TABS.find((t) => t.value === activeTab) || STATUS_TABS[0];

  const { data: orders, isLoading } = useQuery({
    queryKey: ["courier-orders", activeTab],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Order>>("/courier/orders", {
        params: { status: currentTab.statuses.join(",") },
      });
      return res.data.data;
    },
    refetchInterval: 15000,
  });

  const pickupMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await api.patch<ApiResponse<Order>>(
        `/courier/orders/${orderId}/pickup`,
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courier-orders"] });
      toast.success("Order picked up! Head to the customer.");
      closeConfirmDialog();
    },
    onError: () => toast.error("Failed to update status"),
  });

  const onDeliveryMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await api.patch<ApiResponse<Order>>(
        `/courier/orders/${orderId}/on-delivery`,
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courier-orders"] });
      toast.success("On the way to customer!");
      closeConfirmDialog();
    },
    onError: () => toast.error("Failed to update status"),
  });

  const deliverMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await api.patch<ApiResponse<Order>>(
        `/courier/orders/${orderId}/deliver`,
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courier-orders"] });
      toast.success("Delivery completed! Great job! 🎉");
      closeConfirmDialog();
    },
    onError: () => toast.error("Failed to complete delivery"),
  });

  const closeConfirmDialog = () => {
    setConfirmDialog({ open: false, order: null, type: "deliver" });
  };

  const openConfirmDialog = (
    order: Order,
    type: "pickup" | "on_delivery" | "deliver",
  ) => {
    setConfirmDialog({ open: true, order, type });
  };

  const handleConfirmAction = () => {
    if (!confirmDialog.order) return;
    const orderId = confirmDialog.order.id;

    switch (confirmDialog.type) {
      case "pickup":
        pickupMutation.mutate(orderId);
        break;
      case "on_delivery":
        onDeliveryMutation.mutate(orderId);
        break;
      case "deliver":
        deliverMutation.mutate(orderId);
        break;
    }
  };

  const getDialogContent = () => {
    if (!confirmDialog.order)
      return {
        title: "",
        description: "",
        buttonText: "",
        icon: null,
        color: "",
      };

    switch (confirmDialog.type) {
      case "pickup":
        return {
          title: "Confirm Order Pickup",
          description: `You're picking up order #${confirmDialog.order.orderNumber} from ${confirmDialog.order.merchant?.storeName}.`,
          buttonText: "Confirm Pickup",
          icon: <Package className="h-6 w-6 text-blue-500" />,
          color: "bg-blue-600 hover:bg-blue-700",
        };
      case "on_delivery":
        return {
          title: "Start Delivery",
          description: `You're heading to deliver order #${confirmDialog.order.orderNumber}. The customer will be notified.`,
          buttonText: "Start Delivery",
          icon: <Navigation className="h-6 w-6 text-cyan-500" />,
          color:
            "bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600",
        };
      case "deliver":
        return {
          title: "Complete Delivery",
          description: `Confirm that you've delivered order #${confirmDialog.order.orderNumber} to the customer.`,
          buttonText: "Confirm Delivery",
          icon: <CheckCircle2 className="h-6 w-6 text-emerald-500" />,
          color: "bg-emerald-600 hover:bg-emerald-700",
        };
      default:
        return {
          title: "",
          description: "",
          buttonText: "",
          icon: null,
          color: "",
        };
    }
  };

  const dialogContent = getDialogContent();

  const getStatusBadge = (status: OrderStatus) => {
    const config: Record<
      string,
      { color: string; label: string; icon: React.ReactNode }
    > = {
      confirmed: {
        color:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
        label: "Waiting Merchant",
        icon: <Clock className="h-3 w-3" />,
      },
      preparing: {
        color:
          "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
        label: "Being Prepared",
        icon: <ChefHat className="h-3 w-3" />,
      },
      ready_for_pickup: {
        color:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
        label: "Ready for Pickup",
        icon: <Package className="h-3 w-3" />,
      },
      picked_up: {
        color:
          "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300",
        label: "Picked Up",
        icon: <Truck className="h-3 w-3" />,
      },
      on_delivery: {
        color:
          "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
        label: "On Delivery",
        icon: <Navigation className="h-3 w-3" />,
      },
      delivered: {
        color:
          "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
        label: "Delivered",
        icon: <CheckCircle2 className="h-3 w-3" />,
      },
    };
    const { color, label, icon } = config[status] || {
      color: "bg-gray-100",
      label: status,
      icon: null,
    };
    return (
      <Badge className={`${color} font-semibold flex items-center gap-1`}>
        {icon}
        {label}
      </Badge>
    );
  };

  const getStatusActions = (order: Order) => {
    switch (order.status) {
      case "confirmed":
      case "preparing":
        return (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 animate-pulse" />
            <span>Waiting for merchant to prepare...</span>
          </div>
        );
      case "ready_for_pickup":
        return (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              openConfirmDialog(order, "pickup");
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Package className="mr-2 h-4 w-4" />
            Pick Up Order
          </Button>
        );
      case "picked_up":
        return (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              openConfirmDialog(order, "on_delivery");
            }}
            className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
          >
            <Navigation className="mr-2 h-4 w-4" />
            Start Delivery
          </Button>
        );
      case "on_delivery":
        return (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              openConfirmDialog(order, "deliver");
            }}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <CheckCircle2 className="mr-2 h-4 w-4" />
            Complete Delivery
          </Button>
        );
      default:
        return null;
    }
  };

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const getCoordinates = (order: Order) => {
    // Use real merchant coordinates if available, otherwise fallback to defaults
    const merchantLat = order.merchant?.latitude
      ? Number.parseFloat(order.merchant.latitude)
      : -6.2088;
    const merchantLng = order.merchant?.longitude
      ? Number.parseFloat(order.merchant.longitude)
      : 106.8456;

    // Use real delivery address coordinates if available
    const customerLat = order.deliveryAddress?.latitude
      ? Number.parseFloat(order.deliveryAddress.latitude)
      : merchantLat + 0.01;
    const customerLng = order.deliveryAddress?.longitude
      ? Number.parseFloat(order.deliveryAddress.longitude)
      : merchantLng + 0.01;

    // Courier's real position
    const courierLat = courierPosition?.latitude || null;
    const courierLng = courierPosition?.longitude || null;

    return {
      merchantLat,
      merchantLng,
      customerLat,
      customerLng,
      courierLat,
      courierLng,
    };
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            My Deliveries
          </h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Track and manage your assigned deliveries
          </p>
        </div>
        {/* Courier Location Status */}
        <div className="flex items-center gap-2">
          <CurrentLocationDisplay />
          {locationError && (
            <LocationPicker
              onLocationSelect={async (lat, lng) => {
                try {
                  await courierService.updateLocation(lat, lng);
                  toast.success("Location updated manually");
                } catch (error) {
                  console.error("Failed to update location", error);
                  toast.error("Failed to update location");
                }
              }}
              buttonText="Set Location"
              buttonVariant="outline"
              className="h-8 text-xs"
            />
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
              activeTab === tab.value
                ? "bg-background text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {orders && orders.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">🚚</div>
            <h3 className="text-xl font-semibold mb-2">
              {activeTab === "active"
                ? "No active deliveries"
                : "No completed deliveries"}
            </h3>
            <p className="text-muted-foreground">
              {activeTab === "active"
                ? "Accept orders from the Available Orders page"
                : "Your delivery history will appear here"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 items-start">
          {orders?.map((order, index) => {
            const rowKey = order.id || String(index);
            const isExpanded = expandedOrderId === rowKey;
            const coords = getCoordinates(order);
            const showMap = [
              "ready_for_pickup",
              "picked_up",
              "on_delivery",
            ].includes(order.status);

            return (
              <Card
                key={rowKey}
                className="group flex flex-col h-fit self-start bg-gradient-to-br from-[#1e1e1e] to-[#242424] overflow-hidden hover:shadow-soft transition-all duration-300 ring-1 ring-border/50"
              >
                <CardHeader
                  className="p-3 cursor-pointer hover:bg-white/5 transition-colors relative z-10"
                  onClick={() => toggleOrderExpand(rowKey)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/20 text-primary shadow-inner">
                        <Package className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-100 truncate">
                          Order #{order.orderNumber}
                        </p>
                        <div className="flex items-center gap-1.5 text-[0.65rem] text-muted-foreground mt-0.5">
                          <span className="truncate">
                            {formatDistanceToNow(new Date(order.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-primary shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-500 shrink-0 group-hover:text-primary text-transition" />
                    )}
                  </div>

                  <div className="mt-2 -ml-1">
                    {getStatusBadge(order.status)}
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="p-0 border-t border-white/5 bg-background/30 flex-1 flex flex-col">
                    {/* Map Section */}
                    {showMap && (
                      <div className="h-32 bg-[#121212] relative">
                        <UIMap
                          center={[
                            (coords.merchantLng + coords.customerLng) / 2,
                            (coords.merchantLat + coords.customerLat) / 2,
                          ]}
                          zoom={13}
                        >
                          <MapControls position="top-right" showZoom />
                          {/* Merchant Marker */}
                          <MapMarker
                            longitude={coords.merchantLng}
                            latitude={coords.merchantLat}
                          >
                            <MarkerContent>
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg border-2 border-[#121212]">
                                <Store className="h-3 w-3" />
                              </div>
                            </MarkerContent>
                          </MapMarker>
                          {/* Customer Marker */}
                          <MapMarker
                            longitude={coords.customerLng}
                            latitude={coords.customerLat}
                          >
                            <MarkerContent>
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg border-2 border-[#121212]">
                                <MapPin className="h-3 w-3" />
                              </div>
                            </MarkerContent>
                          </MapMarker>
                          <MapRoute
                            coordinates={[
                              [coords.merchantLng, coords.merchantLat],
                              [coords.customerLng, coords.customerLat],
                            ]}
                            color="#0ea5e9"
                            width={3}
                          />
                        </UIMap>
                        <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10" />
                      </div>
                    )}

                    {/* Order Details */}
                    <div className="p-3 flex-1 flex flex-col gap-3">
                      <div className="flex flex-col gap-2 flex-1">
                        {/* Pickup */}
                        <div className="relative pl-4 border-l-2 border-blue-500/50">
                          <Store className="h-3 w-3 text-blue-400 absolute left-[-0.45rem] top-1 bg-background rounded-full" />
                          <p className="text-[0.6rem] font-black text-blue-400/80 mb-0.5">
                            PICKUP
                          </p>
                          <p className="text-xs font-semibold text-slate-200 line-clamp-1">
                            {order.merchant?.storeName}
                          </p>
                          <p className="text-[0.65rem] text-slate-500 line-clamp-1">
                            {order.merchant?.addressLine}
                          </p>
                        </div>

                        {/* Delivery */}
                        <div className="relative pl-4 border-l-2 border-cyan-500/50">
                          <MapPin className="h-3 w-3 text-cyan-400 absolute left-[-0.45rem] top-1 bg-background rounded-full" />
                          <p className="text-[0.6rem] font-black text-cyan-400/80 mb-0.5">
                            DROPOFF
                          </p>
                          <p className="text-xs font-semibold text-slate-200 line-clamp-1">
                            {order.deliveryAddress?.label || "Customer"}
                          </p>
                          <p className="text-[0.65rem] text-slate-500 line-clamp-2">
                            {order.deliveryAddress?.addressLine}
                          </p>
                        </div>
                      </div>

                      {/* Customer Contact & Order Info */}
                      <div className="flex flex-col gap-2 pt-2 border-t border-white/5">
                        <div className="flex items-center justify-between">
                          <a
                            href={`tel:${order.customer?.phone}`}
                            className="flex items-center gap-1.5 px-2 py-1 rounded bg-white/5 hover:bg-white/10 transition-colors text-primary"
                          >
                            <Phone className="h-3 w-3" />
                            <span className="text-[0.7rem] font-medium">
                              {order.customer?.phone || "No phone"}
                            </span>
                          </a>
                          <div className="text-[0.7rem]">
                            <span className="text-muted-foreground mr-1">
                              Total:
                            </span>
                            <span className="font-bold text-white">
                              {formatRupiah(order.totalAmount)}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col gap-1.5 mt-1 child-w-full">
                          {showMap && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-[0.65rem] bg-white/5 border-white/10 hover:bg-white/10"
                              onClick={() => {
                                const url = `https://www.google.com/maps/dir/?api=1&origin=${coords.merchantLat},${coords.merchantLng}&destination=${coords.customerLat},${coords.customerLng}&travelmode=driving`;
                                window.open(url, "_blank");
                              }}
                            >
                              <ExternalLink className="h-3 w-3 mr-1.5" />
                              Navigate
                            </Button>
                          )}
                          <div className="[&>button]:w-full [&>button]:h-8 [&>button]:text-xs">
                            {getStatusActions(order)}
                          </div>

                          {/* Comms Buttons */}
                          <div className="flex gap-1.5 mt-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartChat(order, "customer_courier");
                              }}
                              disabled={isStartingChat}
                              className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[0.6rem] font-semibold text-cyan-400 border border-cyan-500/20 rounded bg-cyan-500/5 hover:bg-cyan-500/10 transition-colors disabled:opacity-30"
                            >
                              <MessageCircle className="h-3 w-3" />
                              Customer
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartChat(order, "merchant_courier");
                              }}
                              disabled={isStartingChat}
                              className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[0.6rem] font-semibold text-amber-400 border border-amber-500/20 rounded bg-amber-500/5 hover:bg-amber-500/10 transition-colors disabled:opacity-30"
                            >
                              <MessageCircle className="h-3 w-3" />
                              Merchant
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) => !open && closeConfirmDialog()}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                {dialogContent.icon}
              </div>
              <div>
                <DialogTitle>{dialogContent.title}</DialogTitle>
                <DialogDescription className="mt-1 text-sm">
                  {dialogContent.description}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {confirmDialog.type === "deliver" && (
            <div className="py-2">
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-amber-700 dark:text-amber-400">
                <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm">
                  Please verify the customer has received their order before
                  confirming.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeConfirmDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={
                pickupMutation.isPending ||
                onDeliveryMutation.isPending ||
                deliverMutation.isPending
              }
              className={dialogContent.color}
            >
              {(pickupMutation.isPending ||
                onDeliveryMutation.isPending ||
                deliverMutation.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {dialogContent.buttonText}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chat Dialog */}
      <Dialog
        open={chatDialogOpen}
        onOpenChange={(open) => {
          setChatDialogOpen(open);
          if (!open) {
            setActiveChatRoomId(null);
            setActiveChatOrder(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-lg h-[80vh] flex flex-col p-0 bg-[#050505] border-white/10 rounded-none gap-0">
          <DialogTitle className="sr-only">Chat</DialogTitle>
          <div className="px-4 py-3 border-b border-white/10 bg-[#0a0a0a]">
            <h3 className="font-mono text-xs font-bold text-white uppercase tracking-widest">
              Comms Channel
            </h3>
            <p className="font-mono text-[9px] text-zinc-600 uppercase tracking-wider mt-0.5">
              Order #{activeChatOrder?.orderNumber} — Real-time
            </p>
          </div>
          <div className="flex-1 overflow-hidden">
            {activeChatRoomId && user?.id ? (
              <ChatInterface
                roomId={activeChatRoomId}
                currentUserId={user.id}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="animate-spin h-5 w-5 text-zinc-600" />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
