'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authFetch } from '@/lib/auth-fetch';
import { ApiClientError } from '@/lib/api-client';
import { formatCOP } from '@mvh/utils';
import type { Category } from '@mvh/types';
import { MediaLibrary } from './media-library';

const INPUT =
  'w-full border border-burgundy-900/20 bg-white px-3 py-2 text-sm focus:outline-none focus:border-burgundy-900/50 transition-colors';
const LABEL = 'block text-xs uppercase tracking-widest text-burgundy-900/50 mb-1.5';
const ERR = 'text-red-500 text-xs mt-1';

interface ProductData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  priceCents: number;
  compareAtPriceCents: number | null;
  stock: number;
  isFeatured: boolean;
  isActive: boolean;
  categoryId: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  images: Array<{ id: string; url: string; alt: string | null; position: number }>;
  variants: Array<{ id: string; sku: string; name: string; priceCents: number; stock: number; isDefault: boolean }>;
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
    priceCents: product ? String(product.priceCents) : '',
    compareAtPriceCents: product?.compareAtPriceCents ? String(product.compareAtPriceCents) : '',
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
    sku: '', name: '', priceCents: '', stock: '0', isDefault: false,
  });
  const [variantError, setVariantError] = useState('');

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => authFetch<Category[]>('/admin/categories'),
  });

  const addImageMutation = useMutation({
    mutationFn: (data: { url: string; alt?: string }) =>
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
      setVariantForm({ sku: '', name: '', priceCents: '', stock: '0', isDefault: false });
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

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setForm((p) => ({ ...p, name, ...(!isEdit ? { slug: slugify(name) } : {}) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const body = {
        name: form.name,
        slug: form.slug,
        description: form.description || undefined,
        shortDescription: form.shortDescription || undefined,
        priceCents: Number(form.priceCents),
        compareAtPriceCents: form.compareAtPriceCents ? Number(form.compareAtPriceCents) : null,
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
    if (!variantForm.sku || !variantForm.name || !variantForm.priceCents) {
      setVariantError('SKU, nombre y precio son requeridos');
      return;
    }
    addVariantMutation.mutate({
      sku: variantForm.sku,
      name: variantForm.name,
      priceCents: Number(variantForm.priceCents),
      stock: Number(variantForm.stock),
      isDefault: variantForm.isDefault,
    });
  };

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="text-sm text-burgundy-900/50 hover:text-burgundy-900">
          ← Volver
        </button>
        <h1 className="font-display text-2xl text-burgundy-900">
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
        <section className="bg-white border border-burgundy-900/10 p-5 space-y-4">
          <h2 className="font-semibold text-burgundy-900 text-sm uppercase tracking-widest">
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
        <section className="bg-white border border-burgundy-900/10 p-5 space-y-4">
          <h2 className="font-semibold text-burgundy-900 text-sm uppercase tracking-widest">
            Precio y stock
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={LABEL}>Precio (COP) *</label>
              <input type="number" min={0} value={form.priceCents} onChange={f('priceCents')} required className={INPUT} placeholder="9000000" />
              {form.priceCents && (
                <p className="text-xs text-burgundy-900/40 mt-1">{formatCOP(Number(form.priceCents))}</p>
              )}
            </div>
            <div>
              <label className={LABEL}>Precio anterior</label>
              <input type="number" min={0} value={form.compareAtPriceCents} onChange={f('compareAtPriceCents')} className={INPUT} placeholder="0" />
            </div>
            <div>
              <label className={LABEL}>Stock</label>
              <input type="number" min={0} value={form.stock} onChange={f('stock')} required className={INPUT} />
            </div>
          </div>
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
          disabled={isSubmitting}
          className="btn-primary w-full disabled:opacity-50"
        >
          {isSubmitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear producto'}
        </button>
      </form>

      {/* Images — only shown for existing products */}
      {isEdit && (
        <>
          <section className="mt-6 bg-white border border-burgundy-900/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-burgundy-900 text-sm uppercase tracking-widest">
                Imágenes
              </h2>
              <button
                type="button"
                onClick={() => setShowMediaLibrary(true)}
                className="bg-burgundy-900 text-cream-50 px-4 py-2 text-xs hover:bg-burgundy-800 transition-colors"
              >
                + Agregar imagen
              </button>
            </div>
            {product.images.length === 0 ? (
              <button
                type="button"
                onClick={() => setShowMediaLibrary(true)}
                className="w-full border-2 border-dashed border-burgundy-900/20 py-8 text-sm text-burgundy-900/40 hover:border-burgundy-900/40 hover:text-burgundy-900/60 transition-colors"
              >
                Clic para agregar imágenes
              </button>
            ) : (
              <div className="flex flex-wrap gap-3">
                {product.images.map((img) => (
                  <div key={img.id} className="relative group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={img.alt ?? ''} className="w-24 h-24 object-cover border border-burgundy-900/10" />
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
                addImageMutation.mutate({ url: item.url, alt: item.alt ?? item.filename });
                setShowMediaLibrary(false);
              }}
              onClose={() => setShowMediaLibrary(false)}
            />
          )}
        </>
      )}

      {/* Variants — only shown for existing products */}
      {isEdit && (
        <section className="mt-6 bg-white border border-burgundy-900/10 p-5">
          <h2 className="font-semibold text-burgundy-900 text-sm uppercase tracking-widest mb-4">
            Variantes
          </h2>
          {product.variants.length > 0 && (
            <table className="w-full text-sm mb-4">
              <thead className="border-b border-burgundy-900/10">
                <tr className="text-xs uppercase tracking-widest text-burgundy-900/50">
                  <th className="text-left py-2">SKU</th>
                  <th className="text-left py-2">Nombre</th>
                  <th className="text-right py-2">Precio</th>
                  <th className="text-right py-2">Stock</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-burgundy-900/5">
                {product.variants.map((v) => (
                  <tr key={v.id}>
                    <td className="py-2 text-burgundy-900/60">{v.sku}</td>
                    <td className="py-2">
                      {v.name}
                      {v.isDefault && (
                        <span className="ml-1 text-xs text-gold-600">(por defecto)</span>
                      )}
                    </td>
                    <td className="py-2 text-right">{formatCOP(v.priceCents)}</td>
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
              <input type="number" min={0} value={variantForm.priceCents} onChange={(e) => setVariantForm((p) => ({ ...p, priceCents: e.target.value }))} className={INPUT} />
            </div>
            <div>
              <label className={LABEL}>Stock</label>
              <input type="number" min={0} value={variantForm.stock} onChange={(e) => setVariantForm((p) => ({ ...p, stock: e.target.value }))} className={INPUT} />
            </div>
            <button
              onClick={handleAddVariant}
              disabled={addVariantMutation.isPending}
              className="bg-burgundy-900 text-cream-50 px-3 py-2 text-sm hover:bg-burgundy-800 disabled:opacity-50"
            >
              + Agregar
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
