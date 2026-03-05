"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/hooks/useAuth";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ isOpen, onClose }: MobileDrawerProps) {
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  // Close on route change
  const drawerRef = useRef<HTMLDivElement>(null);
  const prevPathname = useRef(pathname);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Hanya tutup drawer JIKA pathname benar-benar berubah
    if (prevPathname.current !== pathname) {
      onClose();
      prevPathname.current = pathname;
    }
  }, [pathname, onClose]);
  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        drawerRef.current &&
        !drawerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }

    if (isOpen) {
      // Delay attaching the listener to prevent immediate triggering from the opening click
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 50);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Close on escape
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const currentUser = mounted ? user : null;

  const navLinks = currentUser
    ? [
        { href: "/", label: "Home", icon: "home" },
        { href: "/orders", label: "My Orders", icon: "receipt_long" },
        { href: "/cart", label: "Cart", icon: "shopping_cart" },
        { href: "/profile", label: "Profile", icon: "person" },
        {
          href: "/complaints",
          label: "Help & Complaints",
          icon: "support_agent",
        },
        ...(currentUser.role === "merchant"
          ? [
              {
                href: "/merchant",
                label: "Merchant Dashboard",
                icon: "storefront",
              },
            ]
          : []),
        ...(currentUser.role === "courier"
          ? [
              {
                href: "/courier",
                label: "Start Delivering",
                icon: "delivery_dining",
              },
            ]
          : []),
        ...(currentUser.role === "admin"
          ? [
              {
                href: "/admin",
                label: "Admin Panel",
                icon: "admin_panel_settings",
              },
            ]
          : []),
      ]
    : [
        { href: "/", label: "Home", icon: "home" },
        { href: "/cart", label: "Cart", icon: "shopping_cart" },
      ];

  return (
    <div
      className={`fixed inset-0 z-[99] flex justify-end ${!isOpen ? "pointer-events-none" : ""}`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"} cursor-pointer`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        ref={drawerRef}
        className={`relative w-full max-w-[50vw] h-full bg-[#121212]/85 backdrop-blur-3xl border-l border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden transition-transform duration-300 ease-out pointer-events-auto ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Decorative background glows */}
        <div className="absolute -top-32 -right-32 w-72 h-72 bg-[#FF8C00]/20 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute top-1/2 -left-32 w-64 h-64 bg-[#FF8C00]/10 rounded-full blur-[60px] pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 relative z-10 bg-black/10">
          <div onClick={onClose} className="cursor-pointer">
            <Logo
              imageSize={32}
              iconContainerClassName="w-8 h-8 bg-gradient-to-br from-[#FF8C00] to-[#e07b00] rounded-xl flex items-center justify-center shadow-lg"
              textClassName="text-xl font-black tracking-tight text-white italic"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto hide-scrollbar relative z-10 flex flex-col">
          {/* User Info - Premium Glass Card */}
          {currentUser && (
            <div className="p-5">
              <div className="p-4 rounded-2xl bg-[#1e1e1e]/60 border border-white/5 flex items-center gap-4 relative overflow-hidden group hover:border-[#FF8C00]/20 transition-colors shadow-soft">
                <div className="absolute inset-0 bg-gradient-to-r from-[#FF8C00]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF8C00] to-[#cc7000] flex items-center justify-center ring-2 ring-[#FF8C00]/20 shadow-lg shrink-0">
                  <span className="text-[#121212] font-black text-xl">
                    {currentUser.name?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-base truncate">
                    {currentUser.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-[2px] rounded-md bg-[#FF8C00]/20 text-[#FF8C00] text-[10px] font-black uppercase tracking-wider leading-none">
                      {currentUser.role}
                    </span>
                    <p className="text-slate-400 text-xs truncate font-medium">
                      {currentUser.email}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="px-4 pb-6 flex-1 space-y-1.5 mt-2">
            {!currentUser && (
              <div className="px-4 py-2 mb-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Navigation
                </p>
              </div>
            )}
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={onClose}
                  className={`group flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all relative overflow-hidden ${
                    isActive
                      ? "bg-gradient-to-r from-[#FF8C00]/15 to-transparent border border-[#FF8C00]/10"
                      : "hover:bg-white/5 active:bg-white/10 border border-transparent"
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#FF8C00] rounded-r-full shadow-[0_0_10px_rgba(255,140,0,0.8)]" />
                  )}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                      isActive
                        ? "bg-[#FF8C00] text-[#121212] shadow-lg shadow-[#FF8C00]/40"
                        : "bg-[#2a2a2a] text-slate-400 group-hover:bg-[#333] group-hover:text-[#FF8C00]"
                    }`}
                  >
                    <span className="material-symbols-outlined text-[20px] font-bold">
                      {link.icon}
                    </span>
                  </div>
                  <span
                    className={`font-bold ${isActive ? "text-white text-[15px]" : "text-slate-300 text-sm group-hover:text-white"}`}
                  >
                    {link.label}
                  </span>
                  {!isActive && (
                    <span className="material-symbols-outlined absolute right-4 text-slate-600 opacity-0 -translate-x-3 group-hover:opacity-100 group-hover:translate-x-0 transition-all font-bold">
                      chevron_right
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer Actions */}
          <div className="p-6 border-t border-white/5 mt-auto bg-black/20 backdrop-blur-md">
            {currentUser ? (
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-500 font-bold text-sm transition-all group active:scale-[0.98]"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">
                  logout
                </span>
                Sign Out
              </button>
            ) : (
              <div className="space-y-3">
                <Link
                  href="/login"
                  onClick={onClose}
                  className="w-full flex justify-center items-center px-4 py-4 border border-white/10 hover:border-[#FF8C00]/40 hover:bg-[#FF8C00]/5 rounded-xl text-white font-bold text-sm transition-all active:scale-[0.98]"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={onClose}
                  className="w-full flex justify-center items-center gap-2 px-4 py-4 bg-gradient-to-r from-[#FF8C00] to-[#e07b00] rounded-xl text-[#121212] font-black text-sm shadow-lg shadow-[#FF8C00]/25 hover:shadow-[#FF8C00]/40 transition-all group hover:brightness-110 active:scale-[0.98]"
                >
                  Create Account
                  <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform font-bold">
                    arrow_forward
                  </span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
