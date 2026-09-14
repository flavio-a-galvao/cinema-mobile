export const theme = {
  colors: {
    background: '#09090F',
    surface: '#111827',
    border: '#475569',
    primary: '#F59E0B',
    primaryPressed: '#D97706',
    onPrimary: '#09090F',
    text: '#F1F5F9',
    muted: '#94A3B8',
    error: '#FCA5A5',
  },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
  radius: { sm: 8, md: 12, lg: 16 },
  typography: {
    caption: { fontSize: 14, lineHeight: 20 },
    body: { fontSize: 16, lineHeight: 24 },
    label: { fontSize: 16, lineHeight: 24, fontWeight: '600' },
    heading: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
    title: { fontSize: 32, lineHeight: 40, fontWeight: '700' },
  },
  sizes: { controlMinHeight: 48, contentMaxWidth: 640, borderWidth: 1 },
  opacity: { disabled: 0.5 },
} as const;
