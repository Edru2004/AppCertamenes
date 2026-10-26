import {
  actualizarEquipo,

  crearEquipo,

  getCategCertamenes,

  getCertamenes,

  getDesafios,

  getSalas,
} from '@/services/api';

import { Ionicons } from '@expo/vector-icons';

import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import { useCallback, useMemo, useState } from 'react';

import {
  ActivityIndicator,

  FlatList,

  Modal,

  ScrollView,

  StyleSheet,

  Text,

  TextInput,

  TouchableOpacity,

  View,
} from 'react-native';

type CatalogItem = Record<string, any>;

type ModalType = 'certamen' | 'desafio' | 'categoria' | 'sala' | null;

type ResultState = { visible: boolean; success: boolean; title: string; message: string };

const readList = (value: any): CatalogItem[] => {

  if (Array.isArray(value)) return value;

  if (Array.isArray(value?.data)) return value.data;

  return [];

};

const toNumberOrNull = (value: any): number | null => {

  if (value === null || value === undefined || value === '') return null;

  const result = Number(value);

  return Number.isFinite(result) ? result : null;

};

const getCertamenRecordId = (item: CatalogItem) => toNumberOrNull(item.Id_certamen ?? item.Id_Certamen ?? item.id_certamen ?? item.idCertamen ?? item.id);

const getParentCertamenId = (item: CatalogItem) => toNumberOrNull(item.Id_certamen ?? item.Id_Certamen ?? item.id_certamen ?? item.idCertamen);

const getDesafioId = (item: CatalogItem) => Number(item.Id_desafio ?? item.idDesafio ?? item.id_desafio ?? item.id);

const getCategoriaId = (item: CatalogItem) => Number(item.Id_categCertamen ?? item.idCategoria_certa ?? item.id_categCertamen ?? item.id);

const getSalaId = (item: CatalogItem) => toNumberOrNull(item.Id_sala ?? item.idSala ?? item.id_sala ?? item.id);

const getItemName = (item: CatalogItem, fallback: string) => String(item.Nombre ?? item.nombre ?? fallback);
const getCertamenNombre = (item?: CatalogItem | null) => String(item?.Nombre ?? item?.nombre ?? item?.name ?? 'Certamen sin nombre');

const getTipo = (item?: CatalogItem | null) => String(item?.Tipo ?? item?.tipo ?? '').toUpperCase();

const paramNumber = (value: string | string[] | undefined) => toNumberOrNull(Array.isArray(value) ? value[0] : value);

