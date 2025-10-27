import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { UserProvider } from '@/components/ui/logeadoDatos/userContext';
import { MyListProvider } from '@/components/ui/logeadoDatos/MyListContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <MyListProvider>
        <UserProvider>
          {/* Slot permite renderizar rutas hijas como (auth)(tabs) */}
          <Slot />

          <StatusBar style="auto" />
        </UserProvider>
      </MyListProvider>
    </ThemeProvider>
  );
}
