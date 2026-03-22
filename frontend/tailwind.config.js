import forms from '@tailwindcss/forms';

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        milk: '#FBF7F4',
        oat: '#E5DED2',
        taupe: '#A39382',
        mocha: '#685D54',
        charcoal: '#232323',
      },
      fontFamily: {
        display: ['Cormorant Garamond', 'Georgia', 'serif'],
        body: ['Jost', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        pill: '50px',
      },
      boxShadow: {
        soft: '0 4px 20px rgba(35,35,35,0.12)',
        strong: '0 16px 40px rgba(35,35,35,0.26)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4,0,0.2,1)',
      },
      transitionDuration: {
        smooth: '350ms',
      },
    },
  },
  plugins: [forms],
};
