// Aplana la relación ProductImage → Media para la respuesta del API.
// En BD ProductImage referencia Media (mediaId); el front espera { url, alt }.

export interface RawProductImage {
  id: string;
  alt: string | null;
  position: number;
  media: { url: string; alt: string | null } | null;
}

export interface FlatProductImage {
  id: string;
  url: string;
  alt: string | null;
  position: number;
}

/** Include de Prisma para traer la URL desde Media. */
export const productImagesInclude = {
  orderBy: { position: 'asc' as const },
  include: { media: { select: { url: true, alt: true } } },
} as const;

/** Convierte las imágenes (con relación media) a la forma plana { url, alt }. */
export function flattenImages(images: RawProductImage[]): FlatProductImage[] {
  return images
    .filter((img) => img.media !== null)
    .map((img) => ({
      id: img.id,
      url: img.media!.url,
      alt: img.alt ?? img.media!.alt ?? null,
      position: img.position,
    }));
}

/** Mapea un producto (o cualquier objeto con `images`) aplanando sus imágenes. */
export function mapProduct<T extends { images: RawProductImage[] }>(
  product: T,
): Omit<T, 'images'> & { images: FlatProductImage[] } {
  return { ...product, images: flattenImages(product.images) };
}
