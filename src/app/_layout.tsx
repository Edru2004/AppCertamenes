
import CustomDrawer from '@/components/custom-drawer';
import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="dark" />

      <Drawer
        drawerContent={(props: any) => (
          <CustomDrawer {...props} />
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
          drawerLabelStyle: {
            fontSize: 14,
          },
          drawerType: 'front',
          swipeEnabled: true,
        }}
      >
        {/* Inicio de sesión */}
        <Drawer.Screen
          name="login"
          options={{
            title: 'Iniciar sesión',
            headerShown: false,
            drawerItemStyle: { display: 'none' },
            swipeEnabled: false,
          }}
        />

        {/* Panel principal del administrador */}
        <Drawer.Screen
          name="index"
          options={{
            title: 'Inicio',
            headerTitle: 'Panel del Administrador',
          }}
        />

        {/* Panel del líder de equipo */}
        <Drawer.Screen
          name="liderDashboard"
          options={{
            title: 'Inicio del Líder',
            headerTitle: 'Panel del Líder',
          }}
        />

        {/* Gestión de certámenes */}
        <Drawer.Screen
          name="registroEvento"
          options={{
            title: 'Registro de Certámenes',
            headerTitle: 'Registro de Certámenes',
          }}
        />

        {/* Gestión de categorías */}
        <Drawer.Screen
          name="categorias"
          options={{
            title: 'Categorías',
            headerTitle: 'Gestión de Categorías',
          }}
        />

        {/* Gestión de rúbricas */}
        <Drawer.Screen
          name="Rubricas"
          options={{
            title: 'Rúbricas',
            headerTitle: 'Gestión de Rúbricas',
          }}
        />

        {/* Gestión de desafíos */}
        <Drawer.Screen
          name="desafios"
          options={{
            title: 'Desafíos',
            headerTitle: 'Gestión de Desafíos',
          }}
        />

        {/* Gestión de jurados */}
        <Drawer.Screen
          name="gesJurados"
          options={{
            title: 'Jurados',
            headerTitle: 'Gestión de Jurados',
          }}
        />

        {/* Gestión de equipos */}
        <Drawer.Screen
          name="equipos"
          options={{
            title: 'Equipos',
            headerTitle: 'Gestión de Equipos',
          }}
        />

        {/* Gestión de salas */}
        <Drawer.Screen
          name="registroSalas"
          options={{
            title: 'Registro de Salas',
            headerTitle: 'Registro de Salas',
          }}
        />
      </Drawer>
    </>
  );
}
