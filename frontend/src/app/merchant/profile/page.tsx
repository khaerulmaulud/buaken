"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Save,
  Store,
  Truck,
  UploadCloud,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { LocationPicker } from "@/components/LocationPicker";
import { Button } from "@/components/ui/button";
import FallbackImage from "@/components/ui/FallbackImage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Map as MapComponent,
  MapControls,
  MapMarker,
  MarkerContent,
} from "@/components/ui/map";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/axios";
import type { ApiResponse, Merchant } from "@/types";

export default function MerchantProfilePage() {
  const queryClient = useQueryClient();
  const [isHoveringBanner, setIsHoveringBanner] = useState(false);
  const [isHoveringLogo, setIsHoveringLogo] = useState(false);
  const [mapLocation, setMapLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const { data: merchant, isLoading } = useQuery({
    queryKey: ["merchant-profile"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Merchant>>("/merchant/profile");
      return res.data.data;
    },
  });

  useEffect(() => {
    if (merchant?.latitude && merchant?.longitude) {
      setMapLocation({
        lat: Number.parseFloat(merchant.latitude),
        lng: Number.parseFloat(merchant.longitude),
      });
    }
  }, [merchant]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<Merchant>) => {
      const res = await api.patch<ApiResponse<Merchant>>(
        `/merchant/profile/${merchant?.id}`,
        data,
      );
      return res.data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["merchant-profile"], data);
      toast.success("Store profile updated successfully", {
        description: "Your changes are now live to customers.",
      });
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  const uploadLogoMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("logo", file);
      const res = await api.patch<ApiResponse<Merchant>>(
        `/merchant/profile/${merchant?.id}/logo`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return res.data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["merchant-profile"], data);
      toast.success("Logo uploaded successfully");
    },
    onError: () => toast.error("Failed to upload logo"),
  });

  const uploadBannerMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("banner", file);
      const res = await api.patch<ApiResponse<Merchant>>(
        `/merchant/profile/${merchant?.id}/banner`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return res.data.data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["merchant-profile"], data);
      toast.success("Banner uploaded successfully");
    },
    onError: () => toast.error("Failed to upload banner"),
  });

  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateMutation.mutate({
      storeName: formData.get("storeName") as string,
      description: formData.get("description") as string,
      addressLine: formData.get("addressLine") as string,
      city: formData.get("city") as string,
      phone: formData.get("phone") as string,
      deliveryFee: Number(formData.get("deliveryFee")),
      minOrder: Number(formData.get("minOrder")),
      estimatedDeliveryTime: Number(formData.get("estimatedDeliveryTime")),
      openingTime: formData.get("openingTime") as string,
      closingTime: formData.get("closingTime") as string,
      latitude: mapLocation?.lat.toString() || merchant?.latitude || "",
      longitude: mapLocation?.lng.toString() || merchant?.longitude || "",
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <Store className="h-16 w-16 text-muted-foreground/30" />
        <h3 className="text-xl font-semibold">Profile not found</h3>
        <p className="text-muted-foreground">
          Please set up your merchant profile first.
        </p>
      </div>
    );
  }

  const defaultBanner =
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=2000";
  const defaultLogo = `https://ui-avatars.com/api/?name=${encodeURIComponent(merchant.storeName)}&background=random`;

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-2xl md:text-3xl font-black text-white tracking-widest uppercase mb-1">
          Store Configuration
        </h1>
        <p className="text-xs text-zinc-500 font-mono tracking-wider uppercase">
          Operational Parameters & Profile Matrix
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Banner Section */}
        <section className="space-y-4">
          <h2 className="text-xs font-black uppercase text-amber-500 tracking-widest border-b border-white/5 pb-2">
            01. Visual Assets
          </h2>

          <div className="border border-white/10 bg-[#050505] p-4 relative group">
            <div
              className="h-48 w-full bg-[#111] overflow-hidden relative"
              onMouseEnter={() => setIsHoveringBanner(true)}
              onMouseLeave={() => setIsHoveringBanner(false)}
            >
              <FallbackImage
                src={merchant.bannerUrl || defaultBanner}
                alt="Store Banner"
                fill
                className="object-cover opacity-80"
              />
              <div
                className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${isHoveringBanner ? "opacity-100" : "opacity-0"}`}
              />
              <div
                className={`absolute inset-0 z-20 flex items-center justify-center transition-all duration-300 ${isHoveringBanner ? "opacity-100 scale-100" : "opacity-0 scale-95 pointer-events-none"}`}
              >
                <div className="bg-[#0a0a0a] p-4 border border-white/20 w-full max-w-md mx-4 rounded-sm flex flex-col items-center">
                  <UploadCloud className="w-8 h-8 text-amber-500 mb-2 opacity-80" />
                  <Label className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase mb-4 text-center cursor-pointer">
                    Upload Banner Image
                  </Label>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={bannerInputRef}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadBannerMutation.mutate(file);
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full bg-[#050505] border-white/10 hover:border-amber-500 hover:text-amber-500 text-white"
                    onClick={() => bannerInputRef.current?.click()}
                    disabled={uploadBannerMutation.isPending}
                  >
                    {uploadBannerMutation.isPending
                      ? "Uploading..."
                      : "Select File"}
                  </Button>
                </div>
              </div>
            </div>

            <div
              className="absolute -bottom-8 md:-bottom-12 left-6 md:left-8 z-30 w-28 h-28 md:w-36 md:h-36 border-4 border-[#050505] bg-[#111] overflow-hidden rounded-sm group/logo"
              onMouseEnter={() => setIsHoveringLogo(true)}
              onMouseLeave={() => setIsHoveringLogo(false)}
            >
              <FallbackImage
                src={merchant.logoUrl || defaultLogo}
                alt="Store Logo"
                fill
                className="object-cover"
                unoptimized
              />
              <div
                className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${isHoveringLogo ? "opacity-100" : "opacity-0"}`}
              />
              <button
                type="button"
                aria-label="Upload Logo"
                className={`absolute inset-0 z-20 w-full h-full flex flex-col items-center justify-center cursor-pointer transition-all duration-300 p-2 ${isHoveringLogo ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"}`}
                onClick={() => logoInputRef.current?.click()}
              >
                {uploadLogoMutation.isPending ? (
                  <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
                ) : (
                  <>
                    <UploadCloud className="h-6 w-6 text-amber-500 mb-1" />
                    <span className="text-white text-[10px] mb-1 font-mono uppercase tracking-widest text-center cursor-pointer">
                      Upload Logo
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  ref={logoInputRef}
                  tabIndex={-1}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadLogoMutation.mutate(file);
                  }}
                />
              </button>
            </div>
          </div>
        </section>

        {/* Basic Identity */}
        <section className="space-y-4 pt-8 border-t border-white/10">
          <h2 className="text-xs font-black uppercase text-amber-500 tracking-widest border-b border-white/5 pb-2">
            02. Identity Coordinates
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#0a0a0a] p-6 border border-white/10 rounded-sm">
            <div className="space-y-2">
              <Label className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
                Store Designation
              </Label>
              <Input
                id="storeName"
                name="storeName"
                defaultValue={merchant.storeName}
                required
                className="bg-[#050505] border-white/10 rounded-sm focus-visible:ring-amber-500 font-mono text-white h-12"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
                Comm Link (Phone)
              </Label>
              <Input
                id="phone"
                name="phone"
                defaultValue={merchant.phone}
                className="bg-[#050505] border-white/10 rounded-sm focus-visible:ring-amber-500 font-mono text-white h-12"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
                General Parameters
              </Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={merchant.description}
                rows={3}
                className="bg-[#050505] border-white/10 rounded-sm focus-visible:ring-amber-500 font-mono text-white resize-none"
              />
            </div>
          </div>
        </section>

        {/* Locational Coordinates */}
        <section className="space-y-4 pt-8 border-t border-white/10">
          <h2 className="text-xs font-black uppercase text-amber-500 tracking-widest border-b border-white/5 pb-2">
            03. Spatial Positioning
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#0a0a0a] p-6 border border-white/10 rounded-sm">
            <div className="space-y-2">
              <Label className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
                Address Vector
              </Label>
              <Input
                id="addressLine"
                name="addressLine"
                defaultValue={merchant.addressLine}
                className="bg-[#050505] border-white/10 rounded-sm focus-visible:ring-amber-500 font-mono text-white h-12"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
                City Node
              </Label>
              <Input
                id="city"
                name="city"
                defaultValue={merchant.city}
                className="bg-[#050505] border-white/10 rounded-sm focus-visible:ring-amber-500 font-mono text-white h-12"
              />
            </div>

            <div className="space-y-2 md:col-span-2 mt-4">
              <Label className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase flex items-center justify-between mb-2">
                <span>Map Alignment</span>
                {merchant.latitude && merchant.longitude ? (
                  <span className="text-emerald-500 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-sm">
                    Calibrated
                  </span>
                ) : (
                  <span className="text-rose-500 px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 rounded-sm">
                    Uncalibrated
                  </span>
                )}
              </Label>
              <div className="h-[300px] border border-white/10 rounded-sm overflow-hidden saturate-[0.8] contrast-[1.2] relative">
                <div className="absolute top-4 right-4 z-10">
                  <LocationPicker
                    initialLat={mapLocation?.lat}
                    initialLng={mapLocation?.lng}
                    buttonText="Reposition Map"
                    onLocationSelect={(lat, lng) => {
                      setMapLocation({ lat, lng });
                    }}
                  />
                </div>

                {mapLocation ? (
                  <MapComponent
                    center={[mapLocation.lng, mapLocation.lat]}
                    zoom={15}
                  >
                    <MapControls position="bottom-left" showZoom />
                    <MapMarker
                      longitude={mapLocation.lng}
                      latitude={mapLocation.lat}
                    >
                      <MarkerContent>
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-500 to-orange-600 text-black shadow-lg border-2 border-black animate-bounce">
                          <MapPin className="h-5 w-5" />
                        </div>
                      </MarkerContent>
                    </MapMarker>
                  </MapComponent>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#111] text-zinc-500">
                    <MapPin className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-xs font-mono uppercase">
                      Map Uncalibrated
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Operational Config */}
        <section className="space-y-4 pt-8 border-t border-white/10">
          <h2 className="text-xs font-black uppercase text-amber-500 tracking-widest border-b border-white/5 pb-2">
            04. Service Conditions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-[#0a0a0a] p-6 border border-white/10 rounded-sm">
            <div className="space-y-2">
              <Label className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
                Delivery Tariff (Rp)
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-zinc-500 font-mono text-sm">Rp</span>
                </div>
                <Input
                  id="deliveryFee"
                  name="deliveryFee"
                  type="number"
                  defaultValue={merchant.deliveryFee}
                  className="bg-[#050505] border-white/10 rounded-sm focus-visible:ring-amber-500 font-mono text-white h-12 pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
                Min Order (Rp)
              </Label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-zinc-500 font-mono text-sm">Rp</span>
                </div>
                <Input
                  id="minOrder"
                  name="minOrder"
                  type="number"
                  defaultValue={merchant.minOrder}
                  className="bg-[#050505] border-white/10 rounded-sm focus-visible:ring-amber-500 font-mono text-white h-12 pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
                Est. Time (Mins)
              </Label>
              <Input
                id="estimatedDeliveryTime"
                name="estimatedDeliveryTime"
                type="number"
                defaultValue={merchant.estimatedDeliveryTime}
                className="bg-[#050505] border-white/10 rounded-sm focus-visible:ring-amber-500 font-mono text-white h-12"
              />
            </div>

            <div className="space-y-2 md:col-span-2 lg:col-span-3 mt-4 pt-4 border-t border-white/5">
              <Label className="text-[10px] text-zinc-500 font-mono tracking-widest uppercase mb-2 block">
                Operating Capacity (M-S)
              </Label>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <Input
                    id="openingTime"
                    name="openingTime"
                    type="time"
                    defaultValue={merchant.openingTime}
                    className="bg-[#050505] border-white/10 rounded-sm focus-visible:ring-amber-500 font-mono text-white h-12"
                  />
                </div>
                <span className="text-zinc-600 font-black">—</span>
                <div className="flex-1">
                  <Input
                    id="closingTime"
                    name="closingTime"
                    type="time"
                    defaultValue={merchant.closingTime}
                    className="bg-[#050505] border-white/10 rounded-sm focus-visible:ring-amber-500 font-mono text-white h-12"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Action Commit */}
        <div className="pt-8 border-t border-white/10 flex items-center justify-between sticky bottom-0 bg-[#0a0a0a]/90 backdrop-blur-md p-6 border-b-0 border-x-0 rounded-t-sm shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-40">
          <div>
            <p className="text-sm font-bold text-white uppercase tracking-wider">
              Unsaved changes?
            </p>
            <p className="text-xs text-zinc-500 font-mono">
              Keep your profile updated
            </p>
          </div>
          <Button
            type="submit"
            disabled={updateMutation.isPending}
            className="px-8 h-12 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase text-sm tracking-widest rounded-sm transition-all"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Committing Params...
              </>
            ) : (
              "Save System Coordinates"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
