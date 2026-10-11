import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CustomDrawerLider(props: any) {
  const router = useRouter();

  const handleCerrarSesion = async () => {
    await AsyncStorage.multiRemove(['userToken', 'userRole', 'userData']);
    router.replace('/login' as any);
  };

  return (
    <View style={styles.container}>
      <DrawerContentScrollView {...props} contentContainerStyle={styles.headerBg}>
        {/* Encabezado Líder */}
        <View style={styles.headerContainer}>
          <Ionicons name="person-circle-outline" size={50} color="#fff" />
          <Text style={styles.userName}>Líder de Equipo</Text>
          <Text style={styles.userRole}>Panel de Participante</Text>
        </View>

        {/* Opciones de Menú del Líder */}
        <View style={styles.menuItemsContainer}>
          <DrawerItemList {...props} />
        </View>
      </DrawerContentScrollView>

      {/* Botón Salir */}
      <View style={styles.footerContainer}>
        <TouchableOpacity style={styles.btnLogout} onPress={handleCerrarSesion}>
          <Ionicons name="log-out-outline" size={20} color="#dc2626" />
          <Text style={styles.btnLogoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  headerBg: { backgroundColor: '#002b45' },
  headerContainer: { padding: 20, alignItems: 'center' },
  userName: { fontSize: 18, fontWeight: 'bold', color: '#fff', marginTop: 8 },
  userRole: { fontSize: 12, color: '#9eb23b', marginTop: 2 },
  menuItemsContainer: { backgroundColor: '#fff', paddingTop: 10, flex: 1 },
  footerContainer: { padding: 15, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  btnLogout: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
  btnLogoutText: { color: '#dc2626', fontWeight: 'bold', fontSize: 15 },
});