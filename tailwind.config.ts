import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#E8650A', dark: '#C4540A', light: '#FEF0E6' },
        textdark: '#1a1a1a',
        textmid: '#555555',
        textlight: '#888888',
        bg: '#f7f7f5',
        border: '#e8e8e8',
        green: '#16a34a',
        red: '#dc2626',
        blue: '#2563eb',
      },
      borderRadius: { DEFAULT: '8px', lg: '12px' },
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
export default config
