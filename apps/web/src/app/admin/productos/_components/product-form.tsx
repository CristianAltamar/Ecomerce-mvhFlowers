'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authFetch } from '@/lib/auth-fetch';
import { ApiClientError } from '@/lib/api-client';
import { formatCOP } from '@mvh/utils';
import type { Category } from '@mvh/types';
import { MediaLibrary } from '@/components/media-library';

const INPUT =
  'w-full border border-primary/20 bg-white px-3 py-2 text-sm focus:outline-none focus:border-primary/50 transition-colors';
const LABEL = 'block text-xs uppercase tracking-widest text-primary/50 mb-1.5';
const ERR = 'text-red-500 text-xs mt-1';

interface ProductData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  price: number;
  compareAtPrice: number | null;
  discountType: 'PERCENT' | 'FIXED' | null;
  discountValue: number | null;
  stock: number;
  isFeatured: boolean;
  isActive: boolean;
  categoryId: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  images: Array<{ id: string; url: string; alt: string | null; position: number }>;
  variants: Array<{ id: string; sku: string; name: string; price: number; stock: number; isDefault: boolean }>;
}

interface ProductFormProps {
  product?: ProductData;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function ProductForm({ product }: ProductFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isEdit = !!product;

  const [form, setForm] = useState({
    name: product?.name ?? '',
    slug: product?.slug ?? '',
    description: product?.description ?? '',
    shortDescription: product?.shortDescription ?? '',
    // price es el precio BASE; si hay descuento, el base es compareAtPrice
    price: product ? String(product.compareAtPrice ?? product.price) : '',
    discountType: (product?.discountType ?? '') as '' | 'PERCENT' | 'FIXED',
    discountValue: product?.discountValue ? String(product.discountValue) : '',
    stock: product ? String(product.stock) : '0',
    categoryId: product?.categoryId ?? '',
    isFeatured: product?.isFeatured ?? false,
    isActive: product?.isActive ?? true,
    metaTitle: product?.metaTitle ?? '',
    metaDescription: product?.metaDescription ?? '',
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Image / media library
  const [showMediaLibrary, setShowMediaLibrary] = useState(false);

  // Variant form
  const [variantForm, setVariantForm] = useState({
    sku: '', name: '', price: '', stock: '0', isDefault: false,
  });
  const [variantError, setVariantError] = useState('');

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => authFetch<Category[]>('/admin/categories'),
  });

  const addImageMutation = useMutation({
    mutationFn: (data: { mediaId: string; alt?: string }) =>
      authFetch(`/admin/products/${product!.id}/images`, { method: 'POST', body: data }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-product', product!.id] });
    },
  });

  const deleteImageMutation = useMutation({
    mutationFn: (imageId: string) =>
      authFetch(`/admin/products/${product!.id}/images/${imageId}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-product', product!.id] });
    },
  });

  const addVariantMutation = useMutation({
    mutationFn: (data: object) =>
      authFetch(`/admin/products/${product!.id}/variants`, { method: 'POST', body: data }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-product', product!.id] });
      setVariantForm({ sku: '', name: '', price: '', stock: '0', isDefault: false });
      setVariantError('');
    },
    onError: (err) => {
      setVariantError(err instanceof ApiClientError ? err.message : 'Error al agregar variante');
    },
  });

  const deleteVariantMutation = useMutation({
    mutationFn: (variantId: string) =>
      authFetch(`/admin/products/${product!.id}/variants/${variantId}`, { method: 'DELETE' }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-product', product!.id] });
    },
  });

  const f = (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm((p) => ({ ...p, [k]: e.target.value }));

  // ── Cálculo en vivo del precio final según el descuento ──────────────────
  const basePrice = Number(form.price) || 0;
  const discValue = Number(form.discountValue) || 0;
  const hasDiscount = form.discountType !== '' && discValue > 0;
  const finalPrice = !hasDiscount
    ? basePrice
    : form.discountType === 'PERCENT'
      ? Math.round(basePrice * (1 - discValue / 100))
      : basePrice - discValue;
  const discountInvalid = hasDiscount && (finalPrice <= 0 || (form.discountType === 'PERCENT' && discValue >= 100));

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setForm((p) => ({ ...p, name, ...(!isEdit ? { slug: slugify(name) } : {}) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (discountInvalid) {
      setError('El descuento no puede dejar el precio en 0 o menos.');
      return;
    }
    setIsSubmitting(true);
    try {
      const body = {
        name: form.name,
        slug: form.slug,
        description: form.description || undefined,
        shortDescription: form.shortDescription || undefined,
        // price es el precio base; el backend calcula el final y el "antes"
        price: Number(form.price),
        discountType: hasDiscount ? form.discountType : null,
        discountValue: hasDiscount ? discValue : null,
        stock: Number(form.stock),
        categoryId: form.categoryId || null,
        isFeatured: form.isFeatured,
        isActive: form.isActive,
        metaTitle: form.metaTitle || undefined,
        metaDescription: form.metaDescription || undefined,
      };

      if (isEdit) {
        await authFetch(`/admin/products/${product.id}`, { method: 'PUT', body });
        void queryClient.invalidateQueries({ queryKey: ['admin-product', product.id] });
        void queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      } else {
        const created = await authFetch<{ id: string }>('/admin/products', {
          method: 'POST',
          body,
        });
        void queryClient.invalidateQueries({ queryKey: ['admin-products'] });
        router.push(`/admin/productos/${created.id}`);
        return;
      }
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : 'Error al guardar');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddVariant = () => {
    if (!variantForm.sku || !variantForm.name || !variantForm.price) {
      setVariantError('SKU, nombre y precio son requeridos');
      return;
    }
    addVariantMutation.mutate({
      sku: variantForm.sku,
      name: variantForm.name,
      price: Number(variantForm.price),
      stock: Number(variantForm.stock),
      isDefault: variantForm.isDefault,
    });
  };

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-sm text-primary/50 hover:text-primary">
          ← Volver
        </button>
        <h1 className="font-display text-2xl text-primary">
          {isEdit ? 'Editar producto' : 'Nuevo producto'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* Basic info */}
        <section className="bg-white border border-primary/10 p-5 space-y-4">
          <h2 className="font-semibold text-primary text-sm uppercase tracking-widest">
            Información básica
          </h2>
          <div>
            <label className={LABEL}>Nombre *</label>
            <input type="text" value={form.name} onChange={handleNameChange} required className={INPUT} />
          </div>
          <div>
            <label className={LABEL}>Slug *</label>
            <input type="text" value={form.slug} onChange={f('slug')} required className={INPUT} placeholder="nombre-del-producto" />
          </div>
          <div>
            <label className={LABEL}>Descripción corta</label>
            <input type="text" value={form.shortDescription} onChange={f('shortDescription')} className={INPUT} maxLength={500} />
          </div>
          <div>
            <label className={LABEL}>Descripción</label>
            <textarea value={form.description} onChange={f('description')} rows={4} className={`${INPUT} resize-none`} />
          </div>
          <div>
            <label className={LABEL}>Categoría</label>
            <select value={form.categoryId} onChange={f('categoryId')} className={INPUT}>
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Pricing & stock */}
        <section className="bg-white border border-primary/10 p-5 space-y-4">
          <h2 className="font-semibold text-primary text-sm uppercase tracking-widest">
            Precio y stock
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Precio base (COP) *</label>
              <input type="number" min={1} value={form.price} onChange={f('price')} required className={INPUT} placeholder="90000" />
              {form.price && (
                <p className="text-xs text-primary/40 mt-1">{formatCOP(basePrice)}</p>
              )}
            </div>
            <div>
              <label className={LABEL}>Stock</label>
              <input type="number" min={0} value={form.stock} onChange={f('stock')} required className={INPUT} />
            </div>
          </div>

          {/* Descuento */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Descuento</label>
              <select
                value={form.discountType}
                onChange={(e) => setForm((p) => ({ ...p, discountType: e.target.value as '' | 'PERCENT' | 'FIXED' }))}
                className={INPUT}
              >
                <option value="">Sin descuento</option>
                <option value="PERCENT">Porcentaje (%)</option>
                <option value="FIXED">Monto fijo (COP)</option>
              </select>
            </div>
            <div>
              <label className={LABEL}>
                {form.discountType === 'PERCENT' ? 'Porcentaje a descontar' : form.discountType === 'FIXED' ? 'Pesos a descontar' : 'Valor del descuento'}
              </label>
              <input
                type="number"
                min={0}
                value={form.discountValue}
                onChange={f('discountValue')}
                disabled={form.discountType === ''}
                className={`${INPUT} disabled:opacity-40`}
                placeholder={form.discountType === 'PERCENT' ? '10' : '5000'}
              />
            </div>
          </div>

          {/* Preview del precio final */}
          {hasDiscount && (
            discountInvalid ? (
              <p className={ERR}>⚠ El descuento no puede dejar el precio en 0 o menos{form.discountType === 'PERCENT' ? ' (usa menos de 100%)' : ''}.</p>
            ) : (
              <p className="text-sm text-primary/70">
                Precio final: <span className="font-semibold text-emerald-700">{formatCOP(finalPrice)}</span>
                <span className="text-primary/40 line-through ml-2">{formatCOP(basePrice)}</span>
                <span className="text-accent ml-2 text-xs">
                  ({form.discountType === 'PERCENT' ? `-${discValue}%` : `-${formatCOP(discValue)}`})
                </span>
              </p>
            )
          )}
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
              />
              <span>Activo (visible en tienda)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                checked={form.isFeatured}
                onChange={(e) => setForm((p) => ({ ...p, isFeatured: e.target.checked }))}
              />
              <span>Destacado</span>
            </label>
          </div>
        </section>

        <button
          type="submit"
          disabled={isSubmitting || discountInvalid}
          className="btn-primary w-full disabled:opacity-50"
        >
          {isSubmitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear producto'}
        </button>
      </form>

      {/* Images — only shown for existing products */}
      {isEdit && (
        <>
          <section className="mt-6 bg-white border border-primary/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-primary text-sm uppercase tracking-widest">
                Imágenes
              </h2>
              <button
                type="button"
                onClick={() => setShowMediaLibrary(true)}
                className="bg-primary text-surface px-4 py-2 text-xs hover:bg-primary-light transition-colors"
              >
                + Agregar imagen
              </button>
            </div>
            {product.images.length === 0 ? (
              <button
                type="button"
                onClick={() => setShowMediaLibrary(true)}
                className="w-full border-2 border-dashed border-primary/20 py-8 text-sm text-primary/40 hover:border-primary/40 hover:text-primary/60 transition-colors"
              >
                Clic para agregar imágenes
              </button>
            ) : (
              <div className="flex flex-wrap gap-3">
                {product.images.map((img) => (
                  <div key={img.id} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.alt ?? ''} className="w-24 h-24 object-cover border border-primary/10" />
                    <button
                      type="button"
                      onClick={() => deleteImageMutation.mutate(img.id)}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>

          {showMediaLibrary && (
            <MediaLibrary
              onSelect={(item) => {
                addImageMutation.mutate({ mediaId: item.id, alt: item.alt ?? item.filename });
                setShowMediaLibrary(false);
              }}
              onClose={() => setShowMediaLibrary(false)}
            />
          )}
        </>
      )}

      {/* Variants — only shown for existing products */}
      {isEdit && (
        <section className="mt-6 bg-white border border-primary/10 p-5">
          <h2 className="font-semibold text-primary text-sm uppercase tracking-widest mb-4">
            Variantes
          </h2>
          {product.variants.length > 0 && (
            <table className="w-full text-sm mb-4">
              <thead className="border-b border-primary/10">
                <tr className="text-xs uppercase tracking-widest text-primary/50">
                  <th className="text-left py-2">SKU</th>
                  <th className="text-left py-2">Nombre</th>
                  <th className="text-right py-2">Precio</th>
                  <th className="text-right py-2">Stock</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {product.variants.map((v) => (
                  <tr key={v.id}>
                    <td className="py-2 text-primary/60">{v.sku}</td>
                    <td className="py-2">
                      {v.name}
                      {v.isDefault && (
                        <span className="ml-1 text-xs text-accent">(por defecto)</span>
                      )}
                    </td>
                    <td className="py-2 text-right">{formatCOP(v.price)}</td>
                    <td className="py-2 text-right">{v.stock}</td>
                    <td className="py-2 text-right">
                      <button
                        onClick={() => deleteVariantMutation.mutate(v.id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Add variant */}
          {variantError && <p className={`${ERR} mb-2`}>{variantError}</p>}
          <div className="grid grid-cols-5 gap-2 items-end">
            <div>
              <label className={LABEL}>SKU</label>
              <input type="text" value={variantForm.sku} onChange={(e) => setVariantForm((p) => ({ ...p, sku: e.target.value }))} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Nombre</label>
              <input type="text" value={variantForm.name} onChange={(e) => setVariantForm((p) => ({ ...p, name: e.target.value }))} className={INPUT} placeholder="Mediano" />
            </div>
            <div>
              <label className={LABEL}>Precio</label>
              <input type="number" min={0} value={variantForm.price} onChange={(e) => setVariantForm((p) => ({ ...p, price: e.target.value }))} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Stock</label>
              <input type="number" min={0} value={variantForm.stock} onChange={(e) => setVariantForm((p) => ({ ...p, stock: e.target.value }))} className={INPUT} />
            </div>
            <button
              onClick={handleAddVariant}
              disabled={addVariantMutation.isPending}
              className="bg-primary text-surface px-3 py-2 text-sm hover:bg-primary-light disabled:opacity-50"
            >
              + Agregar
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
