// @ts-nocheck
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  eliminarRubrica,
  getCategCertamenes,
  getCertamenes,
  getRubricas,
} from '../../../services/api';

const obtenerLista = (respuesta: any): any[] => {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.data)) return respuesta.data;
  if (Array.isArray(respuesta?.categorias)) return respuesta.categorias;
  if (Array.isArray(respuesta?.rubricas)) return respuesta.rubricas;
  return [];
};

const idDeCertamen = (item: any) => Number(item?.Id_certamen ?? item?.Id_Certamen ?? item?.idCertamen ?? item?.id_certamen ?? item?.id);
const idDeCategoriaCertamen = (item: any) => Number(item?.Id_categCertamen ?? item?.id_categCertamen ?? item?.idCategoria_certa ?? item?.idCategoria ?? item?.id);
const idDeRubrica = (item: any) => Number(item?.Id_rubrica ?? item?.idRubrica ?? item?.Id_Rubrica ?? item?.id);
const tipoNormalizado = (tipo: any) => String(tipo ?? '').trim().toUpperCase();
const tipoVisible = (tipo: any) => {
  const value = tipoNormalizado(tipo);
  if (value === 'RALLY') return 'Rally';
  if (value === 'INNOVATEC' || value === 'INNOVATECNM') return 'InnovaTecNM';
  return value || 'Tipo no especificado';
};
const nombreDeCertamen = (item: any) => String(item?.Nombre ?? item?.nombre ?? `Certamen #${idDeCertamen(item)}`);
const nombreDeCategoria = (item: any) => String(item?.Nombre ?? item?.nombre ?? `Categoría #${idDeCategoriaCertamen(item)}`);
const preguntaDeRubrica = (item: any) => String(item?.Pregunta ?? item?.pregunta ?? item?.criterio ?? 'Sin pregunta');
const valorDeRubrica = (item: any) => Number(item?.Valor_Max ?? item?.valor_maximo ?? item?.['valor maximo'] ?? item?.valorMaximo ?? 0);

