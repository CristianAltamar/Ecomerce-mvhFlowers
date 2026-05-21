import { prisma } from '../../config/prisma';
import { NotFoundError, ConflictError } from '../../lib/errors';
import type { CreateCategoryInput, UpdateCategoryInput } from './admin.schemas';

const CATEGORY_INCLUDE = {
  parent: { select: { id: true, name: true, slug: true } },
  _count: { select: { children: true, products: true } },
} as const;

export const adminCategoriesService = {
  async list() {
    return prisma.category.findMany({
      include: CATEGORY_INCLUDE,
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
    });
  },

  async getById(id: string) {
    const cat = await prisma.category.findUnique({ where: { id }, include: CATEGORY_INCLUDE });
    if (!cat) throw new NotFoundError('Categoría no encontrada');
    return cat;
  },

  async create(data: CreateCategoryInput) {
    const existing = await prisma.category.findUnique({ where: { slug: data.slug } });
    if (existing) throw new ConflictError(`El slug "${data.slug}" ya existe`);

    return prisma.category.create({
      data: {
        name: data.name,
        slug: data.slug,
        description: data.description,
        imageUrl: data.imageUrl,
        parentId: data.parentId,
        position: data.position,
        isActive: data.isActive,
      },
      include: CATEGORY_INCLUDE,
    });
  },

  async update(id: string, data: UpdateCategoryInput) {
    await this.getById(id);

    if (data.slug) {
      const conflict = await prisma.category.findFirst({
        where: { slug: data.slug, NOT: { id } },
      });
      if (conflict) throw new ConflictError(`El slug "${data.slug}" ya está en uso`);
    }

    return prisma.category.update({
      where: { id },
      data,
      include: CATEGORY_INCLUDE,
    });
  },

  async toggleActive(id: string) {
    const cat = await this.getById(id);
    return prisma.category.update({
      where: { id },
      data: { isActive: !cat.isActive },
      include: CATEGORY_INCLUDE,
    });
  },
};
