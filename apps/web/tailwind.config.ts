import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Paleta MVH Flores: burdeos + dorado + crema
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
          900: '#5a1028', // tono principal
          950: '#3d0a1c',
        },
        gold: {
          50: '#fdf9ef',
          100: '#faf0d7',
          200: '#f4dfaa',
          300: '#ecc774',
          400: '#e4ac47',
          500: '#d49328', // tono principal
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
        display: ['var(--font-display)', 'Georgia', 'serif'],
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        widest: '0.25em',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'fade-up': 'fadeUp 0.7s ease-out forwards',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #d49328 0%, #ecc774 50%, #d49328 100%)',
        'burgundy-radial':
          'radial-gradient(ellipse at top, #831b3e 0%, #5a1028 60%, #3d0a1c 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
