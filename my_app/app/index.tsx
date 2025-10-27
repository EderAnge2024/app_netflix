import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.replace('/(auth)'); // O /(tabs)/principalNav si ya está logeado
    }, 50); // retraso mínimo para asegurarse que RootLayout se monte

    return () => clearTimeout(timeout);
  }, []);

  return null;
}
