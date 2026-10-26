// @ts-nocheck
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// Ajusta esta ruta a la ubicación real de tu archivo api.ts.
// Ejemplo: '../../services/api' o '../services/api'.
import {
  getCategCertamenes,
  getDesafios,
  getEquipos,
  getSalas,
} from '../../services/api';

type Cantidades = {
  categorias: number;
  desafios: number;
  salas: number;
  equipos: number;
};

type TarjetaResumen = {
  titulo: string;
  cantidad: number;
  detalle: string;
  icono: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  fondoIcono: string;
};

/**
 * Acepta respuestas comunes de Laravel:
 * - [...]
 * - { data: [...] } (paginación o recurso)
 * - { categorias: [...] }, { desafios: [...] }, etc.
 *
 * Si tu API devuelve una estructura distinta, ajusta esta función
 * para que apunte a la propiedad que contiene el arreglo.
 */
const contarRegistros = (respuesta: any): number => {
  if (Array.isArray(respuesta)) return respuesta.length;

  if (respuesta && typeof respuesta === 'object') {
    if (Array.isArray(respuesta.data)) return respuesta.data.length;
    if (Array.isArray(respuesta.registros)) return respuesta.registros.length;
    if (Array.isArray(respuesta.categorias)) return respuesta.categorias.length;
    if (Array.isArray(respuesta.desafios)) return respuesta.desafios.length;
    if (Array.isArray(respuesta.salas)) return respuesta.salas.length;
    if (Array.isArray(respuesta.equipos)) return respuesta.equipos.length;
  }

  return 0;
};

