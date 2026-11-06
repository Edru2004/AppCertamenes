import { Stack } from 'expo-router';

export default function RegistroSalasLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#002b45' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Gestión de Salas' }} />
      <Stack.Screen name="form" options={{ title: 'Formulario de Sala' }} />
    </Stack>
  );
}