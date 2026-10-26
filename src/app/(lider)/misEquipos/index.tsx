import { eliminarIntegrante, getIntegrantes } from '@/services/api';
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

export interface Integrante {
  no_control: string;
  Id_equipo: number;
  Nombre: string;
  Carrera?: string;
  Rol?: string;
  Sexo?: string;
  Correo?: string;
  Semestre?: number;
  equipo?: { Nombre: string };
}

export default function EquiposIndexScreen() {
    
  const router = useRouter();

  const [busqueda, setBusqueda] = useState('');
  const [integrantes, setIntegrantes] = useState<Integrante[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  const cargarIntegrantes = useCallback(async () => {
    try {
      setCargando(true);
      const data = await getIntegrantes();
      if (Array.isArray(data)) {
        setIntegrantes(data);
      } else {
        setIntegrantes([]);
      }
    } catch (error: any) {
      console.error('Error al cargar integrantes:', error);
      Alert.alert('Error', 'No se pudieron obtener los integrantes de la API.');
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarIntegrantes();
    }, [cargarIntegrantes])
  );

  const integrantesFiltrados = integrantes.filter((i) => {
    const query = busqueda.toLowerCase();
    const noControl = (i.no_control || '').toLowerCase();
    const nombre = (i.Nombre || '').toLowerCase();
    const equipo = i.equipo?.Nombre?.toLowerCase() || '';
    const correo = (i.Correo || '').toLowerCase();
    const carrera = (i.Carrera || '').toLowerCase();

    return (
      noControl.includes(query) ||
      nombre.includes(query) ||
      equipo.includes(query) ||
      correo.includes(query) ||
      carrera.includes(query)
    );
  });

  const handleEliminar = (integrante: Integrante) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Deseas eliminar al integrante "${integrante.Nombre}" (${integrante.no_control})?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarIntegrante(integrante.no_control);
              Alert.alert('Éxito', 'Integrante eliminado correctamente.');
              cargarIntegrantes();
            } catch (error: any) {
              Alert.alert('Error', 'No se pudo eliminar al integrante.');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Panel de Integrantes</Text>

      {/* Buscador */}
      <View style={styles.filterSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por N° de control, nombre, carrera o equipo..."
            value={busqueda}
            onChangeText={setBusqueda}
          />
        </View>
      </View>

      {cargando ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#002b45" />
          <Text style={styles.loadingText}>Cargando integrantes...</Text>
        </View>
      ) : (
        <FlatList
          data={integrantesFiltrados}
          keyExtractor={(item) => item.no_control}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No hay integrantes registrados.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.idText}>CONTROL: {item.no_control}</Text>
                  <Text style={styles.nombreText}>{item.Nombre}</Text>
                  {item.Correo ? (
                    <Text style={styles.correoText}>
                      <Ionicons name="mail-outline" size={12} color="#555" /> {item.Correo}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.equipoBadge}>
                  <Text style={styles.equipoBadgeText}>
                    {item.equipo?.Nombre || `Equipo #${item.Id_equipo}`}
                  </Text>
                </View>
              </View>

              <View style={styles.infoContainer}>
                {item.Rol ? (
                  <Text style={styles.infoBadge}>
                    <Ionicons name="person-badge-outline" size={14} color="#002b45" /> Rol:{' '}
                    {item.Rol}
                  </Text>
                ) : null}

                {item.Carrera ? (
                  <Text style={styles.infoBadge}>
                    <Ionicons name="school-outline" size={14} color="#002b45" /> Carrera:{' '}
                    {item.Carrera}
                  </Text>
                ) : null}

                <View style={styles.extraDetailsRow}>
                  {item.Semestre ? (
                    <Text style={styles.extraTag}>
                      <Ionicons name="calendar-outline" size={13} color="#002b45" /> Semestre: {item.Semestre}°
                    </Text>
                  ) : null}

                  {item.Sexo ? (
                    <Text style={styles.extraTag}>
                      <Ionicons name="male-female-outline" size={13} color="#002b45" /> Sexo: {item.Sexo}
                    </Text>
                  ) : null}
                </View>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.btnAction, styles.btnEdit]}
                  onPress={() => {
                    router.navigate({
                      pathname: '/integrantes/form' as any,
                      params: { integranteEditar: JSON.stringify(item) },
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
  nombreText: { fontSize: 16, fontWeight: 'bold', color: '#002b45', marginTop: 2 },
  correoText: { fontSize: 12, color: '#555', marginTop: 2 },
  equipoBadge: { backgroundColor: '#eaf4ff', paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  equipoBadgeText: { fontSize: 11, fontWeight: 'bold', color: '#002b45' },
  infoContainer: { marginTop: 10, gap: 4, backgroundColor: '#f9fbfd', padding: 10, borderRadius: 8 },
  infoBadge: { fontSize: 13, color: '#444' },
  extraDetailsRow: { flexDirection: 'row', gap: 15, marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderTopColor: '#eee' },
  extraTag: { fontSize: 12, color: '#555', fontWeight: '500' },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 12, justifyContent: 'flex-end' },
  btnAction: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, gap: 4 },
  btnEdit: { backgroundColor: '#007bff' },
  btnDelete: { backgroundColor: '#dc3545' },
  btnActionText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});