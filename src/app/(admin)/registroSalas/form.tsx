// @ts-nocheck
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
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
import { actualizarSala, crearSala, getCertamenes, getSalas } from '../../../services/api';

const first = (value: any) => Array.isArray(value) ? value[0] : value;
const list = (value: any) => Array.isArray(value) ? value : Array.isArray(value?.data) ? value.data : [];
const certamenId = (item: any) => Number(item?.Id_certamen ?? item?.Id_Certamen ?? item?.id_certamen ?? item?.id);
const typeOf = (item: any) => String(item?.Tipo ?? item?.tipo ?? '').trim().toUpperCase();
const isInnova = (item: any) => ['INNOVATEC', 'INNOVATECNM'].includes(typeOf(item));
const salaId = (item: any) => Number(item?.Id_sala ?? item?.id_sala ?? item?.id);

export default function SalasFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const editIdRaw = first(params.id);
  const editId = editIdRaw ? String(editIdRaw) : null;
  const [certamenes, setCertamenes] = useState<any[]>([]);
  const [idCertamen, setIdCertamen] = useState<number | null>(first(params.idCertamen) ? Number(first(params.idCertamen)) : null);
  const [nombre, setNombre] = useState(String(first(params.nombre) ?? ''));
  const [ubicacion, setUbicacion] = useState(String(first(params.ubicacion) ?? ''));
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [confirmacion, setConfirmacion] = useState(false);
  const [resultado, setResultado] = useState({ visible: false, titulo: '', mensaje: '', exito: false });

  const mostrarResultado = (titulo: string, mensaje: string, exito = false) => setResultado({ visible: true, titulo, mensaje, exito });

  useEffect(() => {
    let active = true;
    const cargar = async () => {
      setCargando(true);
      try {
        const [certResp, salasResp] = await Promise.all([getCertamenes(), editId ? getSalas() : Promise.resolve([])]);
        const disponibles = list(certResp).filter(isInnova);
        if (!active) return;
        setCertamenes(disponibles);
        let idExistente = idCertamen;
        if (editId) {
          const sala = list(salasResp).find((item: any) => String(salaId(item)) === editId);
          if (sala) {
            setNombre(String(sala.Nombre ?? sala.nombre ?? first(params.nombre) ?? ''));
            setUbicacion(String(sala.Ubicacion ?? sala.ubicacion ?? first(params.ubicacion) ?? ''));
            idExistente = Number(sala.Id_certamen ?? sala.Id_Certamen ?? sala.id_certamen ?? idExistente);
          }
        }
        const seleccion = disponibles.find((item: any) => certamenId(item) === Number(idExistente))
          ?? disponibles.find((item: any) => certamenId(item) === Number(first(params.idCertamen)))
          ?? (disponibles.length === 1 ? disponibles[0] : null);
        setIdCertamen(seleccion ? certamenId(seleccion) : null);
        if (disponibles.length === 0) {
          mostrarResultado('No hay certamen InnovaTecNM', 'Registra primero un certamen cuyo tipo sea INNOVATEC. Las salas no se pueden asociar a Rally.', false);
        } else if (disponibles.length > 1 && !seleccion) {
          mostrarResultado('Selecciona un certamen InnovaTecNM', 'Hay varios certámenes InnovaTecNM. Abre el formulario desde el certamen deseado para mantener sus salas separadas.', false);
        }
      } catch (error: any) {
        if (active) mostrarResultado('Error al cargar datos', error?.message || 'No se pudieron consultar los certámenes InnovaTecNM.', false);
      } finally {
        if (active) setCargando(false);
      }
    };
    void cargar();
    return () => { active = false; };
    // Los parámetros definen el modo de edición al abrir la pantalla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const certamenSeleccionado = certamenes.find((item) => certamenId(item) === Number(idCertamen));

  const validar = () => {
    if (!idCertamen || !certamenSeleccionado || !isInnova(certamenSeleccionado)) {
      mostrarResultado('Certamen requerido', 'Selecciona un certamen de tipo InnovaTecNM para registrar esta sala.', false);
      return false;
    }
    if (!nombre.trim()) {
      mostrarResultado('Falta el nombre', 'Escribe el nombre de la sala.', false);
      return false;
    }
    if (!ubicacion.trim()) {
      mostrarResultado('Falta la ubicación', 'Escribe la ubicación de la sala.', false);
      return false;
    }
    return true;
  };

  const guardar = async () => {
    if (guardando || !validar()) return;
    setConfirmacion(true);
  };

  const confirmarGuardar = async () => {
    if (guardando || !idCertamen) return;
    setConfirmacion(false);
    setGuardando(true);
    const esEdicion = Boolean(editId);
    try {
      const payload = { Id_certamen: Number(idCertamen), Nombre: nombre.trim(), Ubicacion: ubicacion.trim() };
      await (esEdicion ? actualizarSala(Number(editId), payload) : crearSala(payload));
      mostrarResultado(esEdicion ? '¡Sala actualizada!' : '¡Sala registrada!', `La sala “${nombre.trim()}” quedó asociada a ${certamenSeleccionado?.Nombre ?? 'InnovaTecNM'}.`, true);
    } catch (error: any) {
      mostrarResultado('No se pudo guardar la sala', error?.message || 'Verifica los datos y vuelve a intentarlo.', false);
    } finally {
      setGuardando(false);
    }
  };

  const cerrarResultado = () => {
    const exito = resultado.exito;
    setResultado((prev) => ({ ...prev, visible: false }));
    if (exito) router.back();
  };

  if (cargando) {
    return <View style={styles.loadingPage}><ActivityIndicator size="large" color="#002b45" /><Text style={styles.loadingText}>Cargando certámenes InnovaTecNM...</Text></View>;
  }

  return (
    <View style={styles.page}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.headerIcon}><Ionicons name="business-outline" size={27} color="#fff" /></View>
          <Text style={styles.title}>{editId ? 'Editar sala de InnovaTecNM' : 'Registro de salas'}</Text>
          <Text style={styles.subtitle}>Las salas son exclusivas de InnovaTecNM. No se asignan a Rally.</Text>
        </View>
        <View style={styles.card}>
          <View style={styles.certamenBadge}><Ionicons name="trophy-outline" size={18} color="#166534" /><View style={{ flex: 1 }}><Text style={styles.badgeLabel}>Certamen permitido</Text><Text style={styles.badgeTitle}>{certamenSeleccionado?.Nombre ?? 'No seleccionado'}</Text><Text style={styles.badgeType}>INNOVATEC</Text></View></View>
          <Text style={styles.label}>Nombre de la sala *</Text>
          <TextInput style={styles.input} placeholder="Ej. SELECCIÓN NATURAL" placeholderTextColor="#94a3b8" value={nombre} onChangeText={setNombre} editable={!guardando} maxLength={100} />
          <Text style={styles.label}>Ubicación *</Text>
          <TextInput style={styles.input} placeholder="Ej. EB02, EB10, EB11" placeholderTextColor="#94a3b8" value={ubicacion} onChangeText={setUbicacion} editable={!guardando} maxLength={150} />
          <View style={styles.infoBox}><Ionicons name="information-circle-outline" size={19} color="#0369a1" /><Text style={styles.infoText}>La sala quedará vinculada al certamen InnovaTecNM mostrado arriba.</Text></View>
          <TouchableOpacity style={[styles.primaryButton, (!certamenSeleccionado || guardando) && styles.disabledButton]} onPress={() => void guardar()} disabled={!certamenSeleccionado || guardando}><Ionicons name="save-outline" size={18} color="#fff" /><Text style={styles.primaryButtonText}>{editId ? 'Guardar cambios' : 'Guardar sala'}</Text></TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()} disabled={guardando}><Text style={styles.secondaryButtonText}>Cancelar</Text></TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={confirmacion} transparent animationType="fade" onRequestClose={() => setConfirmacion(false)}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}><View style={styles.modalIcon}><Ionicons name="help-circle-outline" size={31} color="#0369a1" /></View><Text style={styles.modalTitle}>{editId ? '¿Guardar cambios?' : '¿Registrar sala?'}</Text><Text style={styles.modalMessage}>Se guardará en {certamenSeleccionado?.Nombre ?? 'InnovaTecNM'}.</Text><View style={styles.summaryBox}><Text style={styles.summaryLabel}>Sala</Text><Text style={styles.summaryValue}>{nombre.trim()}</Text><Text style={styles.summaryLabel}>Ubicación</Text><Text style={styles.summaryValue}>{ubicacion.trim()}</Text></View><View style={styles.modalActions}><TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setConfirmacion(false)}><Text style={styles.cancelText}>Cancelar</Text></TouchableOpacity><TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={() => void confirmarGuardar()}><Ionicons name="checkmark-outline" size={17} color="#fff" /><Text style={styles.confirmText}>Sí, guardar</Text></TouchableOpacity></View></View></View>
      </Modal>
      <Modal visible={guardando} transparent animationType="fade" onRequestClose={() => {}}><View style={styles.modalBackdrop}><View style={styles.loadingCard}><ActivityIndicator size="large" color="#002b45" /><Text style={styles.modalTitle}>{editId ? 'Actualizando sala...' : 'Registrando sala...'}</Text><Text style={styles.modalMessage}>Guardando los datos de InnovaTecNM.</Text></View></View></Modal>
      <Modal visible={resultado.visible} transparent animationType="fade" onRequestClose={cerrarResultado}><View style={styles.modalBackdrop}><View style={styles.modalCard}><View style={[styles.modalIcon, resultado.exito ? styles.successIcon : styles.errorIcon]}><Ionicons name={resultado.exito ? 'checkmark-circle-outline' : 'alert-circle-outline'} size={31} color={resultado.exito ? '#15803d' : '#b91c1c'} /></View><Text style={styles.modalTitle}>{resultado.titulo}</Text><Text style={styles.modalMessage}>{resultado.mensaje}</Text><TouchableOpacity style={[styles.modalButton, styles.confirmButton, { alignSelf: 'stretch' }]} onPress={cerrarResultado}><Text style={styles.confirmText}>Aceptar</Text></TouchableOpacity></View></View></Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f5f7fa' }, container: { flex: 1 }, content: { padding: 16, paddingBottom: 28 },
  loadingPage: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f7fa', gap: 10 }, loadingText: { color: '#002b45', fontWeight: '700' },
  header: { marginBottom: 18 }, headerIcon: { width: 52, height: 52, borderRadius: 15, backgroundColor: '#002b45', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }, title: { fontSize: 23, fontWeight: '800', color: '#002b45' }, subtitle: { fontSize: 13, color: '#64748b', marginTop: 5, lineHeight: 19 },
  card: { backgroundColor: '#fff', padding: 18, borderRadius: 14, borderWidth: 1, borderColor: '#e2e8f0', gap: 10 }, certamenBadge: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#f0fdf4', borderRadius: 10, padding: 12, borderWidth: 1, borderColor: '#bbf7d0', marginBottom: 5 }, badgeLabel: { fontSize: 11, color: '#166534' }, badgeTitle: { fontSize: 15, color: '#14532d', fontWeight: '800' }, badgeType: { fontSize: 10, color: '#166534', fontWeight: '800', marginTop: 2 },
  label: { fontSize: 13, fontWeight: '800', color: '#334155', marginTop: 7 }, input: { minHeight: 46, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 9, backgroundColor: '#fff', paddingHorizontal: 12, color: '#0f172a' }, infoBox: { flexDirection: 'row', gap: 8, padding: 11, backgroundColor: '#eff6ff', borderRadius: 9, marginTop: 7, alignItems: 'flex-start' }, infoText: { flex: 1, color: '#1e40af', fontSize: 12, lineHeight: 17 },
  primaryButton: { marginTop: 10, minHeight: 48, backgroundColor: '#002b45', borderRadius: 9, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' }, primaryButtonText: { color: '#fff', fontWeight: '800' }, disabledButton: { opacity: 0.5 }, secondaryButton: { minHeight: 43, alignItems: 'center', justifyContent: 'center' }, secondaryButtonText: { color: '#475569', fontWeight: '700' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.48)', justifyContent: 'center', alignItems: 'center', padding: 20 }, modalCard: { width: '100%', maxWidth: 440, backgroundColor: '#fff', borderRadius: 16, padding: 20, alignItems: 'stretch' }, modalIcon: { alignSelf: 'center', width: 56, height: 56, borderRadius: 18, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }, modalTitle: { color: '#002b45', fontSize: 18, fontWeight: '800', textAlign: 'center', marginBottom: 8 }, modalMessage: { color: '#475569', fontSize: 13, lineHeight: 19, textAlign: 'center', marginBottom: 12 }, summaryBox: { borderRadius: 10, backgroundColor: '#f8fafc', padding: 12, marginBottom: 14 }, summaryLabel: { fontSize: 11, fontWeight: '700', color: '#64748b', marginTop: 4 }, summaryValue: { fontSize: 14, color: '#0f172a', fontWeight: '700', marginBottom: 4 }, modalActions: { flexDirection: 'row', gap: 10 }, modalButton: { minHeight: 42, paddingHorizontal: 14, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, flex: 1 }, cancelButton: { backgroundColor: '#e2e8f0' }, cancelText: { color: '#334155', fontWeight: '800' }, confirmButton: { backgroundColor: '#002b45' }, confirmText: { color: '#fff', fontWeight: '800' }, loadingCard: { width: '100%', maxWidth: 340, backgroundColor: '#fff', borderRadius: 16, padding: 24, alignItems: 'center', gap: 12 }, successIcon: { backgroundColor: '#dcfce7' }, errorIcon: { backgroundColor: '#fee2e2' },
});
