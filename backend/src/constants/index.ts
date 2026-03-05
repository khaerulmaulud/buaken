import type { OrderStatus } from '../db/schema/orders.schema.js';

// Valid order status transitions
export const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['ready_for_pickup', 'cancelled'],
  ready_for_pickup: ['picked_up'],
  picked_up: ['on_delivery'],
  on_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
};

export const PAYMENT_METHOD = {
  CASH: 'cash',
  DIGITAL_WALLET: 'digital_wallet',
  BANK_TRANSFER: 'bank_transfer',
} as const;

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  REFUNDED: 'refunded',
} as const;

export const USER_ROLE = {
  CUSTOMER: 'customer',
  MERCHANT: 'merchant',
  COURIER: 'courier',
} as const;
