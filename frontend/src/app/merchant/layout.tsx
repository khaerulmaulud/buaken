"use client";

import {
  ArrowLeft,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  MessageSquareWarning,
  Settings,
  UtensilsCrossed,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const navigation = [
    { name: "Dashboard", href: "/merchant", icon: LayoutDashboard },
    { name: "Menu", href: "/merchant/menu", icon: UtensilsCrossed },
    { name: "Orders", href: "/merchant/orders", icon: ClipboardList },
    { name: "Complaints", href: "/complaints", icon: MessageSquareWarning },
    { name: "Profile", href: "/merchant/profile", icon: Settings },
  ];

  const sidebarContent = (
    <>
      <div className="p-6 md:p-8 tracking-tighter border-b border-white/10 md:border-none">
        <h1 className="text-2xl font-black text-white uppercase tracking-widest flex items-center gap-2.5">
          <div className="w-3 h-3 bg-amber-500 rounded-sm" />
          MERCHANT
        </h1>
        <p className="text-[10px] text-zinc-500 font-mono mt-1.5 uppercase letter-spacing-wide">
          Operations Terminal
        </p>
      </div>

      <nav className="flex-1 px-4 space-y-1 mt-6">
        <Button
          variant="ghost"
          onClick={() => router.push("/")}
          className="w-full justify-start gap-3 px-3 rounded-none text-zinc-400 hover:text-white hover:bg-white/5 mb-6 hover:border-l hover:border-zinc-500 transition-all font-mono"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-[11px] font-semibold tracking-wider uppercase">
            Ext. Gateway
          </span>
        </Button>

        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-3 rounded-sm transition-all duration-200 border-l-[3px] text-xs font-bold tracking-widest uppercase ${
                isActive
                  ? "bg-white/5 text-amber-500 border-amber-500"
                  : "text-zinc-500 border-transparent hover:bg-white/5 hover:text-zinc-200"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>
    </>
  );

  return (
    <ProtectedRoute allowedRoles={["merchant"]}>
      <div className="flex min-h-screen bg-[#050505] text-zinc-300 font-sans selection:bg-amber-500/30">
        {/* Desktop Sidebar - Brutalist Edge */}
        <aside className="w-64 bg-[#0a0a0a] border-r border-white/10 hidden md:flex flex-col fixed h-full z-40">
          {sidebarContent}
        </aside>

        {/* Mobile Header */}
        <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-white/10 transition-colors">
          <div className="flex items-center justify-between px-4 py-3">
            <h1 className="text-sm font-black tracking-widest uppercase text-white flex items-center gap-2">
              <div className="w-2 h-2 bg-amber-500 rounded-sm" />
              MERCHANT
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
            <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
              <span className="text-xs font-mono tracking-widest text-zinc-500 uppercase">
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
        <main className="flex-1 md:ml-64 pt-16 md:pt-0 min-h-screen border-l border-white/5 overflow-x-hidden">
          <div className="max-w-6xl mx-auto p-6 md:p-10 space-y-8">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
