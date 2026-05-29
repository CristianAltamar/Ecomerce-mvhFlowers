/**
 * Tipos compartidos entre frontend y backend.
 * Estos tipos espejan el schema Prisma de apps/api.
 */

export type Role = 'CUSTOMER' | 'ADMIN' | 'STAFF';

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PROCESSING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type PaymentStatus =
  | 'PENDING'
  | 'AUTHORIZED'
  | 'APPROVED'
  | 'REJECTED'
  | 'FAILED'
  | 'REFUNDED';

export type PaymentMethod = 'BOLD_CARD' | 'BOLD_PSE' | 'BOLD_NEQUI' | 'CASH_ON_DELIVERY';

export type CouponType = 'PERCENT' | 'FIXED';

// === MODELOS DE LECTURA (DTOs públicos) ===

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  parentId: string | null;
  position: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  children?: Category[];
  parent?: Pick<Category, 'id' | 'slug' | 'name'> | null;
}

export interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  position: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  priceCents: number;
  stock: number;
  isDefault: boolean;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  shortDescription: string | null;
  priceCents: number;
  compareAtPriceCents: number | null;
  currency: string;
  isFeatured: boolean;
  isActive: boolean;
  stock: number;
  categoryId: string | null;
  category?: Pick<Category, 'id' | 'slug' | 'name'>;
  images: ProductImage[];
  variants: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  role: Role;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  user: PublicUser;
  tokens: AuthTokens;
}

export interface Address {
  id: string;
  userId: string;
  label: string | null;
  recipientName: string;
  phone: string;
  line1: string;
  line2: string | null;
  neighborhood: string | null;
  city: string;
  state: string;
  country: string;
  postalCode: string | null;
  notes: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  feeCents: number;
  description: string | null;
  neighborhoods: string[];
  isActive: boolean;
}

export interface DeliverySlot {
  id: string;
  label: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  position: number;
}

export interface BlockedDate {
  id: string;
  date: string;
  reason: string | null;
}

export interface Coupon {
  id: string;
  code: string;
  description: string | null;
  type: CouponType;
  value: number;
  minPurchaseCents: number;
  maxDiscountCents: number | null;
}

export interface ValidateCouponResult {
  coupon: Coupon;
  discountCents: number;
}

export interface OrderItem {
  id: string;
  productId: string | null;
  variantId: string | null;
  productName: string;
  variantName: string | null;
  imageUrl: string | null;
  unitPriceCents: number;
  quantity: number;
  subtotalCents: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string | null;
  status: OrderStatus;
  subtotalCents: number;
  discountCents: number;
  shippingFeeCents: number;
  taxCents: number;
  totalCents: number;
  currency: string;
  couponCode: string | null;
  deliveryDate: string | null;
  deliverySlotLabel: string | null;
  deliveryZoneName: string | null;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingNeighborhood: string | null;
  shippingCity: string;
  shippingState: string;
  shippingCountry: string;
  shippingNotes: string | null;
  customerNote: string | null;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

/** Config que el front necesita para renderizar el botón de pagos de Bold. */
export interface BoldButtonConfig {
  apiKey: string;
  orderReference: string;
  amount: number;
  currency: string;
  integritySignature: string;
  description: string;
  redirectionUrl: string;
  customerData?: string;
}

export interface InitiatePaymentResult {
  paymentId: string;
  provider: string;       // 'bold' | 'cash'
  bold: BoldButtonConfig | null;
}

// === PAGINACIÓN ===

export interface PaginationMeta {
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

// === RESPUESTAS API ESTÁNDAR ===

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiErrorResponse {
  ok: false;
  error: ApiError;
}

export interface ApiSuccessResponse<T> {
  ok: true;
  data: T;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
