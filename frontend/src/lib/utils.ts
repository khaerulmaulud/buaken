import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as IDR (Indonesian Rupiah)
 * e.g., formatRupiah(30900) => "Rp 30.900,00"
 */
export function formatRupiah(
  amount: number | string | null | undefined,
): string {
  const val = Number(amount);
  if (Number.isNaN(val)) {
    return "Rp 0,00"; // fallback for invalid amounts
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}
