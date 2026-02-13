/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif']
      },
      boxShadow: {
        card: '0 1px 3px rgba(15, 23, 42, 0.06)',
        'card-hover': '0 8px 16px rgba(15, 23, 42, 0.12)'
      },
      borderRadius: {
        card: '12px'
      }
    }
  },
  plugins: []
};

