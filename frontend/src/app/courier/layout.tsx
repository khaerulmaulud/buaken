"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareWarning,
  Navigation,
  Package,
  Power,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/axios";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import type { ApiResponse, CourierProfile } from "@/types";

export default function CourierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { data: courier } = useQuery({
    queryKey: ["courier-profile"],
    queryFn: async () => {
      const res =
        await api.get<ApiResponse<CourierProfile>>("/courier/profile");
      return res.data.data;
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (isOnline: boolean) => {
      const res = await api.patch<ApiResponse<CourierProfile>>(
        "/courier/status",
        {
          isOnline,
        },
      );
      return res.data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["courier-profile"], data);
      toast.success(
        data.isOnline
          ? "System Online — Accepting deliveries"
          : "System Offline — Standing by",
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
      toast.error("Failed to update status");
    },
  });

  const navigation = [
    { name: "Dashboard", href: "/courier", icon: LayoutDashboard },
    { name: "Available Orders", href: "/courier/available", icon: Package },
    { name: "My Deliveries", href: "/courier/deliveries", icon: Navigation },
    { name: "Complaints", href: "/complaints", icon: MessageSquareWarning },
    { name: "Profile", href: "/courier/profile", icon: User },
  ];

  const sidebarContent = (
    <>
      <div className="p-6 border-b border-white/5">
        <h1 className="text-xl font-black tracking-widest uppercase text-white">
          <span className="text-emerald-500">▲</span> Courier
        </h1>
        <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-widest mt-1">
          Delivery Operations
        </p>
      </div>

      {/* Online Status Toggle */}
      <div className="px-4 py-4 border-b border-white/5">
        <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/5 rounded-sm">
          <div className="flex items-center gap-2">
            <div
              className={`h-2 w-2 rounded-full ${courier?.isOnline ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"}`}
            />
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
              {courier?.isOnline ? "Online" : "Offline"}
            </span>
          </div>
          <Switch
            checked={courier?.isOnline || false}
            onCheckedChange={(checked) => toggleStatusMutation.mutate(checked)}
            disabled={toggleStatusMutation.isPending}
            className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-zinc-700 rounded-sm"
          />
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-zinc-500 hover:text-white hover:bg-white/5 rounded-sm transition-all text-xs font-mono uppercase tracking-widest mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>

        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-sm transition-all duration-200 text-xs font-mono uppercase tracking-widest ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                  : "text-zinc-500 hover:bg-white/5 hover:text-white border border-transparent"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}

        <div className="pt-6 mt-6 border-t border-white/5">
          <button
            type="button"
            className="w-full flex items-center gap-3 px-3 py-2.5 text-rose-500/70 hover:text-rose-500 hover:bg-rose-500/5 rounded-sm transition-all text-xs font-mono uppercase tracking-widest"
            onClick={() => {
              window.location.href = "/";
            }}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </nav>
    </>
  );

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  return (
    <ProtectedRoute allowedRoles={["courier"]}>
      <div className="flex min-h-screen bg-[#050505]">
        {/* Desktop Sidebar */}
        <aside className="w-60 bg-[#0a0a0a] border-r border-white/5 hidden md:flex flex-col fixed h-full z-40">
          {sidebarContent}
        </aside>

        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/5 transition-colors">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-sm font-black tracking-widest uppercase text-white flex items-center gap-2">
              <span className="text-emerald-500 text-[10px]">▲</span> COURIER
            </h1>
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -mr-2 text-zinc-400 hover:text-white transition-colors"
              aria-label="Toggle menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <div
          className={`md:hidden fixed inset-0 z-50 transition-all duration-300 ${isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        >
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${isMobileMenuOpen ? "opacity-100" : "opacity-0"}`}
            onClick={() => setIsMobileMenuOpen(false)}
            onKeyDown={() => setIsMobileMenuOpen(false)}
          />

          {/* Sidebar Panel */}
          <div
            className={`absolute top-0 right-0 w-[280px] h-full bg-[#0a0a0a] border-l border-white/10 flex flex-col shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}`}
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/5">
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-500">
                Navigation
              </span>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 -mr-2 text-zinc-400 hover:text-white transition-colors"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              {sidebarContent}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <main className="flex-1 md:ml-60 pt-16 md:pt-0 min-h-screen border-l border-white/5">
          <div className="max-w-6xl mx-auto p-6 md:p-8 space-y-8">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
