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
  actualizarDesafio,
  crearDesafio,
  getCertamenes,
  getDesafios,
} from '../../../services/api';

type Certamen = {
  id: number;
  nombre: string;
  tipo?: string;
};

type Resultado = {
  visible: boolean;
  titulo: string;
  mensaje: string;
  tipo: 'success' | 'error' | 'warning';
  alCerrar?: () => void;
};

const resultadoInicial: Resultado = {
  visible: false,
  titulo: '',
  mensaje: '',
  tipo: 'success',
};

function extraerLista(respuesta: any): any[] {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.data)) return respuesta.data;
  if (Array.isArray(respuesta?.data?.data)) return respuesta.data.data;
  return [];
}

function obtenerIdCertamen(item: any): number | null {
  const raw =
    item?.Id_certamen ??
    item?.id_certamen ??
    item?.idCertamen ??
    item?.id;
  const id = Number(raw);
  return Number.isFinite(id) && id > 0 ? id : null;
}

export default function DesafiosFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const editId = params.id ? String(params.id) : null;

  const [certamenes, setCertamenes] = useState<Certamen[]>([]);
  const [idCertamenSel, setIdCertamenSel] = useState<number | null>(
    params.idCertamen ? Number(params.idCertamen) : null,
  );
  const [nombre, setNombre] = useState(params.nombre ? String(params.nombre) : '');
  const [descrip, setDescrip] = useState(params.descrip ? String(params.descrip) : '');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [confirmacionVisible, setConfirmacionVisible] = useState(false);
  const [resultado, setResultado] = useState<Resultado>(resultadoInicial);

  const mostrarResultado = (
    titulo: string,
    mensaje: string,
    tipo: Resultado['tipo'] = 'success',
    alCerrar?: () => void,
  ) => {
    setResultado({ visible: true, titulo, mensaje, tipo, alCerrar });
  };

  useEffect(() => {
    void cargarDatosIniciales();
    // Los parámetros de Expo Router definen el modo de edición al montar la pantalla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarDatosIniciales = async () => {
    setCargando(true);
    try {
      const respuestaCertamenes = await getCertamenes();
      const listaCertamenes = extraerLista(respuestaCertamenes)
        .map((item: any) => {
          const id = obtenerIdCertamen(item);
          if (id === null) return null;
          return {
            id,
            nombre: String(item?.Nombre ?? item?.nombre ?? `Certamen #${id}`),
            tipo: item?.Tipo ?? item?.tipo ?? undefined,
          } as Certamen;
        })
        .filter((item: Certamen | null): item is Certamen => item !== null);

      setCertamenes(listaCertamenes);

      let desafioExistente: any = null;
      if (editId) {
        try {
          const respuestaDesafios = await getDesafios();
          desafioExistente = extraerLista(respuestaDesafios).find((item: any) => {
            const id = item?.idDesafio ?? item?.Id_desafio ?? item?.Id_desafio ?? item?.id;
            return String(id) === editId;
          }) ?? null;
        } catch (error) {
          // Si los datos ya venían en los parámetros, se permite continuar con ellos.
          console.warn('No se pudo consultar el desafío para completar la edición:', error);
        }
      }

      if (desafioExistente) {
        setNombre(String(desafioExistente?.Nombre ?? desafioExistente?.nombre ?? params.nombre ?? ''));
        setDescrip(String(desafioExistente?.descrip ?? desafioExistente?.descripcion ?? params.descrip ?? ''));
      }

      const idDelDesafio = desafioExistente
        ? Number(
            desafioExistente?.idCertamen ??
              desafioExistente?.Id_certamen ??
              desafioExistente?.id_certamen ??
              desafioExistente?.certamen?.Id_certamen,
          )
        : null;
      const idSolicitado = params.idCertamen ? Number(params.idCertamen) : null;
      const idsDisponibles = new Set(listaCertamenes.map((item) => item.id));
      const seleccionPreferida =
        idSolicitado && idsDisponibles.has(idSolicitado)
          ? idSolicitado
          : idDelDesafio && idsDisponibles.has(idDelDesafio)
            ? idDelDesafio
            : listaCertamenes[0]?.id ?? null;
      setIdCertamenSel(seleccionPreferida);

      if (editId && !desafioExistente) {
        setNombre(params.nombre ? String(params.nombre) : '');
        setDescrip(params.descrip ? String(params.descrip) : '');
      }
    } catch (error: any) {
      mostrarResultado(
        'Error al cargar',
        error?.message || 'No se pudieron cargar los certámenes. Verifica la conexión con el servidor.',
        'error',
      );
    } finally {
      setCargando(false);
    }
  };

  const validarFormulario = (): boolean => {
    if (!idCertamenSel) {
      mostrarResultado('Falta seleccionar un certamen', 'Selecciona el certamen al que pertenece este desafío.', 'warning');
      return false;
    }
    if (!nombre.trim()) {
      mostrarResultado('Falta el nombre', 'Escribe el nombre del desafío antes de continuar.', 'warning');
      return false;
    }
    if (!descrip.trim()) {
      mostrarResultado('Falta la descripción', 'Escribe la descripción o el planteamiento del desafío.', 'warning');
      return false;
    }
    return true;
  };

  const solicitarGuardar = () => {
    if (guardando || !validarFormulario()) return;
    setConfirmacionVisible(true);
  };

  const ejecutarGuardar = async () => {
    setConfirmacionVisible(false);
    if (!idCertamenSel || !nombre.trim() || !descrip.trim()) return;

    setGuardando(true);
    const esEdicion = Boolean(editId);
    const nombreGuardado = nombre.trim();
    try {
      const payload = {
        Id_certamen: Number(idCertamenSel),
        Nombre: nombreGuardado,
        Descripcion: descrip.trim(),
      };

      if (esEdicion) {
        await actualizarDesafio(Number(editId), payload);
      } else {
        await crearDesafio(payload);
      }

      mostrarResultado(
        '¡Operación exitosa!',
        `El desafío "${nombreGuardado}" se ${esEdicion ? 'actualizó' : 'registró'} correctamente.`,
        'success',
        () => {
          setNombre('');
          setDescrip('');
          router.back();
        },
      );
    } catch (error: any) {
      mostrarResultado(
        'No se pudo guardar',
        error?.message || 'Ocurrió un error al guardar el desafío. Intenta nuevamente.',
        'error',
      );
    } finally {
      setGuardando(false);
    }
  };

  const cerrarResultado = () => {
    const alCerrar = resultado.alCerrar;
    setResultado(resultadoInicial);
    alCerrar?.();
  };

  const tipoVisible = (tipo?: string) => {
    const normalizado = String(tipo ?? '').trim().toUpperCase();
    if (normalizado === 'RALLY') return 'Rally';
    if (normalizado === 'INNOVATEC' || normalizado === 'INNOVATECNM') return 'InnovaTecNM';
    return tipo ? String(tipo) : '';
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{editId ? 'Editar Desafío' : 'Registro de Desafío'}</Text>
        <Text style={styles.subtitle}>Asocia el desafío a un certamen y completa su información.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Certamen asociado *</Text>
          {certamenes.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.warningText}>No se encontraron certámenes en la base de datos.</Text>
            </View>
          ) : (
            <View style={styles.certamenList}>
              {certamenes.map((certamen) => {
                const seleccionado = idCertamenSel === certamen.id;
                const tipo = tipoVisible(certamen.tipo);
                return (
                  <TouchableOpacity
                    key={certamen.id}
                    style={[styles.certItem, seleccionado && styles.certItemActive]}
                    onPress={() => setIdCertamenSel(certamen.id)}
                    disabled={guardando}
                    activeOpacity={0.8}
                  >
                    <View style={styles.certRow}>
                      <Text style={[styles.certIcon, seleccionado && styles.certIconActive]}>
                        {seleccionado ? '●' : '○'}
                      </Text>
                      <View style={styles.certInfo}>
                        <Text style={[styles.certText, seleccionado && styles.certTextActive]}>{certamen.nombre}</Text>
                        {tipo ? <Text style={styles.certType}>{tipo}</Text> : null}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <Text style={styles.label}>Nombre del desafío *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej. Aprovechamiento de Tetra Pak"
            placeholderTextColor="#94a3b8"
            value={nombre}
            onChangeText={setNombre}
            editable={!guardando}
            maxLength={150}
          />

          <Text style={styles.label}>Descripción *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Escribe la problemática o planteamiento del desafío..."
            placeholderTextColor="#94a3b8"
            value={descrip}
            onChangeText={setDescrip}
            multiline
            numberOfLines={4}
            editable={!guardando}
            textAlignVertical="top"
          />

          <TouchableOpacity
            style={[styles.btnSave, (guardando || !idCertamenSel || certamenes.length === 0) && styles.btnDisabled]}
            onPress={solicitarGuardar}
            disabled={guardando || !idCertamenSel || certamenes.length === 0}
            activeOpacity={0.85}
          >
            <Text style={styles.btnSaveText}>{editId ? 'Guardar cambios' : 'Guardar desafío'}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal transparent animationType="fade" visible={cargando} onRequestClose={() => {}}>
        <View style={styles.modalOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#002b45" />
            <Text style={styles.loadingTitle}>Cargando datos...</Text>
            <Text style={styles.loadingText}>Consultando certámenes y desafío.</Text>
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={confirmacionVisible} onRequestClose={() => setConfirmacionVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIcon, styles.iconWarning]}><Text style={styles.modalIconText}>?</Text></View>
            <Text style={styles.modalTitle}>{editId ? 'Confirmar cambios' : 'Confirmar registro'}</Text>
            <Text style={styles.modalMessage}>
              ¿Deseas {editId ? 'guardar los cambios del' : 'registrar el'} desafío "{nombre.trim()}"?
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalButton, styles.buttonSecondary]} onPress={() => setConfirmacionVisible(false)}>
                <Text style={styles.buttonSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.buttonPrimary]} onPress={ejecutarGuardar}>
                <Text style={styles.buttonPrimaryText}>{editId ? 'Sí, guardar' : 'Sí, registrar'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={guardando} onRequestClose={() => {}}>
        <View style={styles.modalOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#002b45" />
            <Text style={styles.loadingTitle}>{editId ? 'Guardando cambios...' : 'Registrando desafío...'}</Text>
            <Text style={styles.loadingText}>No cierres esta ventana mientras se procesa la solicitud.</Text>
          </View>
        </View>
      </Modal>

      <Modal transparent animationType="fade" visible={resultado.visible} onRequestClose={cerrarResultado}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View
              style={[
                styles.modalIcon,
                resultado.tipo === 'success' ? styles.iconSuccess : resultado.tipo === 'warning' ? styles.iconWarning : styles.iconError,
              ]}
            >
              <Text style={styles.modalIconText}>{resultado.tipo === 'success' ? '✓' : resultado.tipo === 'warning' ? '!' : '×'}</Text>
            </View>
            <Text style={styles.modalTitle}>{resultado.titulo}</Text>
            <Text style={styles.modalMessage}>{resultado.mensaje}</Text>
            <TouchableOpacity style={[styles.modalButton, styles.buttonPrimary, styles.resultButton]} onPress={cerrarResultado}>
              <Text style={styles.buttonPrimaryText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f5f7fa' },
  container: { flex: 1 },
  content: { padding: 15, paddingBottom: 28 },
  title: { fontSize: 21, fontWeight: '800', color: '#002b45', marginBottom: 5 },
  subtitle: { fontSize: 13, color: '#64748b', marginBottom: 16, lineHeight: 19 },
  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, elevation: 2, shadowColor: '#0f172a', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
  label: { fontSize: 13, fontWeight: '700', color: '#475569', marginBottom: 8, marginTop: 14 },
  certamenList: { gap: 8, marginBottom: 4 },
  certItem: { padding: 12, borderRadius: 9, borderWidth: 1.5, borderColor: '#e2e8f0', backgroundColor: '#f8fafc' },
  certItemActive: { borderColor: '#002b45', backgroundColor: '#eaf2f8' },
  certRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  certIcon: { fontSize: 18, color: '#94a3b8', width: 22, textAlign: 'center' },
  certIconActive: { color: '#002b45' },
  certInfo: { flex: 1 },
  certText: { fontSize: 14, color: '#334155' },
  certTextActive: { fontWeight: '700', color: '#002b45' },
  certType: { fontSize: 11, color: '#64748b', marginTop: 3 },
  emptyBox: { padding: 12, backgroundColor: '#fef2f2', borderRadius: 8, marginBottom: 10 },
  warningText: { fontSize: 12, color: '#dc2626', textAlign: 'center' },
  input: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, minHeight: 46, borderWidth: 1, borderColor: '#cbd5e1', color: '#0f172a', fontSize: 14 },
  textArea: { height: 115, textAlignVertical: 'top', paddingTop: 12 },
  btnSave: { backgroundColor: '#002b45', borderRadius: 9, minHeight: 49, justifyContent: 'center', alignItems: 'center', marginTop: 25, paddingHorizontal: 14 },
  btnDisabled: { backgroundColor: '#94a3b8' },
  btnSaveText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.48)', justifyContent: 'center', alignItems: 'center', padding: 22 },
  modalCard: { width: '100%', maxWidth: 430, backgroundColor: '#fff', borderRadius: 16, padding: 22, alignItems: 'center', elevation: 8 },
  loadingCard: { width: '100%', maxWidth: 360, backgroundColor: '#fff', borderRadius: 16, padding: 26, alignItems: 'center', elevation: 8 },
  loadingTitle: { color: '#002b45', fontSize: 16, fontWeight: '700', marginTop: 14, textAlign: 'center' },
  loadingText: { color: '#64748b', fontSize: 13, marginTop: 6, textAlign: 'center', lineHeight: 19 },
  modalIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  iconSuccess: { backgroundColor: '#dcfce7' },
  iconWarning: { backgroundColor: '#fef3c7' },
  iconError: { backgroundColor: '#fee2e2' },
  modalIconText: { fontSize: 26, fontWeight: '800', color: '#002b45' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', textAlign: 'center' },
  modalMessage: { fontSize: 14, lineHeight: 21, color: '#475569', textAlign: 'center', marginTop: 9, marginBottom: 20 },
  modalActions: { flexDirection: 'row', gap: 10, width: '100%' },
  modalButton: { minHeight: 44, borderRadius: 9, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  buttonSecondary: { backgroundColor: '#f1f5f9', flex: 1 },
  buttonSecondaryText: { color: '#334155', fontWeight: '700', fontSize: 14 },
  buttonPrimary: { backgroundColor: '#002b45', flex: 1 },
  buttonPrimaryText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  resultButton: { width: '100%', flex: 0 },
});
