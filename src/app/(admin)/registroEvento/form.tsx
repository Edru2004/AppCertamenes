// @ts-nocheck

import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { createElement, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  actualizarCertamen,
  crearCertamen,
  getCertamenes,
} from '../../../services/api';

const TIPOS_CERTAMEN = [
  { etiqueta: 'Rally', valor: 'RALLY', icono: 'trophy-outline' },
  { etiqueta: 'InnovaTecNM', valor: 'INNOVATEC', icono: 'bulb-outline' },
] as const;

const fechaDesdeTexto = (texto?: string | null): Date => {
  if (texto) {
    const coincide = String(texto).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (coincide) {
      const anio = Number(coincide[1]);
      const mes = Number(coincide[2]);
      const dia = Number(coincide[3]);
      const fechaLocal = new Date(anio, mes - 1, dia, 12, 0, 0);
      if (
        fechaLocal.getFullYear() === anio &&
        fechaLocal.getMonth() === mes - 1 &&
        fechaLocal.getDate() === dia
      ) {
        return fechaLocal;
      }
    }
  }
  return new Date();
};

const formatearFecha = (date: Date) => {
  const anio = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const dia = String(date.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

export default function CertamenFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const editId = params.id ? String(params.id) : null;

  const [nombre, setNombre] = useState(params.nombre ? String(params.nombre) : '');
  const [fecha, setFecha] = useState<Date>(() => fechaDesdeTexto(params.fecha ? String(params.fecha) : ''));
  const [fechaTexto, setFechaTexto] = useState(params.fecha ? String(params.fecha).slice(0, 10) : '');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tipo, setTipo] = useState<'RALLY' | 'INNOVATEC'>(
    String(params.tipo || '').toUpperCase() === 'INNOVATEC' ? 'INNOVATEC' : 'RALLY'
  );
  const [estado, setEstado] = useState<'Activo' | 'Inactivo'>(
    String(params.estado || '').toLowerCase() === 'inactivo' ? 'Inactivo' : 'Activo'
  );
  const [guardando, setGuardando] = useState(false);
  const [cargandoDatos, setCargandoDatos] = useState(Boolean(editId));

  const [confirmacionVisible, setConfirmacionVisible] = useState(false);
  const [resultadoVisible, setResultadoVisible] = useState(false);
  const [resultadoExito, setResultadoExito] = useState(false);
  const [resultadoTitulo, setResultadoTitulo] = useState('');
  const [resultadoMensaje, setResultadoMensaje] = useState('');

  const mostrarResultado = (titulo: string, mensaje: string, exito = false) => {
    setResultadoTitulo(titulo);
    setResultadoMensaje(mensaje);
    setResultadoExito(exito);
    setResultadoVisible(true);
  };

  useEffect(() => {
    let activo = true;

    const cargarCertamenExistente = async () => {
      if (!editId) {
        setCargandoDatos(false);
        return;
      }

      try {
        const respuesta = await getCertamenes();
        const lista = Array.isArray(respuesta)
          ? respuesta
          : Array.isArray(respuesta?.data)
            ? respuesta.data
            : [];

        const certamen = lista.find((item: any) =>
          String(item.Id_certamen ?? item.Id_Certamen ?? item.id_certamen ?? item.id) === editId
        );

        if (!activo) return;
        if (!certamen) {
          mostrarResultado('No se encontró el certamen', 'Regresa al listado y vuelve a abrir el registro.', false);
          return;
        }

        setNombre(String(certamen.Nombre ?? certamen.nombre ?? params.nombre ?? ''));

        const fechaServidor = String(
          certamen.Fecha_evento ?? certamen.Fecha ?? certamen.fecha ?? params.fecha ?? ''
        ).slice(0, 10);
        setFechaTexto(fechaServidor);
        if (fechaServidor) setFecha(fechaDesdeTexto(fechaServidor));

        const tipoServidor = String(certamen.Tipo ?? certamen.tipo ?? params.tipo ?? '').toUpperCase();
        setTipo(tipoServidor === 'INNOVATEC' ? 'INNOVATEC' : 'RALLY');

        const estadoServidor = String(certamen.Estado ?? certamen.Estatus ?? params.estado ?? 'Activo');
        setEstado(estadoServidor.toLowerCase() === 'inactivo' ? 'Inactivo' : 'Activo');
      } catch (error: any) {
        if (activo) {
          mostrarResultado(
            'No se pudieron cargar los datos',
            error?.message || 'Comprueba la conexión con el servidor.',
            false
          );
        }
      } finally {
        if (activo) setCargandoDatos(false);
      }
    };

    cargarCertamenExistente();
    return () => {
      activo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  const seleccionarFechaWeb = (valor: string) => {
    setFechaTexto(valor);
    if (valor) setFecha(fechaDesdeTexto(valor));
  };

  const solicitarGuardar = () => {
    if (guardando || cargandoDatos) return;

    if (!nombre.trim()) {
      mostrarResultado('Falta el nombre', 'Escribe el nombre del certamen antes de guardar.', false);
      return;
    }

    if (!fechaTexto) {
      mostrarResultado('Falta la fecha', 'Selecciona la fecha del evento en el calendario.', false);
      return;
    }

    if (!['RALLY', 'INNOVATEC'].includes(tipo)) {
      mostrarResultado('Tipo no válido', 'Selecciona Rally o InnovaTecNM.', false);
      return;
    }

    setConfirmacionVisible(true);
  };

  const confirmarGuardar = async () => {
    if (guardando) return;
    setConfirmacionVisible(false);
    setGuardando(true);

    try {
      const payload = {
        Nombre: nombre.trim(),
        Tipo: tipo,
        Fecha_evento: fechaTexto,
        Estado: estado,
      };

      if (editId) {
        await actualizarCertamen(Number(editId), payload);
      } else {
        await crearCertamen(payload);
      }

      setResultadoExito(true);
      setResultadoTitulo(editId ? '¡Cambios guardados!' : '¡Certamen guardado!');
      setResultadoMensaje(
        editId
          ? `Se actualizaron los datos de “${nombre.trim()}” correctamente.`
          : `“${nombre.trim()}” se registró correctamente como ${tipo === 'RALLY' ? 'Rally' : 'InnovaTecNM'}.`
      );
      setResultadoVisible(true);
    } catch (error: any) {
      setResultadoExito(false);
      setResultadoTitulo('No se pudo guardar');
      setResultadoMensaje(
        error?.message || 'Ocurrió un error al guardar. Revisa la conexión y los datos enviados.'
      );
      setResultadoVisible(true);
    } finally {
      setGuardando(false);
    }
  };

  const cerrarResultado = () => {
    const fueExito = resultadoExito;
    setResultadoVisible(false);
    if (fueExito) router.back();
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headingRow}>
          <View style={styles.headingIcon}>
            <Ionicons name={editId ? 'create-outline' : 'trophy-outline'} size={24} color="#fff" />
          </View>
          <View style={styles.headingTextWrap}>
            <Text style={styles.title}>{editId ? 'Editar certamen' : 'Nuevo certamen'}</Text>
            <Text style={styles.subtitle}>Completa los datos del evento</Text>
          </View>
        </View>

        {cargandoDatos ? (
          <View style={styles.loadingInline}>
            <ActivityIndicator size="small" color="#002b45" />
            <Text style={styles.loadingInlineText}>Cargando datos del certamen...</Text>
          </View>
        ) : null}

        <View style={styles.formCard}>
          <Text style={styles.label}>Nombre del certamen <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Certamen Nacional de Innovación 2026"
            placeholderTextColor="#94a3b8"
            value={nombre}
            onChangeText={setNombre}
            editable={!guardando && !cargandoDatos}
            returnKeyType="next"
          />

          <Text style={styles.label}>Tipo de certamen <Text style={styles.required}>*</Text></Text>
          <View style={styles.tipoRow}>
            {TIPOS_CERTAMEN.map((opcion) => {
              const seleccionado = tipo === opcion.valor;
              return (
                <TouchableOpacity
                  key={opcion.valor}
                  style={[styles.tipoOption, seleccionado && styles.tipoSelected]}
                  onPress={() => setTipo(opcion.valor)}
                  disabled={guardando || cargandoDatos}
                  accessibilityRole="button"
                  accessibilityState={{ selected: seleccionado }}
                >
                  <Ionicons
                    name={opcion.icono as any}
                    size={22}
                    color={seleccionado ? '#fff' : '#002b45'}
                  />
                  <Text style={[styles.tipoText, seleccionado && styles.tipoTextSelected]}>
                    {opcion.etiqueta}
                  </Text>
                  {seleccionado ? <Ionicons name="checkmark-circle" size={18} color="#fff" /> : null}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.label}>Fecha del evento <Text style={styles.required}>*</Text></Text>
          {Platform.OS === 'web' ? (
            <View style={styles.webDateWrapper}>
              <Ionicons name="calendar-outline" size={20} color="#002b45" />
              {createElement('input', {
                type: 'date',
                value: fechaTexto,
                onChange: (event: any) => seleccionarFechaWeb(event?.target?.value || ''),
                disabled: guardando || cargandoDatos,
                'aria-label': 'Fecha del evento',
                style: {
                  flex: 1,
                  minWidth: 0,
                  height: 42,
                  border: 'none',
                  outline: 'none',
                  backgroundColor: 'transparent',
                  color: '#243447',
                  fontSize: '14px',
                  fontFamily: 'inherit',
                },
              })}
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={styles.datePickerButton}
                onPress={() => setShowDatePicker((visible) => !visible)}
                disabled={guardando || cargandoDatos}
              >
                <Ionicons name="calendar-outline" size={20} color="#002b45" />
                <Text style={[styles.datePickerText, !fechaTexto && styles.placeholderText]}>
                  {fechaTexto || 'Seleccionar fecha en el calendario'}
                </Text>
                <Ionicons name="chevron-down-outline" size={18} color="#64748b" />
              </TouchableOpacity>

              {showDatePicker ? (
                <View style={styles.nativeDatePicker}>
                  <DateTimePicker
                    value={fecha}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'calendar'}
                    onChange={(event: any, selectedDate?: Date) => {
                      if (Platform.OS === 'android') setShowDatePicker(false);
                      if (event?.type === 'dismissed') return;
                      if (selectedDate) {
                        setFecha(selectedDate);
                        setFechaTexto(formatearFecha(selectedDate));
                      }
                    }}
                  />
                  {Platform.OS === 'ios' ? (
                    <TouchableOpacity style={styles.dateDoneButton} onPress={() => setShowDatePicker(false)}>
                      <Text style={styles.dateDoneText}>Aceptar fecha</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ) : null}
            </>
          )}

          <Text style={styles.label}>Estado del evento <Text style={styles.required}>*</Text></Text>
          <View style={styles.statusRow}>
            <TouchableOpacity
              style={[styles.statusOption, estado === 'Activo' && styles.statusSelectedActive]}
              onPress={() => setEstado('Activo')}
              disabled={guardando || cargandoDatos}
            >
              <Ionicons name={estado === 'Activo' ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={estado === 'Activo' ? '#15803d' : '#64748b'} />
              <Text style={[styles.statusOptionText, estado === 'Activo' && styles.statusTextActive]}>Activo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statusOption, estado === 'Inactivo' && styles.statusSelectedInactive]}
              onPress={() => setEstado('Inactivo')}
              disabled={guardando || cargandoDatos}
            >
              <Ionicons name={estado === 'Inactivo' ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={estado === 'Inactivo' ? '#b91c1c' : '#64748b'} />
              <Text style={[styles.statusOptionText, estado === 'Inactivo' && styles.statusTextInactive]}>Inactivo</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.previewCard}>
            <Ionicons name={tipo === 'RALLY' ? 'trophy-outline' : 'bulb-outline'} size={20} color="#002b45" />
            <View style={styles.previewTextWrap}>
              <Text style={styles.previewLabel}>Resumen</Text>
              <Text style={styles.previewName}>{nombre.trim() || 'Nombre del certamen'}</Text>
              <Text style={styles.previewType}>{tipo === 'RALLY' ? 'Rally' : 'InnovaTecNM'} · {estado}</Text>
              <Text style={styles.previewDate}>{fechaTexto ? `Fecha: ${fechaTexto}` : 'Fecha pendiente de seleccionar'}</Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.btnSave, (guardando || cargandoDatos) && styles.btnDisabled]}
            onPress={solicitarGuardar}
            disabled={guardando || cargandoDatos}
            accessibilityRole="button"
          >
            <Ionicons name="save-outline" size={20} color="#fff" />
            <Text style={styles.btnSaveText}>{editId ? 'Guardar cambios' : 'Guardar certamen'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnCancelForm}
            onPress={() => router.back()}
            disabled={guardando}
          >
            <Text style={styles.btnCancelFormText}>Cancelar y volver</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Confirmación antes de enviar los datos a Laravel */}
      <Modal
        visible={confirmacionVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmacionVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.confirmIconCircle}>
              <Ionicons name="save-outline" size={30} color="#002b45" />
            </View>
            <Text style={styles.modalTitle}>{editId ? '¿Guardar los cambios?' : '¿Deseas guardar?'}</Text>
            <Text style={styles.modalMessage}>
              {editId
                ? `Se actualizará la información de “${nombre.trim()}”.`
                : `Se registrará “${nombre.trim()}” como ${tipo === 'RALLY' ? 'Rally' : 'InnovaTecNM'}.`}
            </Text>
            <View style={styles.confirmSummary}>
              <View style={styles.summaryRow}>
                <Ionicons name={tipo === 'RALLY' ? 'trophy-outline' : 'bulb-outline'} size={17} color="#002b45" />
                <Text style={styles.summaryText}>{tipo === 'RALLY' ? 'Rally' : 'InnovaTecNM'}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="calendar-outline" size={17} color="#002b45" />
                <Text style={styles.summaryText}>{fechaTexto}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="ellipse" size={12} color={estado === 'Activo' ? '#15803d' : '#b91c1c'} />
                <Text style={styles.summaryText}>{estado}</Text>
              </View>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setConfirmacionVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={confirmarGuardar}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#fff" />
                <Text style={styles.confirmButtonText}>Sí, guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Pantalla modal de carga mientras se guarda o actualiza */}
      <Modal visible={guardando} transparent animationType="fade" statusBarTranslucent>
        <View style={styles.loadingBackdrop}>
          <View style={styles.loadingCard}>
            <View style={styles.loadingIconCircle}>
              <ActivityIndicator size="large" color="#002b45" />
            </View>
            <Text style={styles.loadingTitle}>{editId ? 'Guardando cambios...' : 'Guardando certamen...'}</Text>
            <Text style={styles.loadingDescription}>Estamos guardando la información. No cierres esta pantalla.</Text>
          </View>
        </View>
      </Modal>

      {/* Resultado final: éxito o error */}
      <Modal
        visible={resultadoVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setResultadoVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={[styles.resultIconCircle, resultadoExito ? styles.resultSuccess : styles.resultError]}>
              <Ionicons
                name={resultadoExito ? 'checkmark-circle-outline' : 'alert-circle-outline'}
                size={34}
                color={resultadoExito ? '#15803d' : '#b91c1c'}
              />
            </View>
            <Text style={styles.modalTitle}>{resultadoTitulo}</Text>
            <Text style={styles.modalMessage}>{resultadoMensaje}</Text>
            <TouchableOpacity style={styles.resultButton} onPress={cerrarResultado}>
              <Text style={styles.resultButtonText}>{resultadoExito ? 'Continuar' : 'Entendido'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f7fa' },
  container: { flex: 1, backgroundColor: '#f5f7fa' },
  content: { padding: 16, paddingBottom: 36 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  headingIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: '#002b45', alignItems: 'center', justifyContent: 'center' },
  headingTextWrap: { flex: 1 },
  title: { fontSize: 22, fontWeight: '800', color: '#002b45' },
  subtitle: { marginTop: 3, fontSize: 13, color: '#64748b' },
  loadingInline: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, marginBottom: 12, backgroundColor: '#eaf2f8', borderRadius: 10 },
  loadingInlineText: { color: '#334155', fontSize: 13 },
  formCard: { backgroundColor: '#fff', padding: 17, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', elevation: 2 },
  label: { fontSize: 14, fontWeight: '700', color: '#334155', marginTop: 13, marginBottom: 7 },
  required: { color: '#dc2626' },
  input: { backgroundColor: '#f8fafc', borderRadius: 10, paddingHorizontal: 13, minHeight: 47, borderWidth: 1, borderColor: '#cbd5e1', color: '#243447', fontSize: 14 },
  tipoRow: { flexDirection: 'row', gap: 10 },
  tipoOption: { flex: 1, minHeight: 54, flexDirection: 'row', gap: 7, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 12, borderWidth: 1, borderColor: '#cbd5e1' },
  tipoSelected: { backgroundColor: '#002b45', borderColor: '#002b45' },
  tipoText: { color: '#002b45', fontWeight: '700', fontSize: 13 },
  tipoTextSelected: { color: '#fff' },
  datePickerButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 10, paddingHorizontal: 12, minHeight: 47, borderWidth: 1, borderColor: '#cbd5e1', gap: 10 },
  webDateWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 10, paddingHorizontal: 12, minHeight: 47, borderWidth: 1, borderColor: '#cbd5e1', gap: 10 },
  datePickerText: { flex: 1, fontSize: 14, color: '#243447' },
  placeholderText: { color: '#94a3b8' },
  nativeDatePicker: { marginTop: 8, padding: 10, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', alignItems: 'flex-start' },
  dateDoneButton: { alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 12 },
  dateDoneText: { color: '#002b45', fontWeight: '700' },
  statusRow: { flexDirection: 'row', gap: 10, marginTop: 2 },
  statusOption: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, flex: 1, gap: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  statusSelectedActive: { borderColor: '#86efac', backgroundColor: '#f0fdf4' },
  statusSelectedInactive: { borderColor: '#fca5a5', backgroundColor: '#fef2f2' },
  statusOptionText: { fontSize: 14, fontWeight: '600', color: '#475569' },
  statusTextActive: { color: '#166534' },
  statusTextInactive: { color: '#991b1b' },
  previewCard: { flexDirection: 'row', gap: 12, marginTop: 21, padding: 13, borderRadius: 12, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#dbeafe' },
  previewTextWrap: { flex: 1 },
  previewLabel: { fontSize: 11, color: '#64748b', fontWeight: '700', textTransform: 'uppercase' },
  previewName: { color: '#0f172a', fontSize: 15, fontWeight: '800', marginTop: 2 },
  previewType: { color: '#1d4ed8', fontSize: 13, fontWeight: '700', marginTop: 3 },
  previewDate: { color: '#475569', fontSize: 12, marginTop: 3 },
  btnSave: { flexDirection: 'row', backgroundColor: '#002b45', borderRadius: 11, minHeight: 51, justifyContent: 'center', alignItems: 'center', marginTop: 22, gap: 9, paddingHorizontal: 14 },
  btnDisabled: { backgroundColor: '#64748b', opacity: 0.8 },
  btnSaveText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  btnCancelForm: { minHeight: 42, marginTop: 8, justifyContent: 'center', alignItems: 'center' },
  btnCancelFormText: { color: '#64748b', fontWeight: '700', fontSize: 14 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.58)', justifyContent: 'center', alignItems: 'center', padding: 22 },
  modalCard: { width: '100%', maxWidth: 430, backgroundColor: '#fff', borderRadius: 22, padding: 24, alignItems: 'center', elevation: 14, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 9 } },
  confirmIconCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  modalTitle: { fontSize: 22, lineHeight: 28, fontWeight: '800', color: '#0f172a', textAlign: 'center', marginBottom: 9 },
  modalMessage: { fontSize: 14, lineHeight: 21, color: '#64748b', textAlign: 'center', marginBottom: 18 },
  confirmSummary: { width: '100%', padding: 13, backgroundColor: '#f8fafc', borderRadius: 12, gap: 10, marginBottom: 20, borderWidth: 1, borderColor: '#e2e8f0' },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  summaryText: { fontSize: 13, color: '#334155', fontWeight: '600' },
  modalActions: { flexDirection: 'row', width: '100%', gap: 10 },
  modalButton: { flex: 1, minHeight: 46, borderRadius: 11, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  cancelButton: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1' },
  cancelButtonText: { color: '#334155', fontWeight: '800', fontSize: 14 },
  confirmButton: { backgroundColor: '#002b45' },
  confirmButtonText: { color: '#fff', fontWeight: '800', fontSize: 14 },
  loadingBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.68)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  loadingCard: { width: '100%', maxWidth: 330, backgroundColor: '#fff', borderRadius: 22, padding: 28, alignItems: 'center', elevation: 16, shadowColor: '#000', shadowOpacity: 0.22, shadowRadius: 20, shadowOffset: { width: 0, height: 9 } },
  loadingIconCircle: { width: 74, height: 74, borderRadius: 37, alignItems: 'center', justifyContent: 'center', backgroundColor: '#eff6ff' },
  loadingTitle: { marginTop: 18, fontSize: 19, fontWeight: '800', color: '#002b45', textAlign: 'center' },
  loadingDescription: { marginTop: 8, fontSize: 14, lineHeight: 20, color: '#64748b', textAlign: 'center' },
  resultIconCircle: { width: 68, height: 68, borderRadius: 34, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  resultSuccess: { backgroundColor: '#dcfce7' },
  resultError: { backgroundColor: '#fee2e2' },
  resultButton: { width: '100%', minHeight: 46, backgroundColor: '#002b45', borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  resultButtonText: { color: '#fff', fontWeight: '800', fontSize: 14 },
});