export default function EquipoFormScreen() {

  const router = useRouter();

  const params = useLocalSearchParams<{ equipoEditar?: string | string[]; id_certamen?: string | string[] }>();

  const equipoEditar = Array.isArray(params.equipoEditar) ? params.equipoEditar[0] : params.equipoEditar ?? '';

  const [idEquipo, setIdEquipo] = useState<number | null>(null);

  const [idCertamen, setIdCertamen] = useState<number | null>(paramNumber(params.id_certamen));

  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);

  const [guardando, setGuardando] = useState(false);

  const [confirmarGuardar, setConfirmarGuardar] = useState(false);

  const [modalType, setModalType] = useState<ModalType>(null);

  const [resultado, setResultado] = useState<ResultState>({ visible: false, success: false, title: '', message: '' });

  const [listaCertamenes, setListaCertamenes] = useState<CatalogItem[]>([]);

  const [listaDesafios, setListaDesafios] = useState<CatalogItem[]>([]);

  const [listaCategorias, setListaCategorias] = useState<CatalogItem[]>([]);

  const [listaSalas, setListaSalas] = useState<CatalogItem[]>([]);

  const [nombre, setNombre] = useState('');

  const [idDesafio, setIdDesafio] = useState<number | null>(null);

  const [idCategCertamen, setIdCategCertamen] = useState<number | null>(null);

  const [idSala, setIdSala] = useState<number | null>(null);

  const [video, setVideo] = useState('');

  const [reporte, setReporte] = useState('');

  const cargarCatalogos = useCallback(async () => {

    setCargandoCatalogos(true);

    try {

      const [certamenesRes, desafiosRes, categoriasRes, salasRes] = await Promise.all([

        getCertamenes(),

        getDesafios(),

        getCategCertamenes(),

        getSalas(),

      ]);

      const certamenes = readList(certamenesRes);

      const desafios = readList(desafiosRes);

      const categorias = readList(categoriasRes);

      const salas = readList(salasRes);

      setListaCertamenes(certamenes);

      setListaDesafios(desafios);

      setListaCategorias(categorias);

      setListaSalas(salas);

      let equipo: CatalogItem | null = null;

      if (equipoEditar.trim()) {

        try {

          equipo = JSON.parse(equipoEditar);

        } catch {

          throw new Error('No fue posible leer los datos del equipo que deseas editar.');

        }

      }

      const idDesdeRuta = paramNumber(params.id_certamen);

      const idDesdeEquipo = toNumberOrNull(

        equipo?.desafio?.Id_certamen ??

        equipo?.categoriaCertamen?.Id_Certamen ??

        equipo?.categoria_certamen?.Id_Certamen ??

        equipo?.desafio?.id_certamen ??

        equipo?.categoriaCertamen?.id_certamen

      );

      const candidato = idDesdeRuta ?? idDesdeEquipo;

      const idInicial = candidato && certamenes.some((c) => getCertamenRecordId(c) === candidato)

        ? candidato

        : (certamenes.length ? getCertamenRecordId(certamenes[0]) : null);

      setIdCertamen(idInicial);

      if (equipo) {

        setIdEquipo(toNumberOrNull(equipo.Id_equipo ?? equipo.id_equipo ?? equipo.id));

        setNombre(String(equipo.Nombre ?? equipo.nombre ?? ''));

        setIdDesafio(toNumberOrNull(equipo.Id_desafio ?? equipo.idDesafio ?? equipo.id_desafio));

        setIdCategCertamen(toNumberOrNull(equipo.Id_categCertamen ?? equipo.idCategCertamen ?? equipo.id_categCertamen));

        setIdSala(toNumberOrNull(equipo.Id_sala ?? equipo.idSala ?? equipo.id_sala));

        setVideo(String(equipo.Video ?? equipo.video ?? ''));

        setReporte(String(equipo.Reporte ?? equipo.reporte ?? ''));

      } else {

        setIdEquipo(null);

        setNombre('');

        setIdDesafio(null);

        setIdCategCertamen(null);

        setIdSala(null);

        setVideo('');

        setReporte('');

      }

    } catch (error: any) {

      setResultado({

        visible: true,

        success: false,

        title: 'Error al cargar datos',

        message: error?.message || 'No se pudieron cargar los certámenes, desafíos, categorías y salas. Revisa la conexión con la API.',

      });

    } finally {

      setCargandoCatalogos(false);

    }

  }, [equipoEditar, params.id_certamen]);

  useFocusEffect(

    useCallback(() => {

      void cargarCatalogos();

      return undefined;

    }, [cargarCatalogos])

  );

  const certamenSeleccionado = listaCertamenes.find((item) => getCertamenRecordId(item) === idCertamen) ?? null;

  const esInnovaTec = getTipo(certamenSeleccionado) === 'INNOVATEC';

  const desafiosDisponibles = useMemo(

    () => listaDesafios.filter((item) => getParentCertamenId(item) === idCertamen),

    [listaDesafios, idCertamen]

  );

  const categoriasDisponibles = useMemo(

    () => listaCategorias.filter((item) => getParentCertamenId(item) === idCertamen),

    [listaCategorias, idCertamen]

  );

  const salasDisponibles = useMemo(

    () => esInnovaTec ? listaSalas.filter((item) => getParentCertamenId(item) === idCertamen) : [],

    [listaSalas, idCertamen, esInnovaTec]

  );

  const desafioSeleccionado = desafiosDisponibles.find((item) => getDesafioId(item) === idDesafio);

  const categoriaSeleccionada = categoriasDisponibles.find((item) => getCategoriaId(item) === idCategCertamen);

  const salaSeleccionada = salasDisponibles.find((item) => getSalaId(item) === idSala);

  const limpiarDependenciasAlCambiarCertamen = (item: CatalogItem) => {

    const nuevoId = getCertamenRecordId(item);

    if (nuevoId == null) return;

    if (nuevoId !== idCertamen) {

      setIdDesafio(null);

      setIdCategCertamen(null);

      setIdSala(null);

    }

    setIdCertamen(nuevoId);

    setModalType(null);

  };

  const validarFormulario = () => {

    if (!idCertamen || !certamenSeleccionado) {

      setResultado({ visible: true, success: false, title: 'Dato requerido', message: 'Selecciona el certamen al que pertenece el equipo.' });

      return false;

    }

    if (!nombre.trim()) {

      setResultado({ visible: true, success: false, title: 'Dato requerido', message: 'Ingresa el nombre del equipo.' });

      return false;

    }

    if (!idDesafio || !desafiosDisponibles.some((item) => getDesafioId(item) === idDesafio)) {

      setResultado({ visible: true, success: false, title: 'Desafío requerido', message: 'Selecciona un desafío perteneciente al certamen elegido.' });

      return false;

    }

    if (!idCategCertamen || !categoriasDisponibles.some((item) => getCategoriaId(item) === idCategCertamen)) {

      setResultado({ visible: true, success: false, title: 'Categoría requerida', message: 'Selecciona una categoría perteneciente al certamen elegido.' });

      return false;

    }

    if (!esInnovaTec && idSala !== null) {

      setIdSala(null);

    }

    if (esInnovaTec && idSala !== null && !salasDisponibles.some((item) => getSalaId(item) === idSala)) {

      setResultado({ visible: true, success: false, title: 'Sala no válida', message: 'Selecciona una sala perteneciente a InnovaTecNM o elige “Sin Sala”.' });

      return false;

    }

    return true;

  };

  const solicitarGuardar = () => {

    if (!validarFormulario()) return;

    setConfirmarGuardar(true);

  };

  const handleGuardar = async () => {

    setConfirmarGuardar(false);

    if (!idCertamen || !validarFormulario()) return;

    const payload = {

      Nombre: nombre.trim(),

      Id_desafio: Number(idDesafio),

      Id_categCertamen: Number(idCategCertamen),

      // Rally no utiliza salas; Laravel valida esta regla también en el servidor.

      Id_sala: esInnovaTec && idSala ? Number(idSala) : null,

      Video: video.trim() || null,

      Reporte: reporte.trim() || null,

    };

    try {

      setGuardando(true);

      if (idEquipo) await actualizarEquipo(idEquipo, payload);

      else await crearEquipo(payload);

      setResultado({

        visible: true,

        success: true,

        title: '¡Operación exitosa!',

        message: `El equipo "${nombre.trim()}" se ha ${idEquipo ? 'actualizado' : 'registrado'} correctamente en ${getCertamenNombre(certamenSeleccionado)}.`,

      });

    } catch (error: any) {

      setResultado({

        visible: true,

        success: false,

        title: 'Error al guardar',

        message: error?.message || 'Ocurrió un error al guardar el equipo en la base de datos.',

      });

    } finally {

      setGuardando(false);

    }

  };

  const cerrarResultado = () => {

    const fueExito = resultado.success;

    setResultado((current) => ({ ...current, visible: false }));

    if (fueExito) {

      router.replace({ pathname: '/equipos' as any, params: { id_certamen: String(idCertamen ?? '') } } as any);

    }

  };

  const opcionesActuales: CatalogItem[] = modalType === 'certamen'

    ? listaCertamenes

    : modalType === 'desafio'

      ? desafiosDisponibles

      : modalType === 'categoria'

        ? categoriasDisponibles

        : modalType === 'sala'

          ? [{ Id_sala: null, Nombre: 'Sin Sala' }, ...salasDisponibles]

          : [];

  const tituloSelector = modalType === 'certamen'

    ? 'Selecciona un certamen'

    : modalType === 'desafio'

      ? 'Selecciona un desafío'

      : modalType === 'categoria'

        ? 'Selecciona una categoría'

        : 'Selecciona una sala';

  const idOpcion = (item: CatalogItem) => modalType === 'certamen'

    ? getCertamenRecordId(item)

    : modalType === 'desafio'

      ? getDesafioId(item)

      : modalType === 'categoria'

        ? getCategoriaId(item)

        : getSalaId(item);

  const seleccionarOpcion = (item: CatalogItem) => {

    if (modalType === 'certamen') limpiarDependenciasAlCambiarCertamen(item);

    if (modalType === 'desafio') { setIdDesafio(getDesafioId(item)); setModalType(null); }

    if (modalType === 'categoria') { setIdCategCertamen(getCategoriaId(item)); setModalType(null); }

    if (modalType === 'sala') { setIdSala(getSalaId(item)); setModalType(null); }

  };

  if (cargandoCatalogos) {

    return (

      <View style={styles.loadingContainer}>

        <ActivityIndicator size="large" color="#002b45" />

        <Text style={styles.loadingText}>Cargando certámenes, desafíos, categorías y salas...</Text>

      </View>

    );

  }

  return (

    <View style={styles.screen}>

      <ScrollView style={styles.container} contentContainerStyle={styles.formContent} keyboardShouldPersistTaps="handled">

        <Text style={styles.title}>{idEquipo ? 'Editar Equipo' : 'Registro de Equipo'}</Text>

        <View style={styles.card}>

          <Text style={styles.label}>Certamen *</Text>

          <TouchableOpacity style={styles.selectButton} onPress={() => setModalType('certamen')}>

            <Text style={certamenSeleccionado ? styles.selectText : styles.placeholderText}>

              {certamenSeleccionado ? `${getCertamenNombre(certamenSeleccionado)} · ${getTipo(certamenSeleccionado) === 'INNOVATEC' ? 'InnovaTecNM' : getTipo(certamenSeleccionado) === 'RALLY' ? 'Rally' : getTipo(certamenSeleccionado)}` : 'Selecciona un certamen'}

            </Text>

            <Ionicons name="chevron-down-outline" size={18} color="#666" />

          </TouchableOpacity>

          <Text style={styles.label}>Nombre del equipo *</Text>

          <TextInput style={styles.input} placeholder="Ej. Alpha Tech" value={nombre} onChangeText={setNombre} />

          <Text style={styles.label}>Desafío *</Text>

          <TouchableOpacity style={styles.selectButton} onPress={() => setModalType('desafio')} disabled={!idCertamen}>

            <Text style={desafioSeleccionado ? styles.selectText : styles.placeholderText}>

              {desafioSeleccionado ? getItemName(desafioSeleccionado, `Desafío #${idDesafio}`) : 'Selecciona un desafío del certamen'}

            </Text>

            <Ionicons name="chevron-down-outline" size={18} color="#666" />

          </TouchableOpacity>

          {idCertamen && desafiosDisponibles.length === 0 && <Text style={styles.helperText}>Este certamen todavía no tiene desafíos registrados.</Text>}

          <Text style={styles.label}>Categoría del certamen *</Text>

          <TouchableOpacity style={styles.selectButton} onPress={() => setModalType('categoria')} disabled={!idCertamen}>

            <Text style={categoriaSeleccionada ? styles.selectText : styles.placeholderText}>

              {categoriaSeleccionada ? getItemName(categoriaSeleccionada, `Categoría #${idCategCertamen}`) : 'Selecciona una categoría del certamen'}

            </Text>

            <Ionicons name="chevron-down-outline" size={18} color="#666" />

          </TouchableOpacity>

          {idCertamen && categoriasDisponibles.length === 0 && <Text style={styles.helperText}>Este certamen todavía no tiene categorías registradas.</Text>}

          <Text style={styles.label}>Sala asignada {esInnovaTec ? '(opcional)' : ''}</Text>

          {esInnovaTec ? (

            <TouchableOpacity style={styles.selectButton} onPress={() => setModalType('sala')}>

              <Text style={idSala === null ? styles.placeholderText : styles.selectText}>{salaSeleccionada ? getItemName(salaSeleccionada, `Sala #${idSala}`) : 'Sin Sala'}</Text>

              <Ionicons name="chevron-down-outline" size={18} color="#666" />

            </TouchableOpacity>

          ) : (

            <View style={styles.readOnlyNotice}>

              <Ionicons name="information-circle-outline" size={17} color="#64748b" />

              <Text style={styles.helperText}>Rally no utiliza salas; este campo permanecerá vacío.</Text>

            </View>

          )}

          <Text style={styles.label}>Enlace del video demostrativo (URL)</Text>

          <TextInput style={styles.input} placeholder="https://youtube.com/watch?v=..." value={video} onChangeText={setVideo} autoCapitalize="none" keyboardType="url" />

          <Text style={styles.label}>Enlace del reporte en PDF (URL / Drive)</Text>

          <TextInput style={styles.input} placeholder="https://drive.google.com/file/d/..." value={reporte} onChangeText={setReporte} autoCapitalize="none" keyboardType="url" />

          <TouchableOpacity style={[styles.btnSave, guardando && styles.disabledButton]} onPress={solicitarGuardar} disabled={guardando}>

            <Ionicons name="save-outline" size={20} color="#fff" />

            <Text style={styles.btnSaveText}>{idEquipo ? 'Actualizar equipo' : 'Guardar equipo'}</Text>

          </TouchableOpacity>

        </View>

      </ScrollView>

      <Modal visible={modalType !== null} transparent animationType="fade" onRequestClose={() => setModalType(null)}>

        <View style={styles.overlay}>

          <View style={styles.selectorModal}>

            <View style={styles.modalHeader}>

              <Text style={styles.modalTitle}>{tituloSelector}</Text>

              <TouchableOpacity onPress={() => setModalType(null)} accessibilityLabel="Cerrar selector"><Ionicons name="close" size={24} color="#333" /></TouchableOpacity>

            </View>

            {opcionesActuales.length === 0 ? (

              <Text style={styles.emptyText}>No hay opciones disponibles para el certamen seleccionado.</Text>

            ) : (

              <FlatList

                data={opcionesActuales}

                keyExtractor={(item, index) => `${idOpcion(item) ?? 'sin-sala'}-${index}`}

                renderItem={({ item }) => (

                  <TouchableOpacity style={styles.modalItem} onPress={() => seleccionarOpcion(item)}>

                    <View style={{ flex: 1 }}>

                      <Text style={styles.modalItemText}>{getItemName(item, 'Opción sin nombre')}</Text>

                      {modalType === 'certamen' && <Text style={styles.helperText}>{getTipo(item) === 'INNOVATEC' ? 'InnovaTecNM' : getTipo(item) === 'RALLY' ? 'Rally' : getTipo(item)}</Text>}

                    </View>

                    <Ionicons name="chevron-forward" size={16} color="#64748b" />

                  </TouchableOpacity>

                )}

              />

            )}

          </View>

        </View>

      </Modal>

      <Modal visible={confirmarGuardar} transparent animationType="fade" onRequestClose={() => setConfirmarGuardar(false)}>

        <View style={styles.overlay}>

          <View style={styles.dialog}>

            <View style={styles.iconCircle}><Ionicons name="help-circle-outline" size={32} color="#002b45" /></View>

            <Text style={styles.dialogTitle}>{idEquipo ? 'Confirmar cambios' : 'Confirmar registro'}</Text>

            <Text style={styles.dialogMessage}>¿Deseas {idEquipo ? 'guardar los cambios del' : 'registrar el'} equipo "{nombre.trim()}" en {getCertamenNombre(certamenSeleccionado)}?</Text>

            <View style={styles.dialogActions}>

              <TouchableOpacity style={styles.cancelButton} onPress={() => setConfirmarGuardar(false)}><Text style={styles.cancelButtonText}>Cancelar</Text></TouchableOpacity>

              <TouchableOpacity style={styles.confirmButton} onPress={handleGuardar}><Text style={styles.confirmButtonText}>Confirmar</Text></TouchableOpacity>

            </View>

          </View>

        </View>

      </Modal>

      <Modal transparent visible={guardando} animationType="fade" onRequestClose={() => {}}>

        <View style={styles.overlay}><View style={styles.loadingModal}><ActivityIndicator size="large" color="#002b45" /><Text style={styles.modalMessage}>{idEquipo ? 'Actualizando equipo...' : 'Registrando equipo...'}</Text></View></View>

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

  screen: { flex: 1, backgroundColor: '#f5f7fa' },

  container: { flex: 1, backgroundColor: '#f5f7fa', padding: 15 },

  formContent: { paddingBottom: 30 },

  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f7fa', padding: 20 },

  loadingText: { marginTop: 10, color: '#002b45', fontWeight: '600', textAlign: 'center' },

  title: { fontSize: 20, fontWeight: 'bold', color: '#002b45', marginBottom: 15 },

  card: { backgroundColor: '#fff', padding: 16, borderRadius: 12, elevation: 2 },

  label: { fontSize: 13, fontWeight: '700', color: '#475569', marginTop: 14, marginBottom: 7 },

  input: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, height: 44, borderWidth: 1, borderColor: '#cbd5e1', color: '#1e293b' },

  selectButton: { backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 12, minHeight: 46, borderWidth: 1, borderColor: '#cbd5e1', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },

  selectText: { color: '#1e293b', fontSize: 14, flex: 1 },

  placeholderText: { color: '#94a3b8', fontSize: 14, flex: 1 },

  helperText: { color: '#64748b', fontSize: 12, lineHeight: 17, marginTop: 5, flexShrink: 1 },

  readOnlyNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f1f5f9', borderRadius: 8, padding: 10 },

  btnSave: { flexDirection: 'row', backgroundColor: '#002b45', borderRadius: 9, minHeight: 48, justifyContent: 'center', alignItems: 'center', marginTop: 25, marginBottom: 12, gap: 8 },

  disabledButton: { opacity: 0.6 },

  btnSaveText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },

  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.45)', justifyContent: 'center', alignItems: 'center', padding: 20 },

  selectorModal: { backgroundColor: '#fff', borderRadius: 14, padding: 16, maxHeight: '75%', width: '100%', maxWidth: 520 },

  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 12, marginBottom: 5, borderBottomWidth: 1, borderBottomColor: '#e2e8f0', gap: 10 },

  modalTitle: { fontSize: 17, fontWeight: 'bold', color: '#002b45', flex: 1 },

  modalItem: { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },

  modalItemText: { fontSize: 14, color: '#334155', flex: 1 },

  emptyText: { textAlign: 'center', paddingVertical: 24, color: '#64748b' },

  dialog: { width: '100%', maxWidth: 430, backgroundColor: '#fff', padding: 22, borderRadius: 16, alignItems: 'center', elevation: 8 },

  iconCircle: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#eaf1f7', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },

  successCircle: { backgroundColor: '#dcfce7' },

  errorCircle: { backgroundColor: '#fee2e2' },

  dialogTitle: { fontSize: 18, color: '#0f172a', fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },

  dialogMessage: { color: '#475569', fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 20 },

  dialogActions: { flexDirection: 'row', width: '100%', gap: 10 },

  cancelButton: { flex: 1, height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },

  cancelButtonText: { color: '#334155', fontWeight: '600' },

  confirmButton: { flex: 1, height: 44, borderRadius: 8, backgroundColor: '#002b45', alignItems: 'center', justifyContent: 'center' },

  confirmButtonFull: { alignSelf: 'stretch', height: 44, borderRadius: 8, backgroundColor: '#002b45', alignItems: 'center', justifyContent: 'center' },

  confirmButtonText: { color: '#fff', fontWeight: 'bold' },

  loadingModal: { backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 26, paddingVertical: 24, minWidth: 220, alignItems: 'center' },

  modalMessage: { fontSize: 14, color: '#334155', fontWeight: '600', marginTop: 12, textAlign: 'center' },

});
