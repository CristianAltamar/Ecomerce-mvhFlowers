import { prisma } from '../../config/prisma';
import { cloudinary, cloudinaryConfigured } from '../../lib/cloudinary';
import { BadRequestError, NotFoundError } from '../../lib/errors';
import { cache } from '../../lib/cache';

/**
 * URL de entrega FIRMADA para un asset restringido (access_mode: authenticated).
 * Las imágenes restringidas no se pueden ver con la URL pública; la firma
 * (derivada del api_secret) autoriza la entrega en cualquier lugar (admin y tienda).
 * No expira (no usa token temporal), así que es seguro guardarla en BD.
 */
function signedDeliveryUrl(publicId: string, version?: number): string {
  return cloudinary.url(publicId, {
    secure: true,
    sign_url: true,
    resource_type: 'image',
    ...(version ? { version } : {}),
  });
}

export const adminMediaService = {
  async list(page: number, perPage: number) {
    const skip = (page - 1) * perPage;
    const [data, total] = await Promise.all([
      prisma.media.findMany({ orderBy: { createdAt: 'desc' }, skip, take: perPage }),
      prisma.media.count(),
    ]);
    return { data, meta: { page, perPage, total, totalPages: Math.ceil(total / perPage) } };
  },

  async upload(buffer: Buffer, originalname: string, mimetype: string) {
    if (!cloudinaryConfigured) {
      throw new BadRequestError('Cloudinary no está configurado. Agrega CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.');
    }

    const result = await new Promise<{
      secure_url: string;
      public_id: string;
      bytes: number;
      width: number;
      height: number;
      version: number;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        // access_mode: 'authenticated' → la imagen queda restringida (no accesible por URL pública directa)
        { folder: 'mvh-flores', resource_type: 'image', access_mode: 'authenticated' },
        (error, res) => {
          if (error || !res) reject(error ?? new Error('Upload failed'));
          else resolve(res as Parameters<typeof resolve>[0]);
        },
      );
      stream.end(buffer);
    });

    return prisma.media.create({
      data: {
        url: signedDeliveryUrl(result.public_id, result.version),
        publicId: result.public_id,
        filename: originalname,
        mimeType: mimetype,
        sizeBytes: result.bytes,
        width: result.width,
        height: result.height,
      },
    });
  },

  async update(id: string, data: { filename?: string; alt?: string | null }) {
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) throw new NotFoundError('Archivo no encontrado');
    const updated = await prisma.media.update({
      where: { id },
      data: {
        ...(data.filename !== undefined ? { filename: data.filename } : {}),
        ...(data.alt !== undefined ? { alt: data.alt } : {}),
      },
    });
    // El alt puede usarse en imágenes de producto cacheadas en la tienda
    await cache.delPattern('products:*');
    return updated;
  },

  async remove(id: string) {
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) throw new NotFoundError('Archivo no encontrado');

    // Borra primero en Cloudinary; si falla, no eliminamos el registro para evitar huérfanos invisibles.
    if (cloudinaryConfigured && media.publicId) {
      await cloudinary.uploader.destroy(media.publicId).catch(() => null);
    }

    // El FK de ProductImage es ON DELETE SET NULL: las imágenes que la usaban quedan sin media.
    await prisma.media.delete({ where: { id } });
    // Limpia el caché de productos por si la imagen estaba en uso en la tienda
    await cache.delPattern('products:*');
  },

  /**
   * Importa a la biblioteca las imágenes existentes en Cloudinary (carpeta mvh-flores)
   * que aún no estén registradas en Media. Dedupe por publicId. Devuelve cuántas se crearon.
   */
  async syncFromCloudinary(): Promise<{ imported: number; total: number }> {
    if (!cloudinaryConfigured) {
      throw new BadRequestError('Cloudinary no está configurado.');
    }

    type CloudResource = {
      public_id: string;
      secure_url: string;
      bytes?: number;
      width?: number;
      height?: number;
      format?: string;
      version?: number;
      access_mode?: string;
    };

    // Pagina por todos los recursos de la carpeta (cap de seguridad para no bucear infinito)
    const resources: CloudResource[] = [];
    let nextCursor: string | undefined;
    let pages = 0;
    do {
      const res = (await cloudinary.api.resources({
        type: 'upload',
        prefix: 'mvh-flores/',
        max_results: 500,
        ...(nextCursor ? { next_cursor: nextCursor } : {}),
      })) as { resources: CloudResource[]; next_cursor?: string };
      resources.push(...res.resources);
      nextCursor = res.next_cursor;
      pages += 1;
    } while (nextCursor && pages < 20);

    if (resources.length === 0) return { imported: 0, total: 0 };

    // Registros ya existentes (por publicId) para no duplicar y poder re-firmar URLs viejas
    const existing = await prisma.media.findMany({
      where: { publicId: { in: resources.map((r) => r.public_id) } },
      select: { id: true, publicId: true, url: true },
    });
    const byPublicId = new Map(existing.map((e) => [e.publicId, e]));

    const toCreate: Array<{
      url: string; publicId: string; filename: string;
      mimeType: string | null; sizeBytes: number | null; width: number | null; height: number | null;
    }> = [];
    const toUpdate: Array<{ id: string; url: string }> = [];

    for (const r of resources) {
      // SIEMPRE firmamos: funciona tanto para públicas como restringidas (authenticated).
      // api.resources no devuelve access_mode, así que no podemos distinguir; firmar es seguro en ambos casos.
      const url = signedDeliveryUrl(r.public_id, r.version);
      const ex = byPublicId.get(r.public_id);
      if (!ex) {
        toCreate.push({
          url,
          publicId: r.public_id,
          filename: r.public_id.split('/').pop() ?? r.public_id,
          mimeType: r.format ? `image/${r.format}` : null,
          sizeBytes: r.bytes ?? null,
          width: r.width ?? null,
          height: r.height ?? null,
        });
      } else if (ex.url !== url) {
        // Imagen ya registrada con URL sin firmar (o desactualizada) → la re-firmamos
        toUpdate.push({ id: ex.id, url });
      }
    }

    if (toCreate.length > 0) {
      await prisma.media.createMany({ data: toCreate, skipDuplicates: true });
    }
    for (const u of toUpdate) {
      await prisma.media.update({ where: { id: u.id }, data: { url: u.url } });
    }
    if (toCreate.length > 0 || toUpdate.length > 0) {
      await cache.delPattern('products:*');
    }

    return { imported: toCreate.length, total: resources.length };
  },
};
