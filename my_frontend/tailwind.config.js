/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
          950: '#172554',
        },
        lexport: {
          blue: '#2563EB',
          darkblue: '#1D4ED8',
          navy: '#1E3A8A',
          surface: '#EFF6FF',
          bg: '#F8FAFC',
          white: '#FFFFFF',
          text: '#0F172A',
          body: '#475569',
          border: '#E2E8F0',
          muted: '#64748B',
        },
        status: {
          pass: '#16A34A',
          warning: '#D97706',
          violation: '#DC2626',
          escalation: '#4338CA',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0,0,0,0.06), 0 1px 2px 0 rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px 0 rgba(37,99,235,0.08), 0 2px 4px 0 rgba(0,0,0,0.04)',
        'blue': '0 4px 14px 0 rgba(37,99,235,0.25)',
        'xs': '0 1px 2px 0 rgba(0,0,0,0.05)',
        '2xs': '0 0 0 1px rgba(0,0,0,0.04)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-up': 'slideInUp 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideInRight: { '0%': { transform: 'translateX(20px)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
        slideInUp: { '0%': { transform: 'translateY(10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.7' } },
      }
    },
  },
  plugins: [],
}
