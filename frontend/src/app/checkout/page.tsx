"use client";

import { useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { LocationPicker } from "@/components/LocationPicker";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/axios";
import { formatRupiah } from "@/lib/utils";
import type { ApiResponse, Order } from "@/types";

function CheckoutContent() {
  const { items, totalPrice, merchant, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated && !user && typeof window !== "undefined") {
      router.push("/login");
    } else if (items.length === 0) {
      router.push("/");
    }
  }, [isAuthenticated, user, items, router]);

  if (!isAuthenticated && !user) return null;
  if (items.length === 0) return null;

  const handlePlaceOrder = async () => {
    if (!address) {
      toast.error("Please enter a delivery address");
      return;
    }

    setIsSubmitting(true);
    try {
      const orderItems = items.map((item) => ({
        menuItemId: item.menuItem.id,
        quantity: item.quantity,
      }));

      const res = await api.post<ApiResponse<Order>>("/orders", {
        merchantId: merchant?.id,
        items: orderItems,
        deliveryAddress: address,
        latitude: location?.lat,
        longitude: location?.lng,
        paymentMethod: "cash",
      });

      if (res.data.success) {
        toast.success("Order placed successfully!");
        clearCart();
        router.push(`/orders/${res.data.data.id}`);
      }
    } catch (error) {
      console.error("Failed to place order", error);
      toast.error("Failed to place order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deliveryFee = Number(merchant?.deliveryFee) || 0;
  const grandTotal = totalPrice + deliveryFee;

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto px-4 lg:px-8 py-6 md:py-10 w-full">
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-8">
          Checkout
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
          {/* Left: Address & Payment */}
          <div className="lg:col-span-7 space-y-6">
            {/* Delivery Address */}
            <div className="glass-card rounded-2xl p-5 md:p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg bg-[#FF8C00]/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#FF8C00]">
                    location_on
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white">
                  Delivery Address
                </h2>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label
                    htmlFor="address"
                    className="text-sm font-medium text-slate-300 ml-1"
                  >
                    Address Details
                  </label>
                  <input
                    id="address"
                    placeholder="Street, Building, Floor, etc."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3.5 px-4 text-white focus:outline-none focus:ring-2 focus:ring-[#FF8C00]/50 focus:border-[#FF8C00] transition-all placeholder:text-slate-600 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium text-slate-300 ml-1 block">
                    Pin Location on Map
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <LocationPicker
                      onLocationSelect={(lat, lng) => {
                        setLocation({ lat, lng });
                        toast.success("Location pinned!");
                      }}
                      initialLat={location?.lat}
                      initialLng={location?.lng}
                      buttonText={
                        location ? "Change Location" : "Set Delivery Location"
                      }
                    />
                    {location && (
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <span className="material-symbols-outlined text-green-500 text-sm">
                          check_circle
                        </span>
                        {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                      </p>
                    )}
                  </div>
                  {!location && (
                    <p className="text-xs text-amber-400 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">
                        warning
                      </span>
                      Please set your location on the map for accurate delivery.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="glass-card rounded-2xl p-5 md:p-6">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-lg bg-[#FF8C00]/15 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#FF8C00]">
                    payments
                  </span>
                </div>
                <h2 className="text-lg font-bold text-white">Payment Method</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="glass-panel rounded-xl p-4 border-2 border-[#FF8C00]/50 bg-[#FF8C00]/5 cursor-pointer flex items-center gap-3">
                  <span className="material-symbols-outlined text-[#FF8C00]">
                    local_atm
                  </span>
                  <div>
                    <p className="text-white font-semibold text-sm">
                      Cash on Delivery
                    </p>
                    <p className="text-slate-500 text-xs">
                      Pay when food arrives
                    </p>
                  </div>
                </div>
                <div className="glass-panel rounded-xl p-4 border border-white/10 opacity-40 cursor-not-allowed flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-500">
                    account_balance_wallet
                  </span>
                  <div>
                    <p className="text-slate-300 font-semibold text-sm">
                      E-Wallet
                    </p>
                    <p className="text-slate-500 text-xs">Coming Soon</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 glass-panel rounded-2xl p-6 shadow-xl">
              <h2 className="text-xl font-bold text-white border-b border-white/10 pb-4 mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#FF8C00]">
                  receipt_long
                </span>
                Order Summary
              </h2>

              {merchant && (
                <p className="text-sm text-slate-400 mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-500 text-base">
                    storefront
                  </span>
                  {merchant.storeName}
                </p>
              )}

              <div className="space-y-2.5 mb-4 max-h-52 overflow-y-auto hide-scrollbar">
                {items.map((item) => (
                  <div
                    key={item.menuItem.id}
                    className="flex justify-between items-center text-sm"
                  >
                    <span className="text-slate-300 truncate pr-3">
                      <span className="text-white font-semibold">
                        {item.quantity}x
                      </span>{" "}
                      {item.menuItem.name}
                    </span>
                    <span className="text-white font-medium shrink-0">
                      {formatRupiah(item.quantity * item.menuItem.price)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-white/10 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Subtotal</span>
                  <span className="text-white">{formatRupiah(totalPrice)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-400">
                  <span>Delivery Fee</span>
                  <span className="text-white">
                    {formatRupiah(deliveryFee)}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-lg text-white pt-2 border-t border-white/10">
                  <span>Total</span>
                  <span className="text-[#FF8C00]">
                    {formatRupiah(grandTotal)}
                  </span>
                </div>
              </div>

              <button
                className="w-full mt-6 bg-[#FF8C00] hover:bg-[#e07b00] text-white font-bold py-4 rounded-xl shadow-glow hover:shadow-glow-lg transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
                type="button"
              >
                {isSubmitting ? (
                  <span className="material-symbols-outlined animate-spin">
                    progress_activity
                  </span>
                ) : (
                  <>
                    Place Order
                    <span className="material-symbols-outlined text-lg">
                      check_circle
                    </span>
                  </>
                )}
              </button>

              <p className="text-center text-xs text-slate-500 mt-3 flex items-center justify-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-green-500">
                  lock
                </span>
                Secure checkout powered by FoodDash
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-[#121212] flex flex-col" />}
    >
      <CheckoutContent />
    </Suspense>
  );
}
