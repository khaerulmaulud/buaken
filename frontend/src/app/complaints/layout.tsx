"use client";

import { ProtectedRoute } from "@/components/ProtectedRoute";

export default function ComplaintsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#050505] text-white">{children}</div>
    </ProtectedRoute>
  );
}
