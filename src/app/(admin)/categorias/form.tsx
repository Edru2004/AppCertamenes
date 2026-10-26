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

import {
  actualizarCategCertamen,
  crearCategCertamenes,
  getCategCertamenes,
  getCertamenes,
} from '../../../services/api';

const tipoVisible = (tipo?: string) => {
  const valor = String(tipo || '').trim().toUpperCase();
  if (valor === 'RALLY') return 'Rally';
  if (valor === 'INNOVATEC' || valor === 'INNOVATECNM') return 'InnovaTecNM';
  return 'Tipo no especificado';
};

const obtenerLista = (respuesta: any): any[] => {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.data)) return respuesta.data;
  if (Array.isArray(respuesta?.categorias)) return respuesta.categorias;
  return [];
};

const idDeCertamen = (certamen: any) =>
  Number(certamen?.Id_certamen ?? certamen?.Id_Certamen ?? certamen?.idCertamen ?? certamen?.id);

const idDeCategoria = (categoria: any) =>
  Number(categoria?.Id_categCertamen ?? categoria?.idCategoria_certa ?? categoria?.id);

export default function CategoriasFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const editId = params.id ? String(params.id) : null;
  // Si la pantalla llega desde un certamen filtrado (o se edita), mantenemos la categoría en ese contexto.
  const certamenContextoFijo = Boolean(editId || params.idCertamen);

  const [certamenes, setCertamenes] = useState<any[]>([]);
  const [idCertamenSel, setIdCertamenSel] = useState<number | null>(
    params.idCertamen ? Number(params.idCertamen) : null
  );
  const [nombre, setNombre] = useState(params.nombre ? String(params.nombre) : '');

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [modalConfirmacion, setModalConfirmacion] = useState(false);
  const [modalResultado, setModalResultado] = useState(false);
  const [resultadoTitulo, setResultadoTitulo] = useState('');
  const [resultadoMensaje, setResultadoMensaje] = useState('');
  const [resultadoExito, setResultadoExito] = useState(false);

  useEffect(() => {
    let activo = true;

    const cargarDatosIniciales = async () => {
      setCargando(true);
      try {
        const respuestaCertamenes = await getCertamenes();
        const listaCertamenes = obtenerLista(respuestaCertamenes);

        if (!activo) return;
        setCertamenes(listaCertamenes);

        // Para crear, selecciona por defecto el primer certamen existente.
        if (!idCertamenSel && !editId && listaCertamenes.length > 0) {
          const primerId = idDeCertamen(listaCertamenes[0]);
          if (Number.isFinite(primerId)) setIdCertamenSel(primerId);
        }

        // En edición, cargar el registro completo si no llegaron todos los parámetros.
        if (editId) {
          const respuestaCategorias = await getCategCertamenes();
          const listaCategorias = obtenerLista(respuestaCategorias);
          const categoria = listaCategorias.find(
            (item: any) => String(idDeCategoria(item)) === editId
          );

          if (activo && categoria) {
            setNombre(String(categoria.Nombre ?? categoria.nombre ?? params.nombre ?? ''));
            const parentId =
              categoria.Id_Certamen ??
              categoria.Id_certamen ??
              categoria.idCertamen ??
              categoria.id_certamen;

            if (parentId != null) setIdCertamenSel(Number(parentId));
          }
        }
      } catch (error: any) {
        if (activo) {
          setResultadoTitulo('No se pudieron cargar los datos');
          setResultadoMensaje(
            error?.message || 'No se pudo conectar con el servidor. Verifica la conexión e inténtalo de nuevo.'
          );
          setResultadoExito(false);
          setModalResultado(true);
        }
      } finally {
        if (activo) setCargando(false);
      }
    };

    void cargarDatosIniciales();
    return () => {
      activo = false;
    };
    // La carga inicial solo necesita ejecutarse al abrir el formulario o cambiar el ID.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const mostrarResultado = (titulo: string, mensaje: string, exito: boolean) => {
    setResultadoTitulo(titulo);
    setResultadoMensaje(mensaje);
    setResultadoExito(exito);
    setModalResultado(true);
  };

  const validarFormulario = () => {
    if (!certamenes.length) {
      mostrarResultado(
        'No hay certámenes',
        'Primero registra un certamen para poder asociar esta categoría.',
        false
      );
      return false;
    }
    if (!idCertamenSel || !certamenes.some((item) => idDeCertamen(item) === Number(idCertamenSel))) {
      mostrarResultado('Selecciona un certamen', 'Elige el certamen al que pertenecerá esta categoría.', false);
      return false;
    }
    if (!nombre.trim()) {
      mostrarResultado('Falta el nombre', 'Escribe el nombre de la categoría antes de continuar.', false);
      return false;
    }
    return true;
  };

  const abrirConfirmacionGuardar = () => {
    if (guardando || cargando) return;
    if (validarFormulario()) setModalConfirmacion(true);
  };

  const confirmarGuardar = async () => {
    if (guardando) return;
    setModalConfirmacion(false);
    setGuardando(true);

    const esEdicion = Boolean(editId);
    const certamenSeleccionado = certamenes.find(
      (item) => idDeCertamen(item) === Number(idCertamenSel)
    );

    try {
      const payload = {
        Id_Certamen: Number(idCertamenSel),
        Nombre: nombre.trim(),
      };

      if (esEdicion) {
        await actualizarCategCertamen(Number(editId), payload);
      } else {
        await crearCategCertamenes(payload);
      }

      mostrarResultado(
        esEdicion ? '¡Cambios guardados!' : '¡Categoría guardada!',
        `La categoría "${nombre.trim()}" se ${esEdicion ? 'actualizó' : 'registró'} correctamente${
          certamenSeleccionado
            ? ` en ${certamenSeleccionado.Nombre ?? certamenSeleccionado.nombre ?? 'el certamen seleccionado'} (${tipoVisible(certamenSeleccionado.Tipo ?? certamenSeleccionado.tipo)}).`
            : '.'
        }`,
        true
      );
    } catch (error: any) {
      mostrarResultado(
        'No se pudo guardar',
        error?.message || 'Ocurrió un error al guardar la categoría. Comprueba los datos y vuelve a intentarlo.',
        false
      );
    } finally {
      setGuardando(false);
    }
  };

  if (cargando) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#002b45" />
        <Text style={styles.loadingTitle}>Cargando formulario...</Text>
        <Text style={styles.loadingSubtitle}>Consultando certámenes registrados</Text>
      </View>
    );
  }

  const seleccionado = certamenes.find(
    (item) => idDeCertamen(item) === Number(idCertamenSel)
  );
  const certamenesParaMostrar = certamenContextoFijo && idCertamenSel != null
    ? certamenes.filter((item) => idDeCertamen(item) === Number(idCertamenSel))
    : certamenes;

  return (
    <View style={styles.page}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="pricetags-outline" size={27} color="#fff" />
          </View>
          <Text style={styles.title}>{editId ? 'Editar categoría' : 'Nueva categoría'}</Text>
          <Text style={styles.subtitle}>
            {editId
              ? 'Actualiza la información y confirma cuando estés listo.'
              : 'Completa los datos para asociar la categoría a un certamen.'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Certamen asociado</Text>
          <Text style={styles.helpText}>{certamenContextoFijo ? 'Esta categoría se mantiene vinculada al certamen desde el que abriste el formulario.' : 'Selecciona el certamen al que pertenece esta categoría.'}</Text>

          {certamenes.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="alert-circle-outline" size={22} color="#b91c1c" />
              <Text style={styles.emptyText}>No se encontraron certámenes en la base de datos.</Text>
            </View>
          ) : (
            <View style={styles.certamenList}>
              {certamenesParaMostrar.map((cert: any) => {
                const idCert = idDeCertamen(cert);
                const activo = Number(idCertamenSel) === Number(idCert);
                const nombreCert = cert.Nombre ?? cert.nombre ?? `Certamen #${idCert}`;
                const tipoCert = tipoVisible(cert.Tipo ?? cert.tipo);

                return (
                  <TouchableOpacity
                    key={String(idCert)}
                    style={[styles.certamenItem, activo && styles.certamenItemSelected]}
                    onPress={() => { if (!certamenContextoFijo) setIdCertamenSel(idCert); }}
                    disabled={guardando || certamenContextoFijo}
                    accessibilityRole="button"
                    accessibilityState={{ selected: activo }}
                  >
                    <View style={[styles.radioCircle, activo && styles.radioCircleSelected]}>
                      {activo ? <View style={styles.radioDot} /> : null}
                    </View>
                    <View style={styles.certamenInfo}>
                      <Text style={[styles.certamenName, activo && styles.certamenNameSelected]}>
                        {nombreCert}
                      </Text>
                      <View style={[styles.typeBadge, tipoCert === 'Rally' ? styles.rallyBadge : styles.innovatecBadge]}>
                        <Ionicons
                          name={tipoCert === 'Rally' ? 'trophy-outline' : 'bulb-outline'}
                          size={13}
                          color={tipoCert === 'Rally' ? '#854d0e' : '#075985'}
                        />
                        <Text style={[styles.typeBadgeText, tipoCert === 'Rally' ? styles.rallyText : styles.innovatecText]}>
                          {tipoCert}
                        </Text>
                      </View>
                    </View>
                    {activo ? <Ionicons name={certamenContextoFijo ? 'lock-closed-outline' : 'checkmark-circle'} size={21} color="#002b45" /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={styles.separator} />

          <Text style={styles.label}>Nombre de la categoría</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Agroindustria, Salud y Biotecnología..."
            placeholderTextColor="#94a3b8"
            value={nombre}
            onChangeText={setNombre}
            editable={!guardando}
            maxLength={100}
            returnKeyType="done"
          />
          <Text style={styles.helperRight}>{nombre.length}/100</Text>

          {seleccionado ? (
            <View style={styles.summaryBox}>
              <Ionicons name="link-outline" size={18} color="#0369a1" />
              <Text style={styles.summaryText}>
                Se asociará a <Text style={styles.summaryStrong}>{seleccionado.Nombre ?? seleccionado.nombre}</Text>
                {' '}· {tipoVisible(seleccionado.Tipo ?? seleccionado.tipo)}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.saveButton, (guardando || certamenes.length === 0) && styles.buttonDisabled]}
            onPress={abrirConfirmacionGuardar}
            disabled={guardando || certamenes.length === 0}
          >
            <Ionicons name="save-outline" size={20} color="#fff" />
            <Text style={styles.saveButtonText}>
              {editId ? 'guardar cambios' : 'guardar categoría'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelLink} onPress={() => router.back()} disabled={guardando}>
            <Text style={styles.cancelLinkText}>Cancelar y regresar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal de confirmación para guardar */}
      <Modal
        visible={modalConfirmacion}
        transparent
        animationType="fade"
        onRequestClose={() => setModalConfirmacion(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.confirmIcon}>
              <Ionicons name="save-outline" size={29} color="#0369a1" />
            </View>
            <Text style={styles.modalTitle}>
              {editId ? '¿Guardar los cambios?' : '¿Deseas guardar?'}
            </Text>
            <Text style={styles.modalMessage}>
              Vas a {editId ? 'actualizar' : 'registrar'} la categoría:
            </Text>
            <Text style={styles.modalRecordName}>{nombre.trim()}</Text>
            <View style={styles.modalSummary}>
              <Text style={styles.modalSummaryLabel}>Certamen</Text>
              <Text style={styles.modalSummaryValue}>
                {seleccionado?.Nombre ?? seleccionado?.nombre ?? 'Sin seleccionar'}
              </Text>
              <Text style={styles.modalSummaryType}>
                {tipoVisible(seleccionado?.Tipo ?? seleccionado?.tipo)}
              </Text>
            </View>
            <Text style={styles.modalMessageSmall}>¿Deseas continuar?</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => setModalConfirmacion(false)}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirm]}
                onPress={() => void confirmarGuardar()}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <Text style={styles.modalConfirmText}>Sí, guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pantalla de carga que bloquea los toques mientras guarda */}
      <Modal visible={guardando} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.loadingBackdrop}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#002b45" />
            <Text style={styles.loadingTitle}>
              {editId ? 'Guardando cambios...' : 'Guardando categoría...'}
            </Text>
            <Text style={styles.loadingSubtitle}>Estamos guardando la información. No cierres esta pantalla.</Text>
          </View>
        </View>
      </Modal>

      {/* Resultado de la petición */}
      <Modal
        visible={modalResultado}
        transparent
        animationType="fade"
        onRequestClose={() => setModalResultado(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={[styles.confirmIcon, resultadoExito ? styles.successIcon : styles.errorIcon]}>
              <Ionicons
                name={resultadoExito ? 'checkmark-circle-outline' : 'alert-circle-outline'}
                size={31}
                color={resultadoExito ? '#15803d' : '#b91c1c'}
              />
            </View>
            <Text style={styles.modalTitle}>{resultadoTitulo}</Text>
            <Text style={styles.modalMessage}>{resultadoMensaje}</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalConfirm, styles.resultButton]}
              onPress={() => {
                setModalResultado(false);
                if (resultadoExito) router.back();
              }}
            >
              <Text style={styles.modalConfirmText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f1f5f9' },
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 34, maxWidth: 760, width: '100%', alignSelf: 'center' },
  header: { alignItems: 'center', paddingTop: 12, paddingBottom: 22 },
  headerIcon: { width: 58, height: 58, borderRadius: 18, backgroundColor: '#002b45', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#002b45', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#64748b', textAlign: 'center', marginTop: 6, lineHeight: 19, maxWidth: 430 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#0f172a', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a' },
  helpText: { fontSize: 12, lineHeight: 18, color: '#64748b', marginTop: 4, marginBottom: 12 },
  certamenList: { gap: 9 },
  certamenItem: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  certamenItemSelected: { backgroundColor: '#eff6ff', borderColor: '#0284c7' },
  radioCircle: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.6, borderColor: '#94a3b8', alignItems: 'center', justifyContent: 'center' },
  radioCircleSelected: { borderColor: '#0284c7' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#0284c7' },
  certamenInfo: { flex: 1, gap: 5 },
  certamenName: { fontSize: 14, color: '#334155', fontWeight: '600' },
  certamenNameSelected: { color: '#002b45', fontWeight: '800' },
  typeBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 20, paddingHorizontal: 9, paddingVertical: 4 },
  rallyBadge: { backgroundColor: '#fef3c7' },
  innovatecBadge: { backgroundColor: '#e0f2fe' },
  typeBadgeText: { fontSize: 11, fontWeight: '800' },
  rallyText: { color: '#854d0e' },
  innovatecText: { color: '#075985' },
  separator: { height: 1, backgroundColor: '#e2e8f0', marginTop: 18, marginBottom: 5 },
  label: { fontSize: 13, fontWeight: '800', color: '#334155', marginTop: 14, marginBottom: 7 },
  input: { backgroundColor: '#fff', borderRadius: 11, paddingHorizontal: 13, minHeight: 47, borderWidth: 1, borderColor: '#cbd5e1', color: '#0f172a', fontSize: 14 },
  helperRight: { textAlign: 'right', color: '#94a3b8', fontSize: 11, marginTop: 5 },
  summaryBox: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#f0f9ff', padding: 11, borderRadius: 10, marginTop: 13 },
  summaryText: { flex: 1, color: '#075985', fontSize: 12, lineHeight: 17 },
  summaryStrong: { fontWeight: '800' },
  saveButton: { backgroundColor: '#002b45', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: 12, minHeight: 50, marginTop: 22, paddingHorizontal: 14 },
  saveButtonText: { color: '#fff', fontSize: 14, fontWeight: '800', textAlign: 'center', flexShrink: 1 },
  buttonDisabled: { opacity: 0.5 },
  cancelLink: { alignSelf: 'center', padding: 12, marginTop: 5 },
  cancelLinkText: { color: '#64748b', fontWeight: '700', fontSize: 13 },
  emptyBox: { flexDirection: 'row', gap: 8, alignItems: 'center', backgroundColor: '#fef2f2', borderRadius: 10, padding: 12 },
  emptyText: { flex: 1, color: '#b91c1c', fontSize: 12 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.50)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', width: '100%', maxWidth: 430, borderRadius: 22, padding: 22, alignItems: 'center', shadowColor: '#0f172a', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 9 },
  confirmIcon: { width: 62, height: 62, borderRadius: 20, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  successIcon: { backgroundColor: '#dcfce7' },
  errorIcon: { backgroundColor: '#fee2e2' },
  modalTitle: { color: '#0f172a', fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  modalMessage: { color: '#475569', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  modalMessageSmall: { color: '#64748b', fontSize: 12, marginTop: 13, textAlign: 'center' },
  modalRecordName: { color: '#002b45', fontSize: 16, fontWeight: '800', textAlign: 'center', marginTop: 5, marginBottom: 12 },
  modalSummary: { alignSelf: 'stretch', backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' },
  modalSummaryLabel: { fontSize: 11, color: '#64748b', fontWeight: '700' },
  modalSummaryValue: { fontSize: 14, color: '#002b45', fontWeight: '800', textAlign: 'center', marginTop: 3 },
  modalSummaryType: { fontSize: 12, color: '#0369a1', fontWeight: '800', marginTop: 4 },
  modalButtons: { flexDirection: 'row', gap: 10, marginTop: 20, width: '100%' },
  modalButton: { flex: 1, minHeight: 45, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 10 },
  modalCancel: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1' },
  modalCancelText: { color: '#334155', fontSize: 13, fontWeight: '800' },
  modalConfirm: { backgroundColor: '#002b45' },
  modalConfirmText: { color: '#fff', fontSize: 13, fontWeight: '800', textAlign: 'center' },
  resultButton: { alignSelf: 'stretch', flex: 0, marginTop: 18, width: '100%' },
  loadingScreen: { flex: 1, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', gap: 9, padding: 20 },
  loadingBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'center', alignItems: 'center', padding: 25 },
  loadingCard: { width: '100%', maxWidth: 340, backgroundColor: '#fff', borderRadius: 20, padding: 26, alignItems: 'center', gap: 12 },
  loadingTitle: { color: '#002b45', fontWeight: '800', fontSize: 17, textAlign: 'center' },
  loadingSubtitle: { color: '#64748b', fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
