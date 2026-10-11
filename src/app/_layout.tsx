import CustomDrawer from '@/components/custom-drawer';
import { Drawer } from 'expo-router/drawer';
import { StyleSheet, Text, View } from 'react-native';

export default function RootLayout() {
  return (
    <Drawer
      drawerContent={(props: any) => <CustomDrawer {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: '#002b45' },
        headerTintColor: '#fff',
        headerRight: () => (
          <View style={styles.headerRightContainer}>
            <Text style={styles.headerTitleText}>ITSSMT</Text>
          </View>
        ),
      }}
    >
      {/* 🔴 PANTALLAS SIN ENCABEZADO Y OCULTAS DEL MENÚ AUTOMÁTICO */}
      <Drawer.Screen
        name="login"
        options={{
          drawerItemStyle: { display: 'none' },
          headerShown: false,
          swipeEnabled: false,
        }}
      />
      <Drawer.Screen
        name="index"
        options={{
          drawerItemStyle: { display: 'none' },
          headerShown: false,
        }}
      />

      {/* 🟢 DASHBOARD EXCLUSIVO DEL LÍDER */}
      <Drawer.Screen
        name="liderDashboard"
        options={{
          headerTitle: 'Panel del Líder',
        }}
      />

      {/* 🔵 MÓDULOS DEL ADMINISTRADOR */}
      <Drawer.Screen
        name="adminDashboard"
        options={{
          headerTitle: 'Panel de Administración',
        }}
      />
      <Drawer.Screen
        name="registroEvento"
        options={{
          headerTitle: 'Registro de Certámenes',
        }}
      />
      <Drawer.Screen
        name="categorias"
        options={{
          headerTitle: 'Categorías',
        }}
      />
      <Drawer.Screen
        name="Rubricas"
        options={{
          headerTitle: 'Rúbricas',
        }}
      />
      <Drawer.Screen
        name="desafios"
        options={{
          headerTitle: 'Desafíos',
        }}
      />
      <Drawer.Screen
        name="registroSalas"
        options={{
          headerTitle: 'Registro de Salas',
        }}
      />
      <Drawer.Screen
        name="gesJurados"
        options={{
          headerTitle: 'Jurado',
        }}
      />
      <Drawer.Screen
        name="equipos"
        options={{
          headerTitle: 'Gestión de Equipos',
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  headerRightContainer: { marginRight: 15 },
  headerTitleText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});