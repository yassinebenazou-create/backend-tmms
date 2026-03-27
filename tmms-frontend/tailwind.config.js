import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        tmms: {
          bg: '#0F172A',
          card: '#1E293B',
          border: 'rgba(255,255,255,0.07)',
          blue: '#3B82F6',
          green: '#22C55E',
          red: '#EF4444',
          amber: '#F59E0B',
          purple: '#8B5CF6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif']
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        'pulse-glow': 'pulseGlow 1.8s ease-in-out infinite',
        counter: 'counter 0.7s ease-out'
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' }
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 rgba(239, 68, 68, 0)' },
          '50%': { boxShadow: '0 0 18px rgba(239, 68, 68, 0.45)' }
        },
        counter: {
          '0%': { transform: 'translateY(4px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' }
        }
      }
    }
  },
  plugins: [forms]
};
