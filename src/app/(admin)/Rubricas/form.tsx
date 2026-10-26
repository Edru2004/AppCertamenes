// @ts-nocheck
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
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
import { actualizarRubrica, crearRubrica, getCategCertamenes, getCertamenes } from '../../../services/api';

const primerValor = (valor: any) => (Array.isArray(valor) ? valor[0] : valor);
const obtenerLista = (respuesta: any): any[] => {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.data)) return respuesta.data;
  if (Array.isArray(respuesta?.categorias)) return respuesta.categorias;
  return [];
};
const idDeCertamen = (item: any) => Number(item?.Id_certamen ?? item?.Id_Certamen ?? item?.idCertamen ?? item?.id_certamen ?? item?.id);
const idDeCategoriaCertamen = (item: any) => Number(item?.Id_categCertamen ?? item?.id_categCertamen ?? item?.idCategoria_certa ?? item?.idCategoria ?? item?.id);
const tipoVisible = (tipo: any) => {
  const valor = String(tipo ?? '').trim().toUpperCase();
  if (valor === 'RALLY') return 'Rally';
  if (valor === 'INNOVATEC' || valor === 'INNOVATECNM') return 'InnovaTecNM';
  return valor || 'Tipo no especificado';
};

export default function RubricaFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const editIdParam = primerValor(params.id);
  const categoriaParam = primerValor(params.idCategoria_r);
  const certamenParam = primerValor(params.idCertamen);
  const preguntaParam = primerValor(params.pregunta);
  const valorParam = primerValor(params.valor_maximo);
  const editId = editIdParam ? String(editIdParam) : null;
  const idCategoria = useMemo(() => categoriaParam != null && String(categoriaParam).trim() ? Number(categoriaParam) : null, [categoriaParam]);
  const idCertamenParam = useMemo(() => certamenParam != null && String(certamenParam).trim() ? Number(certamenParam) : null, [certamenParam]);

  const [categoriaCertamen, setCategoriaCertamen] = useState<any>(null);
  const [certamen, setCertamen] = useState<any>(null);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [pregunta, setPregunta] = useState(preguntaParam ? String(preguntaParam) : '');
  const [valorMaximo, setValorMaximo] = useState(valorParam != null && String(valorParam).trim() ? String(valorParam) : '10');
  const [modalConfirmacion, setModalConfirmacion] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [modalResultado, setModalResultado] = useState(false);
  const [resultadoTitulo, setResultadoTitulo] = useState('');
  const [resultadoMensaje, setResultadoMensaje] = useState('');
  const [resultadoExito, setResultadoExito] = useState(false);

  const mostrarResultado = (titulo: string, mensaje: string, exito = false) => {
    setResultadoTitulo(titulo);
    setResultadoMensaje(mensaje);
    setResultadoExito(exito);
    setModalResultado(true);
  };

  useEffect(() => {
    let activo = true;
    const cargarRelacion = async () => {
      setCargandoDatos(true);
      try {
        const [respuestaCategorias, respuestaCertamenes] = await Promise.all([
          getCategCertamenes(),
          getCertamenes(),
        ]);
        const listaCategorias = obtenerLista(respuestaCategorias);
        const listaCertamenes = obtenerLista(respuestaCertamenes);
        const categoria = listaCategorias.find((item: any) => idDeCategoriaCertamen(item) === Number(idCategoria));
        if (!activo) return;
        if (!categoria) {
          setCategoriaCertamen(null);
          setCertamen(null);
          mostrarResultado('Categoría del certamen no encontrada', 'No existe la categoría del certamen asociada a este criterio. Regresa a la lista y selecciona una categoría válida.', false);
          return;
        }
        const parentId = Number(categoria?.Id_Certamen ?? categoria?.Id_certamen ?? categoria?.id_certamen ?? categoria?.idCertamen);
        if (idCertamenParam != null && Number.isFinite(idCertamenParam) && parentId !== idCertamenParam) {
          setCategoriaCertamen(null);
          setCertamen(null);
          mostrarResultado('Certamen no compatible', 'La categoría no pertenece al certamen seleccionado. Regresa a la lista y vuelve a intentarlo.', false);
          return;
        }
        const cert = listaCertamenes.find((item: any) => idDeCertamen(item) === parentId) ?? categoria?.certamen ?? null;
        setCategoriaCertamen(categoria);
        setCertamen(cert);
      } catch (error: any) {
        if (activo) mostrarResultado('No se pudo cargar la categoría', error?.message || 'No fue posible verificar a qué certamen pertenece esta categoría de rúbrica.', false);
      } finally {
        if (activo) setCargandoDatos(false);
      }
    };
    if (!idCategoria || !Number.isFinite(idCategoria) || idCategoria <= 0) {
      setCargandoDatos(false);
      mostrarResultado('Falta la categoría', 'Regresa al listado y selecciona una categoría del certamen antes de continuar.', false);
      return () => { activo = false; };
    }
    void cargarRelacion();
    return () => { activo = false; };
  }, [idCategoria, idCertamenParam]);

  const validarFormulario = () => {
    if (!idCategoria || !Number.isFinite(idCategoria) || idCategoria <= 0 || !categoriaCertamen) {
      mostrarResultado('Falta la categoría', 'No se ha validado una categoría para este certamen.', false);
      return false;
    }
    if (!pregunta.trim()) {
      mostrarResultado('Falta el criterio', 'Escribe la pregunta o el criterio de evaluación antes de continuar.', false);
      return false;
    }
    const valor = Number(valorMaximo);
    if (!valorMaximo.trim() || !Number.isFinite(valor) || valor <= 0) {
      mostrarResultado('Valor máximo inválido', 'Ingresa un valor numérico mayor que 0 para el puntaje máximo.', false);
      return false;
    }
    return true;
  };

  const abrirConfirmacionGuardar = () => {
    if (!guardando && validarFormulario()) setModalConfirmacion(true);
  };

  const confirmarGuardar = async () => {
    if (guardando || !idCategoria || !categoriaCertamen) return;
    setModalConfirmacion(false);
    setGuardando(true);
    const esEdicion = Boolean(editId);
    const valor = Number(valorMaximo);
    const preguntaGuardada = pregunta.trim();
    try {
      const payload = { Id_categCertamen: Number(idCategoria), pregunta: preguntaGuardada, valor_maximo: valor };
      if (esEdicion) await actualizarRubrica(Number(editId), payload);
      else await crearRubrica(payload);
      mostrarResultado(esEdicion ? '¡Criterio actualizado!' : '¡Criterio registrado!', `El criterio “${preguntaGuardada}” se ${esEdicion ? 'actualizó' : 'registró'} correctamente en ${categoriaCertamen?.Nombre ?? categoriaCertamen?.nombre ?? 'la categoría seleccionada'}.`, true);
    } catch (error: any) {
      const errores = error?.errors ? Object.values(error.errors).flat().join('\n') : '';
      mostrarResultado('No se pudo guardar', error?.message || errores || 'Ocurrió un error al guardar el criterio. Revisa los datos e inténtalo nuevamente.', false);
    } finally {
      setGuardando(false);
    }
  };

  const cerrarResultado = () => {
    setModalResultado(false);
    if (resultadoExito) router.back();
  };

  const nombreCategoria = categoriaCertamen?.Nombre ?? categoriaCertamen?.nombre ?? (idCategoria ? `Categoría del certamen #${idCategoria}` : 'Sin categoría');
  const nombreCertamen = certamen?.Nombre ?? certamen?.nombre ?? `Certamen #${idCertamenParam ?? ''}`;
  const tipoCertamen = tipoVisible(certamen?.Tipo ?? certamen?.tipo);

  return (
    <View style={styles.page}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.headerIcon}><Ionicons name="clipboard-outline" size={27} color="#fff" /></View>
          <Text style={styles.title}>{editId ? 'Editar criterio' : 'Nuevo criterio de rúbrica'}</Text>
          <Text style={styles.subtitle}>El criterio quedará ligado exclusivamente a la categoría del certamen seleccionada.</Text>
        </View>

        {cargandoDatos ? (
          <View style={styles.loadingBox}><ActivityIndicator size="large" color="#002b45" /><Text style={styles.loadingText}>Verificando categoría y certamen...</Text></View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Ubicación de este criterio</Text>
            <View style={styles.parentBox}>
              <View style={styles.parentIcon}><Ionicons name="trophy-outline" size={18} color="#002b45" /></View>
              <View style={styles.parentDetails}>
                <Text style={styles.parentLabel}>Certamen</Text>
                <Text style={styles.parentValue}>{nombreCertamen}</Text>
                <View style={[styles.typeBadge, tipoCertamen === 'Rally' ? styles.rallyBadge : styles.innovatecBadge]}>
                  <Ionicons name={tipoCertamen === 'Rally' ? 'trophy-outline' : 'bulb-outline'} size={13} color={tipoCertamen === 'Rally' ? '#854d0e' : '#075985'} />
                  <Text style={[styles.typeBadgeText, tipoCertamen === 'Rally' ? styles.rallyText : styles.innovatecText]}>{tipoCertamen}</Text>
                </View>
                <Text style={[styles.parentLabel, { marginTop: 11 }]}>Categoría del certamen</Text>
                <Text style={styles.parentValue}>{nombreCategoria}</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Datos del criterio</Text>
            <Text style={styles.label}>Pregunta / criterio de evaluación *</Text>
            <TextInput style={[styles.input, styles.textArea]} placeholder="Ej. 1.1 La solución es innovadora..." placeholderTextColor="#94a3b8" value={pregunta} onChangeText={setPregunta} multiline numberOfLines={4} textAlignVertical="top" editable={!guardando && Boolean(categoriaCertamen)} maxLength={2000} />
            <Text style={styles.helper}>Describe claramente qué se evaluará.</Text>
            <Text style={styles.label}>Valor máximo (puntaje) *</Text>
            <TextInput style={styles.input} placeholder="Ej. 7, 10, 8..." placeholderTextColor="#94a3b8" keyboardType="decimal-pad" value={valorMaximo} onChangeText={setValorMaximo} editable={!guardando && Boolean(categoriaCertamen)} />
            <View style={styles.infoBox}><Ionicons name="information-circle-outline" size={19} color="#0369a1" /><Text style={styles.infoText}>El valor máximo debe ser un número mayor que cero.</Text></View>
            <TouchableOpacity style={[styles.primaryButton, (guardando || cargandoDatos || !categoriaCertamen) && styles.disabledButton]} onPress={abrirConfirmacionGuardar} disabled={guardando || cargandoDatos || !categoriaCertamen}>
              <Ionicons name="save-outline" size={19} color="#fff" /><Text style={styles.primaryButtonText}>{editId ? 'Guardar cambios' : 'Guardar criterio'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()} disabled={guardando}><Text style={styles.secondaryButtonText}>Cancelar</Text></TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <Modal visible={modalConfirmacion} transparent animationType="fade" onRequestClose={() => setModalConfirmacion(false)}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}>
          <View style={[styles.modalIcon, styles.confirmIcon]}><Ionicons name="help-circle-outline" size={31} color="#0369a1" /></View>
          <Text style={styles.modalTitle}>{editId ? '¿Guardar cambios?' : '¿Registrar criterio?'}</Text>
          <Text style={styles.modalMessage}>{editId ? 'Se actualizará la información de este criterio.' : `Se guardará el criterio en ${nombreCertamen}, dentro de “${nombreCategoria}”.`}</Text>
          <View style={styles.summaryBox}><Text style={styles.summaryLabel}>Criterio</Text><Text style={styles.summaryQuestion}>{pregunta.trim()}</Text><Text style={styles.summaryScore}>Valor máximo: {Number(valorMaximo)} pts</Text></View>
          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalConfirmacion(false)}><Text style={styles.cancelButtonText}>Revisar</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.confirmButton]} onPress={() => void confirmarGuardar()}><Ionicons name="checkmark-outline" size={17} color="#fff" /><Text style={styles.confirmButtonText}>Sí, guardar</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>

      <Modal visible={guardando} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.modalBackdrop}><View style={styles.loadingCard}><ActivityIndicator size="large" color="#002b45" /><Text style={styles.loadingTitle}>{editId ? 'Actualizando criterio...' : 'Guardando criterio...'}</Text><Text style={styles.loadingSubtitle}>Estamos procesando la solicitud. Espera un momento.</Text></View></View>
      </Modal>

      <Modal visible={modalResultado} transparent animationType="fade" onRequestClose={cerrarResultado}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}>
          <View style={[styles.modalIcon, resultadoExito ? styles.successIcon : styles.errorIcon]}><Ionicons name={resultadoExito ? 'checkmark-circle-outline' : 'alert-circle-outline'} size={31} color={resultadoExito ? '#15803d' : '#b91c1c'} /></View>
          <Text style={styles.modalTitle}>{resultadoTitulo}</Text><Text style={styles.modalMessage}>{resultadoMensaje}</Text>
          <TouchableOpacity style={[styles.modalButton, styles.okButton]} onPress={cerrarResultado}><Text style={styles.okButtonText}>{resultadoExito ? 'Aceptar y volver' : 'Aceptar'}</Text></TouchableOpacity>
        </View></View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f1f5f9' },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32, width: '100%', maxWidth: 760, alignSelf: 'center' },
  header: { alignItems: 'center', paddingTop: 8, paddingBottom: 18 },
  headerIcon: { width: 58, height: 58, borderRadius: 19, backgroundColor: '#002b45', alignItems: 'center', justifyContent: 'center', marginBottom: 11 },
  title: { fontSize: 23, fontWeight: '800', textAlign: 'center', color: '#002b45' },
  subtitle: { maxWidth: 470, fontSize: 12, lineHeight: 18, color: '#64748b', textAlign: 'center', marginTop: 6 },
  card: { backgroundColor: '#fff', borderRadius: 17, borderWidth: 1, borderColor: '#e2e8f0', padding: 18, shadowColor: '#0f172a', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  loadingBox: { paddingVertical: 36, alignItems: 'center', justifyContent: 'center', gap: 10 },
  loadingText: { color: '#64748b', fontSize: 12 },
  sectionTitle: { fontSize: 16, color: '#002b45', fontWeight: '800', marginBottom: 5, marginTop: 7 },
  parentBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 13, marginTop: 10, marginBottom: 16 },
  parentIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center' },
  parentDetails: { flex: 1 },
  parentLabel: { color: '#64748b', fontSize: 11, fontWeight: '700' },
  parentValue: { color: '#0f172a', fontSize: 14, fontWeight: '800', marginTop: 3 },
  typeBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 5, marginTop: 7 },
  rallyBadge: { backgroundColor: '#fef3c7' },
  innovatecBadge: { backgroundColor: '#dbeafe' },
  typeBadgeText: { fontSize: 11, fontWeight: '800' },
  rallyText: { color: '#854d0e' },
  innovatecText: { color: '#075985' },
  label: { fontSize: 13, fontWeight: '800', color: '#334155', marginBottom: 8, marginTop: 17 },
  input: { minHeight: 46, borderRadius: 10, paddingHorizontal: 12, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#fff', color: '#0f172a', fontSize: 14 },
  textArea: { minHeight: 112, paddingTop: 12, paddingBottom: 12 },
  helper: { marginTop: 6, fontSize: 11, color: '#64748b' },
  infoBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#eff6ff', borderRadius: 10, padding: 11, marginTop: 17 },
  infoText: { flex: 1, color: '#075985', fontSize: 12, lineHeight: 17 },
  primaryButton: { minHeight: 48, marginTop: 23, borderRadius: 10, backgroundColor: '#002b45', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 14 },
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  disabledButton: { opacity: 0.6 },
  secondaryButton: { minHeight: 43, borderRadius: 10, marginTop: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1' },
  secondaryButtonText: { color: '#334155', fontSize: 13, fontWeight: '800' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'center', alignItems: 'center', padding: 18 },
  modalCard: { width: '100%', maxWidth: 430, backgroundColor: '#fff', borderRadius: 21, padding: 22, alignItems: 'center', shadowColor: '#0f172a', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 9 },
  modalIcon: { width: 62, height: 62, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  confirmIcon: { backgroundColor: '#dbeafe' },
  successIcon: { backgroundColor: '#dcfce7' },
  errorIcon: { backgroundColor: '#fee2e2' },
  modalTitle: { color: '#0f172a', fontSize: 19, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  modalMessage: { color: '#475569', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  summaryBox: { alignSelf: 'stretch', backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 12, marginTop: 15 },
  summaryLabel: { color: '#64748b', fontSize: 11, fontWeight: '700', marginBottom: 5 },
  summaryQuestion: { color: '#0f172a', fontSize: 13, lineHeight: 19, fontWeight: '700' },
  summaryScore: { color: '#0369a1', fontSize: 12, fontWeight: '800', marginTop: 8 },
  modalActions: { flexDirection: 'row', gap: 9, marginTop: 19, width: '100%' },
  modalButton: { flex: 1, minHeight: 44, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 8 },
  cancelButton: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1' },
  cancelButtonText: { color: '#334155', fontSize: 13, fontWeight: '800' },
  confirmButton: { backgroundColor: '#002b45' },
  confirmButtonText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  okButton: { backgroundColor: '#002b45', alignSelf: 'stretch', flex: 0, marginTop: 19 },
  okButtonText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  loadingCard: { backgroundColor: '#fff', width: '100%', maxWidth: 330, borderRadius: 20, padding: 25, alignItems: 'center', gap: 12 },
  loadingTitle: { color: '#002b45', fontSize: 17, fontWeight: '800', textAlign: 'center' },
  loadingSubtitle: { color: '#64748b', fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
