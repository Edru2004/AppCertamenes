import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function AdminHomeScreen() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(0);

  const categorias = ['TODAS', 'SISTEMAS', 'IA', 'ELECTRO', 'SALUD', 'TURISMO'];

  useEffect(() => {
    const verificarSesion = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const userData = await AsyncStorage.getItem('userData');

        if (!token) {
          router.replace('/login');
        } else {
          if (userData) {
            setUsuario(JSON.parse(userData));
          }
          setCargando(false);
        }
      } catch (error) {
        router.replace('/login');
      }
    };

    verificarSesion();
  }, []);

  const handleCerrarSesion = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas salir del sistema?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
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

  if (cargando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#002b45" />
        <Text style={styles.loadingText}>Verificando sesión...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Cabecera / Saludo al Usuario */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.welcomeTitle}>
            ¡Hola, {usuario?.Nombre || usuario?.Nom || 'Usuario'}! 👋
          </Text>
          <Text style={styles.welcomeSubtitle}>
            {usuario?.Rol ? `Rol: ${usuario.Rol}` : 'Panel de Control ITSSMT'}
          </Text>
        </View>
        <TouchableOpacity style={styles.btnLogout} onPress={handleCerrarSesion}>
          <Ionicons name="log-out-outline" size={22} color="#ff4d4d" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Tarjeta de Resumen / Total de Categorías */}
        <View style={styles.cardTotal}>
          <View style={styles.cardTotalHeader}>
            <Ionicons name="trophy-outline" size={28} color="#002b45" />
            <Text style={styles.cardTitle}>Categorías Registradas</Text>
          </View>
          <Text style={styles.cardNumber}>11</Text>
          <Text style={styles.cardFooter}>Certamen InnovaTecNM 2026</Text>
        </View>

        {/* Módulos de Acceso Rápido */}
        <Text style={styles.sectionTitle}>Módulos Principales</Text>
        <View style={styles.gridContainer}>
          <TouchableOpacity style={styles.gridCard} activeOpacity={0.8}>
            <View style={[styles.iconBox, { backgroundColor: '#e8f0fe' }]}>
              <Ionicons name="shapes-outline" size={24} color="#002b45" />
            </View>
            <Text style={styles.gridTitle}>Categorías</Text>
            <Text style={styles.gridSubtitle}>Gestión y registro</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridCard} activeOpacity={0.8}>
            <View style={[styles.iconBox, { backgroundColor: '#f3f8e0' }]}>
              <Ionicons name="flame-outline" size={24} color="#9eb23b" />
            </View>
            <Text style={styles.gridTitle}>Desafíos</Text>
            <Text style={styles.gridSubtitle}>Retos activos</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridCard} activeOpacity={0.8}>
            <View style={[styles.iconBox, { backgroundColor: '#eaf4ff' }]}>
              <Ionicons name="business-outline" size={24} color="#0284c7" />
            </View>
            <Text style={styles.gridTitle}>Salas</Text>
            <Text style={styles.gridSubtitle}>Asignación de espacio</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridCard} activeOpacity={0.8}>
            <View style={[styles.iconBox, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="people-outline" size={24} color="#d97706" />
            </View>
            <Text style={styles.gridTitle}>Equipos</Text>
            <Text style={styles.gridSubtitle}>Evaluación y notas</Text>
          </TouchableOpacity>
        </View>

        {/* Filtro de Categorías */}
        <Text style={styles.sectionTitle}>Explorar Categorías</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagsContainer}>
          {categorias.map((cat, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.tag, categoriaSeleccionada === index && styles.activeTag]}
              onPress={() => setCategoriaSeleccionada(index)}
            >
              <Text
                style={[
                  styles.tagText,
                  categoriaSeleccionada === index && styles.activeTagText,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>

      {/* Barra de Navegación Inferior */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomTab}>
          <Ionicons name="home" size={22} color="#002b45" />
          <Text style={[styles.tabText, { color: '#002b45', fontWeight: 'bold' }]}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomTab}>
          <Ionicons name="layers-outline" size={22} color="#666" />
          <Text style={styles.tabText}>Categorías</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomTab}>
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
    paddingBottom: 15,
    backgroundColor: '#002b45',
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  welcomeSubtitle: {
    fontSize: 12,
    color: '#a0b2c6',
    marginTop: 2,
  },
  btnLogout: {
    padding: 8,
    backgroundColor: '#ffffff1a',
    borderRadius: 10,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 90,
  },
  cardTotal: {
    backgroundColor: '#A4B74D',
    borderRadius: 16,
    padding: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTotalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    color: '#002b45',
    fontWeight: '600',
  },
  cardNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#002b45',
    marginVertical: 4,
  },
  cardFooter: {
    fontSize: 12,
    color: '#334155',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#002b45',
    marginTop: 22,
    marginBottom: 12,
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
    borderRadius: 14,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
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
});