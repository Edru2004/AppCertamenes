import { eliminarEquipo, getEquipos } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export interface Equipo {
  Id_equipo: number;
  Id_desafio: number;
  Id_categCertamen: number;
  Id_sala: number | null;
  Nombre: string;
  Video?: string;
  Reporte?: string;
  // Relaciones devueltas por Laravel
  desafio?: { Nombre: string };
  categoriaCertamen?: { Nombre: string };
  categoria_certamen?: { Nombre: string };
  sala?: { Nombre: string };
}

export default function EquiposIndexScreen() {
  const router = useRouter();

  const [busqueda, setBusqueda] = useState('');
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  // Cargar lista de equipos desde la API cada vez que entra en foco la pantalla
  const cargarEquipos = useCallback(async () => {
    try {
      setCargando(true);
      const data = await getEquipos();
      if (Array.isArray(data)) {
        setEquipos(data);
      } else {
        setEquipos([]);
      }
    } catch (error: any) {
      Alert.alert('Error', 'No se pudieron obtener los equipos de la API.');
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarEquipos();
    }, [cargarEquipos])
  );

  // Filtro corregido para buscar en las propiedades anidadas de las relaciones
  const equiposFiltrados = equipos.filter((e) => {
    const query = busqueda.toLowerCase();
    const nombreDesafio = e.desafio?.Nombre?.toLowerCase() || '';
    const nombreCategoria = (e.categoriaCertamen?.Nombre || e.categoria_certamen?.Nombre)?.toLowerCase() || '';
    const nombreEquipo = e.Nombre?.toLowerCase() || '';

    return (
      nombreEquipo.includes(query) ||
      nombreDesafio.includes(query) ||
      nombreCategoria.includes(query)
    );
  });

  const handleEliminar = (equipo: Equipo) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Deseas eliminar el equipo "${equipo.Nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarEquipo(equipo.Id_equipo);
              Alert.alert('Éxito', 'Equipo eliminado correctamente.');
              cargarEquipos();
            } catch (error: any) {
              Alert.alert('Error', 'No se pudo eliminar el equipo.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Panel de Gestión de Equipos</Text>

      <View style={styles.filterSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, desafío o categoría..."
            value={busqueda}
            onChangeText={setBusqueda}
          />
        </View>
      </View>

      {cargando ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#002b45" />
          <Text style={styles.loadingText}>Cargando equipos...</Text>
        </View>
      ) : (
        <FlatList
          data={equiposFiltrados}
          keyExtractor={(item) => item.Id_equipo.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No hay equipos registrados.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.idText}>EQUIPO-{item.Id_equipo}</Text>
                  <Text style={styles.nombreText}>{item.Nombre}</Text>
                </View>
                <View style={[styles.salaBadge, item.Id_sala ? styles.salaAsignada : styles.sinSala]}>
                  <Text style={styles.salaText}>
                    {item.sala?.Nombre || (item.Id_sala ? `Sala #${item.Id_sala}` : 'Sin Sala')}
                  </Text>
                </View>
              </View>

              <View style={styles.infoContainer}>
                <Text style={styles.infoBadge}>
                  <Ionicons name="trophy-outline" size={14} color="#002b45" /> Desafío:{' '}
                  {item.desafio?.Nombre || `ID #${item.Id_desafio}`}
                </Text>
                
                <Text style={styles.infoBadge}>
                  <Ionicons name="pricetag-outline" size={14} color="#002b45" /> Categoría:{' '}
                  {item.categoriaCertamen?.Nombre || item.categoria_certamen?.Nombre || `ID #${item.Id_categCertamen}`}
                </Text>
                
                <View style={styles.entregablesRow}>
                  <Text style={styles.entregableTag}>
                    <Ionicons name="logo-youtube" size={13} color={item.Video ? '#dc3545' : '#aaa'} />{' '}
                    {item.Video ? 'Video Adjunto' : 'Sin Video'}
                  </Text>
                  <Text style={styles.entregableTag}>
                    <Ionicons name="document-text-outline" size={13} color={item.Reporte ? '#007bff' : '#aaa'} />{' '}
                    {item.Reporte ? 'Reporte Adjunto' : 'Sin Reporte'}
                  </Text>
                </View>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.btnAction, styles.btnEdit]}
                  onPress={() => {
                    router.navigate({
                      pathname: '/equipos/form' as any,
                      params: { equipoEditar: JSON.stringify(item) },
                    });
                  }}
                >
                  <Ionicons name="create-outline" size={16} color="#fff" />
                  <Text style={styles.btnActionText}>Editar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.btnAction, styles.btnDelete]}
                  onPress={() => handleEliminar(item)}
                >
                  <Ionicons name="trash-outline" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#002b45', marginBottom: 15 },
  filterSection: { marginBottom: 15 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#e0e0e0' },
  searchInput: { flex: 1, height: 42, marginLeft: 8 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  loadingText: { marginTop: 10, color: '#002b45', fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 30, fontSize: 15 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  idText: { fontSize: 11, color: '#888', fontWeight: 'bold' },
  nombreText: { fontSize: 17, fontWeight: 'bold', color: '#002b45', marginTop: 2 },
  salaBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  salaAsignada: { backgroundColor: '#d4edda' },
  sinSala: { backgroundColor: '#fff3cd' },
  salaText: { fontSize: 11, fontWeight: 'bold', color: '#333' },
  infoContainer: { marginTop: 10, gap: 4, backgroundColor: '#f9fbfd', padding: 10, borderRadius: 8 },
  infoBadge: { fontSize: 13, color: '#444' },
  entregablesRow: { flexDirection: 'row', gap: 12, marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#eee' },
  entregableTag: { fontSize: 12, color: '#555', fontWeight: '500' },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 12, justifyContent: 'flex-end' },
  btnAction: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, gap: 4 },
  btnEdit: { backgroundColor: '#007bff' },
  btnDelete: { backgroundColor: '#dc3545' },
  btnActionText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});