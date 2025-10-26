import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        secondary: '#8b5cf6',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      zIndex: {
        canvas: '0',
        overlay: '10',
        control: '20',
        status: '30',
        modal: '100',
      },
    },
  },
  plugins: [],
}

export default config
