import { Stack } from 'expo-router';

export default function DesafiosLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#002b45' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Gestión de Desafíos' }} />
      <Stack.Screen name="form" options={{ title: 'Formulario Desafío' }} />
    </Stack>
  );
}