export default function RubricasIndexScreen() {
  const router = useRouter();
  const [certamenes, setCertamenes] = useState<any[]>([]);
  const [categoriasCertamen, setCategoriasCertamen] = useState<any[]>([]);
  const [idCertamenSel, setIdCertamenSel] = useState<number | null>(null);
  const [idCategoriaSel, setIdCategoriaSel] = useState<number | null>(null);
  const idCertamenRef = useRef<number | null>(null);
  const idCategoriaRef = useRef<number | null>(null);
  const [criterios, setCriterios] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoCriterios, setCargandoCriterios] = useState(false);

  const [modalEliminarVisible, setModalEliminarVisible] = useState(false);
  const [criterioSeleccionado, setCriterioSeleccionado] = useState<any>(null);
  const [eliminando, setEliminando] = useState(false);
  const [modalResultado, setModalResultado] = useState(false);
  const [resultadoTitulo, setResultadoTitulo] = useState('');
  const [resultadoMensaje, setResultadoMensaje] = useState('');
  const [resultadoExito, setResultadoExito] = useState(false);

  const abrirResultado = (titulo: string, mensaje: string, exito = false) => {
    setResultadoTitulo(titulo);
    setResultadoMensaje(mensaje);
    setResultadoExito(exito);
    setModalResultado(true);
  };

  const cargarCriterios = async (idCategoria: number | null, mostrarCarga = true) => {
    if (!idCategoria || !Number.isFinite(Number(idCategoria)) || Number(idCategoria) <= 0) {
      setCriterios([]);
      return;
    }
    try {
      if (mostrarCarga) setCargandoCriterios(true);
      const respuesta = await getRubricas(Number(idCategoria));
      setCriterios(obtenerLista(respuesta));
    } catch (error: any) {
      setCriterios([]);
      abrirResultado(
        'No se pudieron cargar los criterios',
        error?.message || 'No se pudo obtener la rúbrica de la categoría seleccionada.',
        false,
      );
    } finally {
      if (mostrarCarga) setCargandoCriterios(false);
    }
  };

  const cargarDatos = useCallback(async () => {
    try {
      setCargando(true);
      const [respuestaCertamenes, respuestaCategorias] = await Promise.all([
        getCertamenes(),
        getCategCertamenes(),
      ]);
      const listaCertamenes = obtenerLista(respuestaCertamenes);
      const listaCategoriasBase = obtenerLista(respuestaCategorias);
      setCertamenes(listaCertamenes);

      const mapaCertamenes = new Map(listaCertamenes.map((cert: any) => [String(idDeCertamen(cert)), cert]));
      const listaCategorias = listaCategoriasBase.map((categoria: any) => {
        const padreId = categoria?.Id_Certamen ?? categoria?.Id_certamen ?? categoria?.id_certamen ?? categoria?.idCertamen ?? categoria?.certamen?.Id_certamen ?? categoria?.certamen?.Id_Certamen;
        const padre = mapaCertamenes.get(String(padreId)) ?? categoria?.certamen ?? null;
        return {
          ...categoria,
          __certamenId: padreId == null ? null : Number(padreId),
          __certamen: padre,
          __certamenNombre: padre?.Nombre ?? padre?.nombre ?? `Certamen #${padreId ?? '?'}`,
          __certamenTipo: padre?.Tipo ?? padre?.tipo ?? '',
        };
      });
      setCategoriasCertamen(listaCategorias);

      const rally = listaCertamenes.find((cert: any) => tipoNormalizado(cert?.Tipo ?? cert?.tipo) === 'RALLY');
      const actualCertamen = listaCertamenes.find((cert: any) => idDeCertamen(cert) === Number(idCertamenRef.current));
      const elegido = actualCertamen ?? rally ?? listaCertamenes[0] ?? null;
      const siguienteCertamenId = elegido ? idDeCertamen(elegido) : null;
      const categoriasDeCertamen = siguienteCertamenId == null
        ? []
        : listaCategorias.filter((cat: any) => Number(cat.__certamenId) === Number(siguienteCertamenId));
      const categoriaActual = categoriasDeCertamen.find((cat: any) => idDeCategoriaCertamen(cat) === Number(idCategoriaRef.current));
      const categoriaElegida = categoriaActual ?? categoriasDeCertamen[0] ?? null;
      const siguienteCategoriaId = categoriaElegida ? idDeCategoriaCertamen(categoriaElegida) : null;

      idCertamenRef.current = siguienteCertamenId != null && Number.isFinite(siguienteCertamenId) ? siguienteCertamenId : null;
      idCategoriaRef.current = siguienteCategoriaId != null && Number.isFinite(siguienteCategoriaId) ? siguienteCategoriaId : null;
      setIdCertamenSel(idCertamenRef.current);
      setIdCategoriaSel(idCategoriaRef.current);
      await cargarCriterios(idCategoriaRef.current, false);
    } catch (error: any) {
      abrirResultado('No se pudieron cargar las rúbricas', error?.message || 'No se pudo conectar con el servidor para obtener certámenes y categorías del certamen.', false);
    } finally {
      setCargando(false);
      setCargandoCriterios(false);
    }
    // Los refs conservan las selecciones al regresar a esta pantalla.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useFocusEffect(useCallback(() => { void cargarDatos(); }, [cargarDatos]));

  const categoriasDelCertamen = categoriasCertamen.filter(
    (item: any) => idCertamenSel != null && Number(item.__certamenId) === Number(idCertamenSel),
  );
  const categoriaActual = categoriasDelCertamen.find((item: any) => idDeCategoriaCertamen(item) === Number(idCategoriaSel));
  const certamenActual = certamenes.find((item: any) => idDeCertamen(item) === Number(idCertamenSel));
  const totalPuntos = criterios.reduce((suma: number, item: any) => suma + valorDeRubrica(item), 0);

  const seleccionarCertamen = async (id: number) => {
    const siguienteCategorias = categoriasCertamen.filter((cat: any) => Number(cat.__certamenId) === Number(id));
    const primerCategoria = siguienteCategorias[0] ?? null;
    const siguienteIdCategoria = primerCategoria ? idDeCategoriaCertamen(primerCategoria) : null;
    idCertamenRef.current = id;
    idCategoriaRef.current = siguienteIdCategoria;
    setIdCertamenSel(id);
    setIdCategoriaSel(siguienteIdCategoria);
    setCriterios([]);
    await cargarCriterios(siguienteIdCategoria, true);
  };

  const seleccionarCategoriaCertamen = async (id: number) => {
    idCategoriaRef.current = id;
    setIdCategoriaSel(id);
    await cargarCriterios(id, true);
  };

  const abrirConfirmacionEliminar = (item: any) => {
    const id = idDeRubrica(item);
    if (!Number.isFinite(id) || id <= 0) {
      abrirResultado('No se puede eliminar', 'No se encontró el identificador de este criterio.', false);
      return;
    }
    setCriterioSeleccionado({ id, pregunta: preguntaDeRubrica(item), valor: valorDeRubrica(item) });
    setModalEliminarVisible(true);
  };

  const confirmarEliminacion = async () => {
    if (!criterioSeleccionado || eliminando) return;
    const seleccionado = criterioSeleccionado;
    setModalEliminarVisible(false);
    setEliminando(true);
    try {
      await eliminarRubrica(Number(seleccionado.id));
      setCriterios((actuales) => actuales.filter((item) => idDeRubrica(item) !== Number(seleccionado.id)));
      abrirResultado('¡Criterio eliminado!', `El criterio “${seleccionado.pregunta}” se eliminó correctamente.`, true);
    } catch (error: any) {
      abrirResultado('No se pudo eliminar', error?.message || 'Ocurrió un error al eliminar el criterio. Comprueba si existen evaluaciones relacionadas.', false);
    } finally {
      setEliminando(false);
      setCriterioSeleccionado(null);
    }
  };

  return (
    <View style={styles.page}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerIcon}><Ionicons name="clipboard-outline" size={26} color="#fff" /></View>
          <Text style={styles.title}>Gestión de rúbricas</Text>
          <Text style={styles.subtitle}>Primero elige Rally o InnovaTecNM. Después verás las categorías registradas en el módulo Categorías para ese certamen y podrás administrar sus criterios.</Text>
        </View>

        <Text style={styles.sectionLabel}>1. Selecciona el certamen:</Text>
        {cargando ? (
          <View style={styles.loadingInline}><ActivityIndicator size="small" color="#002b45" /><Text style={styles.loadingInlineText}>Cargando certámenes...</Text></View>
        ) : certamenes.length === 0 ? (
          <View style={styles.emptyBox}><Ionicons name="trophy-outline" size={27} color="#64748b" /><Text style={styles.emptyTitle}>No hay certámenes registrados</Text><Text style={styles.emptyText}>Registra un certamen antes de administrar las rúbricas.</Text></View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.certamenOptions}>
            {certamenes.map((cert: any) => {
              const id = idDeCertamen(cert);
              const selected = Number(idCertamenSel) === Number(id);
              const tipo = tipoVisible(cert?.Tipo ?? cert?.tipo);
              const esRally = tipo === 'Rally';
              return (
                <TouchableOpacity key={String(id)} style={[styles.certamenOption, selected && styles.certamenOptionSelected]} onPress={() => void seleccionarCertamen(id)} disabled={cargandoCriterios || eliminando}>
                  <Ionicons name={esRally ? 'trophy-outline' : 'bulb-outline'} size={17} color={selected ? '#fff' : esRally ? '#a16207' : '#0369a1'} />
                  <View style={styles.certamenOptionInfo}>
                    <Text style={[styles.certamenOptionName, selected && styles.certamenOptionNameSelected]} numberOfLines={1}>{nombreDeCertamen(cert)}</Text>
                    <Text style={[styles.certamenOptionType, selected && styles.certamenOptionTypeSelected]}>{tipo}</Text>
                  </View>
                  {selected ? <Ionicons name="checkmark-circle" size={17} color="#fff" /> : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <Text style={styles.sectionLabel}>2. Selecciona una categoría del certamen:</Text>
        {!cargando && categoriasDelCertamen.length === 0 ? (
          <View style={styles.emptyCategoryBox}>
            <Ionicons name="albums-outline" size={24} color="#64748b" />
            <View style={{ flex: 1 }}>
              <Text style={styles.emptyTitle}>No hay categorías registradas</Text>
              <Text style={styles.emptyText}>Este certamen todavía no tiene categorías. Registra primero una categoría en el módulo Categorías.</Text>
            </View>
          </View>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryOptions}>
            {categoriasDelCertamen.map((cat: any) => {
              const id = idDeCategoriaCertamen(cat);
              const selected = Number(idCategoriaSel) === Number(id);
              return (
                <TouchableOpacity key={String(id)} style={[styles.categoryChip, selected && styles.categoryChipSelected]} onPress={() => void seleccionarCategoriaCertamen(id)} disabled={cargandoCriterios || eliminando}>
                  <Ionicons name="pricetag-outline" size={15} color={selected ? '#fff' : '#475569'} />
                  <Text style={[styles.categoryChipText, selected && styles.categoryChipTextSelected]}>{nombreDeCategoria(cat)}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        <View style={styles.panelHeader}>
          <View style={styles.panelInfo}>
            <Text style={styles.panelTitle}>Criterios de evaluación</Text>
            <Text style={styles.panelSubtitle}>{certamenActual ? nombreDeCertamen(certamenActual) : 'Sin certamen'}{categoriaActual ? ` · ${nombreDeCategoria(categoriaActual)}` : ''}</Text>
            <Text style={styles.totalPuntosText}>Puntaje máximo total: {totalPuntos} pts</Text>
          </View>
          <TouchableOpacity style={[styles.btnNuevo, (!idCategoriaSel || cargando || eliminando) && styles.disabledButton]} onPress={() => router.push({ pathname: '/Rubricas/form' as any, params: { idCategoria_r: String(idCategoriaSel), idCertamen: String(idCertamenSel) } })} disabled={!idCategoriaSel || cargando || eliminando}>
            <Ionicons name="add-circle-outline" size={18} color="#fff" /><Text style={styles.btnNuevoText}>Agregar criterio</Text>
          </TouchableOpacity>
        </View>

        {cargandoCriterios ? (
          <View style={styles.center}><ActivityIndicator size="large" color="#002b45" /><Text style={styles.centerText}>Cargando criterios...</Text></View>
        ) : !idCategoriaSel ? (
          <View style={styles.emptyBox}><Ionicons name="document-text-outline" size={30} color="#94a3b8" /><Text style={styles.emptyTitle}>Selecciona una categoría</Text><Text style={styles.emptyText}>Elige una categoría del certamen para consultar o agregar sus criterios de rúbrica.</Text></View>
        ) : criterios.length === 0 ? (
          <View style={styles.emptyBox}><Ionicons name="document-text-outline" size={30} color="#94a3b8" /><Text style={styles.emptyTitle}>Todavía no hay criterios</Text><Text style={styles.emptyText}>No hay criterios registrados para esta categoría. Usa el botón superior para agregar el primero.</Text></View>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {criterios.map((item: any, index: number) => {
              const id = idDeRubrica(item);
              const pregunta = preguntaDeRubrica(item);
              const valor = valorDeRubrica(item);
              return (
                <View key={Number.isFinite(id) && id > 0 ? String(id) : `criterio-${index}`} style={styles.card}>
                  <View style={styles.cardTopRow}>
                    <View style={styles.criterionIcon}><Ionicons name="list-outline" size={22} color="#0369a1" /></View>
                    <View style={styles.infoCol}>
                      <Text style={styles.preguntaText}>{pregunta}</Text>
                      <View style={styles.scoreBadge}><Ionicons name="star-outline" size={14} color="#854d0e" /><Text style={styles.scoreText}>Valor máximo: {valor} pts</Text></View>
                    </View>
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={() => router.push({ pathname: '/Rubricas/form' as any, params: { id: String(id), idCategoria_r: String(idCategoriaSel), idCertamen: String(idCertamenSel), pregunta, valor_maximo: String(valor) } })} disabled={eliminando}>
                      <Ionicons name="create-outline" size={16} color="#fff" /><Text style={styles.actionButtonText}>Editar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={() => abrirConfirmacionEliminar(item)} disabled={eliminando}>
                      <Ionicons name="trash-outline" size={16} color="#fff" /><Text style={styles.actionButtonText}>Eliminar</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      <Modal visible={modalEliminarVisible} transparent animationType="fade" onRequestClose={() => setModalEliminarVisible(false)}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}>
          <View style={[styles.modalIcon, styles.deleteIcon]}><Ionicons name="trash-outline" size={30} color="#b91c1c" /></View>
          <Text style={styles.modalTitle}>¿Eliminar criterio?</Text>
          <Text style={styles.modalMessage}>Confirma si deseas eliminar este criterio de la rúbrica.</Text>
          <View style={styles.summaryBox}><Text style={styles.summaryQuestion}>{criterioSeleccionado?.pregunta}</Text><Text style={styles.summaryScore}>Valor máximo: {criterioSeleccionado?.valor ?? 0} pts</Text></View>
          <Text style={styles.warningText}>Esta acción no se puede deshacer.</Text>
          <View style={styles.modalActions}>
            <TouchableOpacity style={[styles.modalButton, styles.cancelButton]} onPress={() => { setModalEliminarVisible(false); setCriterioSeleccionado(null); }}><Text style={styles.cancelButtonText}>Cancelar</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.modalButton, styles.confirmDeleteButton]} onPress={() => void confirmarEliminacion()}><Ionicons name="trash-outline" size={16} color="#fff" /><Text style={styles.confirmDeleteText}>Sí, eliminar</Text></TouchableOpacity>
          </View>
        </View></View>
      </Modal>

      <Modal visible={eliminando} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.modalBackdrop}><View style={styles.loadingCard}><ActivityIndicator size="large" color="#002b45" /><Text style={styles.loadingTitle}>Eliminando criterio...</Text><Text style={styles.loadingSubtitle}>Estamos procesando la solicitud. Espera un momento.</Text></View></View>
      </Modal>

      <Modal visible={modalResultado} transparent animationType="fade" onRequestClose={() => setModalResultado(false)}>
        <View style={styles.modalBackdrop}><View style={styles.modalCard}>
          <View style={[styles.modalIcon, resultadoExito ? styles.successIcon : styles.errorIcon]}><Ionicons name={resultadoExito ? 'checkmark-circle-outline' : 'alert-circle-outline'} size={31} color={resultadoExito ? '#15803d' : '#b91c1c'} /></View>
          <Text style={styles.modalTitle}>{resultadoTitulo}</Text><Text style={styles.modalMessage}>{resultadoMensaje}</Text>
          <TouchableOpacity style={[styles.modalButton, styles.okButton]} onPress={() => setModalResultado(false)}><Text style={styles.okButtonText}>Aceptar</Text></TouchableOpacity>
        </View></View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f1f5f9' },
  container: { flex: 1, width: '100%', maxWidth: 900, alignSelf: 'center', paddingHorizontal: 15, paddingTop: 12 },
  header: { alignItems: 'center', paddingBottom: 17 },
  headerIcon: { width: 56, height: 56, borderRadius: 18, backgroundColor: '#002b45', alignItems: 'center', justifyContent: 'center', marginBottom: 9 },
  title: { color: '#002b45', fontSize: 23, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: '#64748b', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 5, maxWidth: 500 },
  sectionLabel: { color: '#334155', fontSize: 13, fontWeight: '800', marginBottom: 8, marginTop: 7 },
  loadingInline: { flexDirection: 'row', gap: 9, alignItems: 'center', paddingVertical: 12 },
  loadingInlineText: { color: '#64748b', fontSize: 12 },
  certamenOptions: { alignItems: 'center', paddingRight: 8, paddingBottom: 7 },
  certamenOption: { minHeight: 60, minWidth: 190, maxWidth: 280, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 13, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', marginRight: 9, flexDirection: 'row', alignItems: 'center', gap: 8 },
  certamenOptionSelected: { backgroundColor: '#002b45', borderColor: '#002b45' },
  certamenOptionInfo: { flex: 1, minWidth: 0 },
  certamenOptionName: { color: '#1e293b', fontSize: 12, fontWeight: '800' },
  certamenOptionNameSelected: { color: '#fff' },
  certamenOptionType: { color: '#64748b', fontSize: 11, marginTop: 3, fontWeight: '700' },
  certamenOptionTypeSelected: { color: '#dbeafe' },
  categoryOptions: { alignItems: 'center', paddingBottom: 8, paddingRight: 8 },
  categoryChip: { minHeight: 38, maxWidth: 285, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 22, backgroundColor: '#e2e8f0', marginRight: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  categoryChipSelected: { backgroundColor: '#0369a1' },
  categoryChipText: { fontSize: 12, color: '#334155', fontWeight: '700', flexShrink: 1 },
  categoryChipTextSelected: { color: '#fff', fontWeight: '800' },
  emptyCategoryBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 14, backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 12 },
  emptyBox: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, padding: 22, alignItems: 'center', justifyContent: 'center', gap: 7, marginVertical: 10 },
  emptyTitle: { color: '#1e293b', fontSize: 14, fontWeight: '800' },
  emptyText: { color: '#64748b', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  panelHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10, marginTop: 7, marginBottom: 14 },
  panelInfo: { flex: 1, minWidth: 0 },
  panelTitle: { fontSize: 16, fontWeight: '800', color: '#002b45' },
  panelSubtitle: { fontSize: 11, color: '#475569', marginTop: 3 },
  totalPuntosText: { fontSize: 12, color: '#64748b', marginTop: 3 },
  btnNuevo: { backgroundColor: '#84a32d', paddingHorizontal: 12, minHeight: 40, borderRadius: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  btnNuevoText: { color: '#fff', fontWeight: '800', fontSize: 11 },
  disabledButton: { opacity: 0.55 },
  center: { flex: 1, minHeight: 150, alignItems: 'center', justifyContent: 'center', gap: 9 },
  centerText: { color: '#64748b', fontSize: 12 },
  scroll: { paddingBottom: 30 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 11, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#0f172a', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11 },
  criterionIcon: { width: 41, height: 41, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e0f2fe' },
  infoCol: { flex: 1, minWidth: 0 },
  preguntaText: { fontSize: 14, lineHeight: 20, color: '#1e293b', fontWeight: '700', marginBottom: 9 },
  scoreBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 20, backgroundColor: '#fef3c7' },
  scoreText: { fontSize: 11, color: '#854d0e', fontWeight: '800' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 11, marginTop: 13 },
  actionButton: { minHeight: 36, paddingHorizontal: 12, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  editButton: { backgroundColor: '#0284c7' },
  deleteButton: { backgroundColor: '#dc2626' },
  actionButtonText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'center', alignItems: 'center', padding: 18 },
  modalCard: { width: '100%', maxWidth: 430, backgroundColor: '#fff', borderRadius: 21, padding: 22, alignItems: 'center', shadowColor: '#0f172a', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 9 },
  modalIcon: { width: 62, height: 62, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 13 },
  deleteIcon: { backgroundColor: '#fee2e2' },
  successIcon: { backgroundColor: '#dcfce7' },
  errorIcon: { backgroundColor: '#fee2e2' },
  modalTitle: { color: '#0f172a', fontSize: 19, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  modalMessage: { color: '#475569', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  summaryBox: { alignSelf: 'stretch', backgroundColor: '#f8fafc', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', padding: 12, marginTop: 15 },
  summaryQuestion: { color: '#0f172a', fontSize: 13, lineHeight: 19, fontWeight: '700' },
  summaryScore: { color: '#0369a1', fontSize: 12, fontWeight: '800', marginTop: 8 },
  warningText: { color: '#b91c1c', fontSize: 11, marginTop: 12, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: 9, marginTop: 19, width: '100%' },
  modalButton: { flex: 1, minHeight: 44, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 8 },
  cancelButton: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1' },
  cancelButtonText: { color: '#334155', fontSize: 13, fontWeight: '800' },
  confirmDeleteButton: { backgroundColor: '#dc2626' },
  confirmDeleteText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  okButton: { backgroundColor: '#002b45', alignSelf: 'stretch', flex: 0, marginTop: 19 },
  okButtonText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  loadingCard: { backgroundColor: '#fff', width: '100%', maxWidth: 330, borderRadius: 20, padding: 25, alignItems: 'center', gap: 12 },
  loadingTitle: { color: '#002b45', fontSize: 17, fontWeight: '800', textAlign: 'center' },
  loadingSubtitle: { color: '#64748b', fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
