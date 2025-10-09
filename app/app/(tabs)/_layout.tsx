// app/_layout.tsx (o donde tengas tu root layout)
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen 
        name="(tabs)" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="princilpalNav" 
        options={{ headerShown: false }} 
      />
    </Stack>
  );
}