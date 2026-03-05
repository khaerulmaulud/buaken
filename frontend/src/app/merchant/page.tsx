"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Banknote,
  CalendarClock,
  ClipboardList,
  Loader2,
  MessageSquareWarning,
  Power,
  Settings,
  TrendingUp,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/axios";
import { formatRupiah } from "@/lib/utils";
import type { ApiResponse, Merchant, MerchantDashboardStats } from "@/types";

export default function MerchantDashboard() {
  const queryClient = useQueryClient();

  const { data: merchantData, isLoading } = useQuery({
    queryKey: ["merchant-profile"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Merchant>>("/merchant/profile");
      return res.data.data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ["merchant-dashboard-stats"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<MerchantDashboardStats>>(
        "/merchant/dashboard-stats",
      );
      return res.data.data;
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (isOpen: boolean) => {
      const res = await api.patch<ApiResponse<Merchant>>(
        `/merchant/status/${merchantData?.id}`,
        { isOpen },
      );
      return res.data.data;
    },
    onSuccess: (updatedMerchant) => {
      queryClient.setQueryData(["merchant-profile"], updatedMerchant);
      toast.success(
        `Store is now ${updatedMerchant.isOpen ? "OPEN" : "CLOSED"}`,
        {
          style: {
            borderRadius: 0,
            border: "1px solid rgba(255,255,255,0.1)",
            background: "#0a0a0a",
            color: "#fff",
          },
        },
      );
    },
    onError: () => {
      toast.error("Failed to update store status");
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-5">
        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
        <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
          Initializing Terminal...
        </p>
      </div>
    );
  }

  if (!merchantData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4 border border-amber-500/20 bg-amber-500/5 rounded-sm">
        <AlertTriangle className="h-8 w-8 text-amber-500" />
        <h3 className="text-lg font-black text-white uppercase tracking-wider">
          Profile Setup Required
        </h3>
        <p className="text-sm text-zinc-400 text-center max-w-md">
          Your merchant profile couldn't be loaded. Please set it up to start
          receiving orders.
        </p>
        <Link
          href="/merchant/profile"
          className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-xs tracking-widest rounded-sm transition-all"
        >
          <Settings className="h-4 w-4" />
          Setup Store Profile
        </Link>
      </div>
    );
  }

  const needsSetup =
    merchantData.storeName?.includes("'s Store") ||
    merchantData.addressLine === "Please update your address";

  const handleToggleStatus = (checked: boolean) => {
    toggleStatusMutation.mutate(checked);
  };

  return (
    <div className="space-y-6">
      {/* Setup Banner */}
      {needsSetup && (
        <div className="flex items-center gap-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-sm">
          <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-amber-400 uppercase tracking-wider">
              Complete Your Store Profile
            </p>
            <p className="text-xs text-zinc-400">
              Update your store name, address, and operating hours to start
              receiving orders.
            </p>
          </div>
          <Link
            href="/merchant/profile"
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-[10px] tracking-widest rounded-sm transition-all shrink-0"
          >
            <Settings className="h-3 w-3" />
            Configure
          </Link>
        </div>
      )}

      {/* Header & Status Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col justify-end p-6 md:p-8 bg-[#0a0a0a] border border-white/10 rounded-sm">
          <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
            <Activity className="h-3.5 w-3.5 text-amber-500" />
            System Status: Nominal
          </p>
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase text-white mb-2 leading-none">
            {merchantData.storeName}
          </h1>
          <p className="text-zinc-400 font-medium text-sm md:text-base">
            Operations Dashboard
          </p>
        </div>

        <div className="bg-[#0a0a0a] border border-white/10 p-6 md:p-8 rounded-sm flex flex-col justify-between group overflow-hidden relative">
          <div className="flex justify-between items-start z-10 relative">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Power className="h-3 w-3" />
              Store Status
            </span>
            <Switch
              checked={merchantData.isOpen}
              onCheckedChange={handleToggleStatus}
              disabled={toggleStatusMutation.isPending}
              className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-rose-500/20 rounded-sm"
            />
          </div>

          <div className="flex flex-col mt-12 z-10 relative">
            <span
              className={`text-2xl sm:text-3xl font-black uppercase tracking-tighter leading-none ${merchantData.isOpen ? "text-emerald-500" : "text-rose-500"}`}
            >
              {merchantData.isOpen ? "Accepting Orders" : "Offline / Closed"}
            </span>
            <span className="text-[10px] text-zinc-500 uppercase font-mono mt-3 tracking-widest">
              Toggle switch to change state
            </span>
          </div>

          {/* Core Glow Background effect */}
          <div
            className={`absolute -right-16 -bottom-16 w-48 h-48 blur-[80px] rounded-full transition-colors duration-1000 ${merchantData.isOpen ? "bg-emerald-500/20" : "bg-rose-500/20"}`}
          />
        </div>
      </div>

      {/* Earnings Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today's Revenue — Hero Card */}
        <div className="sm:col-span-2 bg-[#0a0a0a] border border-amber-500/20 p-6 rounded-sm flex flex-col justify-between hover:border-amber-500/40 transition-all duration-300 relative overflow-hidden group">
          <div className="flex justify-between items-start mb-6">
            <span className="text-[10px] font-mono uppercase tracking-widest text-amber-500/70">
              Hari Ini
            </span>
            <CalendarClock className="h-4 w-4 text-amber-500 opacity-60" />
          </div>
          <div>
            <span className="text-4xl md:text-5xl font-black text-white tracking-tighter">
              {formatRupiah(stats?.todayRevenue ?? 0)}
            </span>
            <div className="flex items-center gap-4 mt-3">
              <p className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">
                {stats?.todayOrders ?? 0} pesanan hari ini
              </p>
            </div>
          </div>
          <div className="absolute -right-12 -bottom-12 w-40 h-40 bg-amber-500/5 rounded-full blur-[60px] group-hover:bg-amber-500/10 transition-all duration-700" />
        </div>

        {/* Total Revenue */}
        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-sm flex flex-col justify-between hover:border-white/20 transition-all duration-300">
          <div className="flex justify-between items-start mb-8">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              Total Pendapatan
            </span>
            <Wallet className="h-4 w-4 text-emerald-500 opacity-80" />
          </div>
          <div>
            <span className="text-2xl font-black text-white tracking-tighter">
              {formatRupiah(stats?.totalRevenue ?? 0)}
            </span>
            <p className="text-[10px] uppercase font-mono text-zinc-600 mt-3 tracking-wider">
              {stats?.totalOrders ?? 0} total pesanan selesai
            </p>
          </div>
        </div>

        {/* Active Orders */}
        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-sm flex flex-col justify-between hover:border-white/20 transition-all duration-300">
          <div className="flex justify-between items-start mb-8">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
              Pesanan Aktif
            </span>
            <ClipboardList className="h-4 w-4 text-blue-500 opacity-80" />
          </div>
          <div>
            <span className="text-3xl font-black text-white tracking-tighter">
              {stats?.activeOrders ?? 0}
            </span>
            <p className="text-[10px] uppercase font-mono text-zinc-600 mt-3 tracking-wider">
              Menunggu diproses
            </p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Menu Items */}
        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-sm flex items-center justify-between hover:border-white/20 transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-amber-500/10 flex items-center justify-center rounded-sm">
              <UtensilsCrossed className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <span className="text-2xl font-black text-white tracking-tighter">
                {stats?.menuItemCount ?? 0}
              </span>
              <p className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">
                Item Menu
              </p>
            </div>
          </div>
          <TrendingUp className="h-5 w-5 text-zinc-700" />
        </div>

        {/* Revenue Per Order */}
        <div className="bg-[#0a0a0a] border border-white/5 p-6 rounded-sm flex items-center justify-between hover:border-white/20 transition-all duration-300">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-emerald-500/10 flex items-center justify-center rounded-sm">
              <Banknote className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <span className="text-2xl font-black text-white tracking-tighter">
                {stats && stats.totalOrders > 0
                  ? formatRupiah(
                      Math.round(stats.totalRevenue / stats.totalOrders),
                    )
                  : formatRupiah(0)}
              </span>
              <p className="text-[10px] uppercase font-mono text-zinc-500 tracking-wider">
                Rata-rata per pesanan
              </p>
            </div>
          </div>
          <TrendingUp className="h-5 w-5 text-zinc-700" />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/merchant/menu" className="block group">
          <div className="h-full bg-transparent border border-white/10 hover:border-amber-500 hover:bg-amber-500/5 p-6 md:p-8 rounded-sm transition-all duration-300 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3 mb-2 group-hover:text-amber-500 transition-colors duration-300">
                <UtensilsCrossed className="h-4 w-4" />
                Configure Menu
              </h3>
              <p className="text-xs text-zinc-500 font-mono tracking-wide">
                Add, edit, or adjust item availability.
              </p>
            </div>
            <div className="h-10 w-10 border border-white/10 flex items-center justify-center text-white/30 group-hover:border-amber-500 group-hover:text-amber-500 transition-all duration-300">
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </Link>

        <Link href="/merchant/orders" className="block group">
          <div className="h-full bg-transparent border border-white/10 hover:border-amber-500 hover:bg-amber-500/5 p-6 md:p-8 rounded-sm transition-all duration-300 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3 mb-2 group-hover:text-amber-500 transition-colors duration-300">
                <ClipboardList className="h-4 w-4" />
                Order Queue
              </h3>
              <p className="text-xs text-zinc-500 font-mono tracking-wide">
                Process incoming and active orders.
              </p>
            </div>
            <div className="h-10 w-10 border border-white/10 flex items-center justify-center text-white/30 group-hover:border-amber-500 group-hover:text-amber-500 transition-all duration-300">
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </Link>

        <Link href="/complaints/new" className="block group">
          <div className="h-full bg-transparent border border-white/10 hover:border-amber-500 hover:bg-amber-500/5 p-6 md:p-8 rounded-sm transition-all duration-300 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3 mb-2 group-hover:text-amber-500 transition-colors duration-300">
                <MessageSquareWarning className="h-4 w-4" />
                Report Issue
              </h3>
              <p className="text-xs text-zinc-500 font-mono tracking-wide">
                Submit a complaint to customer support.
              </p>
            </div>
            <div className="h-10 w-10 border border-white/10 flex items-center justify-center text-white/30 group-hover:border-amber-500 group-hover:text-amber-500 transition-all duration-300">
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
