import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // ── Tokens semánticos del tema (editables desde /admin/configuracion/temas) ──
        // Las variaciones se logran con opacidad: bg-primary/10, text-primary/50, etc.
        // Cada uno se define con canales RGB para soportar el modificador <alpha-value>.
        primary:        'rgb(var(--th-primary-rgb) / <alpha-value>)',
        'primary-light':'rgb(var(--th-primary-light-rgb) / <alpha-value>)',
        accent:         'rgb(var(--th-accent-rgb) / <alpha-value>)',
        'accent-light': 'rgb(var(--th-accent-light-rgb) / <alpha-value>)',
        surface:        'rgb(var(--th-surface-rgb) / <alpha-value>)',
        muted:          'rgb(var(--th-muted-rgb) / <alpha-value>)',
        ink:            'rgb(var(--th-ink-rgb) / <alpha-value>)',

        // ── Paleta legacy (estática) — fallback para usos no migrados ──
        burgundy: {
          50: '#fdf2f4',
          100: '#fbe5ea',
          200: '#f6c8d3',
          300: '#ef9eb1',
          400: '#e36889',
          500: '#d23d65',
          600: '#bc2752',
          700: '#9d1d44',
          800: '#831b3e',
          900: '#5a1028',
          950: '#3d0a1c',
        },
        gold: {
          50: '#fdf9ef',
          100: '#faf0d7',
          200: '#f4dfaa',
          300: '#ecc774',
          400: '#e4ac47',
          500: '#d49328',
          600: '#b9761f',
          700: '#985a1d',
          800: '#7e481e',
          900: '#693c1c',
          950: '#3c1f0c',
        },
        cream: {
          50: '#fdfbf7',
          100: '#faf5ea',
          200: '#f3e9d2',
          300: '#ead7af',
          400: '#dec188',
          DEFAULT: '#f7f1e3',
        },
      },
      fontFamily: {
        display: ['var(--th-font-heading)', 'Georgia', 'serif'],
        serif: ['var(--th-font-body)', 'Georgia', 'serif'],
        sans: ['var(--th-font-ui)', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        widest: '0.25em',
      },
      // Animaciones — keyframes en globals.css (de @midudev/tailwind-animations)
      animation: {
        'fade-in':         'fade-in 0.6s ease-in both',
        'fade-out':        'fade-out 0.6s ease-out both',
        'fade-up':         'fade-in-up 0.7s ease-in-out both',
        'fade-in-up':      'fade-in-up 0.7s ease-in-out both',
        'fade-in-down':    'fade-in-down 0.6s ease-in-out both',
        'fade-in-left':    'fade-in-left 0.6s ease-in-out both',
        'fade-in-right':   'fade-in-right 0.6s ease-in-out both',
        'slide-in-bottom': 'slide-in-bottom 0.6s ease-out both',
        'zoom-in':         'zoom-in 0.6s ease-out both',
        'blurred-fade-in': 'blurred-fade-in 0.9s ease-in-out both',
        // search-in: fade-in-up más rápido para el panel de búsqueda
        'search-in':       'fade-in-up 0.28s cubic-bezier(0.16, 1, 0.3, 1) both',
        // shimmer no está en la librería, se mantiene custom
        'shimmer':         'shimmer 2s linear infinite',
      },
      backgroundImage: {
        'gold-gradient':
          'linear-gradient(135deg, var(--th-accent) 0%, var(--th-accent-light) 50%, var(--th-accent) 100%)',
        'burgundy-radial':
          'radial-gradient(ellipse at top, var(--th-primary-light) 0%, var(--th-primary) 60%, #3d0a1c 100%)',
      },
    },
  },
  plugins: [],
};

export default config;