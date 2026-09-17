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

interface Certamen {
  Id_certamen: number;
  Nombre: string;
  Fecha_evento: string;
  Estado: 'Activo' | 'Inactivo';
}

const DATA_INICIAL: Certamen[] = [
  {
    Id_certamen: 1,
    Nombre: 'Certamen Nacional de Innovación 2026',
    Fecha_evento: '2026-10-15',
    Estado: 'Activo',
  },
  {
    Id_certamen: 2,
    Nombre: 'Rally Latinoamericano de Innovación',
    Fecha_evento: '2026-11-04',
    Estado: 'Activo',
  },
  {
    Id_certamen: 3,
    Nombre: 'Certamen Regional 2025',
    Fecha_evento: '2025-09-20',
    Estado: 'Inactivo',
  },
];

export default function CertamenesIndexScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ nuevoEvento?: string }>();
  const [busqueda, setBusqueda] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<'TODOS' | 'Activo' | 'Inactivo'>('TODOS');
  const [certamenes, setCertamenes] = useState<Certamen[]>(DATA_INICIAL);

  // Escucha si llega un evento enviado desde form.tsx
 useEffect(() => {
    if (typeof params.nuevoEvento === 'string') {
      try {
        const nuevoObj: Certamen = JSON.parse(params.nuevoEvento);
        setCertamenes((prev) => {
          if (prev.some((c) => c.Id_certamen === nuevoObj.Id_certamen)) {
            return prev;
          }
          return [nuevoObj, ...prev];
        });
      } catch (e) {
        console.error('Error al procesar el certamen:', e);
      }
    }
  }, [params.nuevoEvento]);

  const certamenesFiltrados = certamenes.filter((item) => {
    const coincideBusqueda = item.Nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideEstado = estadoFiltro === 'TODOS' || item.Estado === estadoFiltro;
    return coincideBusqueda && coincideEstado;
  });

  const handleToggleEstado = (certamen: Certamen) => {
    const nuevoEstado = certamen.Estado === 'Activo' ? 'Inactivo' : 'Activo';
    setCertamenes((prev) =>
      prev.map((c) =>
        c.Id_certamen === certamen.Id_certamen ? { ...c, Estado: nuevoEstado } : c
      )
    );
  };

  const handleEliminar = (certamen: Certamen) => {
    if (certamen.Estado === 'Activo') {
      Alert.alert(
        'Acción No Permitida',
        `No se puede eliminar el certamen "${certamen.Nombre}" mientras esté Activo. Desactívalo primero.`,
        [{ text: 'Entendido' }]
      );
      return;
    }

    Alert.alert(
      'Confirmar Eliminación',
      `¿Deseas eliminar el certamen "${certamen.Nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setCertamenes((prev) => prev.filter((item) => item.Id_certamen !== certamen.Id_certamen));
          },
        },
      ]
    );
  };
  

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Panel de Gestión de Certámenes</Text>

      {/* Filtros de Búsqueda y Estado */}
      <View style={styles.filterSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar certamen por nombre..."
            value={busqueda}
            onChangeText={setBusqueda}
          />
        </View>

        <View style={styles.certamenFilterRow}>
          <Text style={styles.filterLabel}>Estado:</Text>
          {(['TODOS', 'Activo', 'Inactivo'] as const).map((estado) => (
            <TouchableOpacity
              key={estado}
              style={[
                styles.filterChip,
                estadoFiltro === estado && styles.filterChipActive,
              ]}
              onPress={() => setEstadoFiltro(estado)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  estadoFiltro === estado && styles.filterChipTextActive,
                ]}
              >
                {estado}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Lista de Tarjetas */}
      <FlatList
        data={certamenesFiltrados}
        keyExtractor={(item) => item.Id_certamen.toString()}
        contentContainerStyle={{ paddingBottom: 80 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.idText}>CERT-{item.Id_certamen}</Text>
                <Text style={styles.nombreText}>{item.Nombre}</Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  item.Estado === 'Activo' ? styles.statusReady : styles.statusPending,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    { color: item.Estado === 'Activo' ? '#155724' : '#721c24' },
                  ]}
                >
                  {item.Estado}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoBadge}>
                <Ionicons name="calendar-outline" size={14} /> Fecha: {item.Fecha_evento}
              </Text>
            </View>

            {/* Acciones del ítem */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.btnAction, styles.btnEdit]}
                onPress={() => router.push('/registroEvento/form' as any)}
              >
                <Ionicons name="create-outline" size={16} color="#fff" />
                <Text style={styles.btnActionText}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.btnAction,
                  item.Estado === 'Activo' ? styles.btnToggleInactive : styles.btnToggleActive,
                ]}
                onPress={() => handleToggleEstado(item)}
              >
                <Ionicons
                  name={item.Estado === 'Activo' ? 'pause-circle-outline' : 'play-circle-outline'}
                  size={16}
                  color="#fff"
                />
                <Text style={styles.btnActionText}>
                  {item.Estado === 'Activo' ? 'Desactivar' : 'Activar'}
                </Text>
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
  nombreText: { fontSize: 16, fontWeight: 'bold', color: '#002b45', marginTop: 2 },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6 },
  statusReady: { backgroundColor: '#d4edda' },
  statusPending: { backgroundColor: '#f8d7da' },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  infoRow: { flexDirection: 'row', gap: 15, marginTop: 10 },
  infoBadge: { fontSize: 13, color: '#555' },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 15, justifyContent: 'flex-end' },
  btnAction: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 6, gap: 4 },
  btnEdit: { backgroundColor: '#007bff' },
  btnToggleActive: { backgroundColor: '#28a745' },
  btnToggleInactive: { backgroundColor: '#6c757d' },
  btnDelete: { backgroundColor: '#dc3545' },
  btnActionText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  /* Barra inferior (Tabs) */
  tabBar: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60, backgroundColor: '#fff', borderTopWidth: 1, borderColor: '#e0e0e0', flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  tabItem: { alignItems: 'center', justifyContent: 'center' },
  tabLabel: { fontSize: 11, color: '#666', marginTop: 2 },
  tabLabelActive: { color: '#002b45', fontWeight: 'bold' },
});