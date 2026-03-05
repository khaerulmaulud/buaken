"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/axios";
import type { User } from "@/types";

interface ProfileEditModalProps {
  user: User;
  onClose: () => void;
}

export default function ProfileEditModal({
  user,
  onClose,
}: ProfileEditModalProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tab State: "basic" | "security"
  const [activeTab, setActiveTab] = useState<"basic" | "security">("basic");

  // Form States
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
    phone: user.phone || "",
  });

  const [securityData, setSecurityData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    user.avatarUrl || null,
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Mutations
  const updateProfileMutation = useMutation({
    mutationFn: async () => {
      // 1. Update Basic Info
      await api.put("/users/me/profile", {
        name: formData.name,
        phone: formData.phone,
      });

      // 2. Update Email if changed
      if (formData.email !== user.email) {
        await api.put("/users/me/email", { email: formData.email });
      }

      // 3. Update Avatar if a new file is selected
      if (selectedFile) {
        try {
          const fileData = new FormData();
          fileData.append("avatar", selectedFile);
          await api.post("/users/me/avatar", fileData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          // biome-ignore lint/suspicious/noExplicitAny: error from axios
        } catch (avatarError: any) {
          // Profile saved but avatar failed — notify user specifically
          queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
          toast.error(
            avatarError.response?.data?.error?.message ||
              "Profile saved, but avatar upload failed. Please try again.",
          );
          onClose();
          throw new Error("__avatar_partial_fail__");
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      toast.success("Profile updated successfully!");
      onClose();
    },
    // biome-ignore lint/suspicious/noExplicitAny: error from axios
    onError: (error: any) => {
      if (error.message === "__avatar_partial_fail__") return; // already handled
      toast.error(
        error.response?.data?.error?.message || "Failed to update profile",
      );
    },
  });

  const updatePasswordMutation = useMutation({
    mutationFn: async () => {
      await api.put("/users/me/password", {
        currentPassword: securityData.currentPassword,
        newPassword: securityData.newPassword,
      });
    },
    onSuccess: () => {
      toast.success("Password updated successfully!");
      setSecurityData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    },
    // biome-ignore lint/suspicious/noExplicitAny: error from axios
    onError: (error: any) => {
      toast.error(
        error.response?.data?.error?.message || "Failed to update password",
      );
    },
  });

  // Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB");
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBasicSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error("Name and Email are required");
      return;
    }
    updateProfileMutation.mutate();
  };

  const handleSecuritySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (securityData.newPassword !== securityData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (securityData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    updatePasswordMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
            onClose();
          }
        }}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-[#121212] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-black/20">
          <h2 className="text-xl font-black text-white">Edit Profile</h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5 bg-black/10">
          <button
            type="button"
            onClick={() => setActiveTab("basic")}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${
              activeTab === "basic"
                ? "text-[#FF8C00] border-b-2 border-[#FF8C00] bg-[#FF8C00]/5"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Basic Info
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`flex-1 py-4 text-sm font-bold transition-colors ${
              activeTab === "security"
                ? "text-[#FF8C00] border-b-2 border-[#FF8C00] bg-[#FF8C00]/5"
                : "text-slate-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Security
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto hide-scrollbar">
          {activeTab === "basic" ? (
            <form onSubmit={handleBasicSubmit} className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex flex-col items-center gap-4">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg, image/png, image/webp"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#FF8C00] to-[#cc7000] flex items-center justify-center cursor-pointer group shadow-lg ring-4 ring-black"
                >
                  {avatarPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-4xl font-black">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-2xl">
                      photo_camera
                    </span>
                  </div>
                </button>
                <p className="text-xs text-slate-500 font-medium">
                  Click to change avatar
                </p>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="fullName"
                    className="text-xs font-bold text-slate-400 ml-1"
                  >
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] transition-all"
                    placeholder="Enter your name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="emailAddress"
                    className="text-xs font-bold text-slate-400 ml-1"
                  >
                    Email Address
                  </label>
                  <input
                    id="emailAddress"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] transition-all"
                    placeholder="Enter your email"
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="phoneNumber"
                    className="text-xs font-bold text-slate-400 ml-1"
                  >
                    Phone Number
                  </label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] transition-all"
                    placeholder="Enter phone number"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={updateProfileMutation.isPending}
                className="w-full py-4 bg-[#FF8C00] hover:bg-[#ff9d2e] rounded-xl text-[#121212] font-black text-sm transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center"
              >
                {updateProfileMutation.isPending ? (
                  <span className="material-symbols-outlined animate-spin text-[20px]">
                    progress_activity
                  </span>
                ) : (
                  "Save Changes"
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSecuritySubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label
                    htmlFor="currentPassword"
                    className="text-xs font-bold text-slate-400 ml-1"
                  >
                    Current Password
                  </label>
                  <input
                    id="currentPassword"
                    type="password"
                    value={securityData.currentPassword}
                    onChange={(e) =>
                      setSecurityData({
                        ...securityData,
                        currentPassword: e.target.value,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] transition-all"
                    placeholder="Enter current password"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="newPassword"
                    className="text-xs font-bold text-slate-400 ml-1"
                  >
                    New Password
                  </label>
                  <input
                    id="newPassword"
                    type="password"
                    value={securityData.newPassword}
                    onChange={(e) =>
                      setSecurityData({
                        ...securityData,
                        newPassword: e.target.value,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] transition-all"
                    placeholder="Enter new password"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label
                    htmlFor="confirmPassword"
                    className="text-xs font-bold text-slate-400 ml-1"
                  >
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={securityData.confirmPassword}
                    onChange={(e) =>
                      setSecurityData({
                        ...securityData,
                        confirmPassword: e.target.value,
                      })
                    }
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-[#FF8C00] focus:ring-1 focus:ring-[#FF8C00] transition-all"
                    placeholder="Confirm new password"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={updatePasswordMutation.isPending}
                className="w-full py-4 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl text-white font-bold text-sm transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {updatePasswordMutation.isPending ? (
                  <span className="material-symbols-outlined animate-spin text-[20px]">
                    progress_activity
                  </span>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[20px]">
                      lock_reset
                    </span>
                    Update Password
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
