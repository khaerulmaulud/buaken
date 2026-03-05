import { api } from "@/lib/axios";
import type { ApiResponse, CourierProfile } from "@/types";

export const courierService = {
  updateLocation: async (latitude: number, longitude: number) => {
    const res = await api.patch<ApiResponse<CourierProfile>>(
      "/courier/location",
      {
        latitude,
        longitude,
      },
    );
    return res.data.data;
  },
};
