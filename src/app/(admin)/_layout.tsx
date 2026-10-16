// src/app/(admin)/_layout.tsx
import CustomDrawer from '@/components/custom-drawer';
import { Drawer } from 'expo-router/drawer';

export default function AdminLayout() {
  return (
    <Drawer
      drawerContent={(props: any) => <CustomDrawer {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#002b45' },
        headerTintColor: '#fafafa',
        headerTitleStyle: { fontWeight: 'bold' },
        drawerActiveTintColor: '#A4B74D',
        drawerInactiveTintColor: '#555555',
        drawerType: 'front',
        swipeEnabled: true,
      }}
    >
      <Drawer.Screen
        name="index"
        options={{
          title: 'Inicio',
          headerTitle: 'Panel del Administrador',
        }}
      />
      <Drawer.Screen
        name="categorias"
        options={{
          title: 'Categorías',
          headerTitle: 'Gestión de Categorías',
        }}
      />
      <Drawer.Screen
        name="desafios"
        options={{
          title: 'Desafíos',
          headerTitle: 'Gestión de Desafíos',
        }}
      />
      <Drawer.Screen
        name="equipos"
        options={{
          title: 'Equipos',
          headerTitle: 'Gestión de Equipos',
        }}
      />
      <Drawer.Screen
        name="gesJurados"
        options={{
          title: 'Jurados',
          headerTitle: 'Gestión de Jurados',
        }}
      />
      <Drawer.Screen
        name="registroEvento"
        options={{
          title: 'Registro de Certámenes',
          headerTitle: 'Registro de Certámenes',
        }}
      />
      <Drawer.Screen
        name="registroSalas"
        options={{
          title: 'Registro de Salas',
          headerTitle: 'Registro de Salas',
        }}
      />
      <Drawer.Screen
        name="Rubricas"
        options={{
          title: 'Rúbricas',
          headerTitle: 'Gestión de Rúbricas',
        }}
      />
    </Drawer>
  );
}