export default function AdminHomeScreen() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [usuario, setUsuario] = useState<any>(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(0);
  const [cantidades, setCantidades] = useState<Cantidades>({
    categorias: 0,
    desafios: 0,
    salas: 0,
    equipos: 0,
  });

  const categoriasFiltro = ['TODAS', 'SISTEMAS', 'IA', 'ELECTRO', 'SALUD', 'TURISMO'];

  const cargarCantidades = useCallback(async () => {
    setActualizando(true);
    try {
      // Estas funciones usan la URL y el token de Sanctum configurados en api.ts.
      const [respuestaCategorias, respuestaDesafios, respuestaSalas, respuestaEquipos] =
        await Promise.all([
          getCategCertamenes(),
          getDesafios(),
          getSalas(),
          getEquipos(),
        ]);

      setCantidades({
        categorias: contarRegistros(respuestaCategorias),
        desafios: contarRegistros(respuestaDesafios),
        salas: contarRegistros(respuestaSalas),
        equipos: contarRegistros(respuestaEquipos),
      });
    } catch (error) {
      console.error('Error al cargar las cantidades del panel:', error);
      Alert.alert(
        'No se pudieron cargar los registros',
        'Verifica la conexión con la API y que el usuario tenga permisos para consultar categorías, desafíos, salas y equipos.'
      );
    } finally {
      setActualizando(false);
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const verificarSesion = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const userData = await AsyncStorage.getItem('userData');

        if (!token) {
          router.replace('/login');
          return;
        }

        if (userData) setUsuario(JSON.parse(userData));
        await cargarCantidades();
      } catch (error) {
        console.error('Error al verificar la sesión:', error);
        router.replace('/login');
      }
    };

    verificarSesion();
  }, [cargarCantidades, router]);

  const handleCerrarSesion = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas salir del sistema?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userData');
            router.replace('/login');
          },
        },
      ]
    );
  };

  const tarjetas: TarjetaResumen[] = [
    {
      titulo: 'CATEGORÍAS',
      cantidad: cantidades.categorias,
      detalle: 'Registradas en el sistema',
      icono: 'shapes-outline',
      color: '#2563eb',
      fondoIcono: '#eff6ff',
    },
    {
      titulo: 'DESAFÍOS',
      cantidad: cantidades.desafios,
      detalle: 'Desafíos registrados',
      icono: 'flame-outline',
      color: '#d97706',
      fondoIcono: '#fffbeb',
    },
    {
      titulo: 'SALAS',
      cantidad: cantidades.salas,
      detalle: 'Salas registradas',
      icono: 'business-outline',
      color: '#0284c7',
      fondoIcono: '#f0f9ff',
    },
    {
      titulo: 'EQUIPOS',
      cantidad: cantidades.equipos,
      detalle: 'Equipos registrados',
      icono: 'people-outline',
      color: '#059669',
      fondoIcono: '#ecfdf5',
    },
  ];

  if (cargando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#002b45" />
        <Text style={styles.loadingText}>Cargando panel de administración...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <View style={styles.headerText}>
          <Text style={styles.welcomeTitle}>
            ¡Hola, {usuario?.Nombre || usuario?.Nom || 'Usuario'}! 
          </Text>
          <Text style={styles.welcomeSubtitle}>
            {usuario?.Rol ? ` ${usuario.Rol}` : 'Panel de Control ITSSMT'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.btnLogout}
          onPress={handleCerrarSesion}
          accessibilityLabel="Cerrar sesión"
        >
          <Ionicons name="log-out-outline" size={22} color="#ff4d4d" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Resumen de registros</Text>
          <TouchableOpacity
            onPress={cargarCantidades}
            disabled={actualizando}
            style={styles.refreshButton}
            accessibilityLabel="Actualizar cantidades"
          >
            {actualizando ? (
              <ActivityIndicator size="small" color="#002b45" />
            ) : (
              <Ionicons name="refresh-outline" size={19} color="#002b45" />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          {tarjetas.map((tarjeta) => (
            <View key={tarjeta.titulo} style={styles.statCard}>
              <View style={styles.statTextContainer}>
                <Text style={styles.statTitle}>{tarjeta.titulo}</Text>
                <Text style={styles.statNumber}>{tarjeta.cantidad}</Text>
                <View style={styles.statFooter}>
                  <Ionicons
                    name="checkmark-circle"
                    size={13}
                    color={tarjeta.color}
                  />
                  <Text style={[styles.statDetail, { color: tarjeta.color }]}>
                    {tarjeta.detalle}
                  </Text>
                </View>
              </View>

              <View
                style={[
                  styles.statIconBox,
                  { backgroundColor: tarjeta.fondoIcono },
                ]}
              >
                <Ionicons
                  name={tarjeta.icono}
                  size={25}
                  color={tarjeta.color}
                />
              </View>
            </View>
          ))}
        </View>

      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomTab}>
          <Ionicons name="home" size={22} color="#002b45" />
          <Text style={[styles.tabText, styles.activeTabText]}>Inicio</Text>
        </TouchableOpacity>

     

        <TouchableOpacity
          style={styles.bottomTab}
          onPress={() => router.push('')}
        >
          <Ionicons name="person-outline" size={22} color="#666" />
          <Text style={styles.tabText}>Perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 10,
    color: '#002b45',
    fontSize: 14,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 18,
    backgroundColor: '#002b45',
  },
  headerText: {
    flex: 1,
    paddingRight: 12,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: '#a0b2c6',
    marginTop: 3,
  },
  btnLogout: {
    padding: 8,
    backgroundColor: '#ffffff1a',
    borderRadius: 10,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#002b45',
    marginTop: 18,
    marginBottom: 12,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8eef5',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  statCard: {
    width: '48.5%',
    minHeight: 132,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dce5ef',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  statTextContainer: {
    flex: 1,
    paddingRight: 5,
  },
  statTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.45,
    color: '#8190a5',
  },
  statNumber: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#002b45',
    marginTop: 5,
    marginBottom: 4,
  },
  statFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statDetail: {
    fontSize: 9,
    flexShrink: 1,
  },
  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  gridTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  gridSubtitle: {
    fontSize: 11,
    color: '#777',
    marginTop: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
  },
  tag: {
    backgroundColor: '#e2e8f0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
  },
  activeTag: {
    backgroundColor: '#002b45',
  },
  tagText: {
    color: '#475569',
    fontWeight: '600',
    fontSize: 12,
  },
  activeTagText: {
    color: '#fff',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 65,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    elevation: 8,
  },
  bottomTab: {
    alignItems: 'center',
  },
  tabText: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  activeTabText: {
    color: '#002b45',
    fontWeight: 'bold',
  },
});
