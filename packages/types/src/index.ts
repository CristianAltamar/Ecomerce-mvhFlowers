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
