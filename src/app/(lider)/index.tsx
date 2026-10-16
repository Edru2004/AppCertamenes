// src/app/(lider)/index.tsx
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

export default function LiderHomeScreen() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [usuario, setUsuario] = useState<any>(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const userData = await AsyncStorage.getItem('userData');
        if (userData) {
          setUsuario(JSON.parse(userData));
        }
      } catch (e) {
        console.log('Error cargando usuario:', e);
      } finally {
        setCargando(false);
      }
    };
    cargarDatos();
  }, []);

  const handleCerrarSesion = () => {
    Alert.alert('Cerrar Sesión', '¿Estás seguro de que deseas salir?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Cerrar Sesión',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['userToken', 'userData', 'userRole']);
          router.replace('/login');
        },
      },
    ]);
  };

  if (cargando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#002b45" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header con saludo */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.welcomeTitle}>
            ¡Hola, {usuario?.Nombre || 'Líder'}! 👋
          </Text>
          <Text style={styles.welcomeSubtitle}>Panel del Líder de Equipo</Text>
        </View>
        <TouchableOpacity style={styles.btnLogout} onPress={handleCerrarSesion}>
          <Ionicons name="log-out-outline" size={22} color="#ff4d4d" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Tarjeta de bienvenida / Equipo */}
        <View style={styles.cardInfo}>
          <Ionicons name="people-circle-outline" size={40} color="#002b45" />
          <Text style={styles.cardTitle}>Mi Equipo de Certamen</Text>
          <Text style={styles.cardSubtitle}>
            Consulta integrantes, avances y estatus de registro.
          </Text>
        </View>

        {/* Accesos Rápidos */}
        <Text style={styles.sectionTitle}>Acciones Rápidas</Text>
        <TouchableOpacity
          style={styles.actionCard}
          activeOpacity={0.8}
          onPress={() => router.push('/(lider)/equipos' as any)}
        >
          <View style={styles.iconCircle}>
            <Ionicons name="people-outline" size={24} color="#002b45" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Gestionar Mi Equipo</Text>
            <Text style={styles.actionSubtitle}>
              Ver lista de integrantes y detalles del proyecto
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#666" />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#002b45',
  },
  welcomeTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  welcomeSubtitle: { fontSize: 12, color: '#a0b2c6', marginTop: 2 },
  btnLogout: { padding: 8, backgroundColor: '#ffffff1a', borderRadius: 10 },
  scrollContent: { padding: 20 },
  cardInfo: {
    backgroundColor: '#A4B74D',
    borderRadius: 16,
    padding: 20,
    alignItems: 'flex-start',
    gap: 8,
  },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#002b45' },
  cardSubtitle: { fontSize: 13, color: '#2c3e50' },
  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#002b45',
    marginTop: 25,
    marginBottom: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#e8f0fe',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionTitle: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  actionSubtitle: { fontSize: 12, color: '#777', marginTop: 2 },
});