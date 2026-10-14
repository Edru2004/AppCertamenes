import { Stack } from 'expo-router';

export default function CategoriasLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#002b45' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Gestión de Categorías' }} />
      <Stack.Screen name="form" options={{ title: 'Formulario Categoría' }} />
    </Stack>
  );
}