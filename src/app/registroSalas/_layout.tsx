import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function RegistroSalasLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#002b45',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: { height: 62, paddingBottom: 8 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Catálogo Salas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="easel-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="programa"
        options={{
          title: 'Asignaciones',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="agenda"
        options={{
          title: 'Programa Oficial',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-circle-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}