"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bike,
  Car,
  Loader2,
  Pencil,
  Save,
  Star,
  Truck,
  User,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import ProfileEditModal from "@/app/profile/ProfileEditModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/axios";
import type { ApiResponse, CourierProfile, VehicleType } from "@/types";

// biome-ignore lint/suspicious/noExplicitAny: allow any for lucide icons
const VEHICLE_TYPES: { value: VehicleType; label: string; icon: any }[] = [
  { value: "motorcycle", label: "Motorcycle", icon: Bike },
  { value: "bicycle", label: "Bicycle", icon: Bike },
  { value: "car", label: "Car", icon: Car },
];

export default function CourierProfilePage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: courier, isLoading } = useQuery({
    queryKey: ["courier-profile"],
    queryFn: async () => {
      const res =
        await api.get<ApiResponse<CourierProfile>>("/courier/profile");
      return res.data.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: {
      vehicleType: VehicleType;
      vehicleNumber: string;
    }) => {
      const res = await api.patch<ApiResponse<CourierProfile>>(
        "/courier/profile",
        data,
      );
      return res.data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["courier-profile"], data);
      toast.success("Profile updated successfully", {
        description: "Your vehicle details have been saved.",
      });
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      vehicleType: formData.get("vehicleType") as VehicleType,
      vehicleNumber: formData.get("vehicleNumber") as string,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!courier) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <User className="h-16 w-16 text-muted-foreground/30" />
        <h3 className="text-xl font-semibold">Profile not found</h3>
        <p className="text-muted-foreground">
          Please contact support to set up your courier profile.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Profile Header */}
      <div className="glass-card p-6 md:p-8 rounded-3xl ring-1 ring-border/50 bg-gradient-to-br from-[#1e1e1e] to-[#242424] flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 p-1 shrink-0 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full rounded-full bg-background flex items-center justify-center overflow-hidden">
              {user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl md:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-emerald-500 uppercase">
                  {user?.name?.charAt(0) || "D"}
                </span>
              )}
            </div>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
              {user?.name || "Driver"}
            </h1>
            <p className="text-slate-400 text-sm md:text-base flex items-center gap-1.5 mb-2">
              <User className="h-4 w-4" />
              {user?.email || "driver@fooddash.com"}
            </p>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[0.7rem] font-bold tracking-widest uppercase ring-1 ring-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Active Courier
            </div>
          </div>
        </div>

        <Button
          onClick={() => setIsEditModalOpen(true)}
          variant="outline"
          className="bg-white/5 border-white/10 hover:bg-white/10 text-white rounded-xl shrink-0 gap-2 self-start md:self-center"
        >
          <Pencil className="w-4 h-4" />
          Edit Profile
        </Button>
      </div>

      {isEditModalOpen && user && (
        <ProfileEditModal
          user={user}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-6 rounded-3xl ring-1 ring-border/50 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-emerald-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-emerald-600 dark:text-emerald-400 mb-1">
                Total Deliveries
              </p>
              <h2 className="text-4xl md:text-5xl font-black">
                {courier.totalDeliveries}
              </h2>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Truck className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-emerald-500/20 text-sm text-muted-foreground">
            Complete more deliveries to climb the ranks!
          </div>
        </div>

        <div className="glass-card p-6 rounded-3xl ring-1 ring-border/50 bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/20">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-medium text-amber-600 dark:text-amber-400 mb-1">
                Overall Rating
              </p>
              <div className="flex items-baseline gap-2">
                <h2 className="text-4xl md:text-5xl font-black">
                  {Number(courier.rating).toFixed(1)}
                </h2>
                <Star className="h-6 w-6 sm:h-8 sm:w-8 fill-amber-500 text-amber-500" />
              </div>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Star className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-amber-500/20 text-sm text-muted-foreground">
            Keep providing excellent service to maintain your high score.
          </div>
        </div>
      </div>

      {/* Settings Form */}
      <form onSubmit={handleSubmit}>
        <div className="glass-card p-6 md:p-8 rounded-3xl ring-1 ring-border/50">
          <div className="flex items-center gap-2 mb-8 text-xl font-bold">
            <Car className="w-6 h-6 text-primary" />
            <h2>Vehicle Details</h2>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <Label className="text-base font-semibold">
                Select Vehicle Type
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {VEHICLE_TYPES.map((type) => (
                  <label key={type.value} className="cursor-pointer group">
                    <input
                      type="radio"
                      name="vehicleType"
                      value={type.value}
                      defaultChecked={courier.vehicleType === type.value}
                      className="sr-only peer"
                    />
                    <div className="flex flex-col items-center gap-3 p-6 border-2 border-transparent rounded-2xl transition-all duration-300 bg-muted/50 hover:bg-muted peer-checked:border-emerald-500 peer-checked:bg-emerald-50 dark:peer-checked:bg-emerald-950/30 peer-checked:shadow-lg peer-checked:shadow-emerald-500/20">
                      <div className="h-12 w-12 rounded-full bg-background flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-300 peer-checked:text-emerald-600 dark:peer-checked:text-emerald-400">
                        <type.icon className="h-6 w-6" />
                      </div>
                      <span className="font-semibold text-lg">
                        {type.label}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t">
              <Label
                htmlFor="vehicleNumber"
                className="text-base font-semibold"
              >
                Vehicle Number Plate
              </Label>
              <Input
                id="vehicleNumber"
                name="vehicleNumber"
                defaultValue={courier.vehicleNumber}
                placeholder="e.g. B 1234 XYZ"
                className="input-modern max-w-sm text-lg uppercase h-12"
                required
              />
              <p className="text-sm text-muted-foreground">
                This helps customers easily identify you upon arrival.
              </p>
            </div>

            {/* Submit Action */}
            <div className="pt-8 flex justify-end">
              <Button
                type="submit"
                disabled={updateMutation.isPending}
                size="lg"
                className="bg-emerald-600 hover:bg-emerald-700/90 text-white rounded-xl shadow-lg border-b-4 border-emerald-800 active:border-b-0 active:translate-y-1 transition-all px-8 h-14"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Save className="mr-2 h-5 w-5" />
                )}
                Save Vehicle Details
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
