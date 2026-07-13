import { createTheme } from '@mui/material/styles'

// Общая тема MUI (токены как в Work_redone) — править цвета/типографику здесь, не в отдельных страницах.
export const theme = createTheme({
  palette: {
    primary: {
      main: '#008eb9',
      dark: '#006b8f',
    },
    secondary: {
      main: '#e5dfd2',
      light: '#f5f2eb',
    },
    divider: '#e5dfd2',
    background: {
      default: '#f5f2eb',
      paper: '#ffffff',
    },
    text: {
      primary: '#1d1d1f',
      secondary: '#86868b',
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif",
    htmlFontSize: 18,
    fontSize: 18,
    h1: { fontSize: '1.75rem' },
    h2: { fontSize: '1.5rem' },
    h3: { fontSize: '1.25rem' },
    h4: { fontSize: '1.125rem' },
    h5: { fontSize: '1.0625rem' },
    h6: { fontSize: '1rem' },
    body1: { fontSize: '1rem' },
    body2: { fontSize: '0.9375rem' },
    button: { fontSize: '1rem' },
    caption: { fontSize: '0.875rem' },
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& input[type=number]': {
            MozAppearance: 'textfield',
          },
          '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
            WebkitAppearance: 'none',
            margin: 0,
          },
        },
      },
    },
    MuiLink: {
      defaultProps: {
        underline: 'hover',
      },
    },
  },
})

/** Базовые глобальные стили под ThemeProvider + GlobalStyles */
export function globalLegacyAnchorStyles(theme) {
  return {
    html: {
      fontSize: `${theme.typography.htmlFontSize}px`,
    },
    '#root': {
      minHeight: '100vh',
    },
    body: {
      minHeight: '100vh',
    },
    'a, a:link': {
      color: theme.palette.primary.main,
      textDecoration: 'none',
    },
    'a:hover': {
      color: theme.palette.primary.dark,
      textDecoration: 'underline',
    },
  }
}
