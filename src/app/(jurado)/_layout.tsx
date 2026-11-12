import JuradoDrawer from '@/components/jurado-drawer';
import { Drawer } from 'expo-router/drawer';

export default function JuradoLayout() {
  return (
    <Drawer
      drawerContent={(props: any) => (
        <JuradoDrawer {...props} />
      )}
      screenOptions={{
        headerStyle: {
          backgroundColor: '#002b45',
        },

        headerTintColor: '#fafafa',

        headerTitleStyle: {
          fontWeight: 'bold',
        },

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
          headerTitle: 'Panel del jurado',
        }}
      />

      <Drawer.Screen
        name="asignaciones"
        options={{
          title: 'Mis asignaciones',
          headerTitle: 'Mis asignaciones',
        }}
      />

      <Drawer.Screen
        name="perfil"
        options={{
          title: 'Mi perfil',
          headerTitle: 'Mi perfil profesional',
        }}
      />

      {/* Pantalla de evaluación.
          Se registra en el Drawer, pero no aparece en el menú. */}
      <Drawer.Screen
        name="evaluar"
        options={{
          title: 'Evaluar',
          headerTitle: 'Evaluación del equipo',
          drawerItemStyle: {
            display: 'none',
          },
        }}
      />

    </Drawer>
  );
}