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
  
    
  );
}