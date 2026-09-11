/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Studio Veda design system from design1.md
        primary: {
          DEFAULT: '#B8754F',
          50: '#F8F0EB',
          100: '#EFD9CC',
          200: '#DEB499',
          300: '#CE8F66',
          400: '#C47F5A',
          500: '#B8754F',
          600: '#9B5F3F',
          700: '#7D4C32',
          800: '#5F3825',
          900: '#412618',
        },
        accent: '#9B5F3F',
        background: '#000000',
        surface: '#191C21',
        'surface-2': '#22262E',
        'surface-3': '#2A2F38',
        'text-primary': '#FFFFFF',
        'text-secondary': '#A1A1AA',
        'text-muted': '#71717A',
        border: '#756B61',
        'border-subtle': '#2A2F38',
      },
      fontFamily: {
        display: ['Instrument Serif', 'Georgia', 'serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'display-lg': ['64px', { lineHeight: '1.04', letterSpacing: '0' }],
        'display-md': ['48px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-sm': ['36px', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
      },
      borderRadius: {
        card: '10px',
        control: '8px',
        pill: '9999px',
      },
      spacing: {
        'card': '24px',
        'section': '80px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.4), 0 1px 2px rgba(0,0,0,0.6)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.5), 0 2px 4px rgba(0,0,0,0.7)',
        'copper': '0 0 20px rgba(184, 117, 79, 0.15)',
        'copper-lg': '0 0 40px rgba(184, 117, 79, 0.2)',
      },
      backgroundImage: {
        'copper-gradient': 'linear-gradient(135deg, #B8754F 0%, #9B5F3F 100%)',
        'surface-gradient': 'linear-gradient(180deg, #191C21 0%, #111418 100%)',
        'dark-gradient': 'linear-gradient(180deg, #000000 0%, #0D0F12 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-subtle': 'pulseSubtle 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-8px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}
