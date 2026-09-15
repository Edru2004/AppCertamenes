import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
    Alert,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface Categoria {
  id: string;
  nombre: string;
  certamenId: string;
  certamenNombre: string;
  desafiosCount: number;
  equiposCount: number;
  rubricaConfigurada: boolean;
}

const DATA_INICIAL: Categoria[] = [
  {
    id: 'CAT-001',
    nombre: 'Sistemas e Inteligencia Artificial',
    certamenId: 'CERT-2026',
    certamenNombre: 'Certamen Nacional de Innovación 2026',
    desafiosCount: 4,
    equiposCount: 12,
    rubricaConfigurada: true,
  },
  {
    id: 'CAT-002',
    nombre: 'Salud y Biotecnología',
    certamenId: 'CERT-2026',
    certamenNombre: 'Certamen Nacional de Innovación 2026',
    desafiosCount: 2,
    equiposCount: 5,
    rubricaConfigurada: false,
  },
  {
    id: 'CAT-003',
    nombre: 'Innovación Social y Agroindustria',
    certamenId: 'CERT-2025',
    certamenNombre: 'Certamen Regional 2025',
    desafiosCount: 3,
    equiposCount: 0,
    rubricaConfigurada: true,
  },
];

export default function CategoriasIndexScreen() {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState('');
  const [certamenFiltro, setCertamenFiltro] = useState('TODOS');
  const [categorias, setCategorias] = useState<Categoria[]>(DATA_INICIAL);

  const categoriasFiltradas = categorias.filter((cat) => {
    const coincideBusqueda = cat.nombre
      .toLowerCase()
      .includes(busqueda.toLowerCase());
    const coincideCertamen =
      certamenFiltro === 'TODOS' || cat.certamenId === certamenFiltro;
    return coincideBusqueda && coincideCertamen;
  });

  const handleEliminar = (cat: Categoria) => {
    if (cat.equiposCount > 0) {
      Alert.alert(
        'Acción No Permitida',
        `No se puede eliminar la categoría "${cat.nombre}" porque tiene ${cat.equiposCount} equipo(s) inscritos.`,
        [{ text: 'Entendido' }]
      );
      return;
    }

    Alert.alert(
      'Confirmar Eliminación',
      `¿Deseas eliminar la categoría "${cat.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setCategorias((prev) => prev.filter((item) => item.id !== cat.id));
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Panel de Gestión de Categorías</Text>

      <View style={styles.filterSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre..."
            value={busqueda}
            onChangeText={setBusqueda}
          />
        </View>

        <View style={styles.certamenFilterRow}>
          <Text style={styles.filterLabel}>Certamen:</Text>
          <TouchableOpacity
            style={[
              styles.filterChip,
              certamenFiltro === 'TODOS' && styles.filterChipActive,
            ]}
            onPress={() => setCertamenFiltro('TODOS')}
          >
            <Text
              style={[
                styles.filterChipText,
                certamenFiltro === 'TODOS' && styles.filterChipTextActive,
              ]}
            >
              Todos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterChip,
              certamenFiltro === 'CERT-2026' && styles.filterChipActive,
            ]}
            onPress={() => setCertamenFiltro('CERT-2026')}
          >
            <Text
              style={[
                styles.filterChipText,
                certamenFiltro === 'CERT-2026' && styles.filterChipTextActive,
              ]}
            >
              2026
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        data={categoriasFiltradas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View>
                <Text style={styles.idText}>{item.id}</Text>
                <Text style={styles.nombreText}>{item.nombre}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  item.rubricaConfigurada
                    ? styles.statusReady
                    : styles.statusPending,
                ]}
              >
                <Text style={styles.statusText}>
                  {item.rubricaConfigurada ? 'Rúbrica OK' : 'Sin Rúbrica'}
                </Text>
              </View>
            </View>

            <Text style={styles.certamenSubtext}>{item.certamenNombre}</Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoBadge}>
                <Ionicons name="bulb-outline" size={14} /> Desafíos: {item.desafiosCount}
              </Text>
              <Text style={styles.infoBadge}>
                <Ionicons name="people-outline" size={14} /> Equipos: {item.equiposCount}
              </Text>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.btnAction, styles.btnEdit]}
                onPress={() => router.push('/categorias/form' as any)}
              >
                <Ionicons name="create-outline" size={16} color="#fff" />
                <Text style={styles.btnActionText}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnAction, styles.btnRubrica]}
                onPress={() => router.push('/categorias/rubricas' as any)}
              >
                <Ionicons name="checkbox-outline" size={16} color="#fff" />
                <Text style={styles.btnActionText}>Rúbrica</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#002b45', marginBottom: 15 },
  filterSection: { marginBottom: 15, gap: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#e0e0e0' },
  searchInput: { flex: 1, height: 42, marginLeft: 8 },
  certamenFilterRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterLabel: { fontSize: 14, fontWeight: '600', color: '#444' },
  filterChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: '#e0e0e0' },
  filterChipActive: { backgroundColor: '#002b45' },
  filterChipText: { fontSize: 12, color: '#333' },
  filterChipTextActive: { color: '#fff', fontWeight: 'bold' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  idText: { fontSize: 11, color: '#888', fontWeight: 'bold' },
  nombreText: { fontSize: 16, fontWeight: 'bold', color: '#002b45' },
  certamenSubtext: { fontSize: 12, color: '#666', marginTop: 4 },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  statusReady: { backgroundColor: '#d4edda' },
  statusPending: { backgroundColor: '#fff3cd' },
  statusText: { fontSize: 11, fontWeight: 'bold', color: '#155724' },
  infoRow: { flexDirection: 'row', gap: 15, marginTop: 10 },
  infoBadge: { fontSize: 12, color: '#555' },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 15, justifyContent: 'flex-end' },
  btnAction: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, gap: 4 },
  btnEdit: { backgroundColor: '#007bff' },
  btnRubrica: { backgroundColor: '#28a745' },
  btnDelete: { backgroundColor: '#dc3545' },
  btnActionText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
});