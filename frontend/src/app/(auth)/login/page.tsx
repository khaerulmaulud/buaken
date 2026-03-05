"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import FallbackImage from "@/components/ui/FallbackImage";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/hooks/useAuth";

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { loginAsync, isLoggingIn, isAuthenticated, isLoading } = useAuth();
  const [error, setError] = useState("");
  const router = useRouter();
  const hasRedirected = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    // @ts-expect-error - Expected zod type mismatch between versions
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (isAuthenticated && !isLoading && !hasRedirected.current) {
      hasRedirected.current = true;
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);

  const onSubmit = async (data: LoginFormData) => {
    setError("");
    try {
      await loginAsync(data);
    } catch (err) {
      if (err instanceof Error) {
        // @ts-expect-error - Handle axios error format
        const axiosMessage = err.response?.data?.message;
        setError(axiosMessage || err.message || "Login failed");
      } else {
        setError("Login failed");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f8f7f5] dark:bg-[#121212]">
        <Loader2 className="h-8 w-8 animate-spin text-[#f28b0d]" />
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row bg-[#f8f7f5] dark:bg-[#121212] text-slate-900 dark:text-slate-100 font-sans">
      {/* Left Side: Visual Anchor */}
      <div className="relative hidden lg:flex lg:w-1/2 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <FallbackImage
            alt="Gourmet Pizza"
            src="https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&h=800&fit=crop"
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
              Experience Gourmet at Your Doorstep.
            </h2>
            <p className="text-slate-300 text-base md:text-lg">
              Join thousands of foodies enjoying premium deliveries from the
              city's finest kitchens.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side: Login Form */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-10 lg:p-14 bg-[#f8f7f5] dark:bg-[#121212]">
        <div className="w-full max-w-[400px] space-y-6">
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
              Welcome Back
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Please enter your details to continue
            </p>
          </div>

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

            {/* Password Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-sm font-semibold dark:text-slate-200"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register("password")}
                  className={`w-full bg-white dark:bg-[#121212]/50 border ${errors.password ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20" : "border-slate-200 dark:border-[#f28b0d]/20 focus:ring-[#f28b0d]/20 focus:border-[#f28b0d]"} rounded-xl py-3 pl-10 pr-10 focus:ring-2 outline-none transition-all dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-sm`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-[#f28b0d] transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Options */}
            <div className="flex items-center justify-between py-1">
              <label
                htmlFor="rememberMe"
                className="flex items-center gap-2 cursor-pointer group"
              >
                <input
                  id="rememberMe"
                  type="checkbox"
                  className="rounded border-slate-300 dark:border-slate-700 text-[#f28b0d] focus:ring-[#f28b0d]/30 bg-transparent"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400 group-hover:dark:text-slate-200 transition-colors">
                  Remember me
                </span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-semibold text-[#f28b0d] hover:text-[#f28b0d]/80 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full flex justify-center items-center bg-gradient-to-br from-[#f28b0d] to-[#b36306] text-[#121212] font-bold py-3.5 rounded-xl shadow-lg shadow-[#f28b0d]/20 hover:shadow-[#f28b0d]/40 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm"
            >
              {isLoggingIn ? (
                <Loader2 className="w-5 h-5 animate-spin text-[#121212]" />
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-[#f8f7f5] dark:bg-[#121212] px-4 text-slate-500 font-medium">
                Or continue with
              </span>
            </div>
          </div>

          {/* Social Logins */}
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              className="flex items-center justify-center gap-3 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-[#f28b0d]/5 transition-colors group cursor-not-allowed opacity-60"
              title="Not implemented yet"
            >
              <svg
                className="w-5 h-5"
                viewBox="0 0 24 24"
                aria-labelledby="googleIconTitle"
                role="img"
              >
                <title id="googleIconTitle">Google</title>
                <path
                  fill="currentColor"
                  className="text-[#4285F4]"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  className="text-[#34A853]"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  className="text-[#FBBC05]"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  className="text-[#EA4335]"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z"
                />
              </svg>
              <span className="text-sm font-semibold dark:text-slate-300">
                Google
              </span>
            </button>
            <button
              type="button"
              className="flex items-center justify-center gap-3 py-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-transparent hover:bg-slate-50 dark:hover:bg-[#f28b0d]/5 transition-colors group cursor-not-allowed opacity-60"
              title="Not implemented yet"
            >
              <svg
                className="w-5 h-5 dark:text-white text-black"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-labelledby="appleIconTitle"
                role="img"
              >
                <title id="appleIconTitle">Apple</title>
                <path d="M17.05 20.28c-.96.95-2.21 1.72-3.64 1.72-2.15 0-3.32-1.3-4.88-1.3-1.55 0-2.88 1.25-4.88 1.25-1.4 0-2.63-.73-3.58-1.68C-1.57 18.63-2.14 14.28 1.44 9.4c1.23-1.68 3.01-2.7 4.93-2.7 1.5 0 2.41.93 3.65.93 1.25 0 2-.93 3.63-.93 1.6 0 2.95.83 3.86 2.08-3.4 1.63-2.83 6.04.54 7.42-.4-.4 1.53-1.07 3.08-2 4.08zM12.03 5.4c-.1.01-.2.01-.3.01-2.03 0-3.95-1.78-3.6-4.17 2.15.1 3.75 1.95 3.9 4.16z" />
              </svg>
              <span className="text-sm font-semibold dark:text-slate-300">
                Apple
              </span>
            </button>
          </div>

          {/* Footer */}
          <div className="text-center pt-4">
            <p className="text-slate-600 dark:text-slate-400">
              New to FoodDash?
              <Link
                href="/register"
                className="text-[#f28b0d] font-bold hover:underline underline-offset-4 ml-1"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
