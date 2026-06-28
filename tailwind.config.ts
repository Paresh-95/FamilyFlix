import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        netflix: {
          red:     '#E50914',
          dark:    '#0a0a0a',
          surface: '#141414',
          card:    '#1c1c1c',
          border:  '#2d2d2d',
          gray:    '#a0a0a0',
          muted:   '#5a5a5a',
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.4s ease both',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
export default config;
