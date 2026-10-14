import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const API_URL = 'http://192.168.1.99:8000/api';

export default function SalasIndexScreen() {
  const router = useRouter();
  const [salas, setSalas] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      cargarSalas();
    }, [])
  );

  const cargarSalas = async (nombre = '') => {
    try {
      setCargando(true);
      const token = await AsyncStorage.getItem('userToken');

      let url = `${API_URL}/salas`;
      if (nombre.trim()) {
        url += `?Nombre=${encodeURIComponent(nombre.trim())}`;
      }

      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });

      const data = await res.json();

      if (res.ok) {
        const lista = Array.isArray(data) ? data : data.data || [];
        setSalas(lista);
      } else {
        throw new Error(data.message || 'Error al obtener las salas');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Error de conexión');
    } finally {
      setCargando(false);
    }
  };

 const handleEliminar = (idSala: number, nombreSala: string) => {
  Alert.alert(
    'Confirmar Eliminación',
    `¿Deseas eliminar la sala "${nombreSala}"?`,
    [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            const token = await AsyncStorage.getItem('userToken');
            const res = await fetch(`${API_URL}/salas/${idSala}`, {
              method: 'DELETE',
              headers: {
                Accept: 'application/json',
                'Content-Type': 'application/json',
                ...(token ? { Authorization: `Bearer ${token}` } : {}),
              },
            });

            const data = await res.json();

            if (res.ok) {
              Alert.alert('¡Éxito!', data.message || 'Sala eliminada correctamente.');
              cargarSalas(busqueda);
            } else {
              // Muestra el mensaje detallado devuelto por la API
              Alert.alert('No se pudo eliminar', data.message || 'Error al eliminar en la base de datos.');
            }
          } catch (e: any) {
            Alert.alert('Error al eliminar', e.message || 'Error de conexión.');
          }
        },
      },
    ]
  );
};

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.btnNuevo}
        onPress={() => router.push('/registroSalas/form' as any)}
      >
        <Ionicons name="add-circle-outline" size={20} color="#fff" />
        <Text style={styles.btnNuevoText}>Nueva Sala</Text>
      </TouchableOpacity>

      <View style={styles.filterCard}>
        <View style={styles.inputContainer}>
          <Ionicons name="search-outline" size={18} color="#666" />
          <TextInput
            style={styles.input}
            placeholder="Buscar por nombre de sala..."
            value={busqueda}
            onChangeText={setBusqueda}
          />
        </View>
        <TouchableOpacity
          style={styles.btnBuscar}
          onPress={() => cargarSalas(busqueda)}
        >
          <Ionicons name="filter" size={16} color="#fff" />
          <Text style={styles.btnBuscarText}>Buscar</Text>
        </TouchableOpacity>
      </View>

      {cargando ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#002b45" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {salas.length === 0 ? (
            <Text style={styles.emptyText}>No hay salas registradas en la base de datos.</Text>
          ) : (
            salas.map((sala) => {
              const id = sala.id || sala.ID || sala.Id_sala;
              const nombre = sala.Nombre || sala.NOMBRE || 'Sin Nombre';
              const ubicacion = sala.Ubicacion || sala.UBICACIÓN || sala.ubicacion || 'Sin Ubicación';

              return (
                <View key={id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.infoCol}>
                      <Text style={styles.cardTitle}>{nombre}</Text>
                      <Text style={styles.cardBadge}>SALA-00{id}</Text>
                    </View>
                  </View>

                  <Text style={styles.subtext}>
                    Ubicación: <Text style={styles.bold}>{ubicacion}</Text>
                  </Text>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.btnAction, styles.btnEdit]}
                      onPress={() =>
                        router.push({
                          pathname: '/registroSalas/form' as any,
                          params: { id, nombre, ubicacion },
                        })
                      }
                    >
                      <Ionicons name="create-outline" size={16} color="#fff" />
                      <Text style={styles.btnActionText}>Editar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.btnAction, styles.btnDelete]}
                      onPress={() => handleEliminar(id, nombre)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 15 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  btnNuevo: {
    flexDirection: 'row',
    backgroundColor: '#9eb23b',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  btnNuevoText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  filterCard: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 15, elevation: 1 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
  },
  input: { flex: 1, fontSize: 13, color: '#333' },
  btnBuscar: { flexDirection: 'row', backgroundColor: '#002b45', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 6, gap: 6, alignItems: 'center', marginTop: 8, alignSelf: 'flex-end' },
  btnBuscarText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  scroll: { paddingBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoCol: { flexDirection: 'row', justifyContent: 'space-between', flex: 1, alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#002b45' },
  cardBadge: { fontSize: 12, color: '#888', fontWeight: 'bold' },
  subtext: { fontSize: 13, color: '#666', marginTop: 6, marginBottom: 12 },
  bold: { fontWeight: 'bold', color: '#002b45' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  btnAction: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, gap: 4 },
  btnEdit: { backgroundColor: '#0284c7' },
  btnDelete: { backgroundColor: '#dc2626' },
  btnActionText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#777', marginTop: 20 },
});