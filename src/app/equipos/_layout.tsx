import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

export default function EquiposLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#002b45',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: { height: 60, paddingBottom: 8 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Gestión',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="form"
        options={{
          title: 'Nuevo / Editar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}