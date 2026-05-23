import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Inter, Playfair_Display } from 'next/font/google';
import { HeaderServer } from '@/components/header-server';
import { Footer } from '@/components/footer';
import { CartDrawer } from '@/components/cart-drawer';
import { SearchModal } from '@/components/search-modal';
import { QueryProvider } from '@/providers/query-provider';
import { AuthProvider } from '@/providers/auth-provider';
import '@/styles/globals.css';

// Display: Playfair Display — elegancia editorial
const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
});

// Serif body: Cormorant Garamond — refinado, ideal para floristería premium
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-serif',
  weight: ['400', '500', '600'],
});

// Sans utility: Inter — para UI components que requieren legibilidad
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const viewport: Viewport = {
  themeColor: '#5a1028',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'MVH Flowers — Floristería premium en Barranquilla',
    template: '%s | MVH Flowers',
  },
  description:
    'Flores frescas seleccionadas y arreglos premium con entrega el mismo día en Barranquilla. Bouquets, sembrados, arreglos para ocasiones especiales.',
  keywords: [
    'flores Barranquilla',
    'floristería Barranquilla',
    'arreglos florales',
    'bouquets',
    'rosas',
    'flores a domicilio',
    'MVH Flowers',
  ],
  authors: [{ name: 'MVH Flowers' }],
  openGraph: {
    title: 'MVH Flowers — Floristería premium en Barranquilla',
    description: 'Flores frescas con entrega el mismo día en Barranquilla.',
    url: '/',
    siteName: 'MVH Flowers',
    locale: 'es_CO',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MVH Flowers — Floristería premium en Barranquilla',
    description: 'Flores frescas con entrega el mismo día en Barranquilla.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': 'https://mvhflores.co',
  name: 'MVH Flowers',
  description: 'Floristería premium con entrega el mismo día en Barranquilla, Colombia.',
  url: 'https://mvhflores.co',
  telephone: '+573224513906',
  image: 'https://mvhflores.co/opengraph-image',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Barranquilla',
    addressRegion: 'Atlántico',
    addressCountry: 'CO',
  },
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    opens: '08:00',
    closes: '17:00',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es-CO"
      className={`${playfair.variable} ${cormorant.variable} ${inter.variable}`}
    >
      <body className="font-serif min-h-screen flex flex-col bg-cream">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />
        <QueryProvider>
          <AuthProvider>
          <HeaderServer />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
          <SearchModal />
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
