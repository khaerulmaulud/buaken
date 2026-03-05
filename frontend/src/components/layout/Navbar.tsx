"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import FallbackImage from "@/components/ui/FallbackImage";
import { Logo } from "@/components/ui/Logo";
import MobileDrawer from "@/components/ui/MobileDrawer";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const [mounted, setMounted] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [searchQuery, setSearchQuery] = useState(
    searchParams.get("search") || "",
  );
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Sync search input with URL params
  useEffect(() => {
    if (pathname === "/" || pathname.startsWith("/merchants")) {
      const currentSearch = searchParams.get("search") || "";
      if (currentSearch === debouncedSearchQuery) return;

      const params = new URLSearchParams(searchParams);
      if (debouncedSearchQuery) {
        params.set("search", debouncedSearchQuery);
      } else {
        params.delete("search");
      }
      params.delete("page"); // Reset pagination back to page 1 on new searches

      const newUrl = `${pathname}${params.toString() ? `?${params.toString()}` : ""}`;
      router.replace(newUrl, { scroll: false });
    }
  }, [debouncedSearchQuery, pathname, router, searchParams]);

  // Sync local state when URL changes
  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
  }, [searchParams]);

  return (
    <Suspense
      fallback={<div className="h-[73px] glass border-b border-white/5" />}
    >
      <header className="sticky top-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3 flex items-center justify-between gap-4">
          {/* Logo */}
          <Logo
            className="flex items-center gap-2 md:gap-3 shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            iconContainerClassName="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-[#FF8C00] to-[#e07b00] rounded-xl flex items-center justify-center shadow-lg shadow-[#FF8C00]/20"
            iconClassName="text-white font-bold text-lg md:text-xl"
            textClassName="text-lg md:text-xl font-black tracking-tight text-white hidden sm:block"
            imageSize={40}
          />

          {/* Desktop: Dashboard Link */}
          {mounted && user && (
            <div className="hidden xl:flex items-center">
              {user.role === "merchant" && (
                <Link
                  href="/merchant"
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 hover:from-cyan-600/30 hover:to-blue-600/30 border border-cyan-500/30 hover:border-cyan-400/50 rounded-full transition-all group shadow-lg shadow-cyan-900/10"
                >
                  <span className="material-symbols-outlined text-cyan-400 text-lg group-hover:scale-110 transition-transform">
                    storefront
                  </span>
                  <span className="text-sm font-bold text-cyan-50 tracking-wide">
                    Merchant Dashboard
                  </span>
                </Link>
              )}
              {user.role === "courier" && (
                <Link
                  href="/courier"
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600/20 to-emerald-600/20 hover:from-teal-600/30 hover:to-emerald-600/30 border border-teal-500/30 hover:border-teal-400/50 rounded-full transition-all group shadow-lg shadow-teal-900/10"
                >
                  <span className="material-symbols-outlined text-teal-400 text-lg group-hover:scale-110 transition-transform">
                    delivery_dining
                  </span>
                  <span className="text-sm font-bold text-teal-50 tracking-wide">
                    Courier Dashboard
                  </span>
                </Link>
              )}
              {user.role === "admin" && (
                <Link
                  href="/admin"
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 hover:from-purple-600/30 hover:to-indigo-600/30 border border-purple-500/30 hover:border-purple-400/50 rounded-full transition-all group shadow-lg shadow-purple-900/10"
                >
                  <span className="material-symbols-outlined text-purple-400 text-lg group-hover:scale-110 transition-transform">
                    admin_panel_settings
                  </span>
                  <span className="text-sm font-bold text-purple-50 tracking-wide">
                    Admin Panel
                  </span>
                </Link>
              )}
              {user.role === "customer" && (
                <div className="flex items-center gap-2">
                  <Link
                    href="/orders"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF8C00]/20 to-orange-600/20 hover:from-[#FF8C00]/30 hover:to-orange-600/30 border border-[#FF8C00]/30 hover:border-[#FF8C00]/50 rounded-full transition-all group shadow-lg shadow-[#FF8C00]/10"
                  >
                    <span className="material-symbols-outlined text-[#FF8C00] text-lg group-hover:scale-110 transition-transform">
                      receipt_long
                    </span>
                    <span className="text-sm font-bold text-orange-50 tracking-wide">
                      My Orders
                    </span>
                  </Link>
                  <Link
                    href="/complaints"
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-rose-600/20 to-pink-600/20 hover:from-rose-600/30 hover:to-pink-600/30 border border-rose-500/30 hover:border-rose-400/50 rounded-full transition-all group shadow-lg shadow-rose-900/10"
                  >
                    <span className="material-symbols-outlined text-rose-400 text-lg group-hover:scale-110 transition-transform">
                      support_agent
                    </span>
                    <span className="text-sm font-bold text-rose-50 tracking-wide">
                      Help
                    </span>
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Search Bar - Desktop */}
          <div className="flex-1 max-w-md mx-auto hidden md:block">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <span className="material-symbols-outlined text-slate-400 group-focus-within:text-[#FF8C00] transition-colors text-xl">
                  search
                </span>
              </div>
              <input
                className="block w-full pl-11 pr-4 py-2.5 bg-[#242424] border border-transparent rounded-full leading-5 text-slate-200 placeholder-slate-500 focus:outline-none focus:bg-[#1e1e1e] focus:border-[#FF8C00]/50 focus:ring-1 focus:ring-[#FF8C00] sm:text-sm transition-all shadow-inner"
                placeholder="Search cuisines, restaurants..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
                  type="button"
                >
                  <span className="material-symbols-outlined text-slate-400 text-lg">
                    close
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Right side icons */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Cart */}
            <Link
              href="/cart"
              className="relative p-2.5 rounded-full hover:bg-white/5 transition-colors group"
            >
              <span className="material-symbols-outlined text-slate-300 group-hover:text-[#FF8C00] transition-colors text-2xl">
                shopping_cart
              </span>
              {totalItems > 0 && (
                <span className="absolute top-1 right-1 bg-[#FF8C00] text-white text-[10px] font-bold w-4.5 h-4.5 flex items-center justify-center rounded-full shadow-sm">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* Desktop: User Avatar or Auth */}
            <div className="hidden md:flex items-center">
              {mounted && user ? (
                <div className="flex items-center gap-2">
                  <Link
                    href="/profile"
                    className="flex items-center gap-1.5 pl-2 pr-2 py-1.5 rounded-full bg-[#242424] border border-white/5 hover:border-[#FF8C00]/30 hover:bg-[#1e1e1e] transition-all cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-[#FF8C00]/20 group-hover:ring-[#FF8C00] transition-all bg-gradient-to-br from-[#FF8C00] to-orange-600 flex items-center justify-center">
                      {user.avatarUrl ? (
                        <FallbackImage
                          src={user.avatarUrl}
                          alt="Avatar"
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-xs font-bold">
                          {user.name?.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="hidden lg:flex flex-col items-start leading-none px-1.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                        My Account
                      </span>
                      <span className="text-sm font-bold text-slate-200 group-hover:text-white transition-colors truncate max-w-[80px]">
                        {user.name}
                      </span>
                    </div>
                  </Link>
                  <button
                    onClick={() => logout()}
                    className="p-2 rounded-full hover:bg-white/5 transition-colors group"
                    title="Log out"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-slate-400 group-hover:text-red-400 transition-colors text-xl">
                      logout
                    </span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="px-5 py-2 bg-[#FF8C00] hover:bg-[#e07b00] text-white font-bold text-sm rounded-full shadow-lg shadow-[#FF8C00]/20 hover:shadow-[#FF8C00]/40 transition-all"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile: Search Toggle */}
            <button
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)}
              className="md:hidden p-2 rounded-full hover:bg-white/5 transition-colors"
              aria-label="Toggle search"
              type="button"
            >
              <span className="material-symbols-outlined text-slate-300 text-2xl">
                search
              </span>
            </button>

            {/* Mobile: Hamburger */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="md:hidden p-2 rounded-full hover:bg-white/5 transition-colors"
              aria-label="Open menu"
              type="button"
            >
              <span className="material-symbols-outlined text-slate-300 text-2xl">
                menu
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Search Bar - Conditionally Rendered */}
        {isMobileSearchOpen && (
          <div className="md:hidden px-4 pb-4 pt-2 animate-fade-in border-t border-white/5">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                search
              </span>
              <input
                className="w-full bg-[#1e1e1e] border-none rounded-xl py-3 pl-10 pr-10 text-sm focus:ring-1 focus:ring-[#FF8C00] placeholder:text-slate-500 text-white shadow-inner"
                placeholder="Search cravings, restaurants..."
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-white/10 rounded-full transition-colors"
                  type="button"
                >
                  <span className="material-symbols-outlined text-slate-400 text-base">
                    close
                  </span>
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Mobile Drawer - slides from right */}
      <MobileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </Suspense>
  );
}
