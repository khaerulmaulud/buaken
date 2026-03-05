"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import FallbackImage from "@/components/ui/FallbackImage";
import { Logo } from "@/components/ui/Logo";

const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email format"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    // @ts-expect-error - Expected zod type mismatch between versions
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setError("");
    setIsLoading(true);
    try {
      // Use window.location.origin to infer the backend endpoint relatively if NEXT_PUBLIC_API_URL isn't perfect
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
      const res = await fetch(`${apiUrl}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          result.error?.message ||
            result.message ||
            "Failed to send reset link",
        );
      }

      setSuccess(true);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-[#f8f7f5] dark:bg-[#121212] text-slate-900 dark:text-slate-100 font-sans">
      {/* Left Side: Visual Anchor */}
      <div className="relative hidden lg:flex lg:w-1/2 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <FallbackImage
            alt="Gourmet Pizza"
            src="https://images.unsplash.com/photo-1544148103-0773bf10d330?w=1200&h=800&fit=crop"
            fill
            priority
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#12121266] to-[#121212cc] pointer-events-none" />
        </div>

        {/* Branding on Image */}
        <div className="relative z-10 p-12 w-full h-full flex flex-col justify-between">
          <Logo />

          <div className="max-w-md">
            <h2 className="text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
              Get Back to Delivery.
            </h2>
            <p className="text-slate-300 text-base md:text-lg">
              Regain access to your account and continue enjoying premium food
              delivered straight to your door.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side: Forgot Password Form */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-10 lg:p-14 bg-[#f8f7f5] dark:bg-[#121212]">
        <div className="w-full max-w-[400px] space-y-6">
          <Link
            href="/login"
            className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-[#f28b0d] transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to login
          </Link>

          {/* Mobile Logo */}
          <Logo
            className="flex lg:hidden items-center gap-2 mb-6 justify-center w-fit mx-auto hover:opacity-80 transition-opacity"
            iconContainerClassName=""
            iconClassName="text-[#f28b0d] w-8 h-8"
            textClassName="text-xl font-black tracking-tight dark:text-white"
            imageSize={32}
          />

          <div className="space-y-1.5">
            <h2 className="text-3xl font-black tracking-tight dark:text-white">
              Forgot Password
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>
          </div>

          {success ? (
            <div className="bg-green-500/15 text-green-600 dark:text-green-400 text-sm p-4 rounded-xl border border-green-500/20 text-center space-y-3">
              <p className="font-semibold">Check your email!</p>
              <p>We've sent a password reset link to your email address.</p>
              <p className="text-xs opacity-80 pt-2">
                If you don't see the email, check your spam folder or try again.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {error && (
                <div className="bg-red-500/15 text-red-400 text-sm p-3 rounded-md border border-red-500/20">
                  {error}
                </div>
              )}

              {/* Email Input */}
              <div className="space-y-1.5">
                <label
                  htmlFor="email"
                  className="text-sm font-semibold dark:text-slate-200"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <input
                    id="email"
                    type="email"
                    {...register("email")}
                    className={`w-full bg-white dark:bg-[#121212]/50 border ${errors.email ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20" : "border-slate-200 dark:border-[#f28b0d]/20 focus:ring-[#f28b0d]/20 focus:border-[#f28b0d]"} rounded-xl py-3 pl-10 pr-4 focus:ring-2 outline-none transition-all dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-sm`}
                    placeholder="name@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-400 text-xs mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center bg-gradient-to-br from-[#f28b0d] to-[#b36306] text-[#121212] font-bold py-3.5 rounded-xl shadow-lg shadow-[#f28b0d]/20 hover:shadow-[#f28b0d]/40 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm mt-2"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[#121212]" />
                ) : (
                  "Send Reset Link"
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
