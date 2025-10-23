/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta UniSafe - Segurança e Confiança
        primary: {
          50: '#e6f2ff',
          100: '#b3d9ff',
          200: '#80bfff',
          300: '#4da6ff',
          400: '#1a8cff',
          500: '#0073e6',
          600: '#005bb3',
          700: '#004280',
          800: '#002a4d',
          900: '#00121a',
        },
        accent: {
          50: '#e6fff9',
          100: '#b3ffed',
          200: '#80ffe0',
          300: '#4dffd4',
          400: '#1affc8',
          500: '#00e6b8',
          600: '#00b38f',
          700: '#008066',
          800: '#004d3d',
          900: '#001a14',
        },
        warning: {
          50: '#fff8e6',
          100: '#ffedb3',
          200: '#ffe180',
          300: '#ffd64d',
          400: '#ffca1a',
          500: '#e6b800',
          600: '#b38f00',
          700: '#806600',
          800: '#4d3d00',
          900: '#1a1400',
        },
        danger: {
          50: '#ffe6e6',
          100: '#ffb3b3',
          200: '#ff8080',
          300: '#ff4d4d',
          400: '#ff1a1a',
          500: '#e60000',
          600: '#b30000',
          700: '#800000',
          800: '#4d0000',
          900: '#1a0000',
        },
        neutral: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        }
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #0073e6 0%, #005bb3 100%)',
        'gradient-accent': 'linear-gradient(135deg, #00e6b8 0%, #00b38f 100%)',
        'gradient-hero': 'linear-gradient(135deg, #0073e6 0%, #00e6b8 100%)',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 30px -5px rgba(0, 0, 0, 0.06)',
        'strong': '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 15px 50px -10px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}

