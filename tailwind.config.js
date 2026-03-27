/** @type {import('tailwindcss').Config} */
import defaultColors from 'tailwindcss/colors.js'
import defaultTheme from 'tailwindcss/defaultTheme.js'

export default {
  darkMode: 'class',
  content: [
    './src/assets/**/*.{scss,css}',
    './src/**/*.{js,vue,ts}',
    './src/**/*.stories.{js,vue,ts}',
    './src/app.vue'
  ],
  safelist: [
    {
      pattern: /^text-/
    }
  ],
  variants: {
    extend: {
      opacity: ['disabled'],
      borderWidth: ['hover', 'first'],
      ringWidth: ['hover']
    }
  },
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'Nunito', defaultTheme.fontFamily.sans],
        mono: ['"JetBrains Mono"', defaultTheme.fontFamily.mono]
      },
      transitionProperty: {
        height: 'height'
      },
      boxShadow: {
        bottom: 'inset 0 -38px 38px -38px #ececec',
        'glow-blue': '0 0 12px rgba(59, 130, 246, 0.3)',
        'glow-sm': '0 0 8px rgba(59, 130, 246, 0.15)',
        card: '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)'
      },
      fontSize: {
        '2xs': ['0.7rem', { lineHeight: '1.1rem' }]
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-in-right': 'slideInRight 0.25s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' }
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' }
        }
      }
    },
    fontWeight: {
      ...defaultTheme.fontWeight
    },
    colors: {
      ...defaultColors,
      transparent: 'transparent',
      current: 'currentColor',
      purple: defaultColors.indigo,
      red: defaultColors.rose,
      orange: defaultColors.amber
    }
  }
}
