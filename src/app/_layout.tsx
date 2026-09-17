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
      {/* 🟢 Cambiado: Ahora muestra la barra superior azul */}
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