// @ts-nocheck

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  actualizarCertamen,
  eliminarCertamen,
  getCertamenes,
} from '../../../services/api';

export default function CertamenesIndexScreen() {
  const router = useRouter();

  const [certamenes, setCertamenes] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'TODOS' | 'Activo' | 'Inactivo'>('TODOS');
  const [cargando, setCargando] = useState(true);

  // Estado de la ventana de confirmación y de la pantalla de carga.
  const [modalEliminarVisible, setModalEliminarVisible] = useState(false);
  const [certamenSeleccionado, setCertamenSeleccionado] = useState<any>(null);
  const [eliminando, setEliminando] = useState(false);
  const [resultadoVisible, setResultadoVisible] = useState(false);
  const [resultadoTitulo, setResultadoTitulo] = useState('');
  const [resultadoMensaje, setResultadoMensaje] = useState('');
  const [resultadoExito, setResultadoExito] = useState(false);

  const cargarCertamenes = async (mostrarIndicador = true) => {
    try {
      if (mostrarIndicador) setCargando(true);

      const respuesta: any = await getCertamenes();
      const lista = Array.isArray(respuesta)
        ? respuesta
        : Array.isArray(respuesta?.data)
          ? respuesta.data
          : [];

      setCertamenes(lista);
    } catch (e: any) {
      const mensaje = e?.message || 'Error de conexión con el servidor.';
      Alert.alert('Error', mensaje);
    } finally {
      if (mostrarIndicador) setCargando(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      cargarCertamenes();
    }, [])
  );

  const abrirConfirmacionEliminar = (id: number, nombre: string) => {
    setCertamenSeleccionado({ id: Number(id), nombre });
    setResultadoVisible(false);
    setModalEliminarVisible(true);
  };

  const mostrarResultado = (titulo: string, mensaje: string, exito: boolean) => {
    setResultadoTitulo(titulo);
    setResultadoMensaje(mensaje);
    setResultadoExito(exito);
    setResultadoVisible(true);
  };

  const confirmarEliminacion = async () => {
    if (!certamenSeleccionado || eliminando) return;

    const id = Number(certamenSeleccionado.id);
    setModalEliminarVisible(false);
    setEliminando(true);

    try {
      // La función del servicio debe lanzar un error cuando Laravel responde con HTTP no exitoso.
      await eliminarCertamen(id);

      // Retira la tarjeta de inmediato para que la interfaz se actualice sin salir de la pantalla.
      setCertamenes((actuales) =>
        actuales.filter((item) => {
          const itemId = item.Id_certamen ?? item.Id_Certamen ?? item.id_certamen ?? item.id;
          return Number(itemId) !== id;
        })
      );

      // Vuelve a consultar el servidor para sincronizar la lista con la base de datos.
      await cargarCertamenes(false);
      mostrarResultado('¡Certamen eliminado!', `El certamen "${certamenSeleccionado.nombre}" se eliminó correctamente.`, true);
    } catch (e: any) {
      mostrarResultado(
        'No se pudo eliminar',
        e?.message || 'Ocurrió un error al intentar eliminar el certamen. Intenta nuevamente.',
        false
      );
    } finally {
      setEliminando(false);
      setCertamenSeleccionado(null);
    }
  };

  const handleToggleEstado = async (item: any) => {
    const id = item.Id_certamen ?? item.Id_Certamen ?? item.id_certamen ?? item.id;
    const estadoActual = item.Estado || item.Estatus || 'Activo';
    const nuevoEstado = estadoActual === 'Activo' ? 'Inactivo' : 'Activo';

    try {
      const payload: any = {
        Nombre: item.Nombre || item.nombre,
        Estado: nuevoEstado,
      };

      const fecha = item.Fecha_evento || item.Fecha || item.fecha;
      if (fecha && fecha !== 'Sin fecha') payload.Fecha_evento = fecha;
      if (item.Tipo) payload.Tipo = item.Tipo;

      await actualizarCertamen(Number(id), payload);
      await cargarCertamenes(false);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'No se pudo cambiar el estado.');
    }
  };

  const certamenesFiltrados = certamenes.filter((c) => {
    const nombre = (c.Nombre || c.nombre || '').toLowerCase();
    const estado = c.Estado || c.Estatus || 'Activo';
    const cumpleNombre = nombre.includes(busqueda.toLowerCase().trim());
    const cumpleEstado = filtroEstado === 'TODOS' || estado === filtroEstado;
    return cumpleNombre && cumpleEstado;
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Panel de Gestión de Certámenes</Text>

      <TouchableOpacity
        style={styles.btnNuevo}
        onPress={() => router.push('/registroEvento/form' as any)}
        disabled={eliminando}
      >
        <Ionicons name="add-circle-outline" size={20} color="#fff" />
        <Text style={styles.btnNuevoText}>+ Nuevo Certamen</Text>
      </TouchableOpacity>

      <View style={styles.searchCard}>
        <Ionicons name="search-outline" size={18} color="#666" />
        <TextInput
          style={styles.inputSearch}
          placeholder="Buscar certamen por nombre..."
          placeholderTextColor="#777"
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>

      <View style={styles.filterRow}>
        <Text style={styles.filterLabel}>Estado:</Text>
        {(['TODOS', 'Activo', 'Inactivo'] as const).map((st) => (
          <TouchableOpacity
            key={st}
            style={[styles.chip, filtroEstado === st ? styles.chipActive : null]}
            onPress={() => setFiltroEstado(st)}
          >
            <Text style={[styles.chipText, filtroEstado === st ? styles.chipTextActive : null]}>
              {st}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {cargando ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#002b45" />
          <Text style={styles.loadingText}>Cargando certámenes...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {certamenesFiltrados.length === 0 ? (
            <Text style={styles.emptyText}>No hay certámenes registrados.</Text>
          ) : (
            certamenesFiltrados.map((item) => {
              const id = item.Id_certamen ?? item.Id_Certamen ?? item.id_certamen ?? item.id;
              const nombre = item.Nombre || item.nombre || '';
              const tipoValor = String(item.Tipo ?? item.tipo ?? '').toUpperCase();
              const tipoEtiqueta = tipoValor === 'RALLY' ? 'Rally' : tipoValor === 'INNOVATEC' ? 'InnovaTecNM' : 'Tipo no definido';
              const esInnova = tipoValor === 'INNOVATEC';
              const fecha = item.Fecha_evento || item.Fecha || item.fecha || 'Sin fecha';
              const estado = item.Estado || item.Estatus || 'Activo';
              const isActivo = estado === 'Activo';

              return (
                <View key={String(id)} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }} />

                    <View
                      style={[
                        styles.statusBadge,
                        isActivo ? styles.bgActive : styles.bgInactive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          isActivo ? styles.txtActive : styles.txtInactive,
                        ]}
                      >
                        {estado}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.cardTitle}>{nombre}</Text>

                  <View style={[styles.tipoBadge, esInnova ? styles.tipoBadgeInnova : styles.tipoBadgeRally]}>
                    <Ionicons name={esInnova ? 'bulb-outline' : 'trophy-outline'} size={14} color={esInnova ? '#6d28d9' : '#92400e'} />
                    <Text style={[styles.tipoBadgeText, esInnova ? styles.tipoBadgeTextInnova : styles.tipoBadgeTextRally]}>{tipoEtiqueta}</Text>
                  </View>

                  <View style={styles.fechaRow}>
                    <Ionicons name="calendar-outline" size={16} color="#666" />
                    <Text style={styles.fechaText}>Fecha: {String(fecha).slice(0, 10)}</Text>
                  </View>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.btnAction, styles.btnEdit]}
                      disabled={eliminando}
                      onPress={() =>
                        router.push({
                          pathname: '/registroEvento/form' as any,
                          params: { id: String(id), nombre, tipo: String(item.Tipo ?? item.tipo ?? ''), fecha: String(fecha), estado },
                        })
                      }
                    >
                      <Ionicons name="create-outline" size={16} color="#fff" />
                      <Text style={styles.btnActionText}>Editar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.btnAction, styles.btnToggle]}
                      disabled={eliminando}
                      onPress={() => handleToggleEstado(item)}
                    >
                      <Ionicons name={isActivo ? 'pause-circle-outline' : 'play-circle-outline'} size={16} color="#fff" />
                      <Text style={styles.btnActionText}>{isActivo ? 'Desactivar' : 'Activar'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.btnAction, styles.btnDelete, eliminando && styles.buttonDisabled]}
                      disabled={eliminando}
                      onPress={() => abrirConfirmacionEliminar(Number(id), nombre)}
                      accessibilityLabel={`Eliminar certamen ${nombre}`}
                    >
                      <Ionicons name="trash-outline" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Ventana visual de confirmación */}
      <Modal
        visible={modalEliminarVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalEliminarVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmCard}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="trash-outline" size={30} color="#dc2626" />
            </View>
            <Text style={styles.modalTitle}>¿Deseas eliminar?</Text>
            <Text style={styles.modalMessage}>
              ¿Seguro que deseas eliminar el certamen{' '}
              <Text style={styles.modalStrong}>"{certamenSeleccionado?.nombre || ''}"</Text>?
              {'\n'}Esta acción no se puede deshacer.
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalEliminarVisible(false);
                  setCertamenSeleccionado(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmDeleteButton]}
                onPress={confirmarEliminacion}
              >
                <Ionicons name="trash-outline" size={16} color="#fff" />
                <Text style={styles.confirmDeleteText}>Sí, eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pantalla de carga mientras el servidor procesa la eliminación */}
      <Modal visible={eliminando} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.loadingBackdrop}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#002b45" />
            <Text style={styles.loadingTitle}>Eliminando certamen...</Text>
            <Text style={styles.loadingDescription}>Por favor, espera un momento.</Text>
          </View>
        </View>
      </Modal>

      {/* Resultado de la operación */}
      <Modal
        visible={resultadoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setResultadoVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmCard}>
            <View style={[styles.resultIconCircle, resultadoExito ? styles.resultSuccess : styles.resultError]}>
              <Ionicons
                name={resultadoExito ? 'checkmark-circle-outline' : 'alert-circle-outline'}
                size={32}
                color={resultadoExito ? '#15803d' : '#b91c1c'}
              />
            </View>
            <Text style={styles.modalTitle}>{resultadoTitulo}</Text>
            <Text style={styles.modalMessage}>{resultadoMensaje}</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.resultButton]}
              onPress={() => setResultadoVisible(false)}
            >
              <Text style={styles.confirmDeleteText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 15 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#002b45', marginBottom: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#475569', fontSize: 14 },
  btnNuevo: { flexDirection: 'row', backgroundColor: '#9eb23b', padding: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 },
  btnNuevoText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  searchCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#e2e8f0', gap: 8, marginBottom: 12 },
  inputSearch: { flex: 1, fontSize: 14, color: '#333' },
  filterRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15, flexWrap: 'wrap' },
  filterLabel: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#e2e8f0' },
  chipActive: { backgroundColor: '#002b45' },
  chipText: { fontSize: 12, color: '#333' },
  chipTextActive: { color: '#fff', fontWeight: 'bold' },
  scroll: { paddingBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 12, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  cardBadge: { fontSize: 12, color: '#888', fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  bgActive: { backgroundColor: '#d4edda' },
  bgInactive: { backgroundColor: '#f8d7da' },
  statusBadgeText: { fontSize: 11, fontWeight: 'bold' },
  txtActive: { color: '#155724' },
  txtInactive: { color: '#721c24' },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#002b45', marginBottom: 5 },
  tipoBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 999, marginBottom: 10 },
  tipoBadgeRally: { backgroundColor: '#fef3c7' },
  tipoBadgeInnova: { backgroundColor: '#ede9fe' },
  tipoBadgeText: { fontSize: 12, fontWeight: '800' },
  tipoBadgeTextRally: { color: '#92400e' },
  tipoBadgeTextInnova: { color: '#6d28d9' },
  fechaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  fechaText: { fontSize: 13, color: '#666' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, flexWrap: 'wrap' },
  btnAction: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 7, paddingHorizontal: 10, borderRadius: 6, gap: 4 },
  btnEdit: { backgroundColor: '#0284c7' },
  btnToggle: { backgroundColor: '#64748b' },
  btnDelete: { backgroundColor: '#dc2626', minWidth: 40 },
  buttonDisabled: { opacity: 0.5 },
  btnActionText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#777', marginTop: 30 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  confirmCard: { width: '100%', maxWidth: 420, backgroundColor: '#fff', borderRadius: 18, padding: 24, alignItems: 'center', elevation: 12, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
  modalIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 21, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 10 },
  modalMessage: { fontSize: 15, lineHeight: 22, color: '#475569', textAlign: 'center', marginBottom: 22 },
  modalStrong: { fontWeight: '800', color: '#0f172a' },
  modalActions: { flexDirection: 'row', width: '100%', gap: 10 },
  modalButton: { minHeight: 44, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  cancelButton: { flex: 1, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1' },
  cancelButtonText: { color: '#334155', fontWeight: '700', fontSize: 14 },
  confirmDeleteButton: { flex: 1, backgroundColor: '#dc2626' },
  confirmDeleteText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  loadingBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingCard: { width: '100%', maxWidth: 320, backgroundColor: '#fff', borderRadius: 18, padding: 28, alignItems: 'center', elevation: 14, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 18, shadowOffset: { width: 0, height: 8 } },
  loadingTitle: { marginTop: 18, fontSize: 18, fontWeight: '800', color: '#002b45', textAlign: 'center' },
  loadingDescription: { marginTop: 8, fontSize: 14, color: '#64748b', textAlign: 'center' },
  resultIconCircle: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  resultSuccess: { backgroundColor: '#dcfce7' },
  resultError: { backgroundColor: '#fee2e2' },
  resultButton: { width: '100%', backgroundColor: '#002b45' },
});