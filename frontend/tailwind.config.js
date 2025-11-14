/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#67BAE0',
          main: '#3B5787',
          dark: '#2A4065',
          contrastText: '#fff',
        },
        secondary: {
          light: '#67BAE0',
          main: '#3B5787',
          dark: '#2A4065',
          contrastText: '#fff',
        },
        modern: {
          blue: '#3B5787',
          lightBlue: '#67BAE0',
          darkBlue: '#2A4065',
          gray: '#F8FAFC',
          darkGray: '#64748B',
        },
        // Custom colors for new design
        qickroom: {
          blue: '#3B5787',
          lightBlue: '#67BAE0',
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
        sans: ['"Plus Jakarta Sans"', 'Roboto', 'Arial', 'sans-serif'],
        arabic: ['"IBM Plex Sans Arabic"', 'Segoe UI', 'Tahoma', 'Arial', 'sans-serif'],
        english: ['"Plus Jakarta Sans"', 'Roboto', 'Arial', 'sans-serif'],
      },      spacing: {
        navbar: '64px',
        sidebar: '240px',
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
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
