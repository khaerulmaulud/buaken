"use client";

import { useAuth } from "@/hooks/useAuth";
import type { User } from "@/types";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: User["role"][];
}

export function ProtectedRoute({
  children,
  allowedRoles,
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.replace("/login");
      } else if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        router.replace("/");
      } else {
        setIsAuthorized(true);
      }
    }
  }, [isLoading, isAuthenticated, user, router, allowedRoles]);

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white font-mono text-sm tracking-widest uppercase">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          Checking Authorization...
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
