"use client";

import { Utensils } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import FallbackImage from "@/components/ui/FallbackImage";

interface LogoProps {
  className?: string; // Container className
  iconContainerClassName?: string; // Used for fallback icon background/padding
  iconClassName?: string; // Utensils fallback sizing/color
  textClassName?: string; // Text sizing/color
  href?: string;
  showText?: boolean;
  imageSize?: number; // Size for the Image component wrapper
}

export function Logo({
  className = "flex items-center gap-3 w-fit hover:opacity-80 transition-opacity",
  iconContainerClassName = "bg-[#f28b0d] p-2 rounded-lg flex items-center justify-center shrink-0",
  iconClassName = "text-[#121212] w-7 h-7 font-bold",
  textClassName = "text-3xl font-black tracking-tight text-white",
  href = "/",
  showText = true,
  imageSize = 44,
}: LogoProps) {
  const [imgError, setImgError] = useState(false);

  const content = (
    <>
      {!imgError ? (
        <div
          className="relative rounded-lg overflow-hidden shrink-0 shadow-sm"
          style={{ width: imageSize, height: imageSize }}
        >
          <FallbackImage
            src="/images/logo.png"
            alt="FoodDash Logo"
            fill
            sizes={`${imageSize}px`}
            className="object-cover"
            onError={() => setImgError(true)}
            priority
          />
        </div>
      ) : (
        <div className={iconContainerClassName}>
          <Utensils className={iconClassName} />
        </div>
      )}
      {showText && <h1 className={textClassName}>FoodDash</h1>}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return <div className={className}>{content}</div>;
}
