import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
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
  Nombre_usuario?: string;
  Email_usuario?: string;
  Id_sala: number | null;
  Nombre_sala?: string;
  Curriculum: string;
  Institucion: string;
  Area_participacion: string;
  Area_especializada: string;
  Invitacion: 'Aceptada' | 'Pendiente' | 'Rechazada';
}

const DATA_INICIAL: Jurado[] = [
  {
    Id_jurado: 1,
    Id_usuario: 101,
    Nombre_usuario: 'Dr. Roberto Gómez Bolaños',
    Email_usuario: 'rgomez@itssmt.edu.mx',
    Id_sala: 1,
    Nombre_sala: 'Sala 1 - Desarrollo de Software',
    Curriculum: 'https://ejemplo.com/cv/roberto_gomez.pdf',
    Institucion: 'Instituto Tecnológico Superior de San Martín Texmelucan',
    Area_participacion: 'Sistemas e Inteligencia Artificial',
    Area_especializada: 'Machine Learning y Cloud Computing',
    Invitacion: 'Aceptada',
  },
  {
    Id_jurado: 2,
    Id_usuario: 102,
    Nombre_usuario: 'Dra. Carmen López Vega',
    Email_usuario: 'clopez@buap.mx',
    Id_sala: null,
    Nombre_sala: undefined,
    Curriculum: 'https://ejemplo.com/cv/carmen_lopez.pdf',
    Institucion: 'Benemérita Universidad Autónoma de Puebla',
    Area_participacion: 'Salud y Biotecnología',
    Area_especializada: 'Bioprocesos y Bioinformática',
    Invitacion: 'Pendiente',
  },
];

export default function JuradosIndexScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ nuevoJurado?: string }>();

  const [busqueda, setBusqueda] = useState('');
  const [invitacionFiltro, setInvitacionFiltro] = useState<string>('TODOS');
  const [jurados, setJurados] = useState<Jurado[]>(DATA_INICIAL);

  // Escucha si llega un jurado creado o editado desde form.tsx
  useEffect(() => {
    if (typeof params.nuevoJurado === 'string') {
      try {
        const objetoLlegado: Jurado = JSON.parse(params.nuevoJurado);
        setJurados((prev) => {
          const existe = prev.some((j) => j.Id_jurado === objetoLlegado.Id_jurado);
          if (existe) {
            return prev.map((j) =>
              j.Id_jurado === objetoLlegado.Id_jurado ? objetoLlegado : j
            );
          }
          return [objetoLlegado, ...prev];
        });
      } catch (e) {
        console.error('Error al procesar jurado:', e);
      }
    }
  }, [params.nuevoJurado]);

  const juradosFiltrados = jurados.filter((j) => {
    const query = busqueda.toLowerCase();
    const coincideBusqueda =
      (j.Nombre_usuario && j.Nombre_usuario.toLowerCase().includes(query)) ||
      j.Institucion.toLowerCase().includes(query) ||
      j.Area_especializada.toLowerCase().includes(query);

    const coincideInvitacion =
      invitacionFiltro === 'TODOS' || j.Invitacion === invitacionFiltro;

    return coincideBusqueda && coincideInvitacion;
  });

  const handleEliminar = (jurado: Jurado) => {
    Alert.alert(
      'Confirmar Eliminación',
      `¿Deseas eliminar al jurado "${jurado.Nombre_usuario || 'ID ' + jurado.Id_jurado}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setJurados((prev) => prev.filter((item) => item.Id_jurado !== jurado.Id_jurado));
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

      {/* Listado de Tarjetas */}
      <FlatList
        data={juradosFiltrados}
        keyExtractor={(item) => item.Id_jurado.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => {
          const badgeStyle = getBadgeStyle(item.Invitacion);
          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.idText}>JURADO-{item.Id_jurado}</Text>
                  <Text style={styles.nombreText}>
                    {item.Nombre_usuario || `Usuario #${item.Id_usuario}`}
                  </Text>
                  <Text style={styles.institucionText}>
                    <Ionicons name="business-outline" size={13} color="#666" /> {item.Institucion}
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
                  {item.Area_especializada}
                </Text>
                <Text style={styles.infoBadge}>
                  <Ionicons name="easel-outline" size={14} color="#002b45" /> Sala Asignada:{' '}
                  {item.Nombre_sala ? item.Nombre_sala : 'Sin asignación'}
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