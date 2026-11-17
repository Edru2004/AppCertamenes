// @ts-nocheck
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { getEquipos, getFotosEquipo } from '../../../services/api';

const extraerLista = (r: any): any[] =>
  Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : Array.isArray(r?.data?.data) ? r.data.data : [];

const idEquipoDe = (x: any) => Number(x?.Id_equipo ?? x?.id_equipo ?? x?.id);

export default function FotosIndexScreen() {
  const router = useRouter();
  const [equipos, setEquipos] = useState<any[]>([]);
  const [equipoSel, setEquipoSel] = useState<any>(null);
  const [fotos, setFotos] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoFotos, setCargandoFotos] = useState(false);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const cargarFotosDeEquipo = async (idEq: number) => {
    setCargandoFotos(true);
    try {
      const resp = await getFotosEquipo(idEq);
      setFotos(extraerLista(resp));
    } catch {
      setFotos([]);
    } finally {
      setCargandoFotos(false);
    }
  };

  const cargarInicial = useCallback(async () => {
    setCargando(true);
    setErrorMsg('');
    try {
      const userRaw = await AsyncStorage.getItem('userData');
      const u = userRaw ? JSON.parse(userRaw) : null;
      const idLider = Number(u?.Id_usuario ?? u?.id_usuario ?? u?.id);

      const rEquipos = await getEquipos(undefined, Number.isFinite(idLider) ? idLider : undefined);
      const lista = extraerLista(rEquipos);
      setEquipos(lista);

      const actual = equipoSel
        ? lista.find((e) => idEquipoDe(e) === idEquipoDe(equipoSel)) ?? lista[0]
        : lista[0];

      setEquipoSel(actual ?? null);
      if (actual) {
        await cargarFotosDeEquipo(idEquipoDe(actual));
      } else {
        setFotos([]);
      }
    } catch (e: any) {
      setErrorMsg(e?.message || 'No se pudieron cargar los equipos.');
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargarInicial();
    }, [cargarInicial])
  );

  const seleccionarEquipo = async (eq: any) => {
    setEquipoSel(eq);
    setSelectorVisible(false);
    await cargarFotosDeEquipo(idEquipoDe(eq));
  };

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="images-outline" size={27} color="#fff" />
          </View>
          <Text style={styles.title}>Evidencias fotográficas</Text>
          <Text style={styles.subtitle}>Consulta y sube las fotos de tu equipo</Text>
        </View>

        <Text style={styles.sectionTitle}>Equipo seleccionado</Text>

        {cargando ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#002b45" />
            <Text style={styles.loadingText}>Cargando equipos...</Text>
          </View>
        ) : errorMsg ? (
          <View style={styles.emptyCard}>
            <Ionicons name="alert-circle-outline" size={32} color="#dc2626" />
            <Text style={styles.emptyTitle}>Error de conexión / sesión</Text>
            <Text style={styles.emptyText}>{errorMsg}</Text>
          </View>
        ) : equipoSel ? (
          <TouchableOpacity
            style={styles.equipoCard}
            onPress={() => setSelectorVisible(true)}
            activeOpacity={0.85}
          >
            <View style={styles.equipoIconBox}>
              <Ionicons name="people-outline" size={26} color="#0369a1" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.equipoNombre}>{equipoSel.Nombre ?? equipoSel.nombre}</Text>
              <Text style={styles.equipoAyuda}>Toca para cambiar de equipo</Text>
            </View>
            <Ionicons name="chevron-down-circle" size={26} color="#64748b" />
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No tienes equipos registrados todavía.</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.uploadButton, !equipoSel && { opacity: 0.5 }]}
          disabled={!equipoSel}
          onPress={() =>
            router.push({
              pathname: '/(lider)/fotos/form' as any,
              params: {
                idEquipo: String(idEquipoDe(equipoSel)),
                nombreEquipo: String(equipoSel?.Nombre ?? equipoSel?.nombre ?? ''),
              },
            })
          }
        >
          <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
          <Text style={styles.uploadButtonText}>Subir nuevas fotos</Text>
        </TouchableOpacity>

        <Text style={styles.listTitle}>
          Fotos subidas <Text style={styles.count}>{fotos.length}</Text>
        </Text>

        {cargandoFotos ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#002b45" />
          </View>
        ) : fotos.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="image-outline" size={34} color="#94a3b8" />
            <Text style={styles.emptyTitle}>Sin evidencias aún</Text>
            <Text style={styles.emptyText}>Presiona "Subir nuevas fotos" para agregar imágenes de este equipo.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {fotos.map((foto, idx) => {
              const uri = foto?.url ?? foto?.Url ?? foto?.ruta ?? foto?.Ruta ?? foto?.Foto;
              return (
                <View key={foto?.Id_foto ?? foto?.id ?? `foto-${idx}`} style={styles.fotoCard}>
                  <Image source={{ uri }} style={styles.fotoImg} resizeMode="cover" />
                  {foto?.Descripcion || foto?.descripcion ? (
                    <Text style={styles.fotoDesc} numberOfLines={2}>
                      {foto.Descripcion ?? foto.descripcion}
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <Modal visible={selectorVisible} transparent animationType="fade" onRequestClose={() => setSelectorVisible(false)}>
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar equipo</Text>
              <TouchableOpacity onPress={() => setSelectorVisible(false)}>
                <Ionicons name="close" size={24} color="#334155" />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 340 }}>
              {equipos.map((eq) => {
                const activo = idEquipoDe(eq) === idEquipoDe(equipoSel);
                return (
                  <TouchableOpacity
                    key={idEquipoDe(eq)}
                    style={[styles.opcionEquipo, activo && styles.opcionActiva]}
                    onPress={() => void seleccionarEquipo(eq)}
                  >
                    <Ionicons name="people-outline" size={20} color={activo ? '#15803d' : '#0369a1'} />
                    <Text style={[styles.opcionNombre, activo && { color: '#166534' }]}>
                      {eq.Nombre ?? eq.nombre}
                    </Text>
                    {activo && <Ionicons name="checkmark-circle" size={20} color="#15803d" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f1f5f9' },
  container: { padding: 16, paddingBottom: 40 },
  header: { paddingTop: 12, alignItems: 'center', marginBottom: 14 },
  headerIcon: { width: 56, height: 56, borderRadius: 17, backgroundColor: '#002b45', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '800', color: '#002b45', marginTop: 9 },
  subtitle: { fontSize: 12, color: '#64748b', marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#002b45', marginTop: 8, marginBottom: 8 },
  equipoCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#cbd5e1' },
  equipoIconBox: { width: 50, height: 50, borderRadius: 12, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center' },
  equipoNombre: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  equipoAyuda: { fontSize: 12, color: '#0e7490', fontWeight: '700', marginTop: 4 },
  uploadButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#86a327', padding: 13, borderRadius: 10, marginTop: 16 },
  uploadButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  listTitle: { fontSize: 16, fontWeight: '800', color: '#002b45', marginTop: 20, marginBottom: 10 },
  count: { fontSize: 13, color: '#0369a1' },
  center: { alignItems: 'center', padding: 28 },
  loadingText: { marginTop: 8, color: '#64748b' },
  emptyCard: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 24, marginTop: 6 },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: '#334155', marginTop: 8 },
  emptyText: { fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 4 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  fotoCard: { width: '48%', backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' },
  fotoImg: { width: '100%', height: 130, backgroundColor: '#e2e8f0' },
  fotoDesc: { padding: 8, fontSize: 12, color: '#334155' },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.48)', justifyContent: 'center', padding: 18 },
  modalCard: { backgroundColor: '#fff', borderRadius: 18, padding: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 10, marginBottom: 8 },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  opcionEquipo: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 10, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  opcionActiva: { backgroundColor: '#ecfdf5' },
  opcionNombre: { flex: 1, fontSize: 14, fontWeight: '700', color: '#0f172a' },
});