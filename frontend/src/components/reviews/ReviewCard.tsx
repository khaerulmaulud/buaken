"use client";

import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { Review } from "@/types";
import { StarRating } from "./StarRating";

interface ReviewCardProps {
  review: Review;
  onReply?: (reviewId: string) => void;
  showReplyButton?: boolean;
  merchantName?: string;
}

export function ReviewCard({
  review,
  onReply,
  showReplyButton,
  merchantName,
}: ReviewCardProps) {
  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarImage src={review.customer?.avatarUrl} />
              <AvatarFallback>
                {review.customer?.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{review.customer?.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(review.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
          <StarRating rating={review.rating} readonly size="sm" />
        </div>
        {review.menuItem && (
          <Badge variant="secondary" className="w-fit">
            {review.menuItem.name}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {review.comment && (
          <p className="text-sm text-foreground">{review.comment}</p>
        )}

        {/* Review Images */}
        {(review.imageUrls?.length || review.imageUrl) && (
          <div className="flex flex-wrap gap-2 justify-start">
            {/* Handle legacy single image if array is empty but string exists */}
            {(!review.imageUrls || review.imageUrls.length === 0) &&
              review.imageUrl && (
                <Dialog>
                  <DialogTrigger asChild>
                    <div className="relative w-32 h-32 rounded-lg overflow-hidden border bg-gray-50 shrink-0 cursor-pointer hover:opacity-90 transition-opacity">
                      <img
                        src={review.imageUrl}
                        alt="Review"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none">
                    <div className="relative w-full h-[80vh] flex items-center justify-center">
                      <img
                        src={review.imageUrl}
                        alt="Review Full"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </DialogContent>
                </Dialog>
              )}

            {/* Handle array of images */}
            {review.imageUrls?.map((url, index) => (
              <Dialog key={index}>
                <DialogTrigger asChild>
                  <div className="relative w-32 h-32 rounded-lg overflow-hidden border bg-gray-50 shrink-0 cursor-pointer hover:opacity-90 transition-opacity">
                    <img
                      src={url}
                      alt={`Review ${index + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-transparent border-none shadow-none">
                  <VisuallyHidden>
                    <DialogTitle>Review Image {index + 1}</DialogTitle>
                  </VisuallyHidden>
                  <div className="relative w-full h-[80vh] flex items-center justify-center">
                    <img
                      src={url}
                      alt={`Review Full ${index + 1}`}
                      className="w-full h-full object-contain"
                    />
                  </div>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        )}

        {/* Merchant Reply */}
        {review.merchantReply ? (
          <div className="rounded-lg bg-muted p-4 space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              {merchantName || review.merchant?.storeName || "Merchant Reply"}:
            </p>
            <p className="text-sm text-muted-foreground">
              {review.merchantReply}
            </p>
            {review.repliedAt && (
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(review.repliedAt), {
                  addSuffix: true,
                })}
              </p>
            )}
          </div>
        ) : (
          showReplyButton &&
          onReply && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onReply(review.id)}
              className="w-full"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Reply to Review
            </Button>
          )
        )}
      </CardContent>
    </Card>
  );
}
