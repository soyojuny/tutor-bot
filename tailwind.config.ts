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
        'mic-pulse': 'mic-pulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        'mic-pulse': {
          '0%, 100%': {
            transform: 'scale(1)',
            boxShadow: '0 0 0 0 rgba(34, 197, 94, 0.4)',
          },
          '50%': {
            transform: 'scale(1.08)',
            boxShadow: '0 0 0 20px rgba(34, 197, 94, 0)',
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
