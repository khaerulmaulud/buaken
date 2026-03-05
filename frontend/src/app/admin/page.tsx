"use client";

import { useQuery } from "@tanstack/react-query";
import {
  AlertTriangle,
  ArrowRight,
  DollarSign,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { adminService } from "@/services/admin.service";
import { cn } from "@/lib/utils";

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: adminService.getDashboardStats,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Dashboard
        </h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card
              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
              key={i}
              className="bg-[#0a0a0a]/80 backdrop-blur-xl border-[#222222]"
            >
              <CardContent className="p-5">
                <div className="space-y-3">
                  <div className="h-4 w-24 animate-pulse rounded bg-white/10" />
                  <div className="h-7 w-16 animate-pulse rounded bg-white/10" />
                  <div className="h-3 w-32 animate-pulse rounded bg-white/10" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const statCards = [
    {
      title: "Total Revenue",
      value: `$${stats.orders.revenue.toLocaleString()}`,
      subtitle: `${stats.orders.completed} completed orders`,
      icon: DollarSign,
      iconBg:
        "bg-emerald-500/10 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.15)]",
      iconColor: "text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]",
    },
    {
      title: "Active Orders",
      value: stats.orders.active.toString(),
      subtitle: `${stats.orders.total} total orders`,
      icon: ShoppingBag,
      iconBg:
        "bg-blue-500/10 border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.15)]",
      iconColor: "text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]",
    },
    {
      title: "Total Users",
      value: stats.users.total.toString(),
      subtitle: `${stats.users.merchants} merchants · ${stats.users.couriers} couriers`,
      icon: Users,
      iconBg:
        "bg-violet-500/10 border border-violet-500/20 shadow-[0_0_15px_rgba(139,92,246,0.15)]",
      iconColor: "text-violet-400 drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]",
    },
    {
      title: "Pending Complaints",
      value: stats.complaints.pending.toString(),
      subtitle: "Requires attention",
      icon: AlertTriangle,
      iconBg:
        stats.complaints.pending > 0
          ? "bg-amber-500/10 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
          : "bg-emerald-500/10 border border-emerald-500/20",
      iconColor:
        stats.complaints.pending > 0
          ? "text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
          : "text-emerald-400",
      alert: stats.complaints.pending > 0,
    },
  ];

  const quickLinks = [
    {
      title: "Manage Users",
      description: "View and manage user accounts, roles, and status",
      href: "/admin/users",
      icon: Users,
    },
    {
      title: "Review Complaints",
      description: "Handle pending complaints and customer issues",
      href: "/admin/complaints",
      icon: AlertTriangle,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">
          Dashboard
        </h1>
        <p className="text-sm text-white/50 mt-1 font-medium">
          Overview of your food delivery platform
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className={cn(
                "transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] hover:-translate-y-0.5 bg-[#0a0a0a]/80 backdrop-blur-xl border-[#222222]",
                card.alert
                  ? "ring-1 ring-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                  : "",
              )}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40">
                      {card.title}
                    </p>
                    <p className="text-3xl font-bold tracking-tight text-white">
                      {card.value}
                    </p>
                    <p className="text-xs text-white/50 font-medium">
                      {card.subtitle}
                    </p>
                  </div>
                  <div
                    className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                      card.iconBg,
                    )}
                  >
                    <Icon className={cn("h-5 w-5", card.iconColor)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-white/90">
          Quick Actions
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <Card className="group cursor-pointer transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] border-[#222222] bg-[#0a0a0a]/80 hover:border-white/20 backdrop-blur-xl">
                  <CardContent className="flex items-center gap-4 p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
                      <Icon className="h-5 w-5 text-white/80 group-hover:text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white/90 group-hover:text-white transition-colors">
                        {link.title}
                      </p>
                      <p className="text-xs text-white/50 mt-0.5 font-medium">
                        {link.description}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-white/30 transition-all group-hover:translate-x-1 group-hover:text-white/80" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Order Stats Summary */}
      <Card className="bg-[#0a0a0a]/80 backdrop-blur-xl border-[#222222]">
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4 w-4 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
            <h3 className="text-sm font-semibold text-white/90">
              Order Summary
            </h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center rounded-xl bg-white/5 border border-white/5 p-4 shadow-inner">
              <p className="text-3xl font-bold text-white">
                {stats.orders.total}
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40 mt-1">
                Total
              </p>
            </div>
            <div className="text-center rounded-xl bg-blue-500/5 border border-blue-500/10 p-4 shadow-inner">
              <p className="text-3xl font-bold text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]">
                {stats.orders.active}
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40 mt-1">
                In Progress
              </p>
            </div>
            <div className="text-center rounded-xl bg-emerald-500/5 border border-emerald-500/10 p-4 shadow-inner">
              <p className="text-3xl font-bold text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]">
                {stats.orders.completed}
              </p>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-white/40 mt-1">
                Completed
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
