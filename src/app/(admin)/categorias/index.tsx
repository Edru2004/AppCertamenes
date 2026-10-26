// @ts-nocheck
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
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
  eliminarCategCertamen,
  getCategCertamenes,
  getCertamenes,
} from '../../../services/api';

const obtenerLista = (respuesta: any): any[] => {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.data)) return respuesta.data;
  if (Array.isArray(respuesta?.categorias)) return respuesta.categorias;
  return [];
};

const idDeCategoria = (cat: any) =>
  Number(cat?.Id_categCertamen ?? cat?.idCategoria_certa ?? cat?.idCategoria ?? cat?.id);

const idDeCertamen = (cert: any) =>
  Number(cert?.Id_certamen ?? cert?.Id_Certamen ?? cert?.idCertamen ?? cert?.id);

const tipoVisible = (tipo?: string) => {
  const valor = String(tipo || '').trim().toUpperCase();
  if (valor === 'RALLY') return 'Rally';
  if (valor === 'INNOVATEC' || valor === 'INNOVATECNM') return 'InnovaTecNM';
  return 'Tipo no especificado';
};

export default function CategoriasIndexScreen() {
  const router = useRouter();

  const [categorias, setCategorias] = useState<any[]>([]);
  const [certamenes, setCertamenes] = useState<any[]>([]);
  const [idCertamenSel, setIdCertamenSel] = useState<number | null>(null);
  const [busquedaNombre, setBusquedaNombre] = useState('');
  const [busquedaAplicada, setBusquedaAplicada] = useState('');
  const [cargando, setCargando] = useState(true);

  const [modalEliminarVisible, setModalEliminarVisible] = useState(false);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<any>(null);
  const [eliminando, setEliminando] = useState(false);

  const [modalResultado, setModalResultado] = useState(false);
  const [resultadoTitulo, setResultadoTitulo] = useState('');
  const [resultadoMensaje, setResultadoMensaje] = useState('');
  const [resultadoExito, setResultadoExito] = useState(false);

  const abrirResultado = (titulo: string, mensaje: string, exito: boolean) => {
    setResultadoTitulo(titulo);
    setResultadoMensaje(mensaje);
    setResultadoExito(exito);
    setModalResultado(true);
  };

  const cargarCategorias = useCallback(async (mostrarCarga = true) => {
    try {
      if (mostrarCarga) setCargando(true);

      const [respuestaCategorias, respuestaCertamenes] = await Promise.all([
        getCategCertamenes(),
        getCertamenes(),
      ]);

      const listaCategorias = obtenerLista(respuestaCategorias);
      const listaCertamenes = obtenerLista(respuestaCertamenes);
      setCertamenes(listaCertamenes);

      // En la primera carga selecciona Rally por defecto; si no existe, selecciona el primero.
      const rallyPorDefecto = listaCertamenes.find(
        (cert: any) => String(cert?.Tipo ?? cert?.tipo ?? '').trim().toUpperCase() === 'RALLY'
      );
      const certamenPorDefecto = rallyPorDefecto ?? listaCertamenes[0] ?? null;
      const idPorDefecto = certamenPorDefecto ? idDeCertamen(certamenPorDefecto) : null;
      setIdCertamenSel((actual) => {
        if (actual != null && listaCertamenes.some((cert: any) => idDeCertamen(cert) === Number(actual))) {
          return actual;
        }
        return idPorDefecto != null && Number.isFinite(idPorDefecto) ? idPorDefecto : null;
      });

      const mapaCertamenes = new Map(
        listaCertamenes.map((cert: any) => [String(idDeCertamen(cert)), cert])
      );

      // Enriquecemos cada categoría con su certamen propietario.
      const enriquecidas = listaCategorias.map((cat: any) => {
        const parentId =
          cat.Id_Certamen ??
          cat.Id_certamen ??
          cat.idCertamen ??
          cat.id_certamen ??
          cat.certamen?.Id_certamen ??
          cat.certamen?.Id_Certamen;
        const certamen = mapaCertamenes.get(String(parentId)) || cat.certamen || null;
        return {
          ...cat,
          __certamen: certamen,
          __certamenId: parentId == null ? null : Number(parentId),
          __certamenNombre:
            certamen?.Nombre ??
            certamen?.nombre ??
            cat.certamen?.Nombre ??
            `Certamen #${parentId ?? ''}`,
          __certamenTipo: certamen?.Tipo ?? certamen?.tipo ?? cat.certamen?.Tipo ?? '',
        };
      });

      setCategorias(enriquecidas);
    } catch (error: any) {
      abrirResultado(
        'No se pudieron cargar las categorías',
        error?.message || 'No se pudo conectar con el servidor.',
        false
      );
    } finally {
      if (mostrarCarga) setCargando(false);
    }
  }, []);

  const categoriasFiltradas = categorias.filter((cat: any) => {
    const coincideCertamen = idCertamenSel != null && Number(cat.__certamenId) === Number(idCertamenSel);
    const nombreCategoria = String(cat.Nombre ?? cat.nombre ?? '').toLowerCase();
    const coincideBusqueda = !busquedaAplicada.trim() || nombreCategoria.includes(busquedaAplicada.trim().toLowerCase());
    return coincideCertamen && coincideBusqueda;
  });

  useFocusEffect(
    useCallback(() => {
      void cargarCategorias(true);
    }, [cargarCategorias])
  );

  const abrirConfirmacionEliminar = (categoria: any) => {
    const equiposCount = Number(
      categoria.equipos_count ??
      categoria.equiposCount ??
      categoria.total_equipos ??
      0
    );

    if (equiposCount > 0) {
      abrirResultado(
        'No se puede eliminar',
        `La categoría "${categoria.Nombre ?? categoria.nombre}" tiene ${equiposCount} equipo(s) asociado(s). Primero debes resolver esos registros relacionados.`,
        false
      );
      return;
    }

    setCategoriaSeleccionada({
      id: idDeCategoria(categoria),
      nombre: categoria.Nombre ?? categoria.nombre ?? 'Categoría',
      certamen: categoria.__certamenNombre,
      tipo: tipoVisible(categoria.__certamenTipo),
    });
    setModalResultado(false);
    setModalEliminarVisible(true);
  };

  const confirmarEliminacion = async () => {
    if (!categoriaSeleccionada || eliminando) return;

    const seleccionada = categoriaSeleccionada;
    setModalEliminarVisible(false);
    setEliminando(true);

    try {
      const respuestaEliminar: any = await eliminarCategCertamen(Number(seleccionada.id));

      // Compatible con api.ts que devuelve JSON (nuevo servicio) o Response (versión anterior).
      if (
        respuestaEliminar &&
        typeof respuestaEliminar.ok === 'boolean' &&
        !respuestaEliminar.ok
      ) {
        let detalle: any = {};
        try {
          detalle = await respuestaEliminar.json();
        } catch {
          detalle = {};
        }
        throw new Error(
          detalle?.message ||
          (detalle?.errors ? Object.values(detalle.errors).flat().join('\\n') : '') ||
          `El servidor rechazó la eliminación (HTTP ${respuestaEliminar.status}).`
        );
      }

      if (
        respuestaEliminar &&
        typeof respuestaEliminar === 'object' &&
        (respuestaEliminar.errors || respuestaEliminar.message === 'Unauthenticated.')
      ) {
        throw new Error(
          respuestaEliminar.errors
            ? Object.values(respuestaEliminar.errors).flat().join('\\n')
            : respuestaEliminar.message
        );
      }

      // Quita la tarjeta de inmediato y luego sincroniza con la API.
      setCategorias((actuales) =>
        actuales.filter((cat) => idDeCategoria(cat) !== Number(seleccionada.id))
      );
      await cargarCategorias(false);

      abrirResultado(
        '¡Categoría eliminada!',
        `La categoría "${seleccionada.nombre}" se eliminó correctamente.`,
        true
      );
    } catch (error: any) {
      abrirResultado(
        'No se pudo eliminar',
        error?.message || 'El servidor rechazó la eliminación. Comprueba si la categoría tiene equipos, rúbricas u otros registros relacionados.',
        false
      );
    } finally {
      setEliminando(false);
      setCategoriaSeleccionada(null);
    }
  };

  const aplicarBusqueda = () => {
    setBusquedaAplicada(busquedaNombre);
  };

  const seleccionarCertamen = (id: number) => {
    setIdCertamenSel(id);
    // Al cambiar de certamen limpiamos la búsqueda para no confundir resultados.
    setBusquedaNombre('');
    setBusquedaAplicada('');
  };

  const certamenActual = certamenes.find((cert: any) => idDeCertamen(cert) === Number(idCertamenSel));
  const tipoCertamenActual = tipoVisible(certamenActual?.Tipo ?? certamenActual?.tipo);

  return (
    <View style={styles.page}>
      <ScrollView
        style={styles.pageScroll}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="pricetags-outline" size={25} color="#fff" />
          </View>
          <Text style={styles.title}>Gestión de categorías</Text>
          <Text style={styles.subtitle}>
            Administra las categorías y consulta a qué certamen pertenecen.
          </Text>
        </View>

        <View style={styles.certamenFilterCard}>
          <Text style={styles.certamenFilterTitle}>Filtrar categorías por certamen</Text>
          <Text style={styles.certamenFilterSubtitle}>
            Solo se mostrarán las categorías que pertenecen al certamen seleccionado.
          </Text>
          {certamenes.length === 0 ? (
            <Text style={styles.loadingText}>No hay certámenes registrados.</Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.certamenOptions}>
              {certamenes.map((cert: any) => {
                const idCert = idDeCertamen(cert);
                const selected = Number(idCertamenSel) === Number(idCert);
                const tipo = tipoVisible(cert.Tipo ?? cert.tipo);
                const esRally = tipo === 'Rally';
                return (
                  <TouchableOpacity
                    key={String(idCert)}
                    style={[styles.certamenOption, selected && styles.certamenOptionSelected]}
                    onPress={() => seleccionarCertamen(idCert)}
                    disabled={eliminando}
                  >
                    <Ionicons
                      name={esRally ? 'trophy-outline' : 'bulb-outline'}
                      size={17}
                      color={selected ? '#fff' : esRally ? '#a16207' : '#0369a1'}
                    />
                    <View style={styles.certamenOptionTextBox}>
                      <Text style={[styles.certamenOptionName, selected && styles.certamenOptionNameSelected]} numberOfLines={1}>
                        {cert.Nombre ?? cert.nombre ?? `Certamen #${idCert}`}
                      </Text>
                      <Text style={[styles.certamenOptionType, selected && styles.certamenOptionTypeSelected]}>
                        {tipo}
                      </Text>
                    </View>
                    {selected ? <Ionicons name="checkmark-circle" size={17} color="#fff" /> : null}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        <TouchableOpacity
          style={styles.newButton}
          onPress={() => router.push({ pathname: '/categorias/form' as any, params: { idCertamen: String(idCertamenSel ?? '') } })}
          disabled={eliminando}
        >
          <Ionicons name="add-circle-outline" size={20} color="#fff" />
          <Text style={styles.newButtonText}>Nueva categoría</Text>
        </TouchableOpacity>

        <View style={styles.searchCard}>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search-outline" size={18} color="#64748b" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar por nombre de categoría..."
              placeholderTextColor="#94a3b8"
              value={busquedaNombre}
              onChangeText={setBusquedaNombre}
              onSubmitEditing={aplicarBusqueda}
              returnKeyType="search"
              editable={!eliminando}
            />
            {busquedaNombre.length > 0 ? (
              <TouchableOpacity
                onPress={() => {
                  setBusquedaNombre('');
                  setBusquedaAplicada('');
                }}
                accessibilityLabel="Limpiar búsqueda"
              >
                <Ionicons name="close-circle" size={18} color="#94a3b8" />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity style={styles.searchButton} onPress={aplicarBusqueda} disabled={eliminando}>
            <Ionicons name="funnel-outline" size={16} color="#fff" />
            <Text style={styles.searchButtonText}>Buscar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Categorías de {certamenActual?.Nombre ?? tipoCertamenActual}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{categoriasFiltradas.length}</Text>
          </View>
        </View>

        {cargando ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#002b45" />
            <Text style={styles.loadingText}>Cargando categorías...</Text>
          </View>
        ) : (
          <View style={styles.scroll}>
            {categoriasFiltradas.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="file-tray-outline" size={42} color="#94a3b8" />
                <Text style={styles.emptyTitle}>No hay categorías</Text>
                <Text style={styles.emptyText}>
                  {busquedaAplicada
                    ? `No encontramos categorías con ese nombre en ${certamenActual?.Nombre ?? tipoCertamenActual}.`
                    : `Todavía no hay categorías registradas para ${certamenActual?.Nombre ?? tipoCertamenActual}.`}
                </Text>
                {busquedaAplicada ? (
                  <TouchableOpacity
                    onPress={() => {
                      setBusquedaNombre('');
                      setBusquedaAplicada('');
                    }}
                    style={styles.clearFilterButton}
                  >
                    <Text style={styles.clearFilterText}>Quitar filtro</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : (
              categoriasFiltradas.map((cat: any) => {
                const id = idDeCategoria(cat);
                const nombre = cat.Nombre ?? cat.nombre ?? 'Sin nombre';
                const equiposCount = Number(cat.equipos_count ?? cat.equiposCount ?? cat.total_equipos ?? 0);
                const tipo = tipoVisible(cat.__certamenTipo);
                const rally = tipo === 'Rally';

                return (
                  <View key={String(id)} style={styles.card}>
                    <View style={styles.cardTopRow}>
                      <View style={styles.categoryIcon}>
                        <Ionicons name="pricetag-outline" size={21} color="#0369a1" />
                      </View>
                      <View style={styles.categoryHeading}>
                        <Text style={styles.categoryName}>{nombre}</Text>
                        <Text style={styles.categoryCode}>CAT-{String(id).padStart(3, '0')}</Text>
                      </View>
                    </View>

                    <View style={styles.parentBox}>
                      <View style={styles.parentIcon}>
                        <Ionicons name="trophy-outline" size={17} color="#002b45" />
                      </View>
                      <View style={styles.parentInfo}>
                        <Text style={styles.parentLabel}>Certamen asociado</Text>
                        <Text style={styles.parentName}>{cat.__certamenNombre}</Text>
                        <View style={[styles.typeBadge, rally ? styles.rallyBadge : styles.innovatecBadge]}>
                          <Ionicons
                            name={rally ? 'trophy-outline' : 'bulb-outline'}
                            size={13}
                            color={rally ? '#854d0e' : '#075985'}
                          />
                          <Text style={[styles.typeBadgeText, rally ? styles.rallyText : styles.innovatecText]}>
                            {tipo}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.teamsRow}>
                      <Ionicons name="people-outline" size={17} color="#64748b" />
                      <Text style={styles.teamsLabel}>Equipos inscritos</Text>
                      <Text style={styles.teamsCount}>{equiposCount}</Text>
                    </View>

                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.editButton]}
                        disabled={eliminando}
                        onPress={() =>
                          router.push({
                            pathname: '/categorias/form' as any,
                            params: {
                              id: String(id),
                              idCertamen: String(cat.__certamenId ?? ''),
                              nombre: String(nombre),
                            },
                          })
                        }
                      >
                        <Ionicons name="create-outline" size={17} color="#fff" />
                        <Text style={styles.actionButtonText}>Editar</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton, eliminando && styles.disabledButton]}
                        disabled={eliminando}
                        onPress={() => abrirConfirmacionEliminar(cat)}
                      >
                        <Ionicons name="trash-outline" size={17} color="#fff" />
                        <Text style={styles.actionButtonText}>Eliminar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>

      {/* Confirmación visual antes de eliminar */}
      <Modal
        visible={modalEliminarVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalEliminarVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIcon, styles.deleteModalIcon]}>
              <Ionicons name="trash-outline" size={29} color="#dc2626" />
            </View>
            <Text style={styles.modalTitle}>¿Deseas eliminar?</Text>
            <Text style={styles.modalMessage}>
              ¿Seguro que deseas eliminar la categoría
            </Text>
            <Text style={styles.modalRecordName}>{categoriaSeleccionada?.nombre}</Text>
            <View style={styles.modalSummary}>
              <Text style={styles.modalSummaryText}>
                {categoriaSeleccionada?.certamen}
              </Text>
              <Text style={styles.modalSummaryType}>{categoriaSeleccionada?.tipo}</Text>
            </View>
            <Text style={styles.modalWarning}>Esta acción no se puede deshacer.</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalEliminarVisible(false);
                  setCategoriaSeleccionada(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmDeleteButton]}
                onPress={() => void confirmarEliminacion()}
              >
                <Ionicons name="trash-outline" size={17} color="#fff" />
                <Text style={styles.confirmDeleteText}>Sí, eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Indicador que bloquea la pantalla mientras el servidor elimina */}
      <Modal visible={eliminando} transparent animationType="fade" onRequestClose={() => {}}>
        <View style={styles.modalBackdrop}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#002b45" />
            <Text style={styles.loadingTitle}>Eliminando categoría...</Text>
            <Text style={styles.loadingSubtitle}>Estamos procesando la solicitud. Espera un momento.</Text>
          </View>
        </View>
      </Modal>

      {/* Mensajes de éxito y error */}
      <Modal
        visible={modalResultado}
        transparent
        animationType="fade"
        onRequestClose={() => setModalResultado(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIcon, resultadoExito ? styles.successModalIcon : styles.errorModalIcon]}>
              <Ionicons
                name={resultadoExito ? 'checkmark-circle-outline' : 'alert-circle-outline'}
                size={30}
                color={resultadoExito ? '#15803d' : '#b91c1c'}
              />
            </View>
            <Text style={styles.modalTitle}>{resultadoTitulo}</Text>
            <Text style={styles.modalMessage}>{resultadoMensaje}</Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.okButton]}
              onPress={() => setModalResultado(false)}
            >
              <Text style={styles.okButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f1f5f9' },
  pageScroll: { flex: 1, width: '100%' },
  container: { flexGrow: 1, paddingHorizontal: 15, paddingTop: 12, paddingBottom: 30, maxWidth: 850, width: '100%', alignSelf: 'center' },
  header: { alignItems: 'center', paddingBottom: 15 },
  headerIcon: { width: 55, height: 55, borderRadius: 18, backgroundColor: '#002b45', alignItems: 'center', justifyContent: 'center', marginBottom: 9 },
  title: { fontSize: 23, fontWeight: '800', color: '#002b45', textAlign: 'center' },
  subtitle: { color: '#64748b', fontSize: 12, textAlign: 'center', marginTop: 5, lineHeight: 18 },
  certamenFilterCard: { backgroundColor: '#fff', borderRadius: 13, borderWidth: 1, borderColor: '#e2e8f0', padding: 12, marginBottom: 12 },
  certamenFilterTitle: { color: '#0f172a', fontSize: 14, fontWeight: '800' },
  certamenFilterSubtitle: { color: '#64748b', fontSize: 11, lineHeight: 16, marginTop: 4, marginBottom: 10 },
  certamenOptions: { flexDirection: 'row', gap: 8, paddingRight: 4 },
  certamenOption: { minWidth: 165, maxWidth: 245, paddingVertical: 10, paddingHorizontal: 11, borderRadius: 11, borderWidth: 1, borderColor: '#cbd5e1', backgroundColor: '#f8fafc', flexDirection: 'row', alignItems: 'center', gap: 8 },
  certamenOptionSelected: { backgroundColor: '#002b45', borderColor: '#002b45' },
  certamenOptionTextBox: { flex: 1, gap: 2 },
  certamenOptionName: { color: '#334155', fontSize: 12, fontWeight: '800' },
  certamenOptionNameSelected: { color: '#fff' },
  certamenOptionType: { color: '#64748b', fontSize: 10, fontWeight: '700' },
  certamenOptionTypeSelected: { color: '#dbeafe' },
  newButton: { backgroundColor: '#84a32d', paddingHorizontal: 14, minHeight: 46, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 },
  newButtonText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  searchCard: { backgroundColor: '#fff', borderRadius: 13, borderWidth: 1, borderColor: '#e2e8f0', padding: 10, marginBottom: 16, gap: 9 },
  searchInputWrapper: { minHeight: 42, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 9, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 10, gap: 8 },
  searchInput: { flex: 1, minWidth: 0, color: '#0f172a', fontSize: 13, paddingVertical: 8 },
  searchButton: { backgroundColor: '#002b45', minHeight: 38, alignSelf: 'flex-end', paddingHorizontal: 14, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  searchButtonText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  listHeader: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 10 },
  listTitle: { color: '#0f172a', fontSize: 16, fontWeight: '800' },
  countBadge: { minWidth: 26, height: 25, paddingHorizontal: 7, borderRadius: 13, backgroundColor: '#dbeafe', alignItems: 'center', justifyContent: 'center' },
  countBadgeText: { color: '#1d4ed8', fontSize: 12, fontWeight: '800' },
  scroll: { paddingBottom: 30 },
  card: { backgroundColor: '#fff', padding: 15, borderRadius: 15, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0', shadowColor: '#0f172a', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  categoryIcon: { width: 43, height: 43, borderRadius: 13, backgroundColor: '#e0f2fe', alignItems: 'center', justifyContent: 'center' },
  categoryHeading: { flex: 1, gap: 3 },
  categoryName: { fontSize: 16, fontWeight: '800', color: '#002b45' },
  categoryCode: { fontSize: 11, fontWeight: '700', color: '#94a3b8' },
  parentBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginTop: 14, padding: 11, borderRadius: 11, backgroundColor: '#f8fafc' },
  parentIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: '#e2e8f0', alignItems: 'center', justifyContent: 'center' },
  parentInfo: { flex: 1, gap: 5 },
  parentLabel: { fontSize: 11, color: '#64748b', fontWeight: '700' },
  parentName: { fontSize: 13, color: '#334155', fontWeight: '800' },
  typeBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20 },
  rallyBadge: { backgroundColor: '#fef3c7' },
  innovatecBadge: { backgroundColor: '#e0f2fe' },
  typeBadgeText: { fontSize: 11, fontWeight: '800' },
  rallyText: { color: '#854d0e' },
  innovatecText: { color: '#075985' },
  teamsRow: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 12, marginBottom: 14 },
  teamsLabel: { flex: 1, fontSize: 12, color: '#64748b' },
  teamsCount: { fontSize: 13, color: '#002b45', fontWeight: '800' },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 9, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 },
  actionButton: { minHeight: 37, borderRadius: 9, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  editButton: { backgroundColor: '#0284c7' },
  deleteButton: { backgroundColor: '#dc2626' },
  disabledButton: { opacity: 0.55 },
  actionButtonText: { fontSize: 12, color: '#fff', fontWeight: '800' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 25, gap: 10 },
  loadingText: { color: '#64748b', fontSize: 12 },
  emptyState: { backgroundColor: '#fff', borderRadius: 15, padding: 28, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#e2e8f0' },
  emptyTitle: { color: '#002b45', fontSize: 16, fontWeight: '800' },
  emptyText: { color: '#64748b', fontSize: 12, textAlign: 'center', lineHeight: 18 },
  clearFilterButton: { marginTop: 8, padding: 9 },
  clearFilterText: { color: '#0369a1', fontWeight: '800', fontSize: 12 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.53)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: '#fff', width: '100%', maxWidth: 420, borderRadius: 21, padding: 22, alignItems: 'center', shadowColor: '#0f172a', shadowOpacity: 0.2, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 9 },
  modalIcon: { width: 62, height: 62, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  deleteModalIcon: { backgroundColor: '#fee2e2' },
  successModalIcon: { backgroundColor: '#dcfce7' },
  errorModalIcon: { backgroundColor: '#fee2e2' },
  modalTitle: { color: '#0f172a', fontSize: 20, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  modalMessage: { color: '#475569', fontSize: 13, lineHeight: 20, textAlign: 'center' },
  modalRecordName: { color: '#002b45', fontSize: 16, fontWeight: '800', textAlign: 'center', marginTop: 5 },
  modalSummary: { alignSelf: 'stretch', alignItems: 'center', padding: 12, borderRadius: 11, backgroundColor: '#f8fafc', marginTop: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  modalSummaryText: { color: '#334155', fontWeight: '800', fontSize: 13, textAlign: 'center' },
  modalSummaryType: { color: '#0369a1', fontWeight: '800', fontSize: 12, marginTop: 4 },
  modalWarning: { color: '#b91c1c', fontSize: 11, marginTop: 13, textAlign: 'center' },
  modalActions: { flexDirection: 'row', gap: 9, marginTop: 20, width: '100%' },
  modalButton: { flex: 1, minHeight: 44, borderRadius: 11, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 8 },
  cancelButton: { backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1' },
  cancelButtonText: { color: '#334155', fontSize: 13, fontWeight: '800' },
  confirmDeleteButton: { backgroundColor: '#dc2626' },
  confirmDeleteText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  okButton: { backgroundColor: '#002b45', alignSelf: 'stretch', marginTop: 18, flex: 0 },
  okButtonText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  loadingCard: { backgroundColor: '#fff', width: '100%', maxWidth: 330, borderRadius: 20, padding: 25, alignItems: 'center', gap: 12 },
  loadingTitle: { color: '#002b45', fontSize: 17, fontWeight: '800', textAlign: 'center' },
  loadingSubtitle: { color: '#64748b', fontSize: 12, lineHeight: 18, textAlign: 'center' },
});
