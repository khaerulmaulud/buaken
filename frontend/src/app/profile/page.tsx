"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import Footer from "@/components/layout/Footer";
import Navbar from "@/components/layout/Navbar";
import FallbackImage from "@/components/ui/FallbackImage";
import { useAuth } from "@/hooks/useAuth";
import ProfileEditModal from "./ProfileEditModal";

function ProfileContent() {
  const { user, isLoading, logout } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <span className="material-symbols-outlined text-[#FF8C00] text-4xl animate-spin">
            progress_activity
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] flex flex-col">
      <Navbar />
      <main className="flex-1 max-w-4xl mx-auto px-4 py-8 md:py-12 w-full">
        {/* Profile Header */}
        <div className="text-center mb-8 md:mb-12 relative max-w-sm mx-auto">
          {user && (
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="absolute top-0 right-0 md:right-4 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 hover:border-[#FF8C00]/50 transition-all group z-10 hidden sm:flex"
              title="Edit Profile"
            >
              <span className="material-symbols-outlined text-slate-400 group-hover:text-[#FF8C00] text-xl transition-colors">
                edit
              </span>
            </button>
          )}

          <div
            className="w-20 h-20 md:w-24 md:h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#FF8C00] to-orange-600 flex items-center justify-center ring-4 ring-[#FF8C00]/20 shadow-glow overflow-hidden relative group cursor-pointer"
            onClick={() => setIsEditModalOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                setIsEditModalOpen(true);
              }
            }}
          >
            {user?.avatarUrl ? (
              <FallbackImage
                src={user.avatarUrl}
                alt={user.name}
                fill
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-white text-3xl md:text-4xl font-black">
                {user?.name?.charAt(0).toUpperCase()}
              </span>
            )}
            {/* Hover Camera Icon overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-2xl">
                photo_camera
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              {user?.name}
            </h1>
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="sm:hidden p-1 rounded-full bg-white/5 text-slate-400 hover:text-[#FF8C00] flex items-center justify-center"
            >
              <span className="material-symbols-outlined text-lg">edit</span>
            </button>
          </div>

          <p className="text-slate-400 text-sm mt-1 capitalize">
            {user?.role} Account
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Personal Information */}
          <div className="glass-card rounded-2xl p-5 md:p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-lg bg-[#FF8C00]/15 flex items-center justify-center">
                <span className="material-symbols-outlined text-[#FF8C00]">
                  person
                </span>
              </div>
              <h2 className="text-lg font-bold text-white">
                Personal Information
              </h2>
            </div>
            <div className="space-y-4">
              {[
                { label: "Full Name", value: user?.name, icon: "badge" },
                { label: "Email", value: user?.email, icon: "mail" },
                {
                  label: "Role",
                  value: user?.role,
                  icon: "person_pin",
                  capitalize: true,
                },
                {
                  label: "Phone",
                  value: user?.phone || "Not set",
                  icon: "call",
                },
              ].map((field) => (
                <div key={field.label} className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-slate-500 text-lg">
                    {field.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 font-medium">
                      {field.label}
                    </p>
                    <p
                      className={`text-sm text-white font-medium truncate ${field.capitalize ? "capitalize" : ""}`}
                    >
                      {field.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-4 md:space-y-6 flex flex-col">
            {user?.role === "merchant" && (
              <Link
                href="/merchant"
                className="glass-card rounded-2xl p-5 md:p-6 group hover:border-cyan-500/30 transition-all flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-cyan-400 text-2xl">
                    storefront
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white group-hover:text-cyan-400 transition-colors">
                    Merchant Dashboard
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Manage menu, orders, and store settings
                  </p>
                </div>
                <span className="material-symbols-outlined text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all">
                  arrow_forward
                </span>
              </Link>
            )}

            {user?.role === "courier" && (
              <Link
                href="/courier"
                className="glass-card rounded-2xl p-5 md:p-6 group hover:border-teal-500/30 transition-all flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-teal-400 text-2xl">
                    delivery_dining
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white group-hover:text-teal-400 transition-colors">
                    Start Delivering
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Accept deliveries and earn
                  </p>
                </div>
                <span className="material-symbols-outlined text-slate-500 group-hover:text-teal-400 group-hover:translate-x-1 transition-all">
                  arrow_forward
                </span>
              </Link>
            )}

            <Link
              href="/orders"
              className="glass-card rounded-2xl p-5 md:p-6 group hover:border-[#FF8C00]/30 transition-all flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-[#FF8C00]/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-[#FF8C00] text-2xl">
                  receipt_long
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white group-hover:text-[#FF8C00] transition-colors">
                  Order History
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  View and track all your orders
                </p>
              </div>
              <span className="material-symbols-outlined text-slate-500 group-hover:text-[#FF8C00] group-hover:translate-x-1 transition-all">
                arrow_forward
              </span>
            </Link>

            {/* Logout */}
            <button
              onClick={() => logout()}
              className="glass-card rounded-2xl p-5 md:p-6 group hover:border-red-500/30 transition-all flex items-center gap-4 w-full text-left"
              type="button"
            >
              <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-red-400 text-2xl">
                  logout
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white group-hover:text-red-400 transition-colors">
                  Sign Out
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Log out of your account
                </p>
              </div>
              <span className="material-symbols-outlined text-slate-500 group-hover:text-red-400 group-hover:translate-x-1 transition-all">
                arrow_forward
              </span>
            </button>
          </div>
        </div>
      </main>

      {/* Edit Modal Popup */}
      {isEditModalOpen && user && (
        <ProfileEditModal
          user={user}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

      <Footer />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-[#121212] flex flex-col" />}
    >
      <ProfileContent />
    </Suspense>
  );
}
