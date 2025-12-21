import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors
        purple: {
          royal: 'var(--purple-royal)',
          'royal-light': 'var(--purple-royal-light)',
          'royal-dark': 'var(--purple-royal-dark)',
        },
        gold: {
          warm: 'var(--gold-warm)',
          'warm-light': 'var(--gold-warm-light)',
          'warm-dark': 'var(--gold-warm-dark)',
        },
        background: {
          primary: 'var(--bg-primary)',
          secondary: 'var(--bg-secondary)',
          tertiary: 'var(--bg-tertiary)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },
        // Border colors
        'border-gold': 'var(--border-gold)',
        'border-gold-hover': 'var(--border-gold-hover)',
      },
      backgroundImage: {
        'hero-gradient': 'var(--gradient-hero)',
        'purple-gradient': 'var(--gradient-purple)',
        'gold-gradient': 'var(--gradient-gold)',
        'royal-gradient': 'var(--gradient-royal)',
      },
      boxShadow: {
        'glow-gold': '0 0 20px var(--glow-gold)',
        'glow-gold-strong': '0 0 30px var(--glow-gold-strong)',
        'glow-purple': '0 0 20px rgba(139, 92, 246, 0.5)',
        'premium': '0 10px 40px rgba(0, 0, 0, 0.3)',
        'premium-lg': '0 20px 60px rgba(0, 0, 0, 0.4)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        display: ['var(--font-display)'],
        mono: ['var(--font-mono)'],
      },
      borderRadius: {
        sm: '8px',
        DEFAULT: '12px',
        md: '16px',
        lg: '20px',
        xl: '24px',
        '2xl': '32px',
        '3xl': '48px',
        full: '9999px',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        '2xl': '48px',
        '3xl': '64px',
        '4xl': '96px',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s var(--ease-smooth)',
        'slide-up': 'slideUp 0.3s var(--ease-smooth)',
        'scale-in': 'scaleIn 0.3s var(--ease-bounce)',
        'glow-pulse': 'glowPulse 2s var(--ease-smooth) infinite',
        'shimmer': 'shimmer 2s linear infinite',        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'gradient-flow': 'gradientFlow 3s ease infinite',
        'spin-slow': 'spin 8s linear infinite',
        'gradient-slow': 'gradientSlow 15s ease infinite',
        'pulse-slow': 'pulseSlow 8s ease-in-out infinite',
        'float': 'float 15s ease-in-out infinite',      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(212, 175, 55, 0.6)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(255, 215, 0, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(255, 215, 0, 0.8), 0 0 60px rgba(255, 215, 0, 0.4)' },
        },
        gradientFlow: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        gradientSlow: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        pulseSlow: {
          '0%, 100%': { opacity: '0.3' },
          '50%': { opacity: '0.6' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) translateX(0)' },
          '25%': { transform: 'translateY(-20px) translateX(10px)' },
          '50%': { transform: 'translateY(-40px) translateX(-10px)' },
          '75%': { transform: 'translateY(-20px) translateX(-5px)' },
        },
      },
      transitionDuration: {
        fast: '150ms',
        normal: '300ms',
        slow: '500ms',
      },
      transitionTimingFunction: {
        smooth: 'var(--ease-smooth)',
        bounce: 'var(--ease-bounce)',
        spring: 'var(--ease-spring)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
