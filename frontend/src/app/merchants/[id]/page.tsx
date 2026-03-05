"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { use, useState } from "react";
import { toast } from "sonner";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { ReviewCard } from "@/components/reviews/ReviewCard";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import FallbackImage from "@/components/ui/FallbackImage";
import { Textarea } from "@/components/ui/textarea";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/axios";
import { formatRupiah } from "@/lib/utils";
import type { ApiResponse, MenuItem, Merchant, Review } from "@/types";

/* ─── Motion presets ─── */
const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.04 } },
};

const cardVariant = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.25 } },
  exit: { opacity: 0 },
};

export default function MerchantDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const pathname = usePathname();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"menu" | "reviews" | "info">(
    "menu",
  );
  const {
    addItem,
    setMerchant: setCartMerchant,
    merchant: cartMerchant,
    totalItems,
    totalPrice,
  } = useCart();

  /* ─── Queries ─── */
  const { data: merchantData, isLoading: isMerchantLoading } = useQuery({
    queryKey: ["merchant", id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Merchant>>(`/merchants/${id}`);
      return res.data.data;
    },
  });

  const { data: menuData, isLoading: isMenuLoading } = useQuery({
    queryKey: ["menu", id],
    queryFn: async () => {
      const res = await api.get<ApiResponse<MenuItem[]>>(
        `/merchants/${id}/menu`,
      );
      return res.data;
    },
  });

  const { data: reviewsData, isLoading: isReviewsLoading } = useQuery({
    queryKey: ["reviews", "merchant", id],
    queryFn: async () => {
      const res = await api.get<{
        success: boolean;
        data: Review[];
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        meta: any;
      }>(`/reviews/merchant/${id}?limit=20`);
      return { reviews: res.data.data, meta: res.data.meta };
    },
  });

  const { data: userOrdersData } = useQuery({
    queryKey: ["user-orders", "merchant", id],
    queryFn: async () => {
      if (!user) return [];
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      const res = await api.get<ApiResponse<any[]>>(
        `/orders?merchantId=${id}&status=delivered`,
      );
      return res.data.data || [];
    },
    enabled: !!user && !!id,
  });

  const userOrders = userOrdersData || [];

  /* ─── Mutations ─── */
  const createReviewMutation = useMutation({
    mutationFn: async (data: {
      rating: number;
      comment?: string;
      imageUrl?: string;
    }) => {
      const payload = { merchantId: id, ...data };
      const res = await api.post<ApiResponse<Review>>("/reviews", payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["reviews", "merchant", id],
      });
      toast.success("Review submitted successfully!");
      setReviewDialogOpen(false);
    },
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    onError: (error: any) => {
      const errorMessage =
        error.response?.data?.error?.message ||
        error.message ||
        "Failed to submit review.";
      toast.error(
        typeof errorMessage === "string" ? errorMessage : "An error occurred",
      );
    },
  });

  const [replyReviewId, setReplyReviewId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const isOwner = user?.id === merchantData?.userId;

  const replyMutation = useMutation({
    mutationFn: async (data: { reviewId: string; reply: string }) => {
      const res = await api.patch<{ data: Review }>(
        `/reviews/${data.reviewId}/reply`,
        { reply: data.reply },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["reviews", "merchant", id],
      });
      toast.success("Reply submitted successfully");
      setReplyReviewId(null);
      setReplyText("");
    },
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message || "Failed to submit reply",
      );
    },
  });

  const merchant = merchantData;
  const menuItems = menuData?.data || [];
  const reviews = reviewsData?.reviews || [];

  const addToCart = (item: MenuItem) => {
    if (!merchant) return;
    if (!cartMerchant || cartMerchant.id === merchant.id) {
      setCartMerchant(merchant);
    }
    addItem(item, 1);
    toast.success(`${item.name} added to cart`);
  };

  /* ─── Loading state ─── */
  if (isMerchantLoading || isMenuLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <span className="material-symbols-outlined text-[#FF8C00] text-4xl animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  /* ─── 404 state ─── */
  if (!merchant) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <span className="material-symbols-outlined text-6xl text-slate-600 mb-4">
            store_mall_directory
          </span>
          <h1 className="text-2xl font-bold text-white mb-4">
            Restaurant not found
          </h1>
          <Link
            href="/"
            className="px-6 py-3 bg-[#FF8C00] hover:bg-[#e07b00] text-white font-bold rounded-xl shadow-lg shadow-[#FF8C00]/20 transition-all"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "menu" as const, label: "Menu", icon: "restaurant_menu" },
    {
      id: "reviews" as const,
      label: `Reviews (${reviews.length})`,
      icon: "rate_review",
    },
    { id: "info" as const, label: "Info", icon: "info" },
  ];

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col">
      <Navbar />

      {/* ═══ Banner Image ═══ */}
      <div className="relative h-40 sm:h-52 md:h-64 overflow-hidden">
        {merchant.bannerUrl ? (
          <FallbackImage
            src={merchant.bannerUrl}
            alt={merchant.storeName}
            className="object-cover"
            fill
            priority
            sizes="100vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#1e1e1e] to-[#0a0a0a]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/40 to-transparent" />

        {/* Back button */}
        <div className="absolute top-4 left-4 sm:top-5 sm:left-6 z-10">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm text-slate-300 hover:text-white transition-colors glass px-3 py-2 rounded-full hover:shadow-glow"
          >
            <span className="material-symbols-outlined text-sm">
              arrow_back
            </span>
            Back
          </Link>
        </div>
      </div>

      {/* ═══ Merchant Identity Card — overlaps banner ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
        className="relative -mt-12 sm:-mt-14 z-10 max-w-5xl mx-auto w-full px-4 sm:px-6"
      >
        <div className="glass-card rounded-2xl p-4 sm:p-5 md:p-6">
          <div className="flex gap-4 items-start">
            {/* Logo — large, overlapping */}
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 border-[#FF8C00]/30 bg-[#1e1e1e] shadow-xl shrink-0 -mt-10 sm:-mt-12 relative">
              {merchant.logoUrl ? (
                <FallbackImage
                  src={merchant.logoUrl}
                  alt={merchant.storeName}
                  className="object-cover"
                  fill
                  sizes="80px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#242424] to-[#1a1a1a]">
                  <span className="material-symbols-outlined text-[#FF8C00] text-2xl sm:text-3xl">
                    storefront
                  </span>
                </div>
              )}
            </div>

            {/* Text info */}
            <div className="flex-1 min-w-0 pt-0.5">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white truncate">
                {merchant.storeName}
              </h1>
              <p className="text-slate-400 text-xs sm:text-sm mt-1 line-clamp-2">
                {merchant.description || "Authentic flavors & delicious meals"}
              </p>

              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {merchant.rating && (
                  <div className="flex items-center gap-1 bg-[#FF8C00]/10 border border-[#FF8C00]/20 px-2.5 py-1 rounded-full text-sm">
                    <span className="material-symbols-outlined text-[#FF8C00] text-sm fill-1">
                      star
                    </span>
                    <span className="font-bold text-white text-xs">
                      {Number(merchant.rating).toFixed(1)}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      ({merchant.totalReviews})
                    </span>
                  </div>
                )}
                <div
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                    merchant.isOpen
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-red-500/10 text-red-400 border border-red-500/20"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  {merchant.isOpen ? "Open" : "Closed"}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <span className="material-symbols-outlined text-sm">
                    schedule
                  </span>
                  {merchant.estimatedDeliveryTime || 30} min
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-400">
                  <span className="material-symbols-outlined text-sm">
                    delivery_dining
                  </span>
                  {Number(merchant.deliveryFee) === 0
                    ? "Free"
                    : formatRupiah(merchant.deliveryFee)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ═══ Quick Info — Responsive Grid ═══ */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
        className="max-w-5xl mx-auto w-full px-4 sm:px-6 mt-4"
      >
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {[
            {
              icon: "location_on",
              label: "Location",
              value: merchant.city || "N/A",
              color: "text-sky-400",
            },
            {
              icon: "schedule",
              label: "Hours",
              value:
                merchant.openingTime && merchant.closingTime
                  ? `${merchant.openingTime} – ${merchant.closingTime}`
                  : "Always open",
              color: "text-emerald-400",
            },
            {
              icon: "delivery_dining",
              label: "Delivery",
              value: merchant.deliveryFee
                ? formatRupiah(merchant.deliveryFee)
                : "Free",
              color: "text-[#FF8C00]",
            },
            // {
            //   icon: "receipt",
            //   label: "Min. Order",
            //   value: merchant.minOrder
            //     ? formatRupiah(merchant.minOrder)
            //     : "None",
            //   color: "text-violet-400",
            // },
          ].map((info, i) => (
            <motion.div
              key={info.icon}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.25 + i * 0.05 }}
              className="flex items-center gap-2.5 glass-card rounded-xl px-3.5 py-3"
            >
              <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                <span
                  className={`material-symbols-outlined ${info.color} text-base`}
                >
                  {info.icon}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                  {info.label}
                </p>
                <p className="text-xs font-semibold text-white truncate">
                  {info.value}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ═══ Tabs ═══ */}
      <div className="sticky top-[60px] z-30 bg-[#121212]/95 backdrop-blur-md border-b border-white/5 mt-5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 sm:px-5 py-3 text-sm font-semibold transition-all border-b-2 ${
                  activeTab === tab.id
                    ? "text-[#FF8C00] border-[#FF8C00]"
                    : "text-slate-400 border-transparent hover:text-white hover:border-white/20"
                }`}
              >
                <span className="material-symbols-outlined text-lg hidden sm:inline">
                  {tab.icon}
                </span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ Tab Content ═══ */}
      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 py-5 md:py-6 w-full">
        <AnimatePresence mode="wait">
          {/* ── Menu Tab ── */}
          {activeTab === "menu" && (
            <motion.div
              key="menu"
              {...fadeUp}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              {menuItems.length === 0 ? (
                <div className="text-center py-16">
                  <span className="material-symbols-outlined text-5xl text-slate-600 mb-4 block">
                    menu_book
                  </span>
                  <p className="text-slate-400">
                    No menu items available right now.
                  </p>
                </div>
              ) : (
                <motion.div
                  variants={stagger}
                  initial="initial"
                  animate="animate"
                  className="flex flex-col gap-3 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4"
                >
                  {menuItems.map((item) => (
                    <motion.div
                      key={item.id}
                      variants={cardVariant}
                      className="group bg-gradient-to-r sm:bg-gradient-to-b from-[#1e1e1e] to-[#242424] sm:from-[#242424] sm:to-[#1e1e1e] rounded-xl sm:rounded-2xl overflow-hidden border border-white/5 hover:border-[#FF8C00]/30 shadow-soft hover:shadow-glow transition-all duration-300"
                    >
                      {/* Mobile: horizontal compact layout */}
                      <div className="flex sm:hidden">
                        <div className="relative w-28 h-28 shrink-0 overflow-hidden bg-[#121212]">
                          {item.imageUrl ? (
                            <FallbackImage
                              src={item.imageUrl}
                              alt={item.name}
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              fill
                              sizes="112px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a]">
                              <span className="material-symbols-outlined text-slate-600 text-3xl">
                                restaurant
                              </span>
                            </div>
                          )}
                          {!item.isAvailable && (
                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                              <span className="bg-red-500/80 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
                                Unavailable
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                          <div>
                            <h3 className="font-bold text-white text-sm group-hover:text-[#FF8C00] transition-colors truncate">
                              {item.name}
                            </h3>
                            <p className="text-slate-500 text-xs mt-0.5 line-clamp-2">
                              {item.description || "Delicious food item"}
                            </p>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[#FF8C00] font-bold text-sm">
                              {formatRupiah(item.price)}
                            </span>
                            <button
                              type="button"
                              onClick={() => addToCart(item)}
                              disabled={!item.isAvailable || !merchant.isOpen}
                              className="flex items-center gap-0.5 bg-[#FF8C00] hover:bg-[#e07b00] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-[11px] px-2.5 py-1.5 rounded-lg transition-all"
                            >
                              <span className="material-symbols-outlined text-sm">
                                add
                              </span>
                              Add
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Desktop: vertical card layout */}
                      <div className="hidden sm:block">
                        <div className="relative h-36 md:h-40 overflow-hidden bg-[#121212]">
                          {item.imageUrl ? (
                            <FallbackImage
                              src={item.imageUrl}
                              alt={item.name}
                              className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                              fill
                              sizes="(max-width: 1024px) 50vw, 33vw"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a]">
                              <span className="material-symbols-outlined text-slate-600 text-4xl">
                                restaurant
                              </span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-[#1e1e1e] via-transparent to-transparent opacity-60" />
                          {!item.isAvailable && (
                            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                              <span className="bg-red-500/80 text-white px-3 py-1 rounded-full text-xs font-bold">
                                Unavailable
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-bold text-white text-sm group-hover:text-[#FF8C00] transition-colors truncate">
                            {item.name}
                          </h3>
                          <p className="text-slate-500 text-xs mt-1 line-clamp-2 h-8">
                            {item.description || "Delicious food item"}
                          </p>
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                            <span className="text-[#FF8C00] font-bold text-base">
                              {formatRupiah(item.price)}
                            </span>
                            <button
                              type="button"
                              onClick={() => addToCart(item)}
                              disabled={!item.isAvailable || !merchant.isOpen}
                              className="flex items-center gap-1 bg-[#FF8C00] hover:bg-[#e07b00] disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs px-3 py-2 rounded-lg transition-all shadow-sm hover:shadow-[#FF8C00]/30 hover:shadow-md"
                            >
                              <span className="material-symbols-outlined text-base">
                                add
                              </span>
                              Add
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── Reviews Tab ── */}
          {activeTab === "reviews" && (
            <motion.div
              key="reviews"
              {...fadeUp}
              transition={{ duration: 0.25 }}
              className="space-y-5"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#FF8C00]">
                    reviews
                  </span>
                  Customer Reviews
                </h3>
                <button
                  type="button"
                  onClick={() => setReviewDialogOpen(true)}
                  className="px-4 py-2 bg-[#FF8C00] hover:bg-[#e07b00] text-white font-bold text-sm rounded-xl transition-all flex items-center gap-1.5 hover:shadow-lg hover:shadow-[#FF8C00]/20"
                >
                  <span className="material-symbols-outlined text-base">
                    edit
                  </span>
                  Write Review
                </button>
              </div>

              {isReviewsLoading ? (
                <div className="flex justify-center py-12">
                  <span className="material-symbols-outlined text-[#FF8C00] text-3xl animate-spin">
                    progress_activity
                  </span>
                </div>
              ) : (
                <motion.div
                  variants={stagger}
                  initial="initial"
                  animate="animate"
                  className="grid gap-3"
                >
                  {reviews?.map((review) => (
                    <motion.div key={review.id} variants={cardVariant}>
                      <ReviewCard
                        review={review}
                        showReplyButton={isOwner && !review.merchantReply}
                        onReply={(rid) => setReplyReviewId(rid)}
                        merchantName={merchant?.storeName}
                      />
                    </motion.div>
                  ))}
                  {reviews?.length === 0 && (
                    <div className="text-center py-12 glass-card rounded-2xl">
                      <span className="material-symbols-outlined text-4xl text-slate-600 mb-3 block">
                        rate_review
                      </span>
                      <p className="text-slate-400">
                        No reviews yet. Be the first to review!
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          )}

          {/* ── Info Tab ── */}
          {activeTab === "info" && (
            <motion.div
              key="info"
              {...fadeUp}
              transition={{ duration: 0.25 }}
              className="space-y-4 max-w-2xl"
            >
              {/* About */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="glass-card rounded-2xl p-5"
              >
                <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#FF8C00] text-lg">
                    storefront
                  </span>
                  About {merchant.storeName}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {merchant.description ||
                    "Welcome to our restaurant! We serve delicious food with love."}
                </p>
              </motion.div>

              {/* Details */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12 }}
                className="glass-card rounded-2xl p-5 space-y-4"
              >
                <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#FF8C00] text-lg">
                    info
                  </span>
                  Details
                </h3>
                {[
                  {
                    icon: "location_on",
                    label: "Address",
                    value:
                      [merchant.addressLine, merchant.city]
                        .filter(Boolean)
                        .join(", ") || "Not specified",
                    color: "text-sky-400",
                  },
                  ...(merchant.phone
                    ? [
                        {
                          icon: "call",
                          label: "Phone",
                          value: merchant.phone,
                          color: "text-emerald-400",
                        },
                      ]
                    : []),
                  {
                    icon: "schedule",
                    label: "Operating Hours",
                    value:
                      merchant.openingTime && merchant.closingTime
                        ? `${merchant.openingTime} – ${merchant.closingTime}`
                        : "Always open",
                    color: "text-violet-400",
                  },
                  {
                    icon: "delivery_dining",
                    label: "Delivery Fee",
                    value: merchant.deliveryFee
                      ? formatRupiah(merchant.deliveryFee)
                      : "Free delivery",
                    color: "text-[#FF8C00]",
                  },
                  // {
                  //   icon: "receipt",
                  //   label: "Minimum Order",
                  //   value: merchant.minOrder
                  //     ? formatRupiah(merchant.minOrder)
                  //     : "No minimum",
                  //   color: "text-amber-400",
                  // },
                ].map((info) => (
                  <div key={info.label} className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 mt-0.5">
                      <span
                        className={`material-symbols-outlined ${info.color} text-base`}
                      >
                        {info.icon}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                        {info.label}
                      </p>
                      <p className="text-sm text-white font-medium mt-0.5">
                        {info.value}
                      </p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ═══ Floating Cart Bar ═══ */}
      <AnimatePresence>
        {totalItems > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="sticky bottom-0 z-30 bg-gradient-to-t from-[#121212] via-[#121212] to-transparent pt-4 pb-3 px-4"
          >
            <div className="max-w-5xl mx-auto">
              <Link href="/cart">
                <div className="glass-panel rounded-2xl px-5 py-3.5 flex items-center justify-between hover:border-[#FF8C00]/40 transition-all cursor-pointer shadow-glow-lg group">
                  <div className="flex items-center gap-3">
                    <div className="bg-[#FF8C00] text-white rounded-lg w-9 h-9 flex items-center justify-center font-bold text-sm group-hover:scale-110 transition-transform">
                      {totalItems}
                    </div>
                    <span className="text-white font-bold text-sm">
                      View Cart
                    </span>
                  </div>
                  <span className="text-[#FF8C00] font-black text-lg">
                    {formatRupiah(totalPrice)}
                  </span>
                </div>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />

      {/* ═══ Write Review Dialog ═══ */}
      <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Write a Review</DialogTitle>
          </DialogHeader>

          {!user ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Please log in to write a review
              </p>
              <Link href={`/login?returnUrl=${encodeURIComponent(pathname)}`}>
                <Button className="mt-4">Log In</Button>
              </Link>
            </div>
          ) : (
            <ReviewForm
              onSubmit={(data) => {
                if (userOrders.length > 0) {
                  setSelectedOrderId(userOrders[0].id);
                }
                createReviewMutation.mutate(data);
              }}
              isLoading={createReviewMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ═══ Reply Dialog ═══ */}
      <Dialog
        open={!!replyReviewId}
        onOpenChange={(open) => !open && setReplyReviewId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reply to Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Write your reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReplyReviewId(null)}>
              Cancel
            </Button>
            <Button
              disabled={!replyText.trim() || replyMutation.isPending}
              onClick={() =>
                replyReviewId &&
                replyMutation.mutate({
                  reviewId: replyReviewId,
                  reply: replyText,
                })
              }
            >
              {replyMutation.isPending ? "Submitting..." : "Submit Reply"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
