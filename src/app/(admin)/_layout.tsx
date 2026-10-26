// src/app/(admin)/_layout.tsx
// @ts-ignore TS6142: CustomDrawer is a TSX module and is rendered via createElement.
import CustomDrawer from '@/components/custom-drawer';
import { Drawer } from 'expo-router/drawer';
import { createElement } from 'react';

export default function AdminLayout() {
  return createElement(
    Drawer,
    {
      drawerContent: (props: any) => createElement(CustomDrawer, props),
      screenOptions: {
        headerStyle: { backgroundColor: '#002b45' },
        headerTintColor: '#fafafa',
        headerTitleStyle: { fontWeight: 'bold' },
        drawerActiveTintColor: '#A4B74D',
        drawerInactiveTintColor: '#555555',
        drawerType: 'front',
        swipeEnabled: true,
      },
    },
    createElement(Drawer.Screen, {
      name: 'index',
      options: { title: 'Inicio', headerTitle: 'Panel del Administrador' },
    }),
    createElement(Drawer.Screen, {
      name: 'categorias',
      options: { title: 'Categorías', headerTitle: 'Gestión de Categorías' },
    }),
    createElement(Drawer.Screen, {
      name: 'desafios',
      options: { title: 'Desafíos', headerTitle: 'Gestión de Desafíos' },
    }),
    createElement(Drawer.Screen, {
      name: 'equipos',
      options: { title: 'Equipos', headerTitle: 'Gestión de Equipos' },
    }),
    createElement(Drawer.Screen, {
      name: 'gesJurados',
      options: { title: 'Jurados', headerTitle: 'Gestión de Jurados' },
    }),
    createElement(Drawer.Screen, {
      name: 'registroEvento',
      options: {
        title: 'Registro de Certámenes',
        headerTitle: 'Registro de Certámenes',
      },
    }),
    createElement(Drawer.Screen, {
      name: 'registroSalas',
      options: { title: 'Registro de Salas', headerTitle: 'Registro de Salas' },
    }),
    createElement(Drawer.Screen, {
      name: 'Rubricas',
      options: { title: 'Rúbricas', headerTitle: 'Gestión de Rúbricas' },
    }),
  );
}