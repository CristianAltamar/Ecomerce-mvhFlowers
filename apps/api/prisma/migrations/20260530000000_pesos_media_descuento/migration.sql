-- ============================================================================
-- Migración: centavos → pesos, descuentos en producto, ProductImage → Media FK
-- Conserva los datos existentes. Renombra columnas y divide los montos /100.
-- ============================================================================

-- 1. Enum de descuento -------------------------------------------------------
CREATE TYPE "DiscountType" AS ENUM ('PERCENT', 'FIXED');

-- 2. PRODUCTS: precio/compareAt + nuevos campos de descuento -----------------
ALTER TABLE "products" RENAME COLUMN "priceCents" TO "price";
ALTER TABLE "products" RENAME COLUMN "compareAtPriceCents" TO "compareAtPrice";
UPDATE "products" SET "price" = "price" / 100;
UPDATE "products" SET "compareAtPrice" = "compareAtPrice" / 100 WHERE "compareAtPrice" IS NOT NULL;

ALTER TABLE "products" ADD COLUMN "discountType" "DiscountType";
ALTER TABLE "products" ADD COLUMN "discountValue" INTEGER;

-- Migra los productos que estaban "en oferta" (compareAtPrice manual) a descuento fijo
UPDATE "products"
   SET "discountType" = 'FIXED',
       "discountValue" = "compareAtPrice" - "price"
 WHERE "compareAtPrice" IS NOT NULL AND "compareAtPrice" > "price";

-- 3. PRODUCT_VARIANTS --------------------------------------------------------
ALTER TABLE "product_variants" RENAME COLUMN "priceCents" TO "price";
UPDATE "product_variants" SET "price" = "price" / 100;

-- 4. DELIVERY_ZONES ----------------------------------------------------------
ALTER TABLE "delivery_zones" RENAME COLUMN "feeCents" TO "fee";
UPDATE "delivery_zones" SET "fee" = "fee" / 100;

-- 5. ORDERS ------------------------------------------------------------------
ALTER TABLE "orders" RENAME COLUMN "shippingFeeCents" TO "shippingFee";
ALTER TABLE "orders" RENAME COLUMN "subtotalCents" TO "subtotal";
ALTER TABLE "orders" RENAME COLUMN "discountCents" TO "discount";
ALTER TABLE "orders" RENAME COLUMN "taxCents" TO "tax";
ALTER TABLE "orders" RENAME COLUMN "totalCents" TO "total";
UPDATE "orders"
   SET "shippingFee" = "shippingFee" / 100,
       "subtotal"    = "subtotal" / 100,
       "discount"    = "discount" / 100,
       "tax"         = "tax" / 100,
       "total"       = "total" / 100;

-- 6. ORDER_ITEMS -------------------------------------------------------------
ALTER TABLE "order_items" RENAME COLUMN "unitPriceCents" TO "unitPrice";
ALTER TABLE "order_items" RENAME COLUMN "subtotalCents" TO "subtotal";
UPDATE "order_items" SET "unitPrice" = "unitPrice" / 100, "subtotal" = "subtotal" / 100;

-- 7. PAYMENTS ----------------------------------------------------------------
ALTER TABLE "payments" RENAME COLUMN "amountCents" TO "amount";
UPDATE "payments" SET "amount" = "amount" / 100;

-- 8. COUPONS -----------------------------------------------------------------
ALTER TABLE "coupons" RENAME COLUMN "minPurchaseCents" TO "minPurchase";
ALTER TABLE "coupons" RENAME COLUMN "maxDiscountCents" TO "maxDiscount";
UPDATE "coupons" SET "minPurchase" = "minPurchase" / 100;
UPDATE "coupons" SET "maxDiscount" = "maxDiscount" / 100 WHERE "maxDiscount" IS NOT NULL;
-- El value de cupones FIXED estaba en centavos; PERCENT es un porcentaje (no se toca)
UPDATE "coupons" SET "value" = "value" / 100 WHERE "type" = 'FIXED';

-- 9. PRODUCT_IMAGES: url → FK a media ----------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE "product_images" ADD COLUMN "mediaId" TEXT;

-- Crea registros Media para las URLs que aún no existen en la biblioteca
INSERT INTO "media" ("id", "url", "filename", "createdAt")
SELECT gen_random_uuid()::text,
       t.url,
       regexp_replace(t.url, '^.*/', ''),
       CURRENT_TIMESTAMP
  FROM (
    SELECT DISTINCT pi."url" AS url
      FROM "product_images" pi
     WHERE pi."url" IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM "media" m WHERE m."url" = pi."url")
  ) t;

-- Enlaza cada imagen de producto con su Media
UPDATE "product_images" pi
   SET "mediaId" = m."id"
  FROM "media" m
 WHERE m."url" = pi."url";

ALTER TABLE "product_images" DROP COLUMN "url";

CREATE INDEX "product_images_mediaId_idx" ON "product_images"("mediaId");

ALTER TABLE "product_images"
  ADD CONSTRAINT "product_images_mediaId_fkey"
  FOREIGN KEY ("mediaId") REFERENCES "media"("id") ON DELETE SET NULL ON UPDATE CASCADE;
