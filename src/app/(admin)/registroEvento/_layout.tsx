import { Stack } from 'expo-router';
import { createElement } from 'react';

export default function RubricasLayout() {
  return createElement(
    Stack,
    {
      screenOptions: {
        headerStyle: { backgroundColor: '#002b45' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      },
    },
    createElement(Stack.Screen, {
      name: 'index',
      options: { title: 'Gestión de Rúbricas' },
    }),
    createElement(Stack.Screen, {
      name: 'form',
      options: { title: 'Criterio de Rúbrica' },
    }),
  );
}