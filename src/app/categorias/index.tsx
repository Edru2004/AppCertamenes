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

export default function CategoriasIndexScreen() {
  const router = useRouter();
  const [categorias, setCategorias] = useState<any[]>([]);
  const [busquedaNombre, setBusquedaNombre] = useState('');
  const [cargando, setCargando] = useState(true);

  // useFocusEffect se ejecuta SIEMPRE que entras o regresas a esta pantalla
  useFocusEffect(
    useCallback(() => {
      cargarCategorias();
    }, [])
  );

  const cargarCategorias = async (nombre = '') => {
    try {
      setCargando(true);
      const token = await AsyncStorage.getItem('userToken');

      let url = `${API_URL}/categoria-certamens`;
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
      console.log('Categorías recibidas de Laravel:', data);

      if (res.ok) {
        // Maneja tanto arreglos planos como objetos paginados { data: [...] }
        const lista = Array.isArray(data) ? data : data.data || [];
        setCategorias(lista);
      } else {
        throw new Error(data.message || 'Error al obtener categorías');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'No se pudo conectar con el servidor');
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = (idCategory: number, nombreCategory: string, equiposCount: number) => {
    if (equiposCount > 0) {
      Alert.alert(
        'Acción No Permitida',
        `No se puede eliminar la categoría "${nombreCategory}" porque tiene ${equiposCount} equipo(s) inscrito(s).`
      );
      return;
    }

    Alert.alert(
      'Confirmar eliminación',
      `¿Deseas eliminar la categoría "${nombreCategory}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('userToken');
              const res = await fetch(`${API_URL}/categoria-certamens/${idCategory}`, {
                method: 'DELETE',
                headers: {
                  Accept: 'application/json',
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
              });

              const data = await res.json();

              if (res.ok) {
                Alert.alert('¡Éxito!', 'Categoría eliminada correctamente.');
                cargarCategorias(busquedaNombre);
              } else {
                throw new Error(data.message || 'Error al eliminar');
              }
            } catch (e: any) {
              Alert.alert('Error al eliminar', e.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Botón Agregar Nueva Categoría */}
      <TouchableOpacity
        style={styles.btnNuevo}
        onPress={() => router.push('/categorias/form' as any)}
      >
        <Ionicons name="add-circle-outline" size={20} color="#fff" />
        <Text style={styles.btnNuevoText}>Nueva Categoría</Text>
      </TouchableOpacity>

      <View style={styles.filterCard}>
        <View style={styles.inputContainer}>
          <Ionicons name="search-outline" size={18} color="#666" />
          <TextInput
            style={styles.input}
            placeholder="Buscar por nombre..."
            value={busquedaNombre}
            onChangeText={setBusquedaNombre}
          />
        </View>
        <TouchableOpacity
          style={styles.btnBuscar}
          onPress={() => cargarCategorias(busquedaNombre)}
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
          {categorias.length === 0 ? (
            <Text style={styles.emptyText}>No hay categorías registradas en la base de datos.</Text>
          ) : (
            categorias.map((cat) => {
              const id = cat.Id_categCertamen || cat.idCategoria_certa || cat.id;
              const nombreCat = cat.Nombre || cat.nombre;
              const certamenId = cat.Id_Certamen || cat.idCertamen;
              const certamenNombre = cat.certamen?.Nombre || `Certamen #${certamenId}`;
              const equiposCount = cat.equipos_count || 0;

              return (
                <View key={id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{nombreCat}</Text>
                    <Text style={styles.cardBadge}>CAT-00{id}</Text>
                  </View>

                  <Text style={styles.subtext}>Certamen: {certamenNombre}</Text>
                  <Text style={styles.teamsText}>
                    Equipos inscritos: <Text style={styles.bold}>{equiposCount}</Text>
                  </Text>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.btnAction, styles.btnEdit]}
                      onPress={() =>
                        router.push({
                          pathname: '/categorias/form' as any,
                          params: { id, idCertamen: certamenId, nombre: nombreCat },
                        })
                      }
                    >
                      <Ionicons name="create-outline" size={16} color="#fff" />
                      <Text style={styles.btnActionText}>Editar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.btnAction, styles.btnDelete]}
                      onPress={() => handleEliminar(id, nombreCat, equiposCount)}
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
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#002b45', flex: 1, marginRight: 8 },
  cardBadge: { fontSize: 12, color: '#888', fontWeight: 'bold' },
  subtext: { fontSize: 13, color: '#666', marginTop: 4 },
  teamsText: { fontSize: 13, color: '#333', marginTop: 6, marginBottom: 12 },
  bold: { fontWeight: 'bold', color: '#002b45' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  btnAction: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, gap: 4 },
  btnEdit: { backgroundColor: '#0284c7' },
  btnDelete: { backgroundColor: '#dc2626' },
  btnActionText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#777', marginTop: 20 },
});