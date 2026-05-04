import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0a',
        surface: '#111111',
        'surface-2': '#1a1a1a',
        accent: '#d4af37',
        'accent-light': '#e8c94a',
        'accent-dark': '#b8962e',
        gold: '#d4af37',
        'text-primary': '#d4af37',
        'text-secondary': '#c8a830',
        'text-muted': '#8a7020',
        border: '#2a2a1a',
      },
      fontFamily: {
        sans: ['var(--font-noto-sans-jp)', 'sans-serif'],
        display: ['var(--font-playfair-display)', 'serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'hero-gradient': 'linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 60%, rgba(0,0,0,0.75) 100%)',
        'card-gradient': 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0) 60%)',
        'pink-glow': 'radial-gradient(ellipse at center, rgba(212,175,55,0.08) 0%, transparent 70%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
