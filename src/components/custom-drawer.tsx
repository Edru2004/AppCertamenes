// src/components/custom-drawer.tsx

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

export default function CustomDrawer(props: any) {
  const [salasMenuAbierto, setSalasMenuAbierto] = useState(false);
  const [user, setUser] = useState<any>(null);

  const router = useRouter();

  // Cargar información del usuario
  useEffect(() => {
    const loadUser = async () => {
      const storedUser = await AsyncStorage.getItem('userData');

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.log('Error parsing user data:', error);
        }
      }
    };

    loadUser();
  }, []);

  // Cerrar sesión
  const handleLogout = async () => {
    props.navigation.closeDrawer();

    await logoutUsuario();

    await AsyncStorage.multiRemove([
      'userToken',
      'userRole',
      'userData',
    ]);

    router.replace('/login');
  };

  // Identificar rol
  const rolLimpio = String(user?.Rol || '').toLowerCase().trim();

  const esAdmin =
    rolLimpio === 'administrador' || rolLimpio === 'admin';

  // Navegación
  const navegar = (ruta: string) => {
    props.navigation.closeDrawer();
    router.push(ruta as any);
  };

  return (
    <View style={styles.container}>
      <DrawerContentScrollView
        {...props}
        contentContainerStyle={{ paddingTop: 20 }}
      >
        {/* Botón cerrar menú */}
        <TouchableOpacity
          style={styles.closeBtn}
          onPress={() => props.navigation.closeDrawer()}
        >
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Tarjeta de perfil */}
        <View style={styles.profileCard}>
          <Image
            source={{
              uri:
                user?.Foto && user?.Foto !== 'default.png'
                  ? user.Foto
                  : 'https://via.placeholder.com/100',
            }}
            style={styles.avatar}
          />

          <View style={styles.nameBadge}>
            <Text style={styles.profileName}>
              {user
                ? `${user.Nombre} ${user.App || ''} ${user.Apm || ''}`
                : 'Cargando...'}
            </Text>

            <Text style={styles.profileRole}>
              {user?.Rol || 'Usuario'}
            </Text>
          </View>
        </View>

        {/* Opciones del menú */}
        <View style={styles.menuItemsContainer}>
          {esAdmin ? (
            <>
              {/* Inicio */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navegar('/(admin)')}
              >
                <View style={styles.iconCircle}>
                  <Ionicons
                    name="home-outline"
                    size={22}
                    color="#002b49"
                  />
                </View>

                <Text style={styles.menuText}>
                  Inicio (Dashboard)
                </Text>
              </TouchableOpacity>

              {/* Certámenes */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navegar('/(admin)/registroEvento')}
              >
                <View style={styles.iconCircle}>
                  <Ionicons
                    name="trophy-outline"
                    size={22}
                    color="#002b49"
                  />
                </View>

                <Text style={styles.menuText}>
                  Certámenes
                </Text>
              </TouchableOpacity>

              {/* Categorías */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navegar('/(admin)/categorias')}
              >
                <View style={styles.iconCircle}>
                  <Ionicons
                    name="folder-open-outline"
                    size={22}
                    color="#002b49"
                  />
                </View>

                <Text style={styles.menuText}>
                  Categorías
                </Text>
              </TouchableOpacity>

              {/* Rúbricas */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navegar('/(admin)/Rubricas')}
              >
                <View style={styles.iconCircle}>
                  <Ionicons
                    name="ribbon-outline"
                    size={22}
                    color="#002b49"
                  />
                </View>

                <Text style={styles.menuText}>
                  Rúbricas
                </Text>
              </TouchableOpacity>

              {/* Desafíos */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navegar('/(admin)/desafios')}
              >
                <View style={styles.iconCircle}>
                  <Ionicons
                    name="bulb-outline"
                    size={22}
                    color="#002b49"
                  />
                </View>

                <Text style={styles.menuText}>
                  Desafíos
                </Text>
              </TouchableOpacity>

              {/* REGISTRO DE SALAS DESPLEGABLE */}
              <View style={styles.expandableGroup}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() =>
                    setSalasMenuAbierto((actual) => !actual)
                  }
                  activeOpacity={0.8}
                >
                  <View style={styles.iconCircle}>
                    <Ionicons
                      name="easel-outline"
                      size={22}
                      color="#002b49"
                    />
                  </View>

                  <Text
                    style={[
                      styles.menuText,
                      styles.menuTextExpandable,
                    ]}
                  >
                    Registro de salas
                  </Text>

                  {/* Flecha a la derecha */}
                  <Ionicons
                    name={
                      salasMenuAbierto
                        ? 'chevron-down'
                        : 'chevron-forward'
                    }
                    size={22}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>

                {/* Opciones desplegables */}
                {salasMenuAbierto && (
                  <View style={styles.submenu}>
                    {/* Registrar salas */}
                    <TouchableOpacity
                      style={styles.submenuItem}
                      onPress={() =>
                        navegar('/(admin)/registroSalas')
                      }
                    >
                      <Ionicons
                        name="business-outline"
                        size={20}
                        color="#cbd5e1"
                      />

                      <Text style={styles.submenuText}>
                        Registrar salas
                      </Text>
                    </TouchableOpacity>

                    {/* Asignación de salas a jurados */}
                    <TouchableOpacity
                      style={styles.submenuItem}
                      onPress={() =>
                        navegar(
                          '/(admin)/registroSalas/asignacion-jurados'
                        )
                      }
                    >
                      <Ionicons
                        name="person-outline"
                        size={20}
                        color="#cbd5e1"
                      />

                      <Text style={styles.submenuText}>
                        Asignación salas jurados
                      </Text>
                    </TouchableOpacity>

                    {/* Asignación de salas a equipos */}
                    <TouchableOpacity
                      style={styles.submenuItem}
                      onPress={() =>
                        navegar(
                          '/(admin)/registroSalas/asignacion-equipos'
                        )
                      }
                    >
                      <Ionicons
                        name="people-outline"
                        size={20}
                        color="#cbd5e1"
                      />

                      <Text style={styles.submenuText}>
                        Asignación salas equipos
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Jurado */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navegar('/(admin)/gesJurados')}
              >
                <View style={styles.iconCircle}>
                  <Ionicons
                    name="people-outline"
                    size={22}
                    color="#002b49"
                  />
                </View>

                <Text style={styles.menuText}>
                  Jurado
                </Text>
              </TouchableOpacity>

              {/* Equipos */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navegar('/(admin)/equipos')}
              >
                <View style={styles.iconCircle}>
                  <Ionicons
                    name="people-circle-outline"
                    size={22}
                    color="#002b49"
                  />
                </View>

                <Text style={styles.menuText}>
                  Equipos
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* MÓDULOS DEL LÍDER */}

              {/* Inicio líder */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navegar('/(lider)')}
              >
                <View style={styles.iconCircle}>
                  <Ionicons
                    name="home-outline"
                    size={22}
                    color="#002b49"
                  />
                </View>

                <Text style={styles.menuText}>
                  Inicio (Líder)
                </Text>
              </TouchableOpacity>

              {/* Mi equipo */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => navegar('/(lider)/equipos')}
              >
                <View style={styles.iconCircle}>
                  <Ionicons
                    name="people-circle-outline"
                    size={22}
                    color="#002b49"
                  />
                </View>

                <Text style={styles.menuText}>
                  Mi Equipo
                </Text>
              </TouchableOpacity>
            </>
          )}

          {/* Cerrar sesión */}
          <TouchableOpacity
            style={[styles.menuItem, { marginTop: 20 }]}
            onPress={handleLogout}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: '#ff4d4d' },
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
                { color: '#ff4d4d' },
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

// ESTILOS
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

  // Permite que la flecha quede al extremo derecho
  menuTextExpandable: {
    flex: 1,
  },

  expandableGroup: {
    gap: 4,
  },

  submenu: {
    marginLeft: 17,
    paddingLeft: 16,
    paddingVertical: 5,
    borderLeftWidth: 2,
    borderLeftColor: '#739126',
    gap: 12,
  },

  submenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 5,
    paddingRight: 2,
  },

  submenuText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
});