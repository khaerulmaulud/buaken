"use client";

// ... (imports remain same, adding X icon if needed)
import { Loader2, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/axios";
import { StarRating } from "./StarRating";

// ...

interface ReviewFormProps {
  onSubmit: (data: {
    rating: number;
    comment?: string;
    imageUrls?: string[];
  }) => void;
  isLoading?: boolean;
}

export function ReviewForm({ onSubmit, isLoading }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    const validPreviews: string[] = [];

    files.forEach((file) => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`Image ${file.name} is too large (max 5MB)`);
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error(`File ${file.name} is not an image`);
        return;
      }
      validFiles.push(file);
      validPreviews.push(URL.createObjectURL(file));
    });

    setImageFiles((prev) => [...prev, ...validFiles]);
    setImagePreviews((prev) => [...prev, ...validPreviews]);
  };

  const removeImage = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[index]);
      return newPreviews.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const uploadedUrls: string[] = [];

    // Upload images if selected
    if (imageFiles.length > 0) {
      setUploadingImage(true);
      try {
        const uploadPromises = imageFiles.map(async (file) => {
          const formData = new FormData();
          formData.append("image", file);
          const res = await api.post<{
            success: boolean;
            data: { imageUrl: string };
          }>("/reviews/upload-image", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          return res.data.data.imageUrl;
        });

        const urls = await Promise.all(uploadPromises);
        uploadedUrls.push(...urls);
      } catch (error) {
        console.error("Upload error:", error);
        toast.error("Failed to upload one or more images");
        setUploadingImage(false);
        return;
      }
      setUploadingImage(false);
    }

    onSubmit({
      rating,
      comment: comment.trim() || undefined,
      imageUrls: uploadedUrls.length > 0 ? uploadedUrls : undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label>Rating</Label>
        <StarRating rating={rating} onRatingChange={setRating} size="lg" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="comment">Comment (Optional)</Label>
        <Textarea
          id="comment"
          placeholder="Share your experience..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          rows={4}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground text-right">
          {comment.length}/500
        </p>
      </div>

      <div className="space-y-2">
        <Label>Photos (Optional)</Label>

        {/* Image Grid */}
        <div className="grid grid-cols-3 gap-2">
          {imagePreviews.map((preview, index) => (
            <div
              key={index}
              className="relative w-full h-24 rounded-lg overflow-hidden border bg-gray-50"
            >
              <img
                src={preview}
                alt={`Preview ${index + 1}`}
                className="w-full h-full object-contain"
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6"
                onClick={() => removeImage(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}

          {/* Add Button */}
          <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
            <Plus className="h-6 w-6 text-muted-foreground mb-1" />
            <span className="text-xs text-muted-foreground">Add Photo</span>
            <input
              type="file"
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleImageChange}
            />
          </label>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || uploadingImage}
      >
        {uploadingImage || isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {uploadingImage ? "Uploading..." : "Submitting..."}
          </>
        ) : (
          "Submit Review"
        )}
      </Button>
    </form>
  );
}
