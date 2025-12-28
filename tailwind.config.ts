import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'primary-blue': '#2563eb',
        'primary-blue-dark': '#1e40af',
        'primary-blue-light': '#3b82f6',
        'secondary-gray': '#6b7280',
        'bg-primary': '#ffffff',
        'bg-secondary': '#f9fafb',
        'bg-primary-blue': '#2563eb',
        'font-primary': '#111827',
        'font-secondary': '#6b7280',
        'font-red': '#ef4444',
        'border-gray': '#e5e7eb',
      },
    },
  },
  plugins: [],
}
export default config

