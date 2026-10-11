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
      {/* 🔴 PANTALLA DE LOGIN: Sin menú, sin barra azul y sin gesto de deslizar */}
      <Drawer.Screen
        name="login"
        options={{
          drawerItemStyle: { display: 'none' }, // Oculta del menú lateral
          headerShown: false,                    // Oculta el encabezado azul y las 3 rayitas
          swipeEnabled: false,                   // Desactiva deslizar para abrir el menú
        }}
      />

      {/* PANTALLAS DE LA APLICACIÓN */}
      <Drawer.Screen
        name="index"
        options={{
          headerTitle: '',
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
      <Drawer.Screen
        name="registroSalas"
        options={{
          headerTitle: 'Registro de Salas',
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  headerRightContainer: {
    marginRight: 15,
  },
  headerTitleText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});