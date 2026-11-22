import { Stack } from 'expo-router';

export default function PersonalApoyoLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#002B45',
        },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 17,
        },
        headerShadowVisible: false,
        contentStyle: {
          backgroundColor: '#F4F7FA',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: 'Panel Personal de Apoyo',
          headerShown: false,
        }}
      />
    </Stack>
  );
}