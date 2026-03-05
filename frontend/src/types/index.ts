export interface User {
  id: string;
  email: string;
  name: string;
  role: "customer" | "merchant" | "courier" | "admin";
  phone?: string;
  isActive: boolean;
  avatarUrl?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  iconUrl?: string;
  createdAt: string;
}

export interface Merchant {
  id: string;
  userId: string;
  storeName: string;
  description?: string;
  addressLine?: string;
  city?: string;
  phone?: string;
  isOpen: boolean;
  rating?: number;
  totalReviews?: number;
  logoUrl?: string;
  bannerUrl?: string;
  deliveryFee?: number;
  minOrder?: number;
  estimatedDeliveryTime?: number;
  openingTime?: string;
  closingTime?: string;
  latitude?: string;
  longitude?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  id: string;
  merchantId: string;
  categoryId?: string;
  name: string;
  description?: string;
  price: number;
  preparationTime?: number;
  imageUrl?: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  quantity: number;
  price: number;
  menuItem?: MenuItem;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready_for_pickup"
  | "picked_up"
  | "on_delivery"
  | "delivered"
  | "cancelled";

export interface UserAddress {
  id: string;
  userId: string;
  label: string;
  addressLine: string;
  city: string;
  postalCode: string;
  latitude: string;
  longitude: string;
  notes?: string;
  isDefault: boolean;
}

export type PaymentMethod = "cash" | "digital_wallet" | "bank_transfer";
export type PaymentStatus = "pending" | "paid" | "refunded";

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  merchantId: string;
  courierId?: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  subtotal: number;
  deliveryFee: number;
  serviceFee: number;
  totalAmount: number;
  deliveryAddressId: string;
  deliveryAddress: UserAddress;
  deliveryNotes?: string;
  items?: OrderItem[];
  orderItems?: OrderItem[];
  merchant?: Merchant;
  customer?: User;
  courier?: User;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    details?: any;
  };
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type VehicleType = "motorcycle" | "bicycle" | "car";

export interface CourierProfile {
  id: string;
  userId: string;
  vehicleType: VehicleType;
  vehicleNumber: string;
  isOnline: boolean;
  currentLatitude?: string;
  currentLongitude?: string;
  totalDeliveries: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
}

export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  merchantId: string;
  menuItemId?: string;
  rating: number;
  comment?: string;
  imageUrl?: string;
  imageUrls?: string[];
  merchantReply?: string | null;
  repliedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  merchant?: {
    id: string;
    storeName: string;
  };
  menuItem?: {
    id: string;
    name: string;
    imageUrl?: string;
  };
}

export interface DashboardStats {
  users: {
    total: number;
    merchants: number;
    couriers: number;
  };
  orders: {
    total: number;
    active: number;
    completed: number;
    revenue: number;
  };
  complaints: {
    pending: number;
  };
}

export interface MerchantDashboardStats {
  totalRevenue: number;
  totalOrders: number;
  todayRevenue: number;
  todayOrders: number;
  activeOrders: number;
  menuItemCount: number;
}

export interface CourierDashboardStats {
  totalEarnings: number;
  totalDeliveries: number;
  todayEarnings: number;
  todayDeliveries: number;
  activeDeliveries: number;
  rating: number;
  totalDeliveriesProfile: number;
}
