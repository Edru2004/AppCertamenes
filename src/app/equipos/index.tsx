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

export interface Equipo {
  Id_equipo: number;
  Id_desafio: number;
  Nombre_desafio?: string;
  Id_categCertamen: number;
  Nombre_categoria?: string;
  Id_sala: number | null;
  Nombre_sala?: string;
  Nombre: string;
  Video?: string;
  Reporte?: string;
}

const DATA_INICIAL: Equipo[] = [
  {
    Id_equipo: 1,
    Id_desafio: 10,
    Nombre_desafio: 'Desafío Innovación Móvil',
    Id_categCertamen: 2,
    Nombre_categoria: 'Desarrollo de Software',
    Id_sala: 1,
    Nombre_sala: 'Sala 1 - Principal',
    Nombre: 'Alpha Tech',
    Video: 'https://youtube.com/watch?v=demo1',
    Reporte: 'https://drive.google.com/file/d/reporte1.pdf',
  },
  {
    Id_equipo: 2,
    Id_desafio: 12,
    Nombre_desafio: 'Optimización Agroindustrial',
    Id_categCertamen: 3,
    Nombre_categoria: 'Biotecnología',
    Id_sala: null,
    Nombre_sala: undefined,
    Nombre: 'BioInnovadores',
    Video: '',
    Reporte: 'https://drive.google.com/file/d/reporte2.pdf',
  },
];

export default function EquiposIndexScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ nuevoEquipo?: string }>();

  const [busqueda, setBusqueda] = useState('');
  const [equipos, setEquipos] = useState<Equipo[]>(DATA_INICIAL);

  useEffect(() => {
    if (typeof params.nuevoEquipo === 'string') {
      try {
        const objetoLlegado: Equipo = JSON.parse(params.nuevoEquipo);
        setEquipos((prev) => {
          const existe = prev.some((e) => e.Id_equipo === objetoLlegado.Id_equipo);
          if (existe) {
            return prev.map((e) =>
              e.Id_equipo === objetoLlegado.Id_equipo ? objetoLlegado : e
            );
          }
          return [objetoLlegado, ...prev];
        });
      } catch (e) {
        console.error('Error al procesar equipo:', e);
      }
    }
  }, [params.nuevoEquipo]);

  const equiposFiltrados = equipos.filter((e) => {
    const query = busqueda.toLowerCase();
    return (
      e.Nombre.toLowerCase().includes(query) ||
      (e.Nombre_desafio && e.Nombre_desafio.toLowerCase().includes(query)) ||
      (e.Nombre_categoria && e.Nombre_categoria.toLowerCase().includes(query))
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
          onPress: () => {
            setEquipos((prev) => prev.filter((item) => item.Id_equipo !== equipo.Id_equipo));
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

      <FlatList
        data={equiposFiltrados}
        keyExtractor={(item) => item.Id_equipo.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={styles.idText}>EQUIPO-{item.Id_equipo}</Text>
                <Text style={styles.nombreText}>{item.Nombre}</Text>
              </View>
              <View style={[styles.salaBadge, item.Id_sala ? styles.salaAsignada : styles.sinSala]}>
                <Text style={styles.salaText}>
                  {item.Nombre_sala ? item.Nombre_sala : 'Sin Sala'}
                </Text>
              </View>
            </View>

            <View style={styles.infoContainer}>
              <Text style={styles.infoBadge}>
                <Ionicons name="trophy-outline" size={14} color="#002b45" /> Desafío:{' '}
                {item.Nombre_desafio || `ID #${item.Id_desafio}`}
              </Text>
              <Text style={styles.infoBadge}>
                <Ionicons name="pricetag-outline" size={14} color="#002b45" /> Categoría:{' '}
                {item.Nombre_categoria || `ID #${item.Id_categCertamen}`}
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
                    // 🟢 Limpiamos la ruta primero por si había datos previos y enviamos el nuevo objeto
                    router.setParams({ equipoEditar: undefined });
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#002b45', marginBottom: 15 },
  filterSection: { marginBottom: 15 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#e0e0e0' },
  searchInput: { flex: 1, height: 42, marginLeft: 8 },
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