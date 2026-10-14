import { Drawer } from 'expo-router/drawer';
import CustomDrawerLider from '../../components/CustomDrawerLider';

export default function LiderLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerLider {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#002b45' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Drawer.Screen
        name="liderDashboard"
        options={{
          drawerLabel: 'Mi Panel',
          title: 'Panel del Líder',
        }}
      />
      <Drawer.Screen
        name="equipos"
        options={{
          drawerLabel: 'Mi Equipo',
          title: 'Información de Equipo',
        }}
      />
    </Drawer>
  );
}