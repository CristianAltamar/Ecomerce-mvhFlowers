'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { authFetch } from '@/lib/auth-fetch';
import { ProductForm } from '../_components/product-form';

export default function EditarProductoPage() {
  const { id } = useParams<{ id: string }>();

  const { data: product, isLoading } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => authFetch<Parameters<typeof ProductForm>[0]['product']>(`/admin/products/${id}`),
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <p className="text-primary/40 animate-pulse">Cargando producto…</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8">
        <p className="text-red-500">Producto no encontrado.</p>
      </div>
    );
  }

  return <ProductForm product={product} />;
}
