"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import FallbackImage from "@/components/ui/FallbackImage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/axios";
import { formatRupiah } from "@/lib/utils";
import type {
  ApiResponse,
  Category,
  MenuItem,
  PaginatedResponse,
} from "@/types";

export default function MerchantMenuPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");

  const { data: menuItems, isLoading } = useQuery({
    queryKey: ["merchant-menu"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<MenuItem[]>>("/merchant/menu");
      return res.data;
    },
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await api.get<PaginatedResponse<Category>>("/categories");
      return res.data;
    },
  });

  const createMutation = useMutation({
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    mutationFn: async (data: any) => {
      const res = await api.post<ApiResponse<MenuItem>>("/merchant/menu", data);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant-menu"] });
      toast.success("Menu item created");
      setIsDialogOpen(false);
    },
    onError: () => toast.error("Failed to create item"),
  });

  const updateMutation = useMutation({
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await api.patch<ApiResponse<MenuItem>>(
        `/merchant/menu/${id}`,
        data,
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant-menu"] });
      toast.success("Menu item updated");
      setIsDialogOpen(false);
      setEditingItem(null);
    },
    onError: () => toast.error("Failed to update item"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/merchant/menu/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant-menu"] });
      toast.success("Menu item deleted");
    },
    onError: () => toast.error("Failed to delete item"),
  });

  const uploadImageMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("image", file);
      const res = await api.post<ApiResponse<{ imageUrl: string }>>(
        "/merchant/menu/upload-image",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return res.data.data;
    },
    onSuccess: (data) => {
      setImagePreview(data.imageUrl);
      toast.success("Image uploaded successfully");
    },
    onError: () => toast.error("Failed to upload image"),
  });

  const toggleAvailabilityMutation = useMutation({
    mutationFn: async ({
      id,
      isAvailable,
    }: {
      id: string;
      isAvailable: boolean;
    }) => {
      const res = await api.patch<ApiResponse<MenuItem>>(
        `/merchant/menu/${id}/availability`,
        { isAvailable },
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["merchant-menu"] });
      toast.success("Status updated");
    },
    onError: () => toast.error("Failed to update status"),
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    // Prepare JSON payload instead of FormData
    const payload = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      price: Number(formData.get("price")),
      preparationTime: Number(formData.get("preparationTime")) || 15,
      categoryId: selectedCategoryId || undefined,
      imageUrl: imagePreview || undefined,
    };

    if (editingItem) {
      updateMutation.mutate({ id: editingItem.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setImageFile(null);
    setImagePreview(item.imageUrl || null);
    setSelectedCategoryId(item.categoryId || "");
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setEditingItem(null);
    setImageFile(null);
    setImagePreview(null);
    setSelectedCategoryId("");
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-32 space-y-4">
        <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
        <p className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
          Connecting to Databank...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-widest uppercase">
            Menu Config
          </h1>
          <p className="text-xs text-zinc-500 font-mono mt-1 tracking-wider uppercase">
            Data Schema: {menuItems?.data?.length || 0} entries mapped
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              onClick={openNewDialog}
              className="gap-2 rounded-sm bg-white text-black hover:bg-amber-500 uppercase font-black tracking-widest text-xs h-10 px-6 transition-colors"
            >
              <Plus className="h-4 w-4" /> Initialize Item
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[#0a0a0a] border-white/10 rounded-sm">
            <DialogHeader>
              <DialogTitle className="uppercase font-black tracking-widest text-white border-b border-white/10 pb-4 mb-4">
                {editingItem ? "Update Item Record" : "New Item Record"}
              </DialogTitle>
            </DialogHeader>
            <form
              onSubmit={handleSubmit}
              className="space-y-5 text-zinc-300 font-mono text-sm"
            >
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-xs text-zinc-500 uppercase tracking-wider"
                >
                  Item Designation
                </Label>
                <Input
                  id="name"
                  name="name"
                  defaultValue={editingItem?.name}
                  required
                  className="bg-black border-white/10 rounded-none focus-visible:ring-amber-500 focus-visible:border-amber-500"
                />
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="categoryId"
                  className="text-xs text-zinc-500 uppercase tracking-wider"
                >
                  Category
                </Label>
                <Select
                  value={selectedCategoryId}
                  onValueChange={setSelectedCategoryId}
                  required
                >
                  <SelectTrigger className="bg-black border-white/10 rounded-none focus:ring-amber-500 focus:border-amber-500">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a0a0a] border-white/10 text-white">
                    {categoriesData?.data?.map((category) => (
                      <SelectItem
                        key={category.id}
                        value={category.id}
                        className="hover:bg-white/10 focus:bg-white/10"
                      >
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-xs text-zinc-500 uppercase tracking-wider"
                >
                  Parameters / Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={editingItem?.description}
                  required
                  className="bg-black border-white/10 rounded-none focus-visible:ring-amber-500 focus-visible:border-amber-500 resize-none h-24"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label
                    htmlFor="price"
                    className="text-xs text-zinc-500 uppercase tracking-wider"
                  >
                    Value (Rp)
                  </Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    defaultValue={editingItem?.price}
                    required
                    className="bg-black border-white/10 rounded-none focus-visible:ring-amber-500 focus-visible:border-amber-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label
                    htmlFor="preparationTime"
                    className="text-xs text-zinc-500 uppercase tracking-wider"
                  >
                    Cycle Time (mins)
                  </Label>
                  <Input
                    id="preparationTime"
                    name="preparationTime"
                    type="number"
                    defaultValue={
                      (editingItem as MenuItem & { preparationTime?: number })
                        ?.preparationTime || 15
                    }
                    className="bg-black border-white/10 rounded-none focus-visible:ring-amber-500 focus-visible:border-amber-500"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-zinc-500 uppercase tracking-wider">
                  Asset Image
                </Label>
                <div className="mt-2 flex flex-col gap-4">
                  {imagePreview ? (
                    <div className="relative h-40 w-full rounded-sm border border-white/10 overflow-hidden bg-black group">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="object-cover w-full h-full opacity-80"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                        }}
                        className="absolute top-2 right-2 p-2 bg-black border border-white/10 hover:bg-rose-500 hover:text-black hover:border-rose-500 transition-colors z-10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/10 rounded-sm hover:border-amber-500 hover:bg-amber-500/5 transition-colors cursor-pointer">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <ImageIcon className="w-8 h-8 mb-3 text-zinc-500" />
                        <p className="mb-2 text-[10px] text-zinc-500 font-mono uppercase tracking-widest">
                          <span className="text-white">Click</span> to upload
                          asset
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/png, image/jpeg, image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setImageFile(file);
                            uploadImageMutation.mutate(file);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
              </div>
              <DialogFooter className="pt-4 border-t border-white/10">
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending ||
                    updateMutation.isPending ||
                    uploadImageMutation.isPending
                  }
                  className="w-full rounded-sm bg-amber-500 text-black hover:bg-amber-400 font-bold uppercase tracking-widest text-xs h-10"
                >
                  {(createMutation.isPending ||
                    updateMutation.isPending ||
                    uploadImageMutation.isPending) && (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  )}
                  {editingItem ? "Commit Changes" : "Deploy Item"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {menuItems?.data?.map((item) => (
          <div
            key={item.id}
            className={`border border-white/10 bg-[#050505] flex flex-col group transition-all duration-300 hover:border-zinc-500 ${!item.isAvailable ? "opacity-60 saturate-0" : ""}`}
          >
            {/* Image Block */}
            <div className="relative w-full h-40 bg-[#0a0a0a] border-b border-white/10 overflow-hidden">
              {item.imageUrl ? (
                <FallbackImage
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover grayscale-[0.2] transition-transform duration-700 group-hover:scale-105 group-hover:grayscale-0"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-800">
                  <ImageIcon className="h-8 w-8 mb-2" />
                  <span className="text-[10px] font-mono uppercase tracking-widest">
                    No Asset
                  </span>
                </div>
              )}

              {/* Overlay Actions */}
              <div className="absolute top-2 right-2 flex flex-col gap-2 z-10 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleEdit(item);
                  }}
                  className="w-8 h-8 bg-black border border-white/10 flex items-center justify-center text-white hover:bg-amber-500 hover:text-black hover:border-amber-500 transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    if (
                      confirm(
                        "Execute deletion protocol? This action is irreversible.",
                      )
                    ) {
                      deleteMutation.mutate(item.id);
                    }
                  }}
                  className="w-8 h-8 bg-black border border-white/10 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-black hover:border-rose-500 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {!item.isAvailable && (
                <div className="absolute bottom-2 left-2 bg-black text-rose-500 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border border-rose-500/30">
                  Offline
                </div>
              )}
            </div>

            {/* Properties Block */}
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start gap-4 mb-2">
                  <h3 className="font-bold text-white text-sm uppercase tracking-wider line-clamp-1">
                    {item.name}
                  </h3>
                  <Switch
                    checked={item.isAvailable}
                    className="scale-75 origin-top-right data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-zinc-800 rounded-sm shrink-0"
                    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
                    onCheckedChange={(checked: any) =>
                      toggleAvailabilityMutation.mutate({
                        id: item.id,
                        isAvailable: checked,
                      })
                    }
                  />
                </div>
                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed h-8">
                  {item.description || "N/A"}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 flex items-end justify-between font-mono">
                <div className="flex flex-col">
                  <span className="text-[9px] text-zinc-600 uppercase tracking-widest">
                    Base Rate
                  </span>
                  <span className="text-amber-500 font-bold tracking-tight">
                    {formatRupiah(item.price)}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[9px] text-zinc-600 uppercase tracking-widest">
                    Cycle
                  </span>
                  <span className="text-xs text-zinc-300">
                    {item.preparationTime}m
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
