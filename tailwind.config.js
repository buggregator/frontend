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
        sans: ['Nunito', defaultTheme.fontFamily.sans]
      },
      transitionProperty: {
        height: 'height'
      },
      boxShadow: {
        bottom: 'inset 0 -38px 38px -38px #ececec'
      },
      fontSize: {
        '2xs': ['0.6rem', { lineHeight: '1rem' }]
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
