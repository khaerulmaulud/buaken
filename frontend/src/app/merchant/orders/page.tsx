"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChefHat,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Truck,
  User,
  Utensils,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { chatService } from "@/services/chat.service";
import { ChatInterface } from "@/components/chat/ChatInterface";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "@/lib/axios";
import { formatRupiah } from "@/lib/utils";
import type {
  ApiResponse,
  Order,
  OrderStatus,
  PaginatedResponse,
} from "@/types";

// Tabs for merchant order flow
const ORDER_TABS = [
  { value: "new", label: "New Orders", statuses: ["confirmed", "pending"] },
  {
    value: "active",
    label: "Active Orders",
    statuses: ["preparing", "ready_for_pickup", "on_delivery", "picked_up"],
  },
  {
    value: "completed",
    label: "Completed",
    statuses: ["delivered"],
  },
];

export default function MerchantOrdersPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("new");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    type: "prepare" | "ready" | null;
  }>({ open: false, type: null });

  // Chat state
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [activeChatRoomId, setActiveChatRoomId] = useState<string | null>(null);
  const [activeChatOrder, setActiveChatOrder] = useState<Order | null>(null);
  const [isStartingChat, setIsStartingChat] = useState(false);

  const handleStartChat = async (
    order: Order,
    type: "customer_merchant" | "merchant_courier",
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

  const currentTab =
    ORDER_TABS.find((t) => t.value === activeTab) || ORDER_TABS[0];

  // Fetch orders based on active tab
  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["merchant-orders", activeTab],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Order>>("/merchant/orders", {
        params: { status: currentTab.statuses.join(",") },
      });
      return res.data.data;
    },
  });

  // Start preparing order
  const prepareMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await api.patch<ApiResponse<Order>>(
        `/merchant/orders/${orderId}/status`,
        { status: "preparing" },
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant-orders"] });
      toast.success("Order is now being prepared!");
      closeActionDialog();
    },
    onError: () => toast.error("Failed to update order status"),
  });

  // Mark order as ready
  const readyMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await api.patch<ApiResponse<Order>>(
        `/merchant/orders/${orderId}/status`,
        { status: "ready_for_pickup" },
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant-orders"] });
      toast.success("Order marked as ready for pickup!");
      closeActionDialog();
    },
    onError: () => toast.error("Failed to update order status"),
  });

  const closeActionDialog = () => {
    setActionDialog({ open: false, type: null });
    setSelectedOrder(null);
  };

  const openActionDialog = (order: Order, type: "prepare" | "ready") => {
    setSelectedOrder(order);
    setActionDialog({ open: true, type });
  };

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const handleConfirmAction = () => {
    if (!selectedOrder) return;
    if (actionDialog.type === "prepare") {
      prepareMutation.mutate(selectedOrder.id);
    } else if (actionDialog.type === "ready") {
      readyMutation.mutate(selectedOrder.id);
    }
  };

  const getStatusBadge = (status: OrderStatus) => {
    const config: Record<string, { color: string; label: string }> = {
      confirmed: {
        color:
          "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300",
        label: "New Order",
      },
      preparing: {
        color:
          "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300",
        label: "Preparing",
      },
      ready_for_pickup: {
        color:
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300",
        label: "Ready",
      },
      picked_up: {
        color:
          "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300",
        label: "Picked Up",
      },
      on_delivery: {
        color:
          "bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300",
        label: "On Delivery",
      },
      delivered: {
        color:
          "bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300",
        label: "Delivered",
      },
    };
    const { color, label } = config[status] || {
      color: "bg-gray-100",
      label: status,
    };
    return <Badge className={`${color} font-semibold`}>{label}</Badge>;
  };

  const getOrderActions = (order: Order) => {
    switch (order.status) {
      case "confirmed":
        return (
          <Button
            onClick={() => openActionDialog(order, "prepare")}
            className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            <ChefHat className="mr-2 h-4 w-4" />
            Start Preparing
          </Button>
        );
      case "preparing":
        return (
          <Button
            onClick={() => openActionDialog(order, "ready")}
            className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
          >
            <Package className="mr-2 h-4 w-4" />
            Mark Ready
          </Button>
        );
      case "ready_for_pickup":
        return (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 animate-pulse" />
            <span>Waiting for courier pickup...</span>
          </div>
        );
      default:
        return null;
    }
  };

  const orders = ordersData || [];

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
        <span className="font-mono text-xs uppercase tracking-widest text-zinc-500">
          Querying Order Stream...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-white/10 pb-6 flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-widest uppercase mb-1">
            Order Queue
          </h1>
          <p className="text-xs text-zinc-500 font-mono tracking-wider uppercase">
            Active Processing Pipeline
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 border border-white/10 bg-[#0a0a0a] rounded-sm overflow-x-auto">
        {ORDER_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`px-6 py-3 font-bold text-[10px] sm:text-xs tracking-widest uppercase transition-colors rounded-sm whitespace-nowrap flex-1 ${
              activeTab === tab.value
                ? "bg-white text-black"
                : "text-zinc-500 hover:text-white hover:bg-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="border border-white/10 bg-[#0a0a0a] p-16 text-center rounded-sm">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            {activeTab === "new"
              ? "// Awaiting new incoming transmissions..."
              : activeTab === "active"
                ? "// No active processing operations"
                : "// Transaction history empty"}
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-start">
          {orders.map((order) => {
            const rowKey = order.id || order.orderNumber;
            const isExpanded = expandedOrderId === rowKey;

            return (
              <div
                key={rowKey}
                className="bg-[#050505] border border-white/10 p-1 flex flex-col h-fit hover:border-amber-500/50 transition-colors"
              >
                {/* Kitchen Chit Header */}
                <button
                  type="button"
                  className="w-full text-left p-3 bg-[#0a0a0a] border border-white/5 cursor-pointer flex flex-col group relative"
                  onClick={() => toggleOrderExpand(rowKey)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      toggleOrderExpand(rowKey);
                    }
                  }}
                  tabIndex={0}
                >
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-amber-500" />
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-xl text-white tracking-tighter">
                        #{order.orderNumber}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-zinc-500 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-zinc-700 group-hover:text-amber-500 shrink-0" />
                    )}
                  </div>

                  <div className="flex items-end justify-between font-mono text-[10px] uppercase tracking-wider">
                    <span className="text-zinc-500">
                      {formatDistanceToNow(new Date(order.createdAt))} ago
                    </span>
                    <span
                      className={`px-2 py-0.5 border ${
                        order.status === "confirmed"
                          ? "border-blue-500/30 text-blue-500"
                          : order.status === "preparing"
                            ? "border-amber-500/30 text-amber-500"
                            : order.status === "ready_for_pickup"
                              ? "border-emerald-500/30 text-emerald-500"
                              : "border-zinc-500/30 text-zinc-500"
                      }`}
                    >
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-3 mt-1 bg-[#0a0a0a] border border-white/5 flex flex-col gap-4 font-mono">
                    {/* Items */}
                    <div className="border border-white/10 p-2">
                      <p className="text-[9px] font-black text-zinc-600 mb-2 tracking-widest uppercase border-b border-white/5 pb-1">
                        Consumables Auth
                      </p>
                      <ScrollArea className="h-24 w-full pr-2">
                        <div className="space-y-2">
                          {(order.orderItems || order.items)?.map(
                            (item, idx) => (
                              <div
                                key={item.id || idx}
                                className="flex justify-between items-start text-xs leading-tight"
                              >
                                <span className="font-bold text-amber-500 mr-2">
                                  {item.quantity}x
                                </span>
                                <span className="text-zinc-300 flex-1 text-right line-clamp-2 uppercase">
                                  {item.menuItem?.name || "Unknown"}
                                </span>
                              </div>
                            ),
                          )}
                        </div>
                      </ScrollArea>
                      {order.deliveryNotes && (
                        <div className="mt-2 pt-2 border-t border-dashed border-white/10">
                          <p className="text-[10px] text-amber-400 capitalize">
                            * {order.deliveryNotes}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Routing Info */}
                    <div className="border border-white/10 p-2 text-[10px] flex flex-col gap-2">
                      <div className="flex items-start gap-2">
                        <User className="h-3 w-3 text-zinc-500 shrink-0" />
                        <span className="text-zinc-300 uppercase truncate">
                          {order.customer?.name || "Customer Data Missing"}
                        </span>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="h-3 w-3 text-zinc-500 shrink-0" />
                        <span className="text-zinc-400 uppercase line-clamp-2 leading-tight pr-1">
                          {order.deliveryAddress?.addressLine || "Loc missing"}
                        </span>
                      </div>
                      {order.courier && (
                        <div className="flex items-center gap-2 border-t border-dashed border-white/10 pt-2 mt-1">
                          <Truck className="h-3 w-3 text-emerald-500" />
                          <span className="text-emerald-500 uppercase font-bold truncate">
                            Logistics: {order.courier.name}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Comms Buttons */}
                    <div className="border border-white/10 p-2 flex gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartChat(order, "customer_merchant");
                        }}
                        disabled={isStartingChat}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[9px] font-mono font-bold uppercase tracking-wider text-cyan-500 border border-cyan-500/20 hover:bg-cyan-500/10 transition-colors disabled:opacity-30"
                      >
                        <MessageCircle className="h-3 w-3" />
                        Customer
                      </button>
                      {order.courier && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartChat(order, "merchant_courier");
                          }}
                          disabled={isStartingChat}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/10 transition-colors disabled:opacity-30"
                        >
                          <MessageCircle className="h-3 w-3" />
                          Courier
                        </button>
                      )}
                    </div>

                    {/* Total & Actions */}
                    <div className="pt-2">
                      <div className="flex justify-between items-end mb-3">
                        <span className="text-[10px] text-zinc-500 uppercase tracking-widest">
                          Auth Net
                        </span>
                        <span className="text-sm font-black text-white">
                          {formatRupiah(order.totalAmount)}
                        </span>
                      </div>
                      <div className="w-full">{getOrderActions(order)}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog
        open={actionDialog.open}
        onOpenChange={(open) => !open && closeActionDialog()}
      >
        <DialogContent className="bg-[#0a0a0a] border-white/10 rounded-sm">
          <DialogHeader className="border-b border-white/10 pb-4 mb-4">
            <DialogTitle className="uppercase font-black text-white tracking-widest text-sm flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-500" />
              {actionDialog.type === "prepare"
                ? "Init Preparation Protocol"
                : "Mark Readiness"}
            </DialogTitle>
          </DialogHeader>

          <div className="font-mono text-xs text-zinc-400 leading-relaxed uppercase">
            {actionDialog.type === "prepare" ? (
              <p>
                Confirm execution for Order #{selectedOrder?.orderNumber}.
                Target client and logistics operator will receive real-time
                telemetry updates.
              </p>
            ) : (
              <div className="space-y-3">
                <p>
                  Execution complete? Signaling logistics grid for payload
                  extraction of Order #{selectedOrder?.orderNumber}.
                </p>
                <div className="p-3 border border-amber-500/20 bg-amber-500/5 text-amber-500">
                  <p className="text-[10px] font-bold">
                    Warning: Verify structural integrity of all payload items
                    before broadcast.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-3 sm:gap-0 pt-4 border-t border-white/10 mt-4">
            <Button
              variant="ghost"
              className="rounded-none font-mono text-xs uppercase"
              onClick={closeActionDialog}
            >
              Abort
            </Button>
            <Button
              onClick={handleConfirmAction}
              disabled={prepareMutation.isPending || readyMutation.isPending}
              className={`rounded-none font-bold uppercase tracking-widest text-xs h-10 ${
                actionDialog.type === "prepare"
                  ? "bg-amber-500 hover:bg-amber-400 text-black"
                  : "bg-emerald-500 hover:bg-emerald-400 text-black"
              }`}
            >
              {(prepareMutation.isPending || readyMutation.isPending) && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {actionDialog.type === "prepare" ? "Execute" : "Confirm Ready"}
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
