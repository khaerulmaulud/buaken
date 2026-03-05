"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Bike,
  Search,
  ShieldCheck,
  Store,
  User,
  UserCheck,
  UserX,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/ui/Pagination";
import { useDebounce } from "@/hooks/useDebounce";
import { adminService } from "@/services/admin.service";
import { cn } from "@/lib/utils";

const roleTabs = [
  { label: "All", value: "", icon: null },
  { label: "Customer", value: "customer", icon: User },
  { label: "Merchant", value: "merchant", icon: Store },
  { label: "Courier", value: "courier", icon: Bike },
  { label: "Admin", value: "admin", icon: ShieldCheck },
];

const roleColors: Record<string, string> = {
  customer:
    "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.15)]",
  merchant:
    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)]",
  courier:
    "bg-violet-500/10 text-violet-400 border-violet-500/20 shadow-[0_0_10px_rgba(139,92,246,0.15)]",
  admin:
    "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.15)]",
};

function UsersPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const page = Number.parseInt(searchParams.get("page") || "1", 10);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "users", page, debouncedSearch, roleFilter],
    queryFn: () =>
      adminService.getUsers({
        page,
        search: debouncedSearch,
        role: roleFilter || undefined,
      }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ userId, isActive }: { userId: string; isActive: boolean }) =>
      adminService.updateUserStatus(userId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User status updated");
    },
    onError: () => {
      toast.error("Failed to update user status");
    },
  });

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/admin/users?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm">
          Users
        </h1>
        <p className="text-sm text-white/50 mt-1 font-medium">
          Manage platform users, roles, and account status
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Role Tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-white/5 border border-white/5 p-1 backdrop-blur-md">
          {roleTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setRoleFilter(tab.value);
                handlePageChange(1);
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all cursor-pointer",
                roleFilter === tab.value
                  ? "bg-white/10 text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] border border-white/10"
                  : "text-white/50 hover:text-white hover:bg-white/5",
              )}
            >
              {tab.icon && <tab.icon className="h-3 w-3" />}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white/5 border-white/10 focus-visible:border-emerald-500/50 focus-visible:ring-emerald-500/20 text-white placeholder:text-white/30"
          />
        </div>
      </div>

      {/* Table */}
      <Card className="bg-[#0a0a0a]/80 backdrop-blur-xl border-[#222222] shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#333333] bg-white/5">
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-white/40">
                    User
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-white/40">
                    Role
                  </th>
                  <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-widest text-white/40">
                    Joined
                  </th>
                  <th className="px-5 py-4 text-right text-xs font-semibold uppercase tracking-widest text-white/40">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222222]">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                    <tr key={i}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 animate-pulse rounded-full bg-white/10" />
                          <div className="space-y-1.5">
                            <div className="h-3.5 w-28 animate-pulse rounded bg-white/10" />
                            <div className="h-3 w-40 animate-pulse rounded bg-white/10" />
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="h-5 w-16 animate-pulse rounded bg-white/10" />
                      </td>
                      <td className="px-5 py-4">
                        <div className="h-3.5 w-20 animate-pulse rounded bg-white/10" />
                      </td>
                      <td className="px-5 py-4">
                        <div className="h-7 w-16 animate-pulse rounded bg-white/10 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : data?.data.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-12 text-center text-white/50"
                    >
                      No users found.
                    </td>
                  </tr>
                ) : (
                  data?.data.map((user) => (
                    <tr
                      key={user.id}
                      className="transition-colors hover:bg-white/5"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-white/10 text-xs font-semibold text-white drop-shadow-md">
                            {user.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white/90">
                              {user.name}
                            </p>
                            <p className="truncate text-xs text-white/50">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs capitalize",
                            roleColors[user.role] || "",
                          )}
                        >
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-white/50">
                        {format(new Date(user.createdAt), "MMM d, yyyy")}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {user.role !== "admin" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-7 gap-1.5 text-xs cursor-pointer",
                              user.isActive === false
                                ? "text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/20"
                                : "text-white/50 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20",
                            )}
                            onClick={() =>
                              statusMutation.mutate({
                                userId: user.id,
                                isActive: user.isActive === false,
                              })
                            }
                            disabled={statusMutation.isPending}
                          >
                            {user.isActive === false ? (
                              <>
                                <UserCheck className="h-3.5 w-3.5" />
                                Activate
                              </>
                            ) : (
                              <>
                                <UserX className="h-3.5 w-3.5" />
                                Deactivate
                              </>
                            )}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {data?.meta && data.meta.totalPages > 1 && (
            <div className="border-t border-[#333333] px-5 py-3">
              <Pagination
                currentPage={page}
                totalPages={data.meta.totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-muted-foreground">
          Loading users...
        </div>
      }
    >
      <UsersPageContent />
    </Suspense>
  );
}
