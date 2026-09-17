import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface DesafioItem {
  id_desafio: string;
  id_certamen: string;
  certamenNombre: string;
  nombre: string;
  descripcion: string;
  equiposCount: number;
  hasCategorieRubrice: boolean;
}

const DATA_DESAFIOS: DesafioItem[] = [
  {
    id_desafio: 'DES-101',
    id_certamen: 'CERT-2026',
    certamenNombre: 'Certamen Nacional de Innovación 2026',
    nombre: 'HackaHer: Tecnología para la Inclusión',
    descripcion: 'Desarrollo de prototipos para reducir la brecha de género en carreras STEM.',
    equiposCount: 6,
    hasCategorieRubrice: true,
  },
  {
    id_desafio: 'DES-102',
    id_certamen: 'CERT-2026',
    certamenNombre: 'Certamen Nacional de Innovación 2026',
    nombre: 'Semiconductores y Electromovilidad',
    descripcion: 'Optimización de controladores lógicos para estaciones de carga rápida.',
    equiposCount: 3,
    hasCategorieRubrice: true,
  },
  {
    id_desafio: 'DES-103',
    id_certamen: 'CERT-2025',
    certamenNombre: 'Certamen Regional 2025',
    nombre: 'Agrotech Sostenible',
    descripcion: 'Monitoreo de cultivos mediante sensores IoT de bajo costo.',
    equiposCount: 0,
    hasCategorieRubrice: false,
  },
];

export default function DesafiosIndexScreen() {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState('');
  const [certamenFiltro, setCertamenFiltro] = useState('TODOS');
  const [desafios, setDesafios] = useState<DesafioItem[]>(DATA_DESAFIOS);

  const listaFiltrada = desafios.filter((item) => {
    const coincideNombre = item.nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideCertamen = certamenFiltro === 'TODOS' || item.id_certamen === certamenFiltro;
    return coincideNombre && coincideCertamen;
  });

  const handleEliminar = (desafio: DesafioItem) => {
    // Regla de Negocio: Integridad Referencial con Equipo
    if (desafio.equiposCount > 0) {
      Alert.alert(
        'Eliminación Restringida',
        `No es posible eliminar "${desafio.nombre}" debido a que existen ${desafio.equiposCount} equipo(s) vinculados mediante Id_desafio.`,
        [{ text: 'Entendido' }]
      );
      return;
    }

    Alert.alert(
      'Confirmar Eliminación',
      `¿Deseas eliminar el desafío "${desafio.nombre}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            setDesafios((prev) => prev.filter((d) => d.id_desafio !== desafio.id_desafio));
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Panel de Gestión de Desafíos</Text>

      {/* Buscador y Filtro Certamen */}
      <View style={styles.filterSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre de desafío..."
            value={busqueda}
            onChangeText={setBusqueda}
          />
        </View>

        <View style={styles.certamenFilterRow}>
          <Text style={styles.filterLabel}>Certamen:</Text>
          <TouchableOpacity
            style={[styles.filterChip, certamenFiltro === 'TODOS' && styles.filterChipActive]}
            onPress={() => setCertamenFiltro('TODOS')}
          >
            <Text style={[styles.filterChipText, certamenFiltro === 'TODOS' && styles.filterChipTextActive]}>
              Todos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, certamenFiltro === 'CERT-2026' && styles.filterChipActive]}
            onPress={() => setCertamenFiltro('CERT-2026')}
          >
            <Text style={[styles.filterChipText, certamenFiltro === 'CERT-2026' && styles.filterChipTextActive]}>
              2026
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabla / Lista de Desafíos */}
      <FlatList
        data={listaFiltrada}
        keyExtractor={(item) => item.id_desafio}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.idText}>{item.id_desafio} • {item.certamenNombre}</Text>
                <Text style={styles.nombreText}>{item.nombre}</Text>
              </View>
              <View style={[styles.statusBadge, item.hasCategorieRubrice ? styles.statusReady : styles.statusPending]}>
                <Text style={styles.statusText}>
                  {item.hasCategorieRubrice ? 'Rúbrica 1:1' : 'Sin Rúbrica'}
                </Text>
              </View>
            </View>

            <Text style={styles.descripcionText} numberOfLines={2}>
              {item.descripcion}
            </Text>

            <View style={styles.infoRow}>
              <Text style={styles.infoBadge}>
                <Ionicons name="people-outline" size={14} /> Equipos Asignados: {item.equiposCount}
              </Text>
            </View>

            {/* Acciones */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.btnAction, styles.btnEdit]}
                onPress={() => router.push('/desafios/form' as any)}
              >
                <Ionicons name="create-outline" size={15} color="#fff" />
                <Text style={styles.btnActionText}>Editar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnAction, styles.btnRubrica]}
                onPress={() => router.push('/desafios/rubricas' as any)}
              >
                <Ionicons name="checkbox-outline" size={15} color="#fff" />
                <Text style={styles.btnActionText}>Rúbrica</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnAction, styles.btnEquipos]}
                onPress={() => router.push('/desafios/equipos' as any)}
              >
                <Ionicons name="eye-outline" size={15} color="#fff" />
                <Text style={styles.btnActionText}>Equipos</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btnAction, styles.btnDelete]}
                onPress={() => handleEliminar(item)}
              >
                <Ionicons name="trash-outline" size={15} color="#fff" />
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
  descripcionText: { fontSize: 13, color: '#555', marginTop: 8 },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 8, borderRadius: 6, marginLeft: 8 },
  statusReady: { backgroundColor: '#d4edda' },
  statusPending: { backgroundColor: '#fff3cd' },
  statusText: { fontSize: 10, fontWeight: 'bold', color: '#155724' },
  infoRow: { marginTop: 10 },
  infoBadge: { fontSize: 12, color: '#002b45', fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: 6, marginTop: 15, justifyContent: 'flex-end', flexWrap: 'wrap' },
  btnAction: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6, gap: 4 },
  btnEdit: { backgroundColor: '#007bff' },
  btnRubrica: { backgroundColor: '#28a745' },
  btnEquipos: { backgroundColor: '#17a2b8' },
  btnDelete: { backgroundColor: '#dc3545' },
  btnActionText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
});