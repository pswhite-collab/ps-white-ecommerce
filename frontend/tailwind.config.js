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
        'taupe-hover': '#8F826F',
        mocha: '#685D54',
        'mocha-hover': '#5A4F47',
        charcoal: '#232323',
        success: '#4A7856',
        warning: '#B8864A',
        error: '#B85450',
        info: '#6B7A8F',
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
        subtle: '0 2px 8px rgba(35,35,35,0.08)',
        soft: '0 4px 20px rgba(35,35,35,0.12)',
        strong: '0 16px 40px rgba(35,35,35,0.26)',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #FBF7F4 0%, #E5DED2 50%, #A39382 100%)',
        'section-gradient': 'linear-gradient(180deg, #FBF7F4 0%, #E5DED2 50%, #FBF7F4 100%)',
        'button-gradient': 'linear-gradient(135deg, #685D54 0%, #5A4F47 100%)',
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
