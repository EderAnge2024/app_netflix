import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false, // quita la barra superior
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}
