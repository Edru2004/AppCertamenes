import { eliminarJurado, getJurados } from '@/services/api';
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

export interface Jurado {
  Id_jurado: number;
  Id_usuario: number;
  Id_sala: number | null;
  Curriculum?: string;
  Institucion: string;
  Area_participacion: string;
  Area_especializada?: string;
  puesto?: string;
  Invitacion: 'Aceptada' | 'Pendiente' | 'Rechazada';
  // Relaciones devueltas desde Laravel
  usuario?: { Nombre?: string; name?: string; email?: string };
  sala?: { Nombre?: string };
}

export default function JuradosIndexScreen() {
  const router = useRouter();

  const [busqueda, setBusqueda] = useState('');
  const [invitacionFiltro, setInvitacionFiltro] = useState<string>('TODOS');
  const [jurados, setJurados] = useState<Jurado[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);

  // Consulta los jurados reales desde Laravel
  const cargarJurados = useCallback(async () => {
    try {
      setCargando(true);
      const data = await getJurados();
      if (Array.isArray(data)) {
        setJurados(data);
      } else {
        setJurados([]);
      }
    } catch (error: any) {
      console.error('Error al cargar jurados:', error);
      Alert.alert('Error API', error.message || 'No se pudieron obtener los jurados.');
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarJurados();
    }, [cargarJurados])
  );

  const juradosFiltrados = jurados.filter((j) => {
    const query = busqueda.toLowerCase();
    const nombreUsuario = (j.usuario?.Nombre || j.usuario?.name || '').toLowerCase();
    const institucion = (j.Institucion || '').toLowerCase();
    const especialidad = (j.Area_especializada || '').toLowerCase();

    const coincideBusqueda =
      nombreUsuario.includes(query) ||
      institucion.includes(query) ||
      especialidad.includes(query);

    const coincideInvitacion =
      invitacionFiltro === 'TODOS' || j.Invitacion === invitacionFiltro;

    return coincideBusqueda && coincideInvitacion;
  });

  const handleEliminar = (jurado: Jurado) => {
    const nombreEvaluador = jurado.usuario?.Nombre || jurado.usuario?.name || `ID ${jurado.Id_jurado}`;
    Alert.alert(
      'Confirmar Eliminación',
      `¿Deseas eliminar al jurado "${nombreEvaluador}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarJurado(jurado.Id_jurado);
              Alert.alert('Éxito', 'Jurado eliminado correctamente.');
              cargarJurados();
            } catch (error: any) {
              Alert.alert('Error', 'No se pudo eliminar el jurado en la API.');
            }
          },
        },
      ]
    );
  };

  const getBadgeStyle = (invitacion: string) => {
    switch (invitacion) {
      case 'Aceptada':
        return { badge: styles.statusReady, text: '#155724' };
      case 'Pendiente':
        return { badge: styles.statusPending, text: '#856404' };
      default:
        return { badge: styles.statusRejected, text: '#721c24' };
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Panel de Gestión de Jurados</Text>

      {/* Buscador y Filtro */}
      <View style={styles.filterSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, institución o área..."
            value={busqueda}
            onChangeText={setBusqueda}
          />
        </View>

        <View style={styles.chipRow}>
          <Text style={styles.filterLabel}>Invitación:</Text>
          {['TODOS', 'Aceptada', 'Pendiente', 'Rechazada'].map((e) => (
            <TouchableOpacity
              key={e}
              style={[
                styles.filterChip,
                invitacionFiltro === e && styles.filterChipActive,
              ]}
              onPress={() => setInvitacionFiltro(e)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  invitacionFiltro === e && styles.filterChipTextActive,
                ]}
              >
                {e}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {cargando ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#002b45" />
          <Text style={styles.loadingText}>Cargando jurados desde el servidor...</Text>
        </View>
      ) : (
        <FlatList
          data={juradosFiltrados}
          keyExtractor={(item) => item.Id_jurado.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No hay jurados registrados.</Text>
          }
          renderItem={({ item }) => {
            const badgeStyle = getBadgeStyle(item.Invitacion);
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.idText}>JURADO-{item.Id_jurado}</Text>
                    <Text style={styles.nombreText}>
                      {item.usuario?.Nombre || item.usuario?.name || `Usuario #${item.Id_usuario}`}
                    </Text>
                    <Text style={styles.institucionText}>
                      <Ionicons name="business-outline" size={13} color="#555" /> {item.Institucion}
                    </Text>
                  </View>

                  <View style={[styles.statusBadge, badgeStyle.badge]}>
                    <Text style={[styles.statusText, { color: badgeStyle.text }]}>
                      {item.Invitacion}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoContainer}>
                  <Text style={styles.infoBadge}>
                    <Ionicons name="ribbon-outline" size={14} color="#002b45" /> Área:{' '}
                    {item.Area_participacion}
                  </Text>
                  <Text style={styles.infoBadge}>
                    <Ionicons name="extension-puzzle-outline" size={14} color="#002b45" /> Especialidad:{' '}
                    {item.Area_especializada || 'N/A'}
                  </Text>
                  <Text style={styles.infoBadge}>
                    <Ionicons name="easel-outline" size={14} color="#002b45" /> Sala Asignada:{' '}
                    {item.sala?.Nombre || (item.Id_sala ? `Sala #${item.Id_sala}` : 'Sin asignación')}
                  </Text>
                </View>

                {/* Acciones */}
                <View style={styles.actionsRow}>
                  <TouchableOpacity
                    style={[styles.btnAction, styles.btnEdit]}
                    onPress={() => {
                      router.push({
                        pathname: '/gesJurados/form' as any,
                        params: { juradoEditar: JSON.stringify(item) },
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
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#002b45', marginBottom: 15 },
  filterSection: { marginBottom: 15, gap: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#e0e0e0' },
  searchInput: { flex: 1, height: 42, marginLeft: 8 },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  filterLabel: { fontSize: 13, fontWeight: '600', color: '#444' },
  filterChip: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 20, backgroundColor: '#e0e0e0' },
  filterChipActive: { backgroundColor: '#002b45' },
  filterChipText: { fontSize: 12, color: '#333' },
  filterChipTextActive: { color: '#fff', fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  loadingText: { marginTop: 10, color: '#002b45', fontWeight: '600' },
  emptyText: { textAlign: 'center', color: '#888', marginTop: 30, fontSize: 15 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  idText: { fontSize: 11, color: '#888', fontWeight: 'bold' },
  nombreText: { fontSize: 16, fontWeight: 'bold', color: '#002b45', marginTop: 2 },
  institucionText: { fontSize: 12, color: '#555', marginTop: 2 },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  statusReady: { backgroundColor: '#d4edda' },
  statusPending: { backgroundColor: '#fff3cd' },
  statusRejected: { backgroundColor: '#f8d7da' },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  infoContainer: { marginTop: 10, gap: 4, backgroundColor: '#f9fbfd', padding: 10, borderRadius: 8 },
  infoBadge: { fontSize: 13, color: '#444' },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 12, justifyContent: 'flex-end' },
  btnAction: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, gap: 4 },
  btnEdit: { backgroundColor: '#007bff' },
  btnDelete: { backgroundColor: '#dc3545' },
  btnActionText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});