// @ts-nocheck
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { eliminarEquipo, getCertamenes, getEquipos } from '../../../services/api';

const extraerLista = (r: any): any[] =>
  Array.isArray(r) ? r : Array.isArray(r?.data) ? r.data : Array.isArray(r?.data?.data) ? r.data.data : [];

const idCertamenDe = (x: any) => Number(x?.Id_certamen ?? x?.Id_Certamen ?? x?.id_certamen ?? x?.idCertamen ?? x?.id);
const idEquipoDe = (x: any) => Number(x?.Id_equipo ?? x?.id_equipo ?? x?.id);
const nombreEquipo = (e: any) => String(e?.Nombre ?? e?.nombre ?? `Equipo #${idEquipoDe(e)}`);
const nombreCertamen = (e: any) => String(e?.Nombre_certamen ?? e?.certamen?.Nombre ?? e?.certamen?.nombre ?? `Certamen #${e?.Id_certamen ?? '?'}`);
const estadoInicial = { visible: false, titulo: '', mensaje: '', exito: false };

export default function EquiposIndexScreen() {
  const router = useRouter();
  const [certamenes, setCertamenes] = useState<any[]>([]);
  const [idCertamenSel, setIdCertamenSel] = useState<number | null>(null);
  const idCertamenRef = useRef<number | null>(null);
  const [equipos, setEquipos] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [equipoPendiente, setEquipoPendiente] = useState<any>(null);
  const [eliminando, setEliminando] = useState(false);
  const [resultado, setResultado] = useState(estadoInicial);
  const [selectorCertamenVisible, setSelectorCertamenVisible] = useState(false);

  const mostrarResultado = (titulo: string, mensaje: string, exito = false) =>
    setResultado({ visible: true, titulo, mensaje, exito });

  const cargarTodo = useCallback(async () => {
    setCargando(true);
    try {
      const [rCertamenes, rEquipos] = await Promise.all([getCertamenes(), getEquipos()]);
      const listaCertamenes = extraerLista(rCertamenes).filter(
        (x) => Number.isFinite(idCertamenDe(x)) && idCertamenDe(x) > 0
      );
      setCertamenes(listaCertamenes);

      const elegido =
        listaCertamenes.find((x) => idCertamenDe(x) === Number(idCertamenRef.current)) ??
        listaCertamenes.find((x) => String(x.Tipo ?? x.tipo).toUpperCase() === 'RALLY') ??
        listaCertamenes[0] ??
        null;

      const idElegido = elegido ? idCertamenDe(elegido) : null;
      idCertamenRef.current = idElegido;
      setIdCertamenSel(idElegido);
      setEquipos(extraerLista(rEquipos));
    } catch (error: any) {
      mostrarResultado('No se pudieron cargar los equipos', error?.message || 'Verifica la conexión con el servidor.', false);
    } finally {
      setCargando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void cargarTodo();
    }, [cargarTodo])
  );

  const certamenActual = certamenes.find((x) => idCertamenDe(x) === Number(idCertamenSel)) ?? null;

  const seleccionarCertamen = (id: number) => {
    idCertamenRef.current = id;
    setIdCertamenSel(id);
    setSelectorCertamenVisible(false);
  };

  const equiposDelCertamen = useMemo(() => {
    return equipos.filter((eq) => {
      const idCertDesafio = eq.desafio?.Id_certamen ?? eq.desafio?.id_certamen;
      const idCertCategoria = eq.categoria_certamen?.Id_Certamen ?? eq.categoriaCertamen?.Id_Certamen;
      const idCertDirecto = eq.Id_certamen ?? eq.id_certamen;

      const idCert = Number(idCertDesafio ?? idCertCategoria ?? idCertDirecto);
      return idCertamenSel === null || idCert === Number(idCertamenSel);
    });
  }, [equipos, idCertamenSel]);

  const equiposFiltrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return equiposDelCertamen.filter((eq) => {
      const texto = [
        nombreEquipo(eq),
        eq.desafio?.Nombre,
        eq.categoria_certamen?.Nombre ?? eq.categoriaCertamen?.Nombre,
        eq.sala?.Nombre,
        eq.lider?.Nombre,
      ]
        .map((v) => String(v ?? '').toLowerCase())
        .join(' ');
      return !q || texto.includes(q);
    });
  }, [equiposDelCertamen, busqueda]);

  const abrirEliminar = (eq: any) => {
    setEquipoPendiente(eq);
    setConfirmarEliminar(true);
  };

  const confirmarEliminacion = async () => {
    if (!equipoPendiente || eliminando) return;
    setConfirmarEliminar(false);
    setEliminando(true);
    try {
      await eliminarEquipo(idEquipoDe(equipoPendiente));
      setEquipos((prev) => prev.filter((e) => idEquipoDe(e) !== idEquipoDe(equipoPendiente)));
      mostrarResultado('Equipo eliminado', `Se eliminó el equipo ${nombreEquipo(equipoPendiente)}.`, true);
    } catch (error: any) {
      mostrarResultado('No se pudo eliminar', error?.message || 'El equipo podría tener asignaciones o evaluaciones asociadas.', false);
    } finally {
      setEliminando(false);
      setEquipoPendiente(null);
    }
  };

  const cerrarResultado = () => setResultado(estadoInicial);

  return (
    <View style={styles.page}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="people-outline" size={27} color="#fff" />
          </View>
          <Text style={styles.title}>Gestión de equipos</Text>
          <Text style={styles.subtitle}></Text>
        </View>

        <Text style={styles.sectionTitle}>Certamen seleccionado</Text>

        {certamenActual ? (
          <TouchableOpacity
            style={styles.certamenSeleccionadoCard}
            onPress={() => setSelectorCertamenVisible(true)}
            disabled={cargando || eliminando}
            activeOpacity={0.85}
          >
            <View style={styles.certamenIconBox}>
              <Ionicons
                name={['INNOVATEC', 'INNOVATECNM'].includes(String(certamenActual.Tipo ?? certamenActual.tipo ?? '').toUpperCase()) ? 'bulb-outline' : 'trophy-outline'}
                size={27}
                color="#0369a1"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.certamenSeleccionadoNombre}>
                {certamenActual.Nombre ?? certamenActual.nombre ?? 'Certamen'}
              </Text>
              <Text style={styles.certamenSeleccionadoTipo}>
                {['INNOVATEC', 'INNOVATECNM'].includes(String(certamenActual.Tipo ?? certamenActual.tipo ?? '').toUpperCase()) ? 'InnovaTecNM' : (certamenActual.Tipo ?? certamenActual.tipo ?? 'Rally')}
              </Text>
              <Text style={styles.certamenAyuda}>Toca para cambiar de certamen</Text>
            </View>
            <Ionicons name="chevron-down-circle" size={27} color="#64748b" />
          </TouchableOpacity>
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No hay certámenes registrados.</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.newButton}
          onPress={() => router.push({ pathname: '/misEquipos/form' as any, params: { idCertamen: String(idCertamenSel ?? '') } })}
          disabled={!idCertamenSel || eliminando}
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.newButtonText}>Nuevo equipo</Text>
        </TouchableOpacity>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={19} color="#64748b" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, desafío, categoría o sala..."
            placeholderTextColor="#94a3b8"
            value={busqueda}
            onChangeText={setBusqueda}
          />
        </View>

        <Text style={styles.listTitle}>
          Equipos de {certamenActual?.Nombre ?? 'el certamen seleccionado'} <Text style={styles.count}>{equiposFiltrados.length}</Text>
        </Text>

        {cargando ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#002b45" />
            <Text style={styles.loadingText}>Cargando equipos...</Text>
          </View>
        ) : equiposFiltrados.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="people-outline" size={32} color="#94a3b8" />
            <Text style={styles.emptyTitle}>No hay equipos para mostrar</Text>
            <Text style={styles.emptyText}>No hay registros de equipos para este certamen con los filtros seleccionados.</Text>
          </View>
        ) : (
          equiposFiltrados.map((eq, idx) => {
            const numIntegrantes = Array.isArray(eq.integrantes) ? eq.integrantes.length : 0;
            const categoriaNombre = (eq.categoria_certamen?.Nombre ?? eq.categoriaCertamen?.Nombre) || 'Sin categoría';

            return (
              <View key={idEquipoDe(eq) || `equipo-${idx}`} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.avatar}>
                    <Ionicons name="people-outline" size={21} color="#0369a1" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardName}>{nombreEquipo(eq)}</Text>
                    <Text style={styles.cardId}>EQUIPO-{idEquipoDe(eq)}</Text>
                  </View>
                  <View style={[styles.statusBadge, styles.statusAceptada]}>
                    <Text style={styles.statusText}>{numIntegrantes} integrante(s)</Text>
                  </View>
                </View>

                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    <Ionicons name="flag-outline" size={14} color="#002b45" />  Desafío: {eq.desafio?.Nombre || 'Sin desafío'}
                  </Text>
                  <Text style={styles.infoText}>
                    <Ionicons name="ribbon-outline" size={14} color="#002b45" />  Categoría: {categoriaNombre}
                  </Text>
                  <Text style={styles.infoText}>
                    <Ionicons name="trophy-outline" size={14} color="#002b45" />  Certamen: {nombreCertamen(eq)}
                  </Text>
                  {eq.sala ? (
                    <Text style={styles.infoText}>
                      <Ionicons name="business-outline" size={14} color="#002b45" />  Sala: {eq.sala?.Nombre}
                    </Text>
                  ) : null}
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() =>
                      router.push({
                        pathname: '/misEquipos/form' as any,
                        params: { equipoEditar: JSON.stringify(eq), idCertamen: String(idCertamenSel) },
                      })
                    }
                    disabled={eliminando}
                  >
                    <Ionicons name="create-outline" size={16} color="#fff" />
                    <Text style={styles.actionText}>Editar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.deleteButton} onPress={() => abrirEliminar(eq)} disabled={eliminando}>
                    <Ionicons name="trash-outline" size={16} color="#fff" />
                    <Text style={styles.actionText}>Eliminar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Modal Selector Certamen */}
      <Modal
        visible={selectorCertamenVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectorCertamenVisible(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.selectorModalCard}>
            <View style={styles.selectorHeader}>
              <Text style={styles.modalTitle}>Seleccionar certamen</Text>
              <TouchableOpacity onPress={() => setSelectorCertamenVisible(false)} style={styles.closeSelector}>
                <Ionicons name="close" size={25} color="#334155" />
              </TouchableOpacity>
            </View>
            <ScrollView
              style={styles.selectorScroll}
              contentContainerStyle={styles.selectorList}
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
            >
              {certamenes.map((c) => {
                const id = idCertamenDe(c);
                const activo = id === Number(idCertamenSel);
                const innov = ['INNOVATEC', 'INNOVATECNM'].includes(String(c.Tipo ?? c.tipo ?? '').toUpperCase());
                return (
                  <TouchableOpacity
                    key={id}
                    style={[styles.opcionCertamen, activo && styles.opcionCertamenActiva]}
                    onPress={() => seleccionarCertamen(id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={innov ? 'bulb-outline' : 'trophy-outline'} size={23} color={activo ? '#15803d' : '#0369a1'} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.opcionNombre, activo && styles.opcionNombreActivo]}>{c.Nombre ?? c.nombre ?? 'Certamen'}</Text>
                      <Text style={[styles.opcionTipo, activo && styles.opcionNombreActivo]}>{innov ? 'InnovaTecNM' : (c.Tipo ?? c.tipo ?? 'Rally')}</Text>
                    </View>
                    {activo ? <Ionicons name="checkmark-circle" size={22} color="#15803d" /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Confirmar Eliminar */}
      <Modal visible={confirmarEliminar} transparent animationType="fade" onRequestClose={() => setConfirmarEliminar(false)}>
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIcon, styles.errorIcon]}>
              <Ionicons name="trash-outline" size={28} color="#b91c1c" />
            </View>
            <Text style={styles.modalTitle}>¿Eliminar equipo?</Text>
            <Text style={styles.modalMessage}>Se eliminará el equipo "{nombreEquipo(equipoPendiente ?? {})}" junto con sus integrantes asociados.</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setConfirmarEliminar(false)}>
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteConfirmButton} onPress={() => void confirmarEliminacion()}>
                <Text style={styles.confirmText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Alert Resultado */}
      <Modal visible={resultado.visible} transparent animationType="fade" onRequestClose={cerrarResultado}>
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIcon, resultado.exito ? styles.successIcon : styles.errorIcon]}>
              <Ionicons name={resultado.exito ? 'checkmark-circle-outline' : 'alert-circle-outline'} size={29} color={resultado.exito ? '#15803d' : '#b91c1c'} />
            </View>
            <Text style={styles.modalTitle}>{resultado.titulo}</Text>
            <Text style={styles.modalMessage}>{resultado.mensaje}</Text>
            <TouchableOpacity style={styles.confirmButton} onPress={cerrarResultado}>
              <Text style={styles.confirmText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f1f5f9' },
  scrollView: { flex: 1 },
  header: { paddingTop: 18, paddingHorizontal: 18, alignItems: 'center' },
  headerIcon: { width: 56, height: 56, borderRadius: 17, backgroundColor: '#002b45', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 23, fontWeight: '800', color: '#002b45', marginTop: 9 },
  subtitle: { fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 5, marginBottom: 14 },
  container: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#002b45', marginTop: 10, marginBottom: 9 },
  certamenSeleccionadoCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16, padding: 14, backgroundColor: '#f8fafc', borderWidth: 1.5, borderColor: '#cbd5e1', marginBottom: 8, minHeight: 100 },
  certamenIconBox: { width: 58, height: 58, borderRadius: 14, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center' },
  certamenSeleccionadoNombre: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  certamenSeleccionadoTipo: { fontSize: 13, color: '#64748b', marginTop: 4 },
  certamenAyuda: { fontSize: 12, color: '#0e7490', fontWeight: '700', marginTop: 7 },
  selectorModalCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, maxHeight: '82%', width: '100%', maxWidth: 480 },
  selectorHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', paddingBottom: 12, marginBottom: 8 },
  closeSelector: { padding: 4 },
  selectorScroll: { flexGrow: 0 },
  selectorList: { paddingBottom: 4 },
  opcionCertamen: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', borderRadius: 10, minHeight: 76 },
  opcionCertamenActiva: { backgroundColor: '#ecfdf5', borderBottomColor: '#bbf7d0' },
  opcionNombre: { fontSize: 15, fontWeight: '800', color: '#0f172a' },
  opcionTipo: { fontSize: 12, color: '#64748b', marginTop: 4 },
  opcionNombreActivo: { color: '#166534' },
  newButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, backgroundColor: '#86a327', padding: 13, borderRadius: 10, marginTop: 16, marginBottom: 12 },
  newButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1, borderColor: '#dbe3ee', borderRadius: 9, paddingHorizontal: 11 },
  searchInput: { flex: 1, height: 43, marginLeft: 8, color: '#0f172a' },
  listTitle: { fontSize: 16, fontWeight: '800', color: '#002b45', marginTop: 20, marginBottom: 10 },
  count: { fontSize: 12, color: '#0369a1' },
  center: { alignItems: 'center', padding: 30 },
  loadingText: { marginTop: 8, color: '#64748b' },
  emptyCard: { alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 24, marginTop: 6 },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: '#334155', marginTop: 9 },
  emptyText: { fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 5, lineHeight: 18 },
  card: { backgroundColor: '#fff', borderRadius: 13, borderWidth: 1, borderColor: '#e2e8f0', padding: 14, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 42, height: 42, borderRadius: 12, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center' },
  cardName: { fontSize: 16, fontWeight: '800', color: '#002b45' },
  cardId: { fontSize: 10, color: '#94a3b8', fontWeight: '700', marginTop: 2 },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 7 },
  statusAceptada: { backgroundColor: '#dcfce7' },
  statusText: { fontSize: 10, fontWeight: '800', color: '#166534' },
  infoBox: { backgroundColor: '#f8fafc', borderRadius: 9, padding: 10, marginTop: 11, gap: 5 },
  infoText: { fontSize: 12, color: '#475569' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 12 },
  editButton: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#0284c7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 7 },
  deleteButton: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#dc2626', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 7 },
  actionText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.48)', justifyContent: 'center', padding: 18 },
  modalCard: { backgroundColor: '#fff', padding: 18, borderRadius: 15 },
  modalIcon: { alignSelf: 'center', width: 50, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 9, backgroundColor: '#e0f2fe' },
  successIcon: { backgroundColor: '#dcfce7' },
  errorIcon: { backgroundColor: '#fee2e2' },
  modalTitle: { fontSize: 17, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 7 },
  modalMessage: { fontSize: 13, lineHeight: 19, color: '#475569', textAlign: 'center', marginBottom: 14 },
  modalActions: { flexDirection: 'row', gap: 9 },
  cancelButton: { flex: 1, padding: 12, borderRadius: 9, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center' },
  cancelText: { color: '#334155', fontWeight: '800' },
  confirmButton: { padding: 12, borderRadius: 9, backgroundColor: '#002b45', alignItems: 'center' },
  deleteConfirmButton: { flex: 1, padding: 12, borderRadius: 9, backgroundColor: '#dc2626', alignItems: 'center' },
  confirmText: { color: '#fff', fontWeight: '800' }
});