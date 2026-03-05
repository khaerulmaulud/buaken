"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/hooks/useAuth";

const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z
    .string()
    .regex(/^[0-9+\-() ]{10,20}$/, "Invalid phone number format"),
  role: z.enum(["customer", "merchant", "courier"]),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { registerAsync, isRegistering, isAuthenticated, isLoading } =
    useAuth();
  const [error, setError] = useState("");
  const router = useRouter();
  const hasRedirected = useRef(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    // @ts-expect-error - Expected zod type mismatch between versions
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "customer",
    },
  });

  const role = watch("role");

  useEffect(() => {
    if (isAuthenticated && !isLoading && !hasRedirected.current) {
      hasRedirected.current = true;
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);

  const onSubmit = async (data: RegisterFormData) => {
    setError("");
    try {
      await registerAsync(data);
    } catch (err) {
      if (err instanceof Error) {
        // @ts-expect-error - Handle axios error format
        const axiosMessage = err.response?.data?.message;
        setError(axiosMessage || err.message || "Registration failed");
      } else {
        setError("Registration failed");
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#121212]">
        <span className="material-symbols-outlined text-[#FF8C00] text-4xl animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  if (isAuthenticated) return null;

  const roles = [
    {
      value: "customer",
      label: "Customer",
      icon: "person_pin_circle",
    },
    {
      value: "merchant",
      label: "Merchant",
      icon: "storefront",
    },
    {
      value: "courier",
      label: "Courier",
      icon: "pedal_bike",
    },
  ] as const;

  return (
    <div className="flex min-h-screen w-full lg:flex-row bg-[#121212] text-slate-100 font-sans">
      {/* Left Side: Visual Hero */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center z-0"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&h=800&fit=crop')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#12121266] to-[#121212cc] pointer-events-none z-0" />

        {/* Branding on Image */}
        <div className="relative z-10 p-12 w-full h-full flex flex-col justify-between">
          <Logo />

          <div className="max-w-md">
            <h1 className="text-4xl lg:text-5xl font-black leading-tight mb-4 text-white">
              Join the <span className="text-[#FF8C00]">FoodDash</span>{" "}
              community
            </h1>
            <p className="text-slate-300 text-base md:text-lg leading-relaxed">
              Experience premium food delivery at your doorstep. Fresh
              ingredients, lightning fast delivery, and world-class service.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side: Registration Form */}
      <div className="flex flex-1 flex-col items-center justify-center p-6 sm:p-10 lg:p-14 bg-[#f8f7f5] dark:bg-[#121212] overflow-y-auto">
        <div className="w-full max-w-[400px] space-y-6">
          {/* Mobile Logo */}
          <Logo
            className="flex lg:hidden items-center gap-2 mb-6 justify-center w-fit mx-auto hover:opacity-80 transition-opacity"
            iconContainerClassName=""
            iconClassName="text-[#FF8C00] w-8 h-8 font-bold"
            textClassName="text-xl font-black tracking-tight dark:text-white"
            imageSize={32}
          />

          <div className="space-y-1.5">
            <h2 className="text-3xl font-black tracking-tight dark:text-white mb-2">
              Create Account
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm">
              Enter your details to start your premium culinary journey.
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 md:space-y-5"
          >
            {error && (
              <div className="bg-red-500/15 text-red-400 text-sm p-3 rounded-xl border border-red-500/20">
                {error}
              </div>
            )}

            {/* Name */}
            <div className="space-y-1.5">
              <label
                htmlFor="name"
                className="text-sm font-semibold dark:text-slate-200"
              >
                Full Name
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#FF8C00] transition-colors text-lg">
                  person
                </span>
                <input
                  id="name"
                  type="text"
                  {...register("name")}
                  className={`w-full bg-white dark:bg-[#121212]/50 border ${errors.name ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20" : "border-slate-200 dark:border-[#FF8C00]/20 focus:ring-[#FF8C00]/20 focus:border-[#FF8C00]"} rounded-xl py-3 pl-10 pr-4 focus:ring-2 outline-none transition-all dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-sm`}
                  placeholder="   John Doe"
                />
              </div>
              {errors.name && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.name.message}
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-sm font-semibold dark:text-slate-200"
              >
                Email Address
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#FF8C00] transition-colors text-lg">
                  mail
                </span>
                <input
                  id="email"
                  type="email"
                  {...register("email")}
                  className={`w-full bg-white dark:bg-[#121212]/50 border ${errors.email ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20" : "border-slate-200 dark:border-[#FF8C00]/20 focus:ring-[#FF8C00]/20 focus:border-[#FF8C00]"} rounded-xl py-3 pl-10 pr-4 focus:ring-2 outline-none transition-all dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-sm`}
                  placeholder="   name@example.com"
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <label
                htmlFor="phone"
                className="text-sm font-semibold dark:text-slate-200"
              >
                Phone Number
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#FF8C00] transition-colors text-lg">
                  call
                </span>
                <input
                  id="phone"
                  type="tel"
                  {...register("phone")}
                  className={`w-full bg-white dark:bg-[#121212]/50 border ${errors.phone ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20" : "border-slate-200 dark:border-[#FF8C00]/20 focus:ring-[#FF8C00]/20 focus:border-[#FF8C00]"} rounded-xl py-3 pl-10 pr-4 focus:ring-2 outline-none transition-all dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-sm`}
                  placeholder="   +62 812 3456 7890"
                />
              </div>
              {errors.phone && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.phone.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="text-sm font-semibold dark:text-slate-200"
              >
                Password
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#FF8C00] transition-colors text-lg">
                  lock
                </span>
                <input
                  id="password"
                  type="password"
                  {...register("password")}
                  className={`w-full bg-white dark:bg-[#121212]/50 border ${errors.password ? "border-red-500/50 focus:border-red-500 focus:ring-red-500/20" : "border-slate-200 dark:border-[#FF8C00]/20 focus:ring-[#FF8C00]/20 focus:border-[#FF8C00]"} rounded-xl py-3 pl-10 pr-4 focus:ring-2 outline-none transition-all dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 text-sm`}
                  placeholder="   •••••••••••••"
                />
              </div>
              {errors.password && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Role Selector */}
            <div className="space-y-1.5 pt-1">
              <div className="text-sm font-semibold dark:text-slate-200">
                I am a...
              </div>
              <div className="grid grid-cols-3 gap-3">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() =>
                      setValue("role", r.value, { shouldValidate: true })
                    }
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all text-center bg-white dark:bg-[#121212]/50 ${
                      role === r.value
                        ? "border-[#FF8C00] bg-[#FF8C00]/5 dark:bg-[#FF8C00]/10 shadow-sm"
                        : "border-slate-200 dark:border-[#FF8C00]/20 hover:border-[#FF8C00]/50"
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined mb-1 text-2xl ${role === r.value ? "text-[#FF8C00]" : "text-slate-400 group-hover:text-[#FF8C00]/60"}`}
                    >
                      {r.icon}
                    </span>
                    <span
                      className={`text-[10px] sm:text-xs font-semibold uppercase tracking-wider ${role === r.value ? "text-[#FF8C00]" : "text-slate-500 dark:text-slate-400"}`}
                    >
                      {r.label}
                    </span>
                  </button>
                ))}
              </div>
              {errors.role && (
                <p className="text-red-400 text-xs mt-1">
                  {errors.role.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isRegistering}
              className="w-full flex justify-center items-center bg-gradient-to-br from-[#FF8C00] to-[#b36306] text-[#121212] font-bold py-3.5 rounded-xl shadow-lg shadow-[#FF8C00]/20 hover:shadow-[#FF8C00]/40 active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-2 text-sm"
            >
              {isRegistering ? (
                <span className="material-symbols-outlined text-[#121212] animate-spin">
                  progress_activity
                </span>
              ) : (
                "Join FoodDash"
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
                Or log in securely
              </span>
            </div>
          </div>

          <div className="text-center pt-2">
            <p className="text-slate-600 dark:text-slate-400">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-[#FF8C00] font-bold hover:underline underline-offset-4 ml-1"
              >
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
