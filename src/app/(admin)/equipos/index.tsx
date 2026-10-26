import { eliminarEquipo, getCertamenes, getEquipos } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Item = Record<string, any>;
type ResultState = { visible: boolean; success: boolean; title: string; message: string };

export interface Equipo extends Item {
  Id_equipo: number;
  Id_desafio: number;
  Id_categCertamen: number;
  Id_sala: number | null;
  Nombre: string;
}

const readList = (value: any): Item[] => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
};
const getId = (item: Item) => Number(item.Id_certamen ?? item.Id_Certamen ?? item.id_certamen ?? item.idCertamen ?? item.id);
const getEquipoId = (item: Item) => Number(item.Id_equipo ?? item.id_equipo ?? item.id);
const getNombre = (item: Item) => String(item.Nombre ?? item.nombre ?? 'Sin nombre');
const getTipo = (item?: Item | null) => String(item?.Tipo ?? item?.tipo ?? '').toUpperCase();
const getCertamenNombre = (item?: Item | null) => String(item?.Nombre ?? item?.nombre ?? 'Certamen sin nombre');
const paramNumber = (value: string | string[] | undefined) => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

export default function EquiposIndexScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id_certamen?: string | string[] }>();
  const [certamenes, setCertamenes] = useState<Item[]>([]);
  const [idCertamen, setIdCertamen] = useState<number | null>(paramNumber(params.id_certamen));
  const [modalCertamenVisible, setModalCertamenVisible] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [equipoEliminar, setEquipoEliminar] = useState<Equipo | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [resultado, setResultado] = useState<ResultState>({ visible: false, success: false, title: '', message: '' });

  const cargarDatos = useCallback(async () => {
    let activo = true;
    setCargando(true);
    try {
      const respuestaCertamenes = await getCertamenes();
      const listaCertamenes = readList(respuestaCertamenes);
      setCertamenes(listaCertamenes);

      const solicitado = paramNumber(params.id_certamen);
      const idElegido =
        (solicitado && listaCertamenes.some((c) => getId(c) === solicitado) ? solicitado : null) ??
        (idCertamen && listaCertamenes.some((c) => getId(c) === idCertamen) ? idCertamen : null) ??
        (listaCertamenes.length ? getId(listaCertamenes[0]) : null);

      setIdCertamen(idElegido);
      if (!idElegido) {
        setEquipos([]);
        return;
      }
      const respuestaEquipos = await getEquipos(idElegido);
      if (activo) setEquipos(readList(respuestaEquipos) as Equipo[]);
    } catch (error: any) {
      if (activo) {
        setResultado({
          visible: true,
          success: false,
          title: 'Error al cargar datos',
          message: error?.message || 'No se pudieron cargar los certámenes y equipos. Verifica la conexión con Laravel.',
        });
        setEquipos([]);
      }
    } finally {
      if (activo) setCargando(false);
    }
    return () => { activo = false; };
  }, [params.id_certamen, idCertamen]);

  useFocusEffect(
    useCallback(() => {
      void cargarDatos();
      return undefined;
    }, [cargarDatos])
  );

  const elegirCertamen = (item: Item) => {
    const nuevoId = getId(item);
    if (!Number.isFinite(nuevoId)) return;
    setIdCertamen(nuevoId);
    setBusqueda('');
    setModalCertamenVisible(false);
  };

  const certamenSeleccionado = certamenes.find((item) => getId(item) === idCertamen) ?? null;

  const equiposFiltrados = useMemo(() => {
    const query = busqueda.trim().toLocaleLowerCase();
    if (!query) return equipos;
    return equipos.filter((equipo) => {
      const nombreEquipo = getNombre(equipo).toLocaleLowerCase();
      const nombreDesafio = String(equipo.desafio?.Nombre ?? equipo.desafio?.nombre ?? '').toLocaleLowerCase();
      const nombreCategoria = String(equipo.categoriaCertamen?.Nombre ?? equipo.categoriaCertamen?.nombre ?? equipo.categoria_certamen?.Nombre ?? equipo.categoria_certamen?.nombre ?? '').toLocaleLowerCase();
      const nombreSala = String(equipo.sala?.Nombre ?? equipo.sala?.nombre ?? '').toLocaleLowerCase();
      return nombreEquipo.includes(query) || nombreDesafio.includes(query) || nombreCategoria.includes(query) || nombreSala.includes(query);
    });
  }, [equipos, busqueda]);

  const confirmarEliminacion = async () => {
    if (!equipoEliminar) return;
    const equipo = equipoEliminar;
    setEquipoEliminar(null);
    try {
      setEliminando(true);
      await eliminarEquipo(getEquipoId(equipo));
      setEquipos((actuales) => actuales.filter((item) => getEquipoId(item) !== getEquipoId(equipo)));
      setResultado({ visible: true, success: true, title: '¡Equipo eliminado!', message: `El equipo "${getNombre(equipo)}" se eliminó correctamente.` });
    } catch (error: any) {
      setResultado({ visible: true, success: false, title: 'No se pudo eliminar', message: error?.message || 'No se pudo eliminar el equipo. Comprueba si tiene registros relacionados y revisa la API.' });
    } finally {
      setEliminando(false);
    }
  };

  const cerrarResultado = () => setResultado((actual) => ({ ...actual, visible: false }));
  const abrirNuevo = () => {
    if (!idCertamen) {
      setResultado({ visible: true, success: false, title: 'Selecciona un certamen', message: 'Primero registra o selecciona el certamen al que pertenecerá el equipo.' });
      return;
    }
    router.navigate({ pathname: '/equipos/form' as any, params: { id_certamen: String(idCertamen) } });
  };
  const abrirEdicion = (item: Equipo) => {
    const idRelacionado = Number(item.desafio?.Id_certamen ?? item.categoriaCertamen?.Id_Certamen ?? item.categoria_certamen?.Id_Certamen ?? idCertamen);
    router.navigate({ pathname: '/equipos/form' as any, params: { equipoEditar: JSON.stringify(item), id_certamen: String(idRelacionado || idCertamen || '') } });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>Panel de Gestión de Equipos</Text>

      <Text style={styles.label}>Certamen activo</Text>
      <TouchableOpacity style={styles.certamenSelector} onPress={() => setModalCertamenVisible(true)} disabled={certamenes.length === 0}>
        <View style={styles.certamenIcon}><Ionicons name="trophy-outline" size={20} color="#002b45" /></View>
        <View style={styles.certamenInfo}>
          <Text style={styles.certamenName}>{certamenSeleccionado ? getCertamenNombre(certamenSeleccionado) : 'No hay certámenes registrados'}</Text>
          <Text style={styles.certamenType}>{certamenSeleccionado ? (getTipo(certamenSeleccionado) === 'INNOVATEC' ? 'InnovaTecNM' : getTipo(certamenSeleccionado) === 'RALLY' ? 'Rally' : getTipo(certamenSeleccionado)) : 'Registra un certamen para continuar'}</Text>
        </View>
        <Ionicons name="chevron-down" size={20} color="#64748b" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.btnNuevo} onPress={abrirNuevo} disabled={!idCertamen}>
        <Ionicons name="add-circle-outline" size={20} color="#fff" />
        <Text style={styles.btnNuevoText}>Nuevo equipo</Text>
      </TouchableOpacity>

      <View style={styles.filterSection}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, desafío, categoría o sala..."
            placeholderTextColor="#94a3b8"
            value={busqueda}
            onChangeText={setBusqueda}
            returnKeyType="search"
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda('')} accessibilityLabel="Limpiar búsqueda">
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.countText}>{equiposFiltrados.length} equipo(s)</Text>
      </View>

      {cargando ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#002b45" />
          <Text style={styles.loadingText}>Cargando equipos...</Text>
        </View>
      ) : (
        <FlatList
          data={equiposFiltrados}
          keyExtractor={(item, index) => String(getEquipoId(item) || index)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.emptyText}>{busqueda.trim() ? 'No hay equipos que coincidan con la búsqueda.' : `No hay equipos registrados en ${certamenSeleccionado ? getCertamenNombre(certamenSeleccionado) : 'este certamen'}.`}</Text>}
          renderItem={({ item }) => {
            const id = getEquipoId(item);
            const nombreEquipo = getNombre(item);
            const idSala = item.Id_sala ?? item.idSala ?? item.id_sala ?? null;
            const salaNombre = item.sala?.Nombre ?? item.sala?.nombre ?? (idSala ? `Sala #${idSala}` : 'Sin Sala');
            const desafioNombre = item.desafio?.Nombre ?? item.desafio?.nombre ?? `ID #${item.Id_desafio ?? item.id_desafio ?? '?'}`;
            const categoriaNombre = item.categoriaCertamen?.Nombre ?? item.categoriaCertamen?.nombre ?? item.categoria_certamen?.Nombre ?? item.categoria_certamen?.nombre ?? `ID #${item.Id_categCertamen ?? item.id_categCertamen ?? '?'}`;
            const video = item.Video ?? item.video;
            const reporte = item.Reporte ?? item.reporte;
            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.titleColumn}>
                    <Text style={styles.idText}>EQUIPO-{id}</Text>
                    <Text style={styles.nombreText}>{nombreEquipo}</Text>
                  </View>
                  <View style={[styles.salaBadge, idSala ? styles.salaAsignada : styles.sinSala]}>
                    <Text style={styles.salaText}>{salaNombre}</Text>
                  </View>
                </View>
                <View style={styles.infoContainer}>
                  <View style={styles.infoRow}>
                    <Ionicons name="trophy-outline" size={15} color="#002b45" />
                    <Text style={styles.infoText}><Text style={styles.infoLabel}>Desafío: </Text>{desafioNombre}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Ionicons name="pricetag-outline" size={15} color="#002b45" />
                    <Text style={styles.infoText}><Text style={styles.infoLabel}>Categoría: </Text>{categoriaNombre}</Text>
                  </View>
                  <View style={styles.deliverablesRow}>
                    <View style={styles.deliverable}><Ionicons name="logo-youtube" size={14} color={video ? '#dc3545' : '#94a3b8'} /><Text style={styles.deliverableText}>{video ? 'Video adjunto' : 'Sin video'}</Text></View>
                    <View style={styles.deliverable}><Ionicons name="document-text-outline" size={14} color={reporte ? '#0284c7' : '#94a3b8'} /><Text style={styles.deliverableText}>{reporte ? 'Reporte adjunto' : 'Sin reporte'}</Text></View>
                  </View>
                </View>
                <View style={styles.actionsRow}>
                  <TouchableOpacity style={[styles.btnAction, styles.btnEdit]} onPress={() => abrirEdicion(item)}>
                    <Ionicons name="create-outline" size={16} color="#fff" /><Text style={styles.btnActionText}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btnAction, styles.btnDelete]} onPress={() => setEquipoEliminar(item)} disabled={eliminando} accessibilityLabel={`Eliminar ${nombreEquipo}`}>
                    <Ionicons name="trash-outline" size={16} color="#fff" /><Text style={styles.btnActionText}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      <Modal visible={modalCertamenVisible} transparent animationType="fade" onRequestClose={() => setModalCertamenVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.selectorModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.dialogTitle}>Seleccionar certamen</Text>
              <TouchableOpacity onPress={() => setModalCertamenVisible(false)}><Ionicons name="close" size={24} color="#334155" /></TouchableOpacity>
            </View>
            <FlatList
              data={certamenes}
              keyExtractor={(item, index) => String(getId(item) || index)}
              ListEmptyComponent={<Text style={styles.emptyText}>No hay certámenes registrados.</Text>}
              renderItem={({ item }) => {
                const selected = getId(item) === idCertamen;
                return <TouchableOpacity style={[styles.certamenOption, selected && styles.certamenOptionActive]} onPress={() => elegirCertamen(item)}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.certamenName, selected && styles.certamenOptionTextActive]}>{getCertamenNombre(item)}</Text>
                    <Text style={[styles.certamenType, selected && styles.certamenOptionTextActive]}>{getTipo(item) === 'INNOVATEC' ? 'InnovaTecNM' : getTipo(item) === 'RALLY' ? 'Rally' : getTipo(item)}</Text>
                  </View>
                  {selected && <Ionicons name="checkmark-circle" size={20} color="#15803d" />}
                </TouchableOpacity>;
              }}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={equipoEliminar !== null} transparent animationType="fade" onRequestClose={() => setEquipoEliminar(null)}>
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <View style={[styles.iconCircle, styles.warningCircle]}><Ionicons name="trash-outline" size={30} color="#b91c1c" /></View>
            <Text style={styles.dialogTitle}>Confirmar eliminación</Text>
            <Text style={styles.dialogMessage}>¿Deseas eliminar el equipo "{equipoEliminar ? getNombre(equipoEliminar) : ''}"? Esta acción no se puede deshacer.</Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEquipoEliminar(null)}><Text style={styles.cancelButtonText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={styles.deleteConfirmButton} onPress={confirmarEliminacion}><Text style={styles.confirmButtonText}>Eliminar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={eliminando} animationType="fade" onRequestClose={() => {}}>
        <View style={styles.overlay}><View style={styles.loadingModal}><ActivityIndicator size="large" color="#002b45" /><Text style={styles.modalMessage}>Eliminando equipo...</Text></View></View>
      </Modal>

      <Modal visible={resultado.visible} transparent animationType="fade" onRequestClose={cerrarResultado}>
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <View style={[styles.iconCircle, resultado.success ? styles.successCircle : styles.errorCircle]}>
              <Ionicons name={resultado.success ? 'checkmark-circle-outline' : 'alert-circle-outline'} size={34} color={resultado.success ? '#15803d' : '#b91c1c'} />
            </View>
            <Text style={styles.dialogTitle}>{resultado.title}</Text>
            <Text style={styles.dialogMessage}>{resultado.message}</Text>
            <TouchableOpacity style={styles.confirmButtonFull} onPress={cerrarResultado}><Text style={styles.confirmButtonText}>Aceptar</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 15 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#002b45', marginBottom: 12 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#475569', marginBottom: 6 },
  certamenSelector: { backgroundColor: '#fff', borderRadius: 10, padding: 12, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#dbe4ee', gap: 10, marginBottom: 12 },
  certamenIcon: { width: 38, height: 38, borderRadius: 9, backgroundColor: '#e6f0f7', alignItems: 'center', justifyContent: 'center' },
  certamenInfo: { flex: 1 },
  certamenName: { fontSize: 14, color: '#1e293b', fontWeight: 'bold' },
  certamenType: { fontSize: 12, color: '#64748b', marginTop: 3 },
  certamenOption: { paddingVertical: 13, paddingHorizontal: 10, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, borderBottomWidth: 1, borderColor: '#eef2f6' },
  certamenOptionActive: { backgroundColor: '#ecfdf5', borderColor: '#bbf7d0' },
  certamenOptionTextActive: { color: '#166534' },
  btnNuevo: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, backgroundColor: '#9eb23b', borderRadius: 9, padding: 12, marginBottom: 12 },
  btnNuevoText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  filterSection: { marginBottom: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#e2e8f0', gap: 8 },
  searchInput: { flex: 1, height: 44, color: '#1e293b' },
  countText: { alignSelf: 'flex-end', marginTop: 7, color: '#64748b', fontSize: 12, fontWeight: '600' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 30 },
  loadingText: { marginTop: 10, color: '#002b45', fontWeight: '600' },
  listContent: { paddingBottom: 24, flexGrow: 1 },
  emptyText: { textAlign: 'center', color: '#64748b', marginTop: 25, fontSize: 14, paddingHorizontal: 20 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 12, elevation: 2, borderWidth: 1, borderColor: '#eef2f6' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  titleColumn: { flex: 1, paddingRight: 4 },
  idText: { fontSize: 11, color: '#94a3b8', fontWeight: 'bold' },
  nombreText: { fontSize: 17, fontWeight: 'bold', color: '#002b45', marginTop: 3 },
  salaBadge: { paddingVertical: 5, paddingHorizontal: 8, borderRadius: 6, maxWidth: '46%' },
  salaAsignada: { backgroundColor: '#dcfce7' },
  sinSala: { backgroundColor: '#fef3c7' },
  salaText: { fontSize: 11, fontWeight: 'bold', color: '#334155' },
  infoContainer: { marginTop: 12, gap: 8, backgroundColor: '#f8fafc', padding: 11, borderRadius: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  infoText: { fontSize: 13, color: '#475569', flex: 1, lineHeight: 18 },
  infoLabel: { fontWeight: 'bold', color: '#334155' },
  deliverablesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4, paddingTop: 9, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  deliverable: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  deliverableText: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 13, justifyContent: 'flex-end' },
  btnAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 7, gap: 5 },
  btnEdit: { backgroundColor: '#0284c7' },
  btnDelete: { backgroundColor: '#dc3545' },
  btnActionText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  selectorModal: { width: '100%', maxWidth: 480, maxHeight: '75%', backgroundColor: '#fff', borderRadius: 14, padding: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingBottom: 12, marginBottom: 5, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  dialog: { width: '100%', maxWidth: 430, backgroundColor: '#fff', padding: 22, borderRadius: 16, alignItems: 'center', elevation: 8 },
  iconCircle: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  warningCircle: { backgroundColor: '#fee2e2' },
  successCircle: { backgroundColor: '#dcfce7' },
  errorCircle: { backgroundColor: '#fee2e2' },
  dialogTitle: { fontSize: 18, color: '#0f172a', fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  dialogMessage: { color: '#475569', fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 20 },
  dialogActions: { flexDirection: 'row', width: '100%', gap: 10 },
  cancelButton: { flex: 1, height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { color: '#334155', fontWeight: '600' },
  deleteConfirmButton: { flex: 1, height: 44, borderRadius: 8, backgroundColor: '#dc2626', alignItems: 'center', justifyContent: 'center' },
  confirmButtonFull: { alignSelf: 'stretch', height: 44, borderRadius: 8, backgroundColor: '#002b45', alignItems: 'center', justifyContent: 'center' },
  confirmButtonText: { color: '#fff', fontWeight: 'bold' },
  loadingModal: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 26, paddingVertical: 24, minWidth: 220, alignItems: 'center' },
  modalMessage: { fontSize: 14, color: '#334155', fontWeight: '600', marginTop: 12, textAlign: 'center' },
});
