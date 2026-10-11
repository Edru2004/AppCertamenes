import { Stack } from 'expo-router';

export default function RubricasLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#002b45' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Gestión de Rúbricas' }} />
      <Stack.Screen name="form" options={{ title: 'Criterio de Rúbrica' }} />
    </Stack>
  );
}