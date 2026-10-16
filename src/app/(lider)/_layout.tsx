// src/app/(lider)/_layout.tsx
import CustomDrawer from '@/components/custom-drawer';
import { Drawer } from 'expo-router/drawer';

export default function LiderLayout() {
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
          headerTitle: 'Panel del Líder',
        }}
      />
      <Drawer.Screen
        name="equipos"
        options={{
          title: 'Mi Equipo',
          headerTitle: 'Gestión de Mi Equipo',
        }}
      />
    </Drawer>
  );
}