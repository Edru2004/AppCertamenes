import { logoutUsuario } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { DrawerContentScrollView } from 'expo-router/drawer';
import { useEffect, useState } from 'react';

import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function JuradoDrawer(props: any) {
  const [user, setUser] = useState<any>(null);

  const router = useRouter();

  // =========================================================
  // CARGAR USUARIO
  // =========================================================
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('userData');

        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.log(
          'Error cargando información del jurado:',
          error
        );
      }
    };

    loadUser();
  }, []);

  // =========================================================
  // CERRAR SESIÓN
  // =========================================================
  const handleLogout = async () => {
    try {
      props.navigation.closeDrawer();

      await logoutUsuario();

      await AsyncStorage.multiRemove([
        'userToken',
        'userRole',
        'userData',
      ]);

      router.replace('/login');
    } catch (error) {
      console.log('Error cerrando sesión:', error);

      await AsyncStorage.multiRemove([
        'userToken',
        'userRole',
        'userData',
      ]);

      router.replace('/login');
    }
  };

  // =========================================================
  // NAVEGACIÓN
  // =========================================================
  const navegar = (ruta: string) => {
    props.navigation.closeDrawer();

    router.push(ruta as any);
  };

  // =========================================================
  // NOMBRE DEL JURADO
  // =========================================================
  const nombreCompleto = user
    ? `${user.Nombre || ''} ${user.App || ''} ${user.Apm || ''}`
        .replace(/\s+/g, ' ')
        .trim()
    : 'Cargando...';

  return (
    <View style={styles.container}>

      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{
          paddingTop: 20,
        }}
      >

        {/* =====================================================
            BOTÓN CERRAR MENÚ
        ====================================================== */}
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => props.navigation.closeDrawer()}
        >
          <Ionicons
            name="close"
            size={28}
            color="#fff"
          />
        </TouchableOpacity>

        {/* =====================================================
            PERFIL DEL JURADO
        ====================================================== */}
        <View style={styles.profileCard}>

          <Image
            source={{
              uri:
                user?.Foto &&
                user?.Foto !== 'default.png'
                  ? user.Foto
                  : 'https://via.placeholder.com/100',
            }}
            style={styles.avatar}
          />

          <View style={styles.nameBadge}>

            <Text style={styles.profileName}>
              {nombreCompleto}
            </Text>

            <Text style={styles.profileRole}>
              {user?.Rol || 'Jurado'}
            </Text>

          </View>

        </View>

        {/* =====================================================
            MENÚ DEL JURADO
        ====================================================== */}
        <View style={styles.menuItemsContainer}>

          {/* INICIO */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => navegar('/(jurado)')}
          >
            <View style={styles.iconCircle}>
              <Ionicons
                name="home-outline"
                size={22}
                color="#002b49"
              />
            </View>

            <Text style={styles.menuText}>
              Inicio
            </Text>
          </TouchableOpacity>

          {/* MIS ASIGNACIONES */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              navegar('/(jurado)/asignaciones')
            }
          >
            <View style={styles.iconCircle}>
              <Ionicons
                name="clipboard-outline"
                size={22}
                color="#002b49"
              />
            </View>

            <Text style={styles.menuText}>
              Mis asignaciones
            </Text>
          </TouchableOpacity>

          {/* MI PERFIL */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() =>
              navegar('/(jurado)/perfil')
            }
          >
            <View style={styles.iconCircle}>
              <Ionicons
                name="person-outline"
                size={22}
                color="#002b49"
              />
            </View>

            <Text style={styles.menuText}>
              Mi perfil
            </Text>
          </TouchableOpacity>

          {/* CERRAR SESIÓN */}
          <TouchableOpacity
            style={[
              styles.menuItem,
              {
                marginTop: 20,
              },
            ]}
            onPress={handleLogout}
          >
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: '#ff4d4d',
                },
              ]}
            >
              <Ionicons
                name="log-out-outline"
                size={22}
                color="#fff"
              />
            </View>

            <Text
              style={[
                styles.menuText,
                {
                  color: '#ff4d4d',
                },
              ]}
            >
              Cerrar Sesión
            </Text>
          </TouchableOpacity>

        </View>

      </DrawerContentScrollView>

    </View>
  );
}

// =========================================================
// ESTILOS
// =========================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#002b45',
    paddingHorizontal: 15,
  },

  closeBtn: {
    alignSelf: 'flex-end',
    padding: 10,
  },

  profileCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    marginBottom: 25,
  },

  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
  },

  nameBadge: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 15,
    alignItems: 'center',
    width: '100%',
  },

  profileName: {
    color: '#809900',
    fontWeight: 'bold',
    fontSize: 13,
    textAlign: 'center',
  },

  profileRole: {
    color: '#666',
    fontSize: 11,
  },

  menuItemsContainer: {
    gap: 20,
    paddingBottom: 30,
  },

  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },

  iconCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  menuText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});