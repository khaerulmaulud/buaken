"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Loader2,
  MapPin,
  Navigation2,
  Package,
  Store,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
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
  MapMarker,
  MapRoute,
  MarkerContent,
  Map as UIMap,
} from "@/components/ui/map";
import { api } from "@/lib/axios";
import { formatRupiah } from "@/lib/utils";
import type { ApiResponse, Order, PaginatedResponse } from "@/types";

export default function AvailableOrdersPage() {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  // Fetch pending orders (not yet accepted by any courier)
  const { data: orders, isLoading } = useQuery({
    queryKey: ["courier-available-orders"],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Order>>(
        "/courier/available-orders",
      );
      return res.data.data;
    },
    refetchInterval: 15000, // Refresh every 15 seconds for real-time updates
  });

  // Accept order mutation
  const acceptMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await api.post<ApiResponse<Order>>(
        `/courier/orders/${orderId}/accept`,
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courier-available-orders"] });
      queryClient.invalidateQueries({ queryKey: ["courier-orders"] });
      toast.success("Order accepted! The merchant will start preparing.");
      setConfirmDialogOpen(false);
      setSelectedOrder(null);
    },
    onError: () => {
      toast.error(
        "Failed to accept order. It may have been taken by another courier.",
      );
    },
  });

  const openConfirmDialog = (order: Order) => {
    setSelectedOrder(order);
    setConfirmDialogOpen(true);
  };

  const toggleOrderExpand = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  // Get coordinates for map preview
  const getCoordinates = (order: Order) => {
    const merchantLat = order.merchant?.latitude
      ? Number.parseFloat(order.merchant.latitude)
      : -6.2088; // Fallback to Jakarta if no coordinates
    const merchantLng = order.merchant?.longitude
      ? Number.parseFloat(order.merchant.longitude)
      : 106.8456; // Fallback to Jakarta if no coordinates
    const customerLat = order.deliveryAddress?.latitude
      ? Number.parseFloat(order.deliveryAddress.latitude)
      : merchantLat + 0.015; // Fallback near merchant
    const customerLng = order.deliveryAddress?.longitude
      ? Number.parseFloat(order.deliveryAddress.longitude)
      : merchantLng + 0.01; // Fallback near merchant

    return { merchantLat, merchantLng, customerLat, customerLng };
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
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
          Available Orders
        </h1>
        <p className="text-muted-foreground">
          Accept an order to start earning. First come, first served!
        </p>
      </div>

      {/* Refresh indicator */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <span>Auto-refreshing every 15 seconds</span>
      </div>

      {/* Orders List */}
      {orders && orders.length === 0 ? (
        <Card className="glass-card">
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold mb-2">No orders available</h3>
            <p className="text-muted-foreground">
              Check back soon for new delivery opportunities!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 items-start">
          {orders?.map((order, index) => {
            const rowKey = order.id || String(index);
            const isExpanded = expandedOrderId === rowKey;
            const coords = getCoordinates(order);

            return (
              <Card
                key={rowKey}
                className="group flex flex-col h-fit self-start bg-gradient-to-br from-[#1e1e1e] to-[#242424] overflow-hidden hover:shadow-soft transition-all duration-300 ring-1 ring-border/50 hover:ring-cyan-500/40"
              >
                <CardHeader
                  className="p-3 cursor-pointer hover:bg-white/5 transition-colors relative z-10"
                  onClick={() => toggleOrderExpand(rowKey)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-inner">
                        <Package className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-100 truncate">
                          {order.merchant?.storeName}
                        </p>
                        <div className="flex items-center gap-1.5 text-[0.65rem] text-muted-foreground mt-0.5">
                          <span className="font-mono bg-white/10 px-1 rounded text-slate-300">
                            #{order.orderNumber}
                          </span>
                          <span className="w-1 h-1 rounded-full bg-slate-600" />
                          <span className="truncate">
                            {formatDistanceToNow(new Date(order.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-cyan-400 shrink-0" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-500 shrink-0 group-hover:text-cyan-400 text-transition" />
                    )}
                  </div>

                  {/* Earnings Bar Prominent */}
                  <div className="mt-3 flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 px-2 py-1.5 rounded-md">
                    <span className="text-[0.65rem] font-bold text-emerald-500 tracking-wider">
                      EARNINGS
                    </span>
                    <span className="font-black text-sm text-emerald-400 flex items-center gap-0.5">
                      {formatRupiah(order.deliveryFee)}
                    </span>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent className="p-0 border-t border-white/5 bg-background/30 flex-1 flex flex-col">
                    {/* Map Preview */}
                    <div className="h-32 bg-[#121212] relative">
                      <UIMap
                        center={[
                          (coords.merchantLng + coords.customerLng) / 2,
                          (coords.merchantLat + coords.customerLat) / 2,
                        ]}
                        zoom={12}
                      >
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
                          width={2}
                        />
                      </UIMap>
                      <div className="absolute inset-0 pointer-events-none ring-1 ring-inset ring-white/10" />
                    </div>

                    {/* Compact Order Details */}
                    <div className="p-3 flex-1 flex flex-col gap-2">
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
                    </div>

                    <div className="p-3 pt-0 mt-auto">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          openConfirmDialog(order);
                        }}
                        className="w-full h-8 text-xs bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white shadow-md border-0"
                      >
                        <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />
                        Accept Offer
                      </Button>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Accept Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 text-white">
                <Navigation2 className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle>Accept This Order?</DialogTitle>
                <DialogDescription className="mt-1">
                  Order #{selectedOrder?.orderNumber}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="p-4 rounded-lg bg-muted/50 space-y-3">
              <div className="flex items-center gap-2">
                <Store className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {selectedOrder?.merchant?.storeName}
                </span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-sm">
                  {selectedOrder?.deliveryAddress?.addressLine},{" "}
                  {selectedOrder?.deliveryAddress?.city}
                </span>
              </div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <DollarSign className="h-4 w-4" />
                <span className="font-semibold">
                  Earn {formatRupiah(selectedOrder?.deliveryFee || 0)}
                </span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              By accepting this order, you agree to pick it up from the merchant
              once it's ready and deliver it to the customer.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedOrder && acceptMutation.mutate(selectedOrder.id)
              }
              disabled={acceptMutation.isPending}
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
            >
              {acceptMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Accept Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
