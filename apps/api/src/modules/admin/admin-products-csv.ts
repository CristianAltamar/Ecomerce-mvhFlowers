import { type Request, type Response } from 'express';
import { prisma } from '../../config/prisma';
import { asyncHandler } from '../../lib/async-handler';
import { sendSuccess } from '../../lib/http';
import { cache } from '../../lib/cache';
import { slugify } from '@mvh/utils';
import type { DiscountType } from '../../generated/prisma/client';

const CSV_HEADERS = [
  'nombre',
  'slug',
  'descripcion',
  'descripcion_corta',
  'precio',
  'tipo_descuento',
  'valor_descuento',
  'categoria_slug',
  'destacado',
  'activo',
  'stock',
  'meta_titulo',
  'meta_descripcion',
] as const;

type ImportRowResult = {
  row: number;
  name: string;
  status: 'created' | 'error';
  message?: string;
};

function escapeField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function buildCsvLine(values: readonly string[]): string {
  return values.map(escapeField).join(',');
}

// RFC 4180 parser — soporta campos entre comillas con comas/punto y coma y comillas escapadas
function parseCsvLine(line: string, delimiter: ',' | ';'): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i] as string; // safe: i < line.length
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { // undefined !== '"' → safe
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Detecta si el CSV usa punto y coma (Excel español) o coma (estándar)
function detectDelimiter(headerLine: string): ',' | ';' {
  const semicolons = (headerLine.match(/;/g) ?? []).length;
  const commas = (headerLine.match(/,/g) ?? []).length;
  return semicolons > commas ? ';' : ',';
}

function parseCsv(text: string): Record<string, string>[] {
  // Quita BOM UTF-8 que Excel agrega al guardar (U+FEFF = código 65279)
  const cleaned = text.replace(/^﻿/, '');
  const lines = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  if (lines.length < 2) return [];
  const delimiter = detectDelimiter(lines[0]!); // lines.length >= 2, safe
  const headers = parseCsvLine(lines[0]!, delimiter).map((h) => h.toLowerCase().trim().replace(/^﻿/, ''));
  return lines
    .slice(1)
    .filter((l) => l.trim())
    .map((line) => {
      const values = parseCsvLine(line, delimiter);
      return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? '']));
    });
}

function computePricing(price: number, discountType: DiscountType | null, discountValue: number | null) {
  if (!discountType || !discountValue || discountValue <= 0) {
    return { price, compareAtPrice: null, discountType: null, discountValue: null };
  }
  const final =
    discountType === 'PERCENT' ? Math.round(price * (1 - discountValue / 100)) : price - discountValue;
  if (final <= 0) throw new Error('El descuento no puede dejar el precio en 0 o menos');
  return { price: final, compareAtPrice: price, discountType, discountValue };
}

export const adminProductsCsvController = {
  downloadTemplate: asyncHandler(async (_req: Request, res: Response) => {
    const header = buildCsvLine(CSV_HEADERS);
    const examples = [
      buildCsvLine([
        'Rosas Rojas Premium',
        '',
        'Hermoso arreglo de 12 rosas rojas premium',
        '12 rosas de temporada',
        '150000',
        '',
        '',
        '',
        'false',
        'true',
        '10',
        '',
        '',
      ]),
      buildCsvLine([
        'Bouquet de Girasoles',
        'bouquet-de-girasoles',
        'Alegre bouquet de 8 girasoles frescos',
        'Ideal para decoración',
        '120000',
        'PERCENT',
        '10',
        'arreglos',
        'true',
        'true',
        '5',
        '',
        '',
      ]),
    ];

    const csv = '﻿' + [header, ...examples].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="plantilla-productos.csv"');
    res.send(csv);
  }),

  importCsv: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      res.status(400).json({ ok: false, error: { code: 'BAD_REQUEST', message: 'No se subió ningún archivo CSV' } });
      return;
    }

    const text = req.file.buffer.toString('utf-8').replace(/^﻿/, '');
    const rows = parseCsv(text);

    if (rows.length === 0) {
      res.status(400).json({ ok: false, error: { code: 'BAD_REQUEST', message: 'El CSV no contiene filas de datos' } });
      return;
    }

    const allCategories = await prisma.category.findMany({ select: { id: true, slug: true } });
    const categoryBySlug = new Map(allCategories.map((c) => [c.slug, c.id]));

    const results: ImportRowResult[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;
      const rowNum = i + 2; // fila real en el CSV (1-based + header)

      try {
        const nombre = row['nombre']?.trim();
        if (!nombre) throw new Error('El campo "nombre" es requerido');

        const precioRaw = row['precio']?.trim();
        const precio = Math.round(Number(precioRaw));
        if (!precioRaw || isNaN(precio) || precio <= 0) {
          throw new Error('"precio" debe ser un entero positivo en pesos COP');
        }

        const slugValue = row['slug']?.trim() || slugify(nombre);

        const tipoDescuentoRaw = row['tipo_descuento']?.trim().toUpperCase();
        const discountType: DiscountType | null =
          tipoDescuentoRaw === 'PERCENT' || tipoDescuentoRaw === 'FIXED' ? tipoDescuentoRaw : null;

        const valorDescuentoRaw = row['valor_descuento']?.trim();
        const discountValue = valorDescuentoRaw ? Number(valorDescuentoRaw) : null;

        if (discountType && (discountValue === null || isNaN(discountValue))) {
          throw new Error('Si se especifica "tipo_descuento", "valor_descuento" debe ser un número');
        }

        const categoriaSlug = row['categoria_slug']?.trim();
        let categoryId: string | null = null;
        if (categoriaSlug) {
          categoryId = categoryBySlug.get(categoriaSlug) ?? null;
          if (!categoryId) throw new Error(`Categoría "${categoriaSlug}" no encontrada`);
        }

        const pricing = computePricing(precio, discountType, discountValue);

        await prisma.product.create({
          data: {
            name: nombre,
            slug: slugValue,
            description: row['descripcion']?.trim() || null,
            shortDescription: row['descripcion_corta']?.trim() || null,
            price: pricing.price,
            compareAtPrice: pricing.compareAtPrice,
            discountType: pricing.discountType,
            discountValue: pricing.discountValue,
            categoryId,
            isFeatured: row['destacado']?.trim().toLowerCase() === 'true',
            isActive: row['activo']?.trim().toLowerCase() !== 'false',
            stock: row['stock']?.trim() ? Math.max(0, Math.round(Number(row['stock']))) : 0,
            metaTitle: row['meta_titulo']?.trim() || null,
            metaDescription: row['meta_descripcion']?.trim() || null,
            currency: 'COP',
          },
        });

        results.push({ row: rowNum, name: nombre, status: 'created' });
      } catch (err) {
        let message = 'Error desconocido';
        if (err instanceof Error) {
          message = err.message;
        }
        // Slug duplicado (Prisma P2002)
        if (typeof err === 'object' && err !== null && 'code' in err && err.code === 'P2002') {
          message = 'Ya existe un producto con ese slug';
        }
        results.push({ row: rowNum, name: row['nombre'] || `Fila ${rowNum}`, status: 'error', message });
      }
    }

    const created = results.filter((r) => r.status === 'created').length;
    if (created > 0) await cache.delPattern('products:*');

    sendSuccess(res, {
      total: rows.length,
      created,
      errors: results.filter((r) => r.status === 'error').length,
      results,
    });
  }),
};
