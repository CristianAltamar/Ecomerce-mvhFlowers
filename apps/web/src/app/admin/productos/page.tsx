'use client';

import { Suspense, useState, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authFetch } from '@/lib/auth-fetch';
import { ApiClientError } from '@/lib/api-client';
import { formatCOP } from '@mvh/utils';
import type { ProductVariant, ProductImage, Category } from '@mvh/types';

interface AdminProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  category: { id: string; name: string; slug: string } | null;
  images: ProductImage[];
  variants: ProductVariant[];
  _count: { orderItems: number };
  createdAt: string;
}

interface ProductsData {
  data: AdminProduct[];
  meta: { page: number; perPage: number; total: number; totalPages: number };
}

interface ImportResult {
  total: number;
  created: number;
  errors: number;
  results: { row: number; name: string; status: 'created' | 'error'; message?: string }[];
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const page = Number(searchParams.get('page') ?? 1);
  const search = searchParams.get('search') ?? '';
  const isActive = searchParams.get('isActive') ?? '';
  const categoryId = searchParams.get('categoryId') ?? '';

  const [searchInput, setSearchInput] = useState(search);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState('');
  const csvInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const bom = '﻿';
    const header =
      'nombre,slug,descripcion,descripcion_corta,precio,tipo_descuento,valor_descuento,categoria_slug,destacado,activo,stock,meta_titulo,meta_descripcion';
    const ex1 =
      'Rosas Rojas Premium,,Hermoso arreglo de 12 rosas rojas premium,12 rosas de temporada,150000,,,, false,true,10,,';
    const ex2 =
      'Bouquet de Girasoles,bouquet-de-girasoles,Alegre bouquet de 8 girasoles frescos,Ideal para decoración,120000,PERCENT,10,arreglos,true,true,5,,';
    const csv = bom + [header, ex1, ex2].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'plantilla-productos.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCsvFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportResult(null);
    setImportError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const result = await authFetch<ImportResult>('/admin/products/import-csv', {
        method: 'POST',
        body: formData,
      });
      setImportResult(result);
      void queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    } catch (err) {
      setImportError(err instanceof ApiClientError ? err.message : 'Error al importar el archivo');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: () => authFetch<Category[]>('/admin/categories'),
  });

  const { data, isLoading } = useQuery<ProductsData>({
    queryKey: ['admin-products', page, search, isActive, categoryId],
    queryFn: () =>
      authFetch('/admin/products', {
        searchParams: {
          page,
          perPage: 20,
          ...(search ? { search } : {}),
          ...(isActive ? { isActive } : {}),
          ...(categoryId ? { categoryId } : {}),
        },
      }),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) =>
      authFetch<AdminProduct>(`/admin/products/${id}/toggle-active`, { method: 'PATCH' }),
    onSuccess: (updated, id) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      // Mantén el caché del detalle en sync (el provider tiene staleTime 60s,
      // si no, al entrar a editar mostraría el estado viejo)
      queryClient.setQueryData(['admin-product', id], updated);
    },
  });

  const applySearch = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (searchInput) params.set('search', searchInput);
    else params.delete('search');
    params.delete('page');
    router.push(`/admin/productos?${params.toString()}`);
  };

  const setFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page');
    router.push(`/admin/productos?${params.toString()}`);
  };

  return (
    <div className="p-8 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl text-primary">Productos</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadTemplate}
            className="text-xs px-3 py-2 border border-primary/20 text-primary/60 hover:text-primary hover:border-primary/40 transition-colors"
          >
            ↓ Plantilla CSV
          </button>
          <button
            onClick={() => csvInputRef.current?.click()}
            disabled={importing}
            className="text-xs px-3 py-2 border border-primary/20 text-primary/60 hover:text-primary hover:border-primary/40 transition-colors disabled:opacity-40"
          >
            {importing ? 'Importando…' : '↑ Importar CSV'}
          </button>
          <input
            ref={csvInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleCsvFileChange}
            className="hidden"
          />
          <Link href="/admin/productos/nuevo" className="btn-primary text-sm px-4 py-2">
            + Nuevo producto
          </Link>
        </div>
      </div>

      {/* Import results */}
      {(importResult || importError) && (
        <div
          className={`mb-5 p-4 border text-sm ${
            importError
              ? 'border-red-200 bg-red-50 text-red-700'
              : importResult && importResult.errors > 0
              ? 'border-yellow-200 bg-yellow-50'
              : 'border-green-200 bg-green-50'
          }`}
        >
          {importError ? (
            <p>{importError}</p>
          ) : importResult ? (
            <>
              <p className="font-semibold mb-2">
                {importResult.created > 0 && (
                  <span className="text-green-700">{importResult.created} producto{importResult.created !== 1 ? 's' : ''} creado{importResult.created !== 1 ? 's' : ''}</span>
                )}
                {importResult.errors > 0 && (
                  <span className="text-yellow-700 ml-2">· {importResult.errors} error{importResult.errors !== 1 ? 'es' : ''}</span>
                )}
                <button
                  onClick={() => setImportResult(null)}
                  className="ml-3 text-xs text-primary/40 hover:text-primary/70"
                >
                  ✕
                </button>
              </p>
              {importResult.results.filter((r) => r.status === 'error').map((r) => (
                <p key={r.row} className="text-yellow-700 text-xs">
                  Fila {r.row} — {r.name}: {r.message}
                </p>
              ))}
            </>
          ) : null}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="flex gap-2 flex-1 min-w-50">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applySearch()}
            placeholder="Buscar por nombre o slug…"
            className="flex-1 border border-primary/20 bg-white px-3 py-2 text-sm focus:outline-none focus:border-primary/50"
          />
          <button
            onClick={applySearch}
            className="bg-primary text-surface px-4 py-2 text-sm hover:bg-primary-light transition-colors cursor-pointer"
          >
            Buscar
          </button>
        </div>
        <select
          value={categoryId}
          onChange={(e) => setFilter('categoryId', e.target.value)}
          className="border border-primary/20 bg-white px-3 py-2 text-sm focus:outline-none cursor-pointer"
        >
          <option value="">Todas las categorías</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={isActive}
          onChange={(e) => setFilter('isActive', e.target.value)}
          className="border border-primary/20 bg-white px-3 py-2 text-sm focus:outline-none cursor-pointer"
        >
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-primary/40 animate-pulse py-10">Cargando…</p>
      ) : (
        <>
          <div className="bg-white border border-primary/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-primary/10">
                <tr>
                  <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-primary/50">
                    Producto
                  </th>
                  <th className="text-right px-4 py-3 text-xs uppercase tracking-widest text-primary/50">
                    Precio
                  </th>
                  <th className="text-right px-4 py-3 text-xs uppercase tracking-widest text-primary/50">
                    Stock
                  </th>
                  <th className="text-center px-4 py-3 text-xs uppercase tracking-widest text-primary/50">
                    Estado
                  </th>
                  <th className="text-center px-4 py-3 text-xs uppercase tracking-widest text-primary/50">
                    Pedidos
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-primary/5">
                {data?.data.map((product) => (
                  <tr key={product.id} className="hover:bg-surface/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {product.images[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={product.images[0].url}
                            alt={product.name}
                            className="w-10 h-10 object-cover shrink-0 border border-primary/10"
                          />
                        )}
                        <div>
                          <p className="font-semibold text-primary">{product.name}</p>
                          <p className="text-xs text-primary/40">{product.slug}</p>
                          {product.category && (
                            <p className="text-xs text-primary/50">{product.category.name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-primary">
                      {formatCOP(product.price)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-semibold ${
                          product.stock === 0
                            ? 'text-red-600'
                            : product.stock <= 5
                            ? 'text-yellow-600'
                            : 'text-primary'
                        }`}
                      >
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleMutation.mutate(product.id)}
                        disabled={toggleMutation.isPending}
                        className={`text-xs px-2 py-0.5 transition-colors cursor-pointer ${
                          product.isActive
                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {product.isActive ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center text-primary/60">
                      {product._count.orderItems}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/productos/${product.id}`}
                        className="text-xs text-accent hover:underline cursor-pointer"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
                {data?.data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-primary/40">
                      No hay productos que coincidan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-primary/50">
                {data.meta.total} productos · página {data.meta.page} de {data.meta.totalPages}
              </span>
              <div className="flex gap-2">
                {data.meta.page > 1 && (
                  <button
                    onClick={() => setFilter('page', String(page - 1))}
                    className="px-3 py-1 border border-primary/20 hover:border-primary/50"
                  >
                    ← Anterior
                  </button>
                )}
                {data.meta.page < data.meta.totalPages && (
                  <button
                    onClick={() => setFilter('page', String(page + 1))}
                    className="px-3 py-1 border border-primary/20 hover:border-primary/50"
                  >
                    Siguiente →
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function ProductosPage() {
  return (
    <Suspense>
      <ProductsContent />
    </Suspense>
  );
}
