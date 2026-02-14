/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['ExpertSans-Regular', 'system-ui', 'sans-serif']
      },
      colors: {
        bg: {
          main: '#FAFBFC',
          card: '#FFFFFF',
          hover: '#F7FAFC',
          sidebar: '#f2fbfe',
        },
        text: {
          primary: '#2D3748',
          secondary: '#718096',
          tertiary: '#A0AEC0',
        },
        border: {
          light: '#E2E8F0',
          focus: '#CBD5E0',
        },
        status: {
          success: '#48BB78',
          warning: '#ED8936',
          danger: '#F56565',
          info: '#38B2AC',
          neutral: '#A0AEC0',
        },
        /* Muted palette for dashboards – professional, not bright */
        muted: {
          danger: '#B91C1C',
          dangerBg: '#FEE2E2',
          warning: 'rgb(223 185 55)',
          warningBg: '#FEF3C7',
          success: '#047857',
          successBg: '#D1FAE5',
          neutral: '#475569',
          neutralBg: '#F1F5F9',
        },
        /* Risk distribution bar – slightly brighter red / yellow / green (edit here to change) */
        riskBar: {
          high: '#FECACA',
          medium: '#FDE68A',
          low: '#A7F3D0',
        },
        /* /cases page: light yellow for Medium risk (a little more dark) */
        riskMediumYellow: {
          bg: 'rgb(255 249 226)',
          text: '#B45309',
        },
        /* Status breakdown bars – very little brighter (edit here) */
        statusBreakdown: {
          pending: 'rgb(223 185 55)',
          approved: '#A7F3D0',
          rejected: '#E2E8F0',
        },
        /* Average risk score gauge – very little brighter (edit here) */
        avgScoreGauge: {
          high: '#FCA5A5',
          medium: '#FCD34D',
          low: '#6EE7B7',
        }
      },
      boxShadow: {
        card: '0 1px 2px rgba(0, 0, 0, 0.02)',
        'card-hover': '0 2px 4px rgba(0, 0, 0, 0.04)',
        button: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
      borderRadius: {
        card: '10px',
        button: '8px',
      },
    }
  },
  plugins: []
};
