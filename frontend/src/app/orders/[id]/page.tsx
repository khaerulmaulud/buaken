"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  CheckCircle2,
  Clock,
  Loader2,
  MapPin,
  Package,
  Phone,
  ShieldCheck,
  Store,
  Truck,
  User,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { use, useState } from "react";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { chatService } from "@/services/chat.service";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Map as MapUI,
  MarkerContent,
  MarkerPopup,
} from "@/components/ui/map";
import { api } from "@/lib/axios";
import { formatRupiah } from "@/lib/utils";
import type { ApiResponse, Order, Review } from "@/types";
import Navbar from "@/components/layout/Navbar";

// Order status configuration
const ORDER_STATUSES = [
  { status: "pending", label: "Order Placed", icon: Package },
  { status: "confirmed", label: "Confirmed", icon: CheckCircle2 },
  { status: "preparing", label: "Preparing", icon: Store },
  { status: "ready_for_pickup", label: "Ready", icon: Package },
  { status: "picked_up", label: "Picked Up", icon: Truck },
  { status: "on_delivery", label: "On the Way", icon: Truck },
  { status: "delivered", label: "Delivered", icon: CheckCircle2 },
];

function getStatusIndex(status: string): number {
  const idx = ORDER_STATUSES.findIndex((s) => s.status === status);
  return idx >= 0 ? idx : 0;
}

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const { user } = useAuth();
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [activeChatRoomId, setActiveChatRoomId] = useState<string | null>(null);
  const [isStartingChat, setIsStartingChat] = useState(false);

  const handleStartChat = async (
    type: "customer_merchant" | "customer_courier",
  ) => {
    if (!orderData?.id) return;
    try {
      setIsStartingChat(true);
      const res = await chatService.startRoom(orderData.id, type);
      setActiveChatRoomId(res.room.id);
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

  const { data: orderData, isLoading } = useQuery({
    queryKey: ["order", id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Order>>(`/orders/${id}`);
      return res.data.data;
    },
    refetchInterval: 10000,
  });

  const confirmDeliveryMutation = useMutation({
    mutationFn: async () => {
      // Customer confirms they received the delivery
      const res = await api.patch<ApiResponse<Order>>(
        `/orders/${id}/confirm-delivery`,
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      toast.success("Delivery confirmed! Thank you for your order.");
      setConfirmDialogOpen(false);
    },
    onError: () => {
      toast.error("Failed to confirm delivery. Please try again.");
    },
  });

  const cancelOrderMutation = useMutation({
    mutationFn: async (reason: string) => {
      const res = await api.patch<ApiResponse<Order>>(`/orders/${id}/cancel`, {
        reason,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order", id] });
      toast.success("Order cancelled successfully!");
      setCancelDialogOpen(false);
      setCancelReason("");
    },
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message ||
          "Failed to cancel order. Please try again.",
      );
    },
  });

  const order = orderData;

  // Fetch merchant reviews
  const { data: reviewsData } = useQuery({
    queryKey: ["reviews", "merchant", order?.merchantId],
    queryFn: async () => {
      if (!order?.merchantId) return { reviews: [], meta: { total: 0 } };
      const res = await api.get<{
        success: boolean;
        data: Review[];
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        meta: any;
      }>(`/reviews/merchant/${order.merchantId}?limit=5`);
      return { reviews: res.data.data, meta: res.data.meta };
    },
    enabled: !!order?.merchantId,
  });

  // Create review mutation
  const createReviewMutation = useMutation({
    mutationFn: async (data: { rating: number; comment?: string }) => {
      const res = await api.post<ApiResponse<Review>>("/reviews", {
        orderId: id,
        ...data,
      });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["reviews", "merchant", order?.merchantId],
      });
      toast.success("Review submitted successfully!");
      setReviewDialogOpen(false);
    },
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message ||
          "Failed to submit review. Please try again.",
      );
    },
  });

  if (isLoading)
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-primary" />
      </div>
    );

  if (!order)
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold">Order not found</h1>
          <Link href="/orders">
            <Button className="mt-4">Back to Orders</Button>
          </Link>
        </div>
      </div>
    );

  const currentStatusIndex = getStatusIndex(order.status);
  const isDelivered = order.status === "delivered";
  const isCancelled = order.status === "cancelled";
  const canConfirmDelivery = order.status === "on_delivery";
  const canCancel = ["pending", "confirmed"].includes(order.status);

  // MapUI coordinates
  const merchantLat = order.merchant?.latitude
    ? Number.parseFloat(order.merchant.latitude)
    : -6.2088; // Fallback to Jakarta if no coordinates
  const merchantLng = order.merchant?.longitude
    ? Number.parseFloat(order.merchant.longitude)
    : 106.8456; // Fallback to Jakarta if no coordinates
  const customerLat = order.deliveryAddress?.latitude
    ? Number.parseFloat(order.deliveryAddress.latitude)
    : -6.22;
  const customerLng = order.deliveryAddress?.longitude
    ? Number.parseFloat(order.deliveryAddress.longitude)
    : 106.85;

  const showMap = ["picked_up", "on_delivery", "delivered"].includes(
    order.status,
  );

  return (
    <div className="min-h-screen bg-background pb-20">
      <Navbar />
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-4xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              Order #{order.orderNumber || order.id.slice(0, 8)}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Placed{" "}
              {formatDistanceToNow(new Date(order.createdAt), {
                addSuffix: true,
              })}
            </p>
          </div>
          {isDelivered && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 dark:bg-green-950/30 px-4 py-2 rounded-full">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-semibold">Delivered</span>
            </div>
          )}
          {isCancelled && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 dark:bg-red-950/30 px-4 py-2 rounded-full">
              <XCircle className="h-5 w-5" />
              <span className="font-semibold">Cancelled</span>
            </div>
          )}
        </div>

        {/* Order Status Stepper */}
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-primary/5 to-transparent pb-4">
            <CardTitle className="text-lg">Order Status</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="relative">
              {/* Progress Line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-muted" />
              <div
                className="absolute left-5 top-0 w-0.5 bg-primary transition-all duration-500"
                style={{
                  height: `${(currentStatusIndex / (ORDER_STATUSES.length - 1)) * 100}%`,
                }}
              />

              {/* Status Items */}
              <div className="space-y-6">
                {ORDER_STATUSES.map((statusItem, index) => {
                  const isCompleted = index <= currentStatusIndex;
                  const isCurrent = index === currentStatusIndex;
                  const Icon = statusItem.icon;

                  return (
                    <div
                      key={statusItem.status}
                      className="relative flex items-start gap-4 pl-2"
                    >
                      <div
                        className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full transition-all ${
                          isCompleted
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        } ${isCurrent ? "ring-4 ring-primary/20" : ""}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 pt-0.5">
                        <p
                          className={`font-medium ${
                            isCompleted
                              ? "text-foreground"
                              : "text-muted-foreground"
                          }`}
                        >
                          {statusItem.label}
                        </p>
                        {isCurrent && !isDelivered && (
                          <p className="text-sm text-muted-foreground mt-0.5">
                            Current status
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Confirm Delivery Button */}
            {canConfirmDelivery && (
              <div className="mt-6 pt-6 border-t">
                <Button
                  onClick={() => setConfirmDialogOpen(true)}
                  className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"
                  size="lg"
                >
                  <ShieldCheck className="mr-2 h-5 w-5" />
                  Confirm Delivery Received
                </Button>
                <p className="text-xs text-muted-foreground text-center mt-2">
                  Press this when you have received your order from the courier
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delivery MapUI */}
        {showMap && (
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                Delivery Tracking
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-64 md:h-80">
                <MapUI
                  center={[
                    (merchantLng + customerLng) / 2,
                    (merchantLat + customerLat) / 2,
                  ]}
                  zoom={13}
                >
                  <MapControls position="top-right" showZoom />

                  {/* Merchant Marker */}
                  <MapMarker longitude={merchantLng} latitude={merchantLat}>
                    <MarkerContent>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg border-2 border-white">
                        <Store className="h-5 w-5" />
                      </div>
                    </MarkerContent>
                    <MarkerPopup>
                      <div className="p-2 min-w-[150px]">
                        <p className="font-semibold">
                          {order.merchant?.storeName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Pickup Location
                        </p>
                      </div>
                    </MarkerPopup>
                  </MapMarker>

                  {/* Customer Marker */}
                  <MapMarker longitude={customerLng} latitude={customerLat}>
                    <MarkerContent>
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 text-white shadow-lg border-2 border-white">
                        <MapPin className="h-5 w-5" />
                      </div>
                    </MarkerContent>
                    <MarkerPopup>
                      <div className="p-2 min-w-[150px]">
                        <p className="font-semibold">Delivery Location</p>
                        <p className="text-xs text-muted-foreground">
                          {order.deliveryAddress?.addressLine}
                        </p>
                      </div>
                    </MarkerPopup>
                  </MapMarker>

                  {/* Route Line */}
                  <MapRoute
                    coordinates={[
                      [merchantLng, merchantLat],
                      [customerLng, customerLat],
                    ]}
                    color="#0ea5e9"
                    width={4}
                  />
                </MapUI>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Order Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Merchant Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Store className="h-4 w-4" />
                Restaurant
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold text-lg">
                {order.merchant?.storeName}
              </p>
              {order.merchant?.addressLine && (
                <p className="text-sm text-muted-foreground mt-1">
                  {order.merchant.addressLine}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Delivery Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">
                {order.deliveryAddress?.label || "Delivery Location"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {order.deliveryAddress?.addressLine},{" "}
                {order.deliveryAddress?.city}
              </p>
              {order.deliveryNotes && (
                <p className="text-sm italic mt-2 text-muted-foreground">
                  Note: {order.deliveryNotes}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Courier Info */}
          {order.courier && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Courier
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">{order.courier.name}</p>
                    {order.courier.phone && (
                      <a
                        href={`tel:${order.courier.phone}`}
                        className="text-sm text-primary flex items-center gap-1"
                      >
                        <Phone className="h-3 w-3" />
                        {order.courier.phone}
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Payment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold capitalize">
                {order.paymentMethod?.replace("_", " ") || "Cash on Delivery"}
              </p>
              <p
                className={`text-sm mt-1 ${
                  order.paymentStatus === "paid"
                    ? "text-green-600"
                    : "text-amber-600"
                }`}
              >
                {order.paymentStatus === "paid" ? "Paid" : "Pending Payment"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Order Items */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Order Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(order.orderItems || order.items)?.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center py-2 border-b last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center bg-primary/10 text-primary text-sm font-bold rounded-full">
                    {item.quantity}x
                  </span>
                  <span className="font-medium">
                    {item.menuItem?.name || "Unknown Item"}
                  </span>
                </div>
                <span className="font-semibold">
                  {formatRupiah(item.price * item.quantity)}
                </span>
              </div>
            ))}

            <div className="pt-4 mt-4 border-t space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatRupiah(order.subtotal || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Delivery Fee</span>
                <span>{formatRupiah(order.deliveryFee || 0)}</span>
              </div>
              {order.serviceFee > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Service Fee</span>
                  <span>{formatRupiah(order.serviceFee)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold pt-2 border-t">
                <span>Total</span>
                <span className="text-primary">
                  {formatRupiah(order.totalAmount)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          {isDelivered &&
            order.paymentMethod === "cash" &&
            order.paymentStatus !== "paid" && (
              <Button
                onClick={() => setConfirmDialogOpen(true)}
                className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
              >
                <ShieldCheck className="mr-2 h-4 w-4" />
                Confirm Delivery Received
              </Button>
            )}

          {canCancel && (
            <Button
              variant="destructive"
              className="flex-1"
              onClick={() => setCancelDialogOpen(true)}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Cancel Order
            </Button>
          )}

          <Link href="/" className="flex-1">
            <Button variant="outline" className="w-full">
              Continue Shopping
            </Button>
          </Link>
          <Link href="/orders" className="flex-1">
            <Button className="w-full">View All Orders</Button>
          </Link>
        </div>

        {/* Chat Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
          <Button
            variant="secondary"
            onClick={() => handleStartChat("customer_merchant")}
            disabled={isStartingChat}
            className="flex-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            Chat with Merchant
          </Button>

          {order.courier && (
            <Button
              variant="secondary"
              onClick={() => handleStartChat("customer_courier")}
              disabled={isStartingChat}
              className="flex-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Chat with Courier
            </Button>
          )}
        </div>
      </div>

      {/* Confirm Delivery Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-teal-500 text-white">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle>Confirm Delivery</DialogTitle>
                <DialogDescription className="mt-1">
                  Have you received your order from the courier?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4">
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg text-amber-700 dark:text-amber-400 text-sm">
              <p className="font-medium mb-1">Important:</p>
              <p>
                Only confirm if you have physically received your order and
                verified all items are correct. This action cannot be undone.
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
            >
              Not Yet
            </Button>
            <Button
              onClick={() => confirmDeliveryMutation.mutate()}
              disabled={confirmDeliveryMutation.isPending}
              className="bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600"
            >
              {confirmDeliveryMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Yes, I Received It
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Write Review Dialog */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
            <DialogDescription>
              Share your experience with {order?.merchant?.storeName}
            </DialogDescription>
          </DialogHeader>
          <ReviewForm
            onSubmit={(data) => createReviewMutation.mutate(data)}
            isLoading={createReviewMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Chat Dialog */}
      <Dialog
        open={chatDialogOpen}
        onOpenChange={(open) => {
          setChatDialogOpen(open);
          if (!open) setActiveChatRoomId(null);
        }}
      >
        <DialogContent className="sm:max-w-lg h-[80vh] flex flex-col p-0 bg-[#050505] border-white/10 rounded-none gap-0">
          <DialogTitle className="sr-only">Chat</DialogTitle>
          <div className="px-4 py-3 border-b border-white/10 bg-[#0a0a0a]">
            <h3 className="font-mono text-xs font-bold text-white uppercase tracking-widest">
              Comms Channel
            </h3>
            <p className="font-mono text-[9px] text-zinc-600 uppercase tracking-wider mt-0.5">
              Order #{order.orderNumber} — Real-time
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

      {/* Cancel Order Dialog */}
      <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <XCircle className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle>Cancel Order</DialogTitle>
                <DialogDescription className="mt-1">
                  Are you sure you want to cancel this order?
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-2 space-y-3">
            <p className="text-sm text-muted-foreground">
              Please provide a reason for cancelling this order (optional):
            </p>
            <textarea
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 min-h-[100px]"
              placeholder="e.g., I ordered the wrong item..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setCancelDialogOpen(false)}
            >
              Keep Order
            </Button>
            <Button
              variant="destructive"
              onClick={() => cancelOrderMutation.mutate(cancelReason)}
              disabled={cancelOrderMutation.isPending}
            >
              {cancelOrderMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              Yes, Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
