"use client";

import Link from "next/link";
import { Suspense } from "react";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import { useCart } from "@/context/CartContext";
import { formatRupiah } from "@/lib/utils";

function CartContent() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart, merchant } =
    useCart();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4 text-center px-4">
          <span className="material-symbols-outlined text-6xl text-slate-600">
            shopping_cart
          </span>
          <h1 className="text-2xl font-bold text-white">Your cart is empty</h1>
          <p className="text-slate-400">Find some delicious food to order!</p>
          <Link
            href="/"
            className="px-6 py-3 bg-[#FF8C00] hover:bg-[#e07b00] text-white font-bold rounded-xl shadow-lg shadow-[#FF8C00]/20 transition-all"
          >
            Browse Restaurants
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col">
      <Navbar />
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-6 md:py-10 lg:px-8">
        {/* Title */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-1">
            Your Cart
          </h1>
          {merchant && (
            <p className="text-slate-400 text-sm md:text-base flex items-center gap-2">
              <span className="material-symbols-outlined text-[#FF8C00] text-base">
                storefront
              </span>
              Order from{" "}
              <span className="font-semibold text-white">
                {merchant.storeName}
              </span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 relative">
          {/* Cart Items */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            {items.map((item) => (
              <div
                key={item.menuItem.id}
                className="group flex flex-col sm:flex-row gap-4 p-4 rounded-xl bg-[#1e1e1e] border border-[#2a2a2a] hover:border-[#FF8C00]/30 transition-all duration-300"
              >
                <div className="shrink-0">
                  {item.menuItem.imageUrl ? (
                    <img
                      alt={item.menuItem.name}
                      className="w-full h-36 sm:w-28 sm:h-28 object-cover rounded-lg shadow-md"
                      src={item.menuItem.imageUrl}
                    />
                  ) : (
                    <div className="w-full h-36 sm:w-28 sm:h-28 bg-[#242424] rounded-lg flex items-center justify-center text-3xl">
                      🍔
                    </div>
                  )}
                </div>
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <h3 className="text-base md:text-lg font-bold text-white mb-1 group-hover:text-[#FF8C00] transition-colors">
                        {item.menuItem.name}
                      </h3>
                      <p className="text-slate-400 text-sm">
                        {formatRupiah(item.menuItem.price)} each
                      </p>
                    </div>
                    <span className="text-lg font-bold text-white shrink-0">
                      {formatRupiah(item.menuItem.price * item.quantity)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-3 sm:mt-0">
                    <button
                      onClick={() => removeItem(item.menuItem.id)}
                      className="text-slate-400 hover:text-red-400 text-sm font-medium flex items-center gap-1 transition-colors"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-lg">
                        delete
                      </span>
                      Remove
                    </button>
                    <div className="flex items-center bg-[#2a2a2a] rounded-lg p-1">
                      <button
                        className="w-8 h-8 flex items-center justify-center rounded bg-[#333] text-white hover:bg-[#FF8C00] transition-colors"
                        onClick={() =>
                          updateQuantity(item.menuItem.id, item.quantity - 1)
                        }
                        type="button"
                      >
                        <span className="material-symbols-outlined text-base">
                          remove
                        </span>
                      </button>
                      <span className="w-10 text-center text-white font-medium text-sm">
                        {item.quantity}
                      </span>
                      <button
                        className="w-8 h-8 flex items-center justify-center rounded bg-[#FF8C00] text-[#121212] hover:bg-[#e07b00] transition-colors"
                        onClick={() =>
                          updateQuantity(item.menuItem.id, item.quantity + 1)
                        }
                        type="button"
                      >
                        <span className="material-symbols-outlined text-base">
                          add
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Clear cart */}
            <button
              onClick={clearCart}
              className="text-red-400 hover:text-red-300 text-sm font-medium flex items-center gap-1 self-start transition-colors mt-2"
              type="button"
            >
              <span className="material-symbols-outlined text-lg">
                remove_shopping_cart
              </span>
              Clear Cart
            </button>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-4 relative">
            <div className="sticky top-24 space-y-4">
              <div className="glass-panel rounded-2xl p-6 shadow-xl flex flex-col gap-4">
                <h2 className="text-xl font-bold text-white border-b border-white/10 pb-4">
                  Order Summary
                </h2>
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-sm">
                      Subtotal ({items.reduce((a, i) => a + i.quantity, 0)}{" "}
                      items)
                    </span>
                    <span className="text-white font-medium">
                      {formatRupiah(totalPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400">
                    <span className="text-sm">Delivery Fee</span>
                    <span className="text-white font-medium">
                      {merchant?.deliveryFee
                        ? formatRupiah(merchant.deliveryFee)
                        : formatRupiah(0)}
                    </span>
                  </div>
                </div>
                <div className="h-px w-full bg-white/10" />
                <div className="flex justify-between items-end">
                  <span className="text-white font-bold text-lg">Total</span>
                  <span className="text-[#FF8C00] font-black text-2xl md:text-3xl tracking-tight">
                    {formatRupiah(
                      totalPrice + (Number(merchant?.deliveryFee) || 0),
                    )}
                  </span>
                </div>
                <Link
                  href="/checkout"
                  className="w-full mt-2 rounded-xl bg-[#FF8C00] px-4 py-3.5 text-base font-bold text-white shadow-glow hover:shadow-glow-lg hover:bg-[#e07b00] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2 text-center"
                >
                  Proceed to Checkout
                  <span className="material-symbols-outlined text-lg font-bold">
                    arrow_forward
                  </span>
                </Link>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500 flex items-center justify-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-green-500">
                    lock
                  </span>
                  Secure checkout powered by FoodDash
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function CartPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-[#121212] flex flex-col" />}
    >
      <CartContent />
    </Suspense>
  );
}
