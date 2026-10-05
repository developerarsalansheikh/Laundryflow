/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Base backgrounds mapped to CSS tokens
        bgPrimary: 'var(--lf-bg-primary)',
        bgSecondary: 'var(--lf-bg-secondary)',
        bgSidebar: 'var(--lf-bg-sidebar)',

        // Surface tokens
        cardBg: 'var(--lf-card)',
        cardHover: 'var(--lf-card-hover)',
        panelBg: 'var(--lf-panel)',

        // Border tokens
        borderSubtle: 'var(--lf-border)',
        borderStrong: 'var(--lf-border-strong)',
        borderPurple: 'var(--lf-border-purple)',

        // Brand palette
        primaryPurple: 'var(--lf-purple)',
        purpleLight: 'var(--lf-purple-light)',
        brandIndigo: 'var(--lf-indigo)',
        brandBlue: 'var(--lf-blue)',
        brandCyan: 'var(--lf-cyan)',

        // Status tokens
        statusSuccess: 'var(--lf-success)',
        statusWarning: 'var(--lf-warning)',
        statusDanger: 'var(--lf-danger)',
        statusInfo: 'var(--lf-info)',

        // Typography tokens
        textPrimary: 'var(--lf-text-primary)',
        textSecondary: 'var(--lf-text-secondary)',
        textMuted: 'var(--lf-text-muted)',
      },
      fontFamily: {
        sans: ['Outfit', 'Plus Jakarta Sans', '-apple-system', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      borderRadius: {
        sm: 'var(--lf-radius-sm)',
        md: 'var(--lf-radius-md)',
        lg: 'var(--lf-radius-lg)',
        xl: 'var(--lf-radius-xl)',
        '2xl': 'var(--lf-radius-2xl)',
        full: 'var(--lf-radius-full)',
      },
      boxShadow: {
        card: 'var(--lf-shadow-card)',
        cardHover: 'var(--lf-shadow-card-hover)',
        floating: 'var(--lf-shadow-floating)',
        glowPurple: 'var(--lf-shadow-purple-glow)',
        glowBlue: 'var(--lf-shadow-blue-glow)',
      },
    },
  },
  plugins: [],
};
