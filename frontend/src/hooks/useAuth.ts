import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { api } from "@/lib/axios";
import type { ApiResponse, User } from "@/types";

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      try {
        const res = await api.get<ApiResponse<User>>("/auth/me");
        return res.data.data;
      } catch (_err) {
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes - prevent aggressive refetching
    refetchOnMount: false, // Don't refetch on component mount
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const res = await api.post("/auth/login", credentials);
      return res.data;
    },
    onSuccess: async (data) => {
      console.log("Login response:", data);
      if (data.data?.accessToken) {
        localStorage.setItem("token", data.data.accessToken);
      }

      // Force refetch instead of just invalidate
      await queryClient.refetchQueries({ queryKey: ["auth", "me"] });

      const searchParams = new URLSearchParams(window.location.search);
      const returnUrl = searchParams.get("returnUrl");
      router.push(returnUrl || "/");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await api.post("/auth/logout");
    },
    onSuccess: async (data) => {
      console.log("Logout response:", data);
      localStorage.removeItem("token");
      queryClient.setQueryData(["auth", "me"], null);
      router.push("/login");
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: {
      email: string;
      password: string;
      name: string;
      phone: string;
      role: "customer" | "merchant" | "courier";
    }) => {
      const res = await api.post("/auth/register", data);
      return res.data;
    },
    onSuccess: async (data) => {
      console.log("Register response:", data);
      if (data.data?.accessToken) {
        localStorage.setItem("token", data.data.accessToken);
      }

      // Force refetch instead of just invalidate
      await queryClient.refetchQueries({ queryKey: ["auth", "me"] });

      router.push("/");
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutate,
    loginAsync: loginMutation.mutateAsync,
    logout: logoutMutation.mutate,
    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  };
}
