"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo } from "react";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { Pagination } from "@/components/ui/Pagination";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/axios";
import { formatRupiah } from "@/lib/utils";
import type { Order, PaginatedResponse } from "@/types";

const statusConfig: Record<
  string,
  { label: string; color: string; bg: string; border: string; icon: string }
> = {
  pending: {
    label: "Pending",
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    icon: "hourglass_top",
  },
  confirmed: {
    label: "Confirmed",
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    icon: "check_circle",
  },
  preparing: {
    label: "Preparing",
    color: "text-orange-400",
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    icon: "skillet",
  },
  ready_for_pickup: {
    label: "Ready",
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
    icon: "package_2",
  },
  picked_up: {
    label: "Picked Up",
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
    icon: "local_shipping",
  },
  on_delivery: {
    label: "On Delivery",
    color: "text-[#FF8C00]",
    bg: "bg-[#FF8C00]/10",
    border: "border-[#FF8C00]/20",
    icon: "moped",
  },
  delivered: {
    label: "Delivered",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    icon: "check",
  },
  cancelled: {
    label: "Cancelled",
    color: "text-rose-500",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
    icon: "cancel",
  },
};

function isActiveOrder(status: string) {
  return !["delivered", "cancelled"].includes(status);
}

function OrdersPageContent() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentPage = Number.parseInt(searchParams.get("page") || "1", 10);

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Order>>("/orders");
      return res.data;
    },
    enabled: isAuthenticated,
    refetchInterval: 30000, // Poll every 30s for active order updates
  });

  const orders = ordersData?.data || [];
  const activeOrders = orders.filter((o) => isActiveOrder(o.status));
  const pastOrders = orders.filter((o) => !isActiveOrder(o.status));

  const ITEMS_PER_PAGE = 5;
  const totalPages = Math.ceil(pastOrders.length / ITEMS_PER_PAGE);

  const paginatedPastOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return pastOrders.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [pastOrders, currentPage]);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/orders?${params.toString()}`, { scroll: false });
  };

  if (isAuthLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <span className="material-symbols-outlined text-[#FF8C00] text-4xl animate-spin">
            progress_activity
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col">
      <Navbar />
      <main className="flex-1 w-full">
        <div className="mt-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full flex flex-col gap-6 md:gap-8 pb-16 md:pb-24">
          {orders.length === 0 ? (
            <div className="text-center py-16">
              <span className="material-symbols-outlined text-5xl text-slate-600 mb-4 block">
                receipt_long
              </span>
              <p className="text-slate-400 mb-4">No orders found.</p>
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-[#FF8C00] hover:bg-[#e07b00] text-white font-bold rounded-xl shadow-lg shadow-[#FF8C00]/20 transition-all"
              >
                Start Ordering
              </Link>
            </div>
          ) : (
            <>
              {/* Active Orders */}
              {activeOrders.length > 0 && (
                <>
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#FF8C00] opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#FF8C00]" />
                    </span>
                    <h3 className="text-white font-bold text-lg md:text-xl tracking-wide">
                      In Progress
                    </h3>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent ml-4" />
                  </div>

                  {activeOrders.map((order) => {
                    const sc =
                      statusConfig[order.status] || statusConfig.pending;
                    return (
                      <Link
                        key={order.id}
                        href={`/orders/${order.id}`}
                        className="block"
                      >
                        <div className="glass-card rounded-2xl md:rounded-3xl p-5 md:p-6 relative overflow-hidden group transform hover:-translate-y-1 transition-all duration-300 hover:border-[#FF8C00]/40">
                          <div className="absolute top-0 left-0 w-1 md:w-1.5 h-full bg-gradient-to-b from-[#FF8C00] via-orange-500 to-transparent opacity-80" />
                          <div className="flex flex-col sm:flex-row gap-4 md:gap-6">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-3 mb-2">
                                <h4 className="text-lg md:text-xl font-bold text-white group-hover:text-[#FF8C00] transition-colors">
                                  Order #{order.id.slice(0, 8)}
                                </h4>
                                <span
                                  className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${sc.bg} ${sc.color} ${sc.border} border`}
                                >
                                  {sc.label}
                                </span>
                              </div>
                              <p className="text-slate-400 text-sm font-medium mb-1">
                                {order.merchant?.storeName} •{" "}
                                {(order.orderItems || order.items)?.length || 0}{" "}
                                items
                              </p>
                              <p className="text-slate-500 text-xs">
                                Placed{" "}
                                {new Date(order.createdAt).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:justify-center">
                              <p className="text-white font-bold text-xl md:text-2xl tracking-tight">
                                {formatRupiah(order.totalAmount)}
                              </p>
                              <span className="px-4 py-2 bg-gradient-to-r from-[#FF8C00] to-orange-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-[#FF8C00]/25 flex items-center gap-1.5">
                                Track
                                <span className="material-symbols-outlined text-base">
                                  arrow_forward
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </>
              )}

              {/* Past Orders */}
              {pastOrders.length > 0 && (
                <>
                  <div className="flex items-center gap-3 mt-4">
                    <div className="w-7 h-7 rounded-full bg-[#1e1e1e] flex items-center justify-center border border-white/5">
                      <span className="material-symbols-outlined text-slate-400 text-sm">
                        history
                      </span>
                    </div>
                    <h3 className="text-white font-bold text-lg md:text-xl tracking-wide">
                      Past Orders
                    </h3>
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent ml-4" />
                  </div>

                  {paginatedPastOrders.map((order) => {
                    const sc =
                      statusConfig[order.status] || statusConfig.delivered;
                    const isCancelled = order.status === "cancelled";
                    return (
                      <Link
                        key={order.id}
                        href={`/orders/${order.id}`}
                        className="block"
                      >
                        <div
                          className={`glass-card rounded-2xl p-4 md:p-5 group hover:border-white/10 transition-all ${isCancelled ? "opacity-60 hover:opacity-100" : ""}`}
                        >
                          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            <div className="flex-1 w-full">
                              <div className="flex justify-between items-center mb-1">
                                <h4
                                  className={`text-base md:text-lg font-bold group-hover:text-[#FF8C00] transition-colors ${isCancelled ? "text-slate-400 line-through decoration-red-500/40" : "text-white"}`}
                                >
                                  {order.merchant?.storeName ||
                                    `Order #${order.id.slice(0, 8)}`}
                                </h4>
                                <p
                                  className={`font-bold text-base md:text-lg ${isCancelled ? "text-slate-500 line-through" : "text-white"}`}
                                >
                                  {formatRupiah(order.totalAmount)}
                                </p>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs text-slate-500">
                                <span
                                  className={`flex items-center gap-1 ${sc.color} ${sc.bg} px-2 py-0.5 rounded ${sc.border} border font-medium`}
                                >
                                  <span className="material-symbols-outlined text-sm">
                                    {sc.icon}
                                  </span>
                                  {sc.label}
                                </span>
                                <span className="w-1 h-1 bg-slate-600 rounded-full hidden sm:block" />
                                <span>
                                  {new Date(
                                    order.createdAt,
                                  ).toLocaleDateString()}
                                </span>
                                <span className="w-1 h-1 bg-slate-600 rounded-full hidden sm:block" />
                                <span>
                                  {(order.orderItems || order.items)?.length ||
                                    0}{" "}
                                  items
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}

                  {pastOrders.length > 0 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={handlePageChange}
                    />
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-[#121212] flex flex-col" />}
    >
      <OrdersPageContent />
    </Suspense>
  );
}
