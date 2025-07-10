/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#4dabf5',
          main: '#1976d2',
          dark: '#115293',
          contrastText: '#fff',
        },
        secondary: {
          light: '#ff4081',
          main: '#dc004e',
          dark: '#9a0036',
          contrastText: '#fff',
        },
        background: {
          paper: '#fff',
          default: '#f5f5f5',
        },
        hotel: {
          100: '#e3f2fd',
          500: '#2196f3',
          900: '#0d47a1',
        },
        service: {
          100: '#f3e5f5',
          500: '#9c27b0',
          900: '#4a148c',
        },
        booking: {
          100: '#e8f5e9',
          500: '#4caf50',
          900: '#1b5e20',
        },
      },
      fontFamily: {
        sans: ['Roboto', 'Arial', 'sans-serif'],
      },
      spacing: {
        navbar: '64px',
        sidebar: '240px',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      boxShadow: {
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        dropdown: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
  corePlugins: {
    preflight: true,
  },
  important: '#root',
}
