"use client";

import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import FallbackImage from "@/components/ui/FallbackImage";
import { Pagination } from "@/components/ui/Pagination";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/axios";
import { formatRupiah } from "@/lib/utils";
import type { Category, Merchant, PaginatedResponse } from "@/types";

function HomeContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchQuery = searchParams.get("search") || "";
  const currentPage = Number.parseInt(searchParams.get("page") || "1", 10);

  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // For wheel-to-scroll on categories
  const categoryScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = categoryScrollRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      // If scrolling horizontally (trackpad), don't intercept
      if (e.deltaX !== 0) return;

      if (e.deltaY !== 0) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };

    // Use passive: false to allow e.preventDefault()
    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, []);

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Category>>("/categories");
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: merchantsData, isLoading } = useQuery({
    queryKey: ["merchants", searchQuery],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Merchant>>("/merchants", {
        params: { search: searchQuery, limit: 100 },
      });
      return res.data;
    },
    staleTime: 2 * 60 * 1000,
  });

  const categories = categoriesData?.data || [];
  const allMerchants = merchantsData?.data || [];

  const merchants = useMemo(() => {
    return allMerchants.filter((merchant) => {
      const matchesCategory =
        !selectedCategory ||
        categories
          .find((c) => c.id === selectedCategory)
          ?.name.toLowerCase()
          .split(" ")
          .some(
            (word) =>
              merchant.description?.toLowerCase().includes(word) ||
              merchant.storeName.toLowerCase().includes(word),
          );

      return matchesCategory;
    });
  }, [allMerchants, selectedCategory, categories]);

  const handleCategoryClick = (categoryId: string | null) => {
    setSelectedCategory(categoryId === selectedCategory ? null : categoryId);
    handlePageChange(1);
  };

  const ITEMS_PER_PAGE = 10;
  const totalPages = Math.ceil(merchants.length / ITEMS_PER_PAGE);
  const safePage = Math.max(1, Math.min(currentPage, Math.max(1, totalPages)));

  const paginatedMerchants = useMemo(() => {
    const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
    return merchants.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [merchants, safePage]);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-[#121212] text-slate-100 font-sans flex flex-col">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 md:px-8 py-6 md:py-8 space-y-10 md:space-y-12">
        {/* Hero Banner */}
        <section className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-2xl shadow-black/50 group">
          <div className="relative w-full h-[280px] sm:h-[360px] md:h-[450px]">
            <div className="w-full h-full bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]">
              <FallbackImage
                alt="Gourmet Food Banner"
                className="object-cover object-center transform group-hover:scale-105 transition-transform duration-1000 ease-out opacity-70"
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=600&fit=crop"
                fill
                priority
                sizes="(max-width: 1200px) 100vw, 1200px"
              />
            </div>
            <div className="absolute inset-0 hero-gradient flex flex-col justify-center px-6 sm:px-10 md:px-16">
              <div className="max-w-xl space-y-4 md:space-y-6">
                <div className="inline-flex items-center gap-2 bg-[#FF8C00]/20 backdrop-blur-sm border border-[#FF8C00]/30 px-3 py-1.5 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-[#FF8C00] animate-pulse" />
                  <span className="text-[#FF8C00] text-xs font-bold uppercase tracking-widest">
                    Free Delivery Today
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-[1.1] tracking-tight">
                  Discover{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF8C00] to-orange-300">
                    delicious
                  </span>
                  <br className="hidden sm:block" /> food near you
                </h2>
                <p className="text-slate-300 text-sm sm:text-base md:text-base font-medium max-w-md leading-relaxed">
                  Experience gourmet delivery from top-rated local restaurants.
                  Fresh, fast, and fabulous.
                </p>
                <div className="flex flex-wrap gap-2 pt-2">
                  <Link
                    href="#restaurants"
                    className="bg-[#FF8C00] hover:bg-[#e07b00] text-white font-bold px-4 py-2 md:px-8 md:py-4 rounded-xl shadow-lg shadow-[#FF8C00]/25 hover:shadow-[#FF8C00]/40 transform hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 text-sm md:text-base"
                  >
                    Order Now
                    <span className="material-symbols-outlined text-lg">
                      arrow_forward
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Explore Cuisines / Categories */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Explore Menu
            </h3>
            {selectedCategory && (
              <button
                onClick={() => setSelectedCategory(null)}
                className="text-[#FF8C00] text-sm font-bold hover:underline flex items-center gap-1"
                type="button"
              >
                Clear filter
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}
          </div>
          <div
            className="flex gap-3 overflow-x-auto pb-3 hide-scrollbar"
            ref={categoryScrollRef}
          >
            <button
              onClick={() => setSelectedCategory(null)}
              className={`flex shrink-0 items-center gap-2 px-5 py-2.5 rounded-2xl transition-all text-sm font-semibold ${
                !selectedCategory
                  ? "bg-[#FF8C00] text-white shadow-lg shadow-[#FF8C00]/20"
                  : "glass-card hover:bg-white/5 hover:border-[#FF8C00]/50 text-slate-300 hover:text-white border border-white/5"
              }`}
              type="button"
            >
              <span className="text-lg">🍽️</span>
              All
            </button>
            {categories.map((category, i) => (
              <motion.button
                key={category.id}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                onClick={() => handleCategoryClick(category.id)}
                className={`flex shrink-0 items-center gap-2 px-5 py-2.5 rounded-2xl transition-all text-sm font-semibold group ${
                  selectedCategory === category.id
                    ? "bg-[#FF8C00] text-white shadow-lg shadow-[#FF8C00]/20"
                    : "glass-card hover:bg-white/5 hover:border-[#FF8C00]/50 text-slate-300 hover:text-white border border-white/5"
                }`}
                type="button"
              >
                {category.iconUrl && (
                  <FallbackImage
                    src={category.iconUrl}
                    alt=""
                    width={20}
                    height={20}
                    className="object-contain group-hover:scale-110 transition-transform"
                  />
                )}
                {category.name}
              </motion.button>
            ))}
          </div>
        </section>

        {/* Popular Restaurants */}
        <section id="restaurants" className="mb-8">
          <div className="flex items-end justify-between mb-6 md:mb-8">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                {selectedCategory
                  ? `${categories.find((c) => c.id === selectedCategory)?.name || ""} Restaurants`
                  : searchQuery
                    ? "Search Results"
                    : "Popular Near You"}
              </h3>
              <p className="text-slate-400 text-sm mt-1.5 font-medium">
                {paginatedMerchants.length === 0
                  ? "No restaurants found"
                  : `${paginatedMerchants.length} ${paginatedMerchants.length === 1 ? "place" : "places"} available`}
              </p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <div
                  key={i}
                  className="h-64 rounded-2xl bg-[#1e1e1e] animate-pulse border border-white/5"
                />
              ))}
            </div>
          ) : paginatedMerchants.length === 0 ? (
            <div className="glass-card rounded-2xl py-16 text-center border border-white/5">
              <div className="text-5xl mb-4 grayscale opacity-50">🍽️</div>
              <h3 className="text-xl font-semibold text-white mb-2">
                No restaurants found
              </h3>
              <p className="text-slate-400 mb-6">
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : "Try a different category"}
              </p>
              <button
                onClick={() => setSelectedCategory(null)}
                className="px-6 py-2.5 border border-white/10 hover:border-[#FF8C00]/30 rounded-xl text-white font-semibold text-sm transition-all hover:bg-white/5"
                type="button"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-5 pb-10">
              <AnimatePresence mode="popLayout">
                {paginatedMerchants.map((merchant, index) => (
                  <motion.div
                    key={merchant.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                  >
                    <Link href={`/merchants/${merchant.id}`}>
                      <div className="group h-full bg-gradient-to-b from-[#242424] to-[#1e1e1e] rounded-2xl overflow-hidden border border-white/5 hover:border-[#FF8C00]/40 shadow-soft hover:shadow-glow transition-all duration-300 transform hover:-translate-y-1 flex flex-col">
                        {/* Image Container */}
                        <div className="relative h-36 shrink-0 overflow-hidden bg-[#121212]">
                          {merchant.logoUrl ? (
                            <FallbackImage
                              alt={merchant.storeName}
                              className="object-cover group-hover:scale-110 group-hover:rotate-1 transition-transform duration-700 ease-out"
                              src={merchant.logoUrl}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-700">
                              🍽️
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#1e1e1e] via-transparent to-transparent opacity-90" />

                          {/* Top Badges */}
                          <div className="absolute top-2 left-2 flex gap-1.5">
                            {merchant.isOpen ? (
                              <span className="bg-emerald-500/90 text-white text-[0.65rem] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full shadow-sm backdrop-blur-md flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                                Open
                              </span>
                            ) : (
                              <span className="bg-rose-500/90 text-white text-[0.65rem] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full shadow-sm backdrop-blur-md">
                                Closed
                              </span>
                            )}
                          </div>

                          {/* Rating Floating Tag */}
                          <div className="absolute bottom-2 right-2">
                            <div className="flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10 shadow-lg">
                              <span className="material-symbols-outlined text-[#FF8C00] text-xs fill-1">
                                star
                              </span>
                              <span className="text-xs font-bold text-white">
                                {merchant.rating
                                  ? Number(merchant.rating).toFixed(1)
                                  : "NEW"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-3 flex-1 flex flex-col">
                          <h4 className="text-sm md:text-base font-bold text-white group-hover:text-[#FF8C00] transition-colors line-clamp-1 mb-1">
                            {merchant.storeName}
                          </h4>
                          <p className="text-[0.7rem] text-slate-400 font-medium line-clamp-2 leading-relaxed flex-1">
                            {merchant.description ||
                              "Authentic flavors & delicious meals"}
                          </p>

                          {/* Footer Metrics */}
                          <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/5">
                            <div className="flex items-center gap-2.5 text-[0.7rem] font-semibold text-slate-300">
                              <div className="flex items-center gap-1 bg-white/5 px-1.5 py-0.5 rounded-md">
                                <span className="material-symbols-outlined text-slate-400 text-[1rem]">
                                  schedule
                                </span>
                                <span>
                                  {merchant.estimatedDeliveryTime || 30}m
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="material-symbols-outlined text-[#FF8C00] text-[1rem]">
                                  two_wheeler
                                </span>
                                <span
                                  className={
                                    Number(merchant.deliveryFee) === 0
                                      ? "text-emerald-400"
                                      : ""
                                  }
                                >
                                  {Number(merchant.deliveryFee) === 0
                                    ? "Free"
                                    : formatRupiah(merchant.deliveryFee)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && merchants.length > 0 && (
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#121212]" />}>
      <HomeContent />
    </Suspense>
  );
}
