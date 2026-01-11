import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        child: {
          primary: '#FFD700',
          secondary: '#FF69B4',
          success: '#00D084',
          background: '#F0F9FF',
        },
        parent: {
          primary: '#3B82F6',
          secondary: '#8B5CF6',
          background: '#F9FAFB',
        },
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s infinite',
      },
    },
  },
  plugins: [],
};

export default config;
