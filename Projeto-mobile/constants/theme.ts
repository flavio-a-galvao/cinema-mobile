const tokens = {
 spacing: { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 },
 radius: { sm: 10, md: 16, lg: 24, pill: 999 },
 typography: { caption: { fontSize: 13, lineHeight: 19 }, body: { fontSize: 16, lineHeight: 24 }, label: { fontSize: 16, lineHeight: 24, fontWeight: '600' }, heading: { fontSize: 24, lineHeight: 32, fontWeight: '700' }, title: { fontSize: 36, lineHeight: 44, fontWeight: '800' } },
 sizes: { controlMinHeight: 52, contentMaxWidth: 720, borderWidth: 1, posterWidth: 100, posterHeight: 150, heroPosterHeight: 320, seat: 32, icon: 22, iconLarge: 32, avatar: 64, gridBreakpoint: 680, qr: 168 },
 shadow: { shadowColor: '#000000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 12, elevation: 2 },
 opacity: { disabled: 0.45 },
} as const;
const darkColors = { background: '#0B0D14', surface: '#171B26', border: '#2A3040', elevated: '#202637', primarySoft: '#35212C', success: '#82D7B2', successSoft: '#182E29', warning: '#F0CA84', warningSoft: '#30291E', errorSoft: '#351D29', primary: '#FF6B6B', primaryPressed: '#F24D59', onPrimary: '#210A10', text: '#F7F8FC', muted: '#ADB7CA', error: '#FF9C9C' };
const lightColors = { background: '#F4F3F7', surface: '#FFFFFF', border: '#E0DFE8', elevated: '#ECEBF2', primarySoft: '#FCE6E9', success: '#246B50', successSoft: '#E1F2EA', warning: '#805916', warningSoft: '#FFF0D5', errorSoft: '#FCE6EB', primary: '#BB283E', primaryPressed: '#9F1C30', onPrimary: '#FFFFFF', text: '#182033', muted: '#58657A', error: '#AF1935' };
export const themes = { dark: { ...tokens, colors: darkColors }, light: { ...tokens, colors: lightColors } };
export type AppTheme = typeof themes.dark;
export type ThemeMode = keyof typeof themes;
