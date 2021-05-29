const colors = require('tailwindcss/colors')

module.exports = {
  darkMode: 'class',
  purge: {
    enabled: true,
    content: [
      './src/**/*.html',
      './src/**/*.vue',
    ],
  },
  theme: {
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      black: '#161616',
      white: '#ffffff',
      gray: colors.gray,
      indigo: colors.indigo,
      teal: colors.teal,
      pink: colors.pink,
      red: colors.red,
      yellow: colors.amber,
      green: colors.green,
    },
  },
  variants: {
    extends: {
      opacity: ['active', 'hover'],
      scale: ['active'],
      border: ['focus'],
      translate: ['active'],
      transform: ['active'],
    }
  },
  plugins: [
  ],
}
