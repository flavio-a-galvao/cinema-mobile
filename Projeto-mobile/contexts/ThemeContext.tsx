import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { themes, type ThemeMode } from '@/constants/theme';
const KEY = 'cinemax.theme';
const Context = createContext({ theme: themes.dark, mode: 'dark' as ThemeMode, toggleTheme: async () => {} });
export function ThemeProvider({ children }: PropsWithChildren) {
 const [mode, setMode] = useState<ThemeMode>('dark');
 useEffect(() => {
  let active = true;
  const read = async () => Platform.OS === 'web' ? localStorage.getItem(KEY) : SecureStore.getItemAsync(KEY);
  void read().then(value => { if (active && (value === 'light' || value === 'dark')) setMode(value); }).catch(() => {});
  return () => { active = false; };
 }, []);
 async function toggleTheme() {
  const next = mode === 'dark' ? 'light' : 'dark';
  if (Platform.OS === 'web') localStorage.setItem(KEY, next);
  else await SecureStore.setItemAsync(KEY, next);
  setMode(next);
 }
 return <Context.Provider value={{ theme: themes[mode], mode, toggleTheme }}>{children}</Context.Provider>;
}
export function useTheme() { return useContext(Context); }
