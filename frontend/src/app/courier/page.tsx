"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Activity,
  ArrowRight,
  Banknote,
  CalendarClock,
  Clock,
  Loader2,
  MapPin,
  MessageSquareWarning,
  Package,
  Star,
  Truck,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/axios";
import { formatRupiah } from "@/lib/utils";
import type {
  ApiResponse,
  CourierDashboardStats,
  CourierProfile,
  Order,
  PaginatedResponse,
} from "@/types";

export default function CourierDashboardPage() {
  const { data: courier, isLoading: isProfileLoading } = useQuery({
    queryKey: ["courier-profile"],
    queryFn: async () => {
      const res =
        await api.get<ApiResponse<CourierProfile>>("/courier/profile");
      return res.data.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["courier-dashboard-stats"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<CourierDashboardStats>>(
        "/courier/dashboard-stats",
      );
      return res.data.data;
    },
  });

  const { data: activeDeliveries } = useQuery({
    queryKey: ["courier-orders", "active"],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Order>>("/courier/orders", {
        params: { status: "picked_up,on_delivery" },
      });
      return res.data.data;
    },
  });

  const { data: availableOrders } = useQuery({
    queryKey: ["courier-available-orders"],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Order>>(
        "/courier/available-orders",
      );
      return res.data.data;
    },
  });

  if (isProfileLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-5">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
          Initializing Terminal...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-end p-6 md:p-8 bg-[#0a0a0a] border border-white/10 rounded-sm">
        <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
          <Activity className="h-3.5 w-3.5 text-emerald-500" />
          Courier Terminal
        </p>
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase text-white mb-1 leading-none">
          Dashboard
        </h1>
        <p className="text-zinc-400 font-medium text-sm">
          Selamat datang! Berikut ringkasan pengiriman Anda.
        </p>
      </div>

      {/* Earnings Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Earnings — Hero Card */}
        <div className="sm:col-span-2 bg-[#0a0a0a] border border-emerald-500/20 p-6 rounded-sm flex flex-col justify-between hover:border-emerald-500/40 transition-all duration-300 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-500/70">
              Penghasilan Hari Ini
            </span>
            <CalendarClock className="h-4 w-4 text-emerald-500 opacity-60" />
          </div>
          <div>
            <span className="text-4xl md:text-5xl font-black text-white tracking-tighter">
              {formatRupiah(stats?.todayEarnings ?? 0)}
            </span>
            <div className="flex items-center gap-4 mt-3">
              <p className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">
                {stats?.todayDeliveries ?? 0} pengiriman hari ini
              </p>
            </div>
          </div>
          <div className="absolute -right-12 -bottom-12 w-40 h-40 bg-emerald-500/5 rounded-full blur-[60px] group-hover:bg-emerald-500/10 transition-all duration-700" />
        </div>

        {/* Total Earnings */}
        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-sm flex flex-col justify-between hover:border-white/20 transition-all duration-300">
          <div className="flex justify-between items-start mb-8">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              Total Penghasilan
            </span>
            <Wallet className="h-4 w-4 text-emerald-500 opacity-80" />
          </div>
          <div>
            <span className="text-2xl font-black text-white tracking-tighter">
              {formatRupiah(stats?.totalEarnings ?? 0)}
            </span>
            <p className="text-[10px] uppercase font-mono text-zinc-600 mt-3 tracking-wider">
              {stats?.totalDeliveries ?? 0} pengiriman selesai
            </p>
          </div>
        </div>

        {/* Average Per Delivery */}
        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-sm flex flex-col justify-between hover:border-white/20 transition-all duration-300">
          <div className="flex justify-between items-start mb-8">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              Rata-Rata / Kirim
            </span>
            <Banknote className="h-4 w-4 text-amber-500 opacity-80" />
          </div>
          <div>
            <span className="text-2xl font-black text-white tracking-tighter">
              {stats && stats.totalDeliveries > 0
                ? formatRupiah(
                    Math.round(stats.totalEarnings / stats.totalDeliveries),
                  )
                : formatRupiah(0)}
            </span>
            <p className="text-[10px] uppercase font-mono text-zinc-600 mt-3 tracking-wider">
              Per pengiriman
            </p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Deliveries */}
        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-sm flex items-center justify-between hover:border-white/20 transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-emerald-500/10 flex items-center justify-center rounded-sm">
              <Truck className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <span className="text-2xl font-black text-white tracking-tighter">
                {courier?.totalDeliveries || 0}
              </span>
              <p className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">
                Total Pengiriman
              </p>
            </div>
          </div>
        </div>

        {/* Rating */}
        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-sm flex items-center justify-between hover:border-white/20 transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-amber-500/10 flex items-center justify-center rounded-sm">
              <Star className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-white tracking-tighter">
                  {Number(courier?.rating || 0).toFixed(1)}
                </span>
                <span className="text-xs text-zinc-600">/5.0</span>
              </div>
              <p className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">
                Rating
              </p>
            </div>
          </div>
        </div>

        {/* Available Orders */}
        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-sm flex items-center justify-between hover:border-white/20 transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-blue-500/10 flex items-center justify-center rounded-sm">
              <Package className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <span className="text-2xl font-black text-white tracking-tighter">
                {availableOrders?.length || 0}
              </span>
              <p className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">
                Pesanan Tersedia
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Active Delivery */}
      {activeDeliveries && activeDeliveries.length > 0 && (
        <div className="bg-[#0a0a0a] border border-emerald-500/30 p-6 rounded-sm relative overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-500">
              Pengiriman Aktif
            </span>
          </div>
          {activeDeliveries.slice(0, 1).map((order) => (
            <div key={order.id} className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-lg font-black text-white uppercase tracking-tight">
                    Order #{order.orderNumber}
                  </p>
                  <p className="text-xs text-zinc-500 font-mono">
                    {order.merchant?.storeName}
                  </p>
                </div>
                <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-sm text-[10px] font-mono uppercase tracking-wider">
                  {order.status.replace("_", " ")}
                </span>
              </div>

              <div className="flex items-start gap-2 text-xs text-zinc-400">
                <MapPin className="h-3.5 w-3.5 mt-0.5 text-zinc-600" />
                <span>
                  {order.deliveryAddress?.addressLine},{" "}
                  {order.deliveryAddress?.city}
                </span>
              </div>

              <Link href="/courier/deliveries">
                <button
                  type="button"
                  className="w-full mt-2 inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase text-xs tracking-widest rounded-sm transition-all"
                >
                  Lihat Detail
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
          ))}
          <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-emerald-500/5 rounded-full blur-[80px]" />
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/courier/available" className="block group">
          <div className="h-full bg-transparent border border-white/10 hover:border-emerald-500 hover:bg-emerald-500/5 p-6 md:p-8 rounded-sm transition-all duration-300 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3 mb-2 group-hover:text-emerald-500 transition-colors duration-300">
                <Package className="h-4 w-4" />
                Cari Pesanan
              </h3>
              <p className="text-xs text-zinc-500 font-mono tracking-wide">
                Telusuri pesanan yang tersedia untuk diambil.
              </p>
            </div>
            <div className="h-10 w-10 border border-white/10 flex items-center justify-center text-white/30 group-hover:border-emerald-500 group-hover:text-emerald-500 transition-all duration-300">
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </Link>

        <Link href="/courier/deliveries" className="block group">
          <div className="h-full bg-transparent border border-white/10 hover:border-emerald-500 hover:bg-emerald-500/5 p-6 md:p-8 rounded-sm transition-all duration-300 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3 mb-2 group-hover:text-emerald-500 transition-colors duration-300">
                <Clock className="h-4 w-4" />
                Riwayat Pengiriman
              </h3>
              <p className="text-xs text-zinc-500 font-mono tracking-wide">
                Lihat riwayat pengiriman Anda.
              </p>
            </div>
            <div className="h-10 w-10 border border-white/10 flex items-center justify-center text-white/30 group-hover:border-emerald-500 group-hover:text-emerald-500 transition-all duration-300">
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </Link>

        <Link href="/complaints/new" className="block group">
          <div className="h-full bg-transparent border border-white/10 hover:border-emerald-500 hover:bg-emerald-500/5 p-6 md:p-8 rounded-sm transition-all duration-300 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3 mb-2 group-hover:text-emerald-500 transition-colors duration-300">
                <MessageSquareWarning className="h-4 w-4" />
                Laporkan Masalah
              </h3>
              <p className="text-xs text-zinc-500 font-mono tracking-wide">
                Kirim keluhan ke layanan pelanggan.
              </p>
            </div>
            <div className="h-10 w-10 border border-white/10 flex items-center justify-center text-white/30 group-hover:border-emerald-500 group-hover:text-emerald-500 transition-all duration-300">
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
