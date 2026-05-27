import { prisma } from '../../config/prisma';
import { cloudinary, cloudinaryConfigured } from '../../lib/cloudinary';
import { BadRequestError, NotFoundError } from '../../lib/errors';

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
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'mvh-flores', resource_type: 'image' },
        (error, res) => {
          if (error || !res) reject(error ?? new Error('Upload failed'));
          else resolve(res as Parameters<typeof resolve>[0]);
        },
      );
      stream.end(buffer);
    });

    return prisma.media.create({
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        filename: originalname,
        mimeType: mimetype,
        sizeBytes: result.bytes,
        width: result.width,
        height: result.height,
      },
    });
  },

  async remove(id: string) {
    const media = await prisma.media.findUnique({ where: { id } });
    if (!media) throw new NotFoundError('Archivo no encontrado');

    if (cloudinaryConfigured && media.publicId) {
      await cloudinary.uploader.destroy(media.publicId).catch(() => null);
    }

    await prisma.media.delete({ where: { id } });
  },
};
