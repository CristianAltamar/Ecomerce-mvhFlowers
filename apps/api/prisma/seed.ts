import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Seed de datos basado en el catálogo real de mvhflores.com
 * Ejecutar: pnpm --filter @mvh/api db:seed
 */
async function main() {
  console.log('🌱 Iniciando seed de MVH Flores...');

  // === LIMPIEZA ===
  console.log('🧹 Limpiando datos previos...');
  await prisma.$transaction([
    prisma.orderStatusHistory.deleteMany(),
    prisma.orderItem.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.order.deleteMany(),
    prisma.refreshToken.deleteMany(),
    prisma.auditLog.deleteMany(),
    prisma.address.deleteMany(),
    prisma.inventoryMovement.deleteMany(),
    prisma.productImage.deleteMany(),
    prisma.productVariant.deleteMany(),
    prisma.product.deleteMany(),
    prisma.category.deleteMany(),
    prisma.coupon.deleteMany(),
    prisma.banner.deleteMany(),
    prisma.deliveryZone.deleteMany(),
    prisma.deliverySlot.deleteMany(),
    prisma.blockedDate.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // === USUARIOS ===
  console.log('👤 Creando usuarios...');
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const customerPassword = await bcrypt.hash('Cliente123!', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@mvhflores.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'MVH',
      phone: '+57 322 451 3906',
      role: 'ADMIN',
      emailVerifiedAt: new Date(),
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'cliente@test.com',
      passwordHash: customerPassword,
      firstName: 'María',
      lastName: 'García',
      phone: '+57 300 123 4567',
      role: 'CUSTOMER',
      emailVerifiedAt: new Date(),
    },
  });

  // === CATEGORÍAS (jerarquía como el sitio actual) ===
  console.log('🌿 Creando categorías...');

  const arreglosPremium = await prisma.category.create({
    data: {
      slug: 'arreglos-premium',
      name: 'Arreglos premium',
      description: 'Nuestras creaciones más exclusivas, diseñadas para ocasiones inolvidables.',
      position: 1,
    },
  });

  const estilo = await prisma.category.create({
    data: { slug: 'estilo', name: 'Estilo', position: 2 },
  });

  const bouquets = await prisma.category.create({
    data: { slug: 'bouquets', name: 'Bouquets', parentId: estilo.id, position: 1 },
  });

  const sembrados = await prisma.category.create({
    data: { slug: 'sembrados', name: 'Sembrados', parentId: estilo.id, position: 2 },
  });

  const arreglosFlorales = await prisma.category.create({
    data: { slug: 'arreglos-florales', name: 'Arreglos Florales', parentId: estilo.id, position: 3 },
  });

  const floreros = await prisma.category.create({
    data: { slug: 'floreros', name: 'Floreros', parentId: estilo.id, position: 4 },
  });

  const ocasion = await prisma.category.create({
    data: { slug: 'ocasion', name: 'Ocasión', position: 3 },
  });

  const amor = await prisma.category.create({
    data: { slug: 'amor', name: 'Amor', parentId: ocasion.id, position: 1 },
  });
  await prisma.category.create({
    data: { slug: 'amistad', name: 'Amistad', parentId: ocasion.id, position: 2 },
  });
  const cumpleanos = await prisma.category.create({
    data: { slug: 'cumpleanos', name: 'Cumpleaños', parentId: ocasion.id, position: 3 },
  });
  await prisma.category.create({
    data: { slug: 'aniversarios', name: 'Aniversarios', parentId: ocasion.id, position: 4 },
  });
  await prisma.category.create({
    data: { slug: 'condolencias', name: 'Condolencias', parentId: ocasion.id, position: 5 },
  });

  // === PRODUCTOS (basados en el catálogo real) ===
  console.log('💐 Creando productos...');

  const products = [
    {
      slug: 'sembrado-floral-primavera-radiante',
      name: 'Sembrado Floral Primavera Radiante',
      shortDescription: 'Sembrado con flores de temporada en tonos vibrantes.',
      description:
        'Un sembrado floral cuidadosamente compuesto con flores frescas de temporada en tonos rosa, blanco y verde. Ideal como detalle delicado o regalo para alegrar cualquier espacio.',
      priceCents: 9_000_000,
      categoryId: sembrados.id,
      isFeatured: true,
      stock: 15,
      imageUrl:
        'https://images.unsplash.com/photo-1455659817273-f96807779a8a?w=800&q=80&auto=format&fit=crop',
    },
    {
      slug: 'arreglo-rosas-gladiolos',
      name: 'Arreglo en base con Rosas y Gladiolos',
      shortDescription: 'Combinación elegante de rosas y gladiolos en base de cerámica.',
      description:
        'Arreglo floral en base de cerámica que combina rosas premium con gladiolos. Una pieza imponente, perfecta para regalar o decorar espacios especiales.',
      priceCents: 15_000_000,
      categoryId: arreglosFlorales.id,
      isFeatured: true,
      stock: 8,
      imageUrl:
        'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=800&q=80&auto=format&fit=crop',
    },
    {
      slug: 'frescura-tropical',
      name: 'Frescura Tropical',
      shortDescription: 'Diseño tropical vibrante con heliconias y aves del paraíso.',
      description:
        'Composición tropical que evoca la frescura del Caribe colombiano. Incluye heliconias, aves del paraíso y follaje selecto.',
      priceCents: 21_400_000,
      categoryId: arreglosFlorales.id,
      isFeatured: true,
      stock: 6,
      imageUrl:
        'https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=800&q=80&auto=format&fit=crop',
    },
    {
      slug: 'arreglo-unico',
      name: 'Arreglo único',
      shortDescription: 'Una creación premium personalizada por nuestra florista.',
      description:
        'Diseñado por nuestra florista principal, este arreglo único es irrepetible. Cada pieza varía según las flores frescas disponibles del día.',
      priceCents: 27_400_000,
      categoryId: arreglosPremium.id,
      isFeatured: true,
      stock: 4,
      imageUrl:
        'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=800&q=80&auto=format&fit=crop',
    },
    {
      slug: 'centro-de-mesa-luminosidad-floral',
      name: 'Centro de mesa luminosidad floral',
      shortDescription: 'Centro de mesa con velas y flores blancas.',
      description:
        'Centro de mesa elegante que combina velas LED con flores blancas y verdes. Perfecto para eventos, cenas o decoración especial.',
      priceCents: 29_700_000,
      categoryId: arreglosPremium.id,
      isFeatured: false,
      stock: 5,
      imageUrl:
        'https://images.unsplash.com/photo-1519378058457-4c29a0a2efac?w=800&q=80&auto=format&fit=crop',
    },
    {
      slug: 'arcoiris-de-rosas',
      name: 'Arcoíris de rosas',
      shortDescription: '24 rosas de colores variados en presentación premium.',
      description:
        'Un arcoíris de 24 rosas frescas en una gama de colores cuidadosamente seleccionada. Presentación premium con empaque sofisticado.',
      priceCents: 39_000_000,
      categoryId: arreglosPremium.id,
      isFeatured: true,
      stock: 7,
      imageUrl:
        'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&q=80&auto=format&fit=crop',
    },
    {
      slug: 'blush-and-bloom',
      name: 'Blush & Bloom',
      shortDescription: 'Bouquet en tonos rosa palo y nude.',
      description:
        'Un bouquet romántico en paleta blush, perfecto para aniversarios, citas especiales o como detalle de "porque sí".',
      priceCents: 25_400_000,
      categoryId: bouquets.id,
      isFeatured: true,
      stock: 10,
      imageUrl:
        'https://images.unsplash.com/photo-1530092285049-1c42085fd395?w=800&q=80&auto=format&fit=crop',
    },
    {
      slug: 'golden-sunflowers-box',
      name: 'Golden Sunflowers Box',
      shortDescription: 'Caja premium con girasoles y detalles dorados.',
      description:
        'Una caja de regalo con girasoles frescos, follaje verde y acentos dorados. Energía y alegría en cada pétalo.',
      priceCents: 28_700_000,
      categoryId: bouquets.id,
      isFeatured: true,
      stock: 9,
      imageUrl:
        'https://images.unsplash.com/photo-1473973266408-ed4e27abdd47?w=800&q=80&auto=format&fit=crop',
    },
    {
      slug: 'first-love',
      name: 'First Love',
      shortDescription: 'Bouquet romántico con rosas rojas y blancas.',
      description:
        'Una declaración floral del primer amor: rosas rojas como pasión, blancas como pureza. Acompañado de tarjeta personalizable.',
      priceCents: 39_500_000,
      categoryId: amor.id,
      isFeatured: true,
      stock: 6,
      imageUrl:
        'https://images.unsplash.com/photo-1494972308805-463bc619d34e?w=800&q=80&auto=format&fit=crop',
    },
    {
      slug: 'bouquet-amarillo-radiante',
      name: 'Bouquet amarillo radiante',
      shortDescription: 'Bouquet con girasoles y flores amarillas.',
      description: 'Bouquet en tonos amarillos vibrantes. Energía pura para regalar alegría.',
      priceCents: 12_500_000,
      categoryId: bouquets.id,
      isFeatured: false,
      stock: 14,
      imageUrl:
        'https://images.unsplash.com/photo-1496062031456-07b8f162a322?w=800&q=80&auto=format&fit=crop',
    },
    {
      slug: 'bouquet-de-margaritas',
      name: 'Bouquet de margaritas',
      shortDescription: 'Bouquet fresco de margaritas blancas y amarillas.',
      description: 'Sencillo y encantador. Un bouquet de margaritas frescas, ideal como detalle.',
      priceCents: 6_000_000,
      categoryId: bouquets.id,
      isFeatured: false,
      stock: 20,
      imageUrl:
        'https://images.unsplash.com/photo-1454425064867-89343b51e9a3?w=800&q=80&auto=format&fit=crop',
    },
    {
      slug: 'bouquet-surtido',
      name: 'Bouquet surtido',
      shortDescription: 'Combinación variada de flores de temporada.',
      description: 'Bouquet con flores variadas de temporada. El precio más accesible del catálogo.',
      priceCents: 4_000_000,
      categoryId: bouquets.id,
      isFeatured: false,
      stock: 25,
      imageUrl:
        'https://images.unsplash.com/photo-1469259943454-aa100abba749?w=800&q=80&auto=format&fit=crop',
    },
  ];

  for (const p of products) {
    const { imageUrl, ...productData } = p;
    const created = await prisma.product.create({
      data: {
        ...productData,
        metaTitle: `${productData.name} | MVH Flores Barranquilla`,
        metaDescription: productData.shortDescription,
        images: {
          create: [{ url: imageUrl, alt: productData.name, position: 0 }],
        },
      },
    });

    // Variantes para arreglos premium
    if (productData.priceCents >= 25_000_000) {
      await prisma.productVariant.createMany({
        data: [
          {
            productId: created.id,
            sku: `${productData.slug}-M`,
            name: 'Mediano',
            priceCents: productData.priceCents,
            stock: Math.floor((productData.stock ?? 0) / 2),
            isDefault: true,
          },
          {
            productId: created.id,
            sku: `${productData.slug}-G`,
            name: 'Grande',
            priceCents: Math.round(productData.priceCents * 1.3),
            stock: Math.ceil((productData.stock ?? 0) / 2),
            isDefault: false,
          },
        ],
      });
    }
  }

  // === ZONAS DE ENTREGA (Barranquilla) ===
  console.log('🚚 Creando zonas de entrega...');
  await prisma.deliveryZone.createMany({
    data: [
      {
        name: 'Norte',
        feeCents: 1_000_000,
        description: 'Norte de Barranquilla: Alto Prado, Villa Country, El Golf, Riomar.',
        neighborhoods: ['Alto Prado', 'Villa Country', 'El Golf', 'Riomar', 'Villa Santos', 'Altos del Prado'],
      },
      {
        name: 'Centro',
        feeCents: 800_000,
        description: 'Centro y zonas céntricas.',
        neighborhoods: ['Centro', 'Prado', 'Boston', 'El Recreo', 'Abajo'],
      },
      {
        name: 'Sur',
        feeCents: 1_200_000,
        description: 'Sur de Barranquilla.',
        neighborhoods: ['Ciudadela 20 de Julio', 'La Magdalena', 'Las Estrellas', 'Las Nieves'],
      },
      {
        name: 'Sur Occidente',
        feeCents: 1_500_000,
        description: 'Soledad y zonas aledañas.',
        neighborhoods: ['Soledad Centro', 'Hipódromo', 'Cordialidad'],
      },
    ],
  });

  // === FRANJAS HORARIAS ===
  console.log('⏰ Creando franjas horarias...');
  await prisma.deliverySlot.createMany({
    data: [
      { label: '8:00 AM - 11:00 AM', startTime: '08:00', endTime: '11:00', position: 1 },
      { label: '11:00 AM - 2:00 PM', startTime: '11:00', endTime: '14:00', position: 2 },
      { label: '2:00 PM - 5:00 PM', startTime: '14:00', endTime: '17:00', position: 3 },
      { label: '5:00 PM - 8:00 PM', startTime: '17:00', endTime: '20:00', position: 4 },
    ],
  });

  // === BANNERS HOME ===
  console.log('🖼️  Creando banners...');
  await prisma.banner.createMany({
    data: [
      {
        title: '¿Tienes una fecha especial hoy?',
        subtitle:
          'Cumpleaños, aniversarios, amor o simplemente porque sí — flores frescas a cualquier dirección en Barranquilla el mismo día.',
        imageUrl:
          'https://images.unsplash.com/photo-1490750967868-88aa4486c946?w=1600&q=80&auto=format&fit=crop',
        linkUrl: '/categoria/arreglos-premium',
        ctaLabel: 'Comprar ahora',
        position: 1,
      },
    ],
  });

  // === CUPONES DEMO ===
  console.log('🎟️  Creando cupones demo...');
  await prisma.coupon.create({
    data: {
      code: 'BIENVENIDA10',
      description: '10% de descuento en tu primera compra',
      type: 'PERCENT',
      value: 10,
      minPurchaseCents: 5_000_000,
      maxDiscountCents: 5_000_000,
      isActive: true,
    },
  });

  // === DIRECCIÓN DEMO DEL CLIENTE ===
  await prisma.address.create({
    data: {
      userId: customer.id,
      label: 'Casa',
      recipientName: 'María García',
      phone: '+57 300 123 4567',
      line1: 'Cra 48 # 75 - 51',
      neighborhood: 'Alto Prado',
      isDefault: true,
    },
  });

  // === LOG DE AUDITORÍA ===
  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      action: 'DATABASE_SEEDED',
      metadata: { products: products.length, env: process.env.NODE_ENV ?? 'development' },
    },
  });

  console.log('✅ Seed completado.');
  console.log('');
  console.log('📋 Credenciales:');
  console.log('   Admin    → admin@mvhflores.com / Admin123!');
  console.log('   Cliente  → cliente@test.com    / Cliente123!');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
