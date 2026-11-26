// @ts-nocheck
import { eliminarEquipo, getCertamenes, getEquipos } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Item = Record<string, any>;
type ResultState = { visible: boolean; success: boolean; title: string; message: string };

export interface Equipo extends Item {
  Id_equipo: number;
  Id_desafio: number;
  Id_categCertamen: number;
  Id_sala: number | null;
  Nombre: string;
}

const readList = (value: any): Item[] => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
};

const getId = (item: Item) =>
  Number(item.Id_certamen ?? item.Id_Certamen ?? item.id_certamen ?? item.idCertamen ?? item.id);
const getEquipoId = (item: Item) => Number(item.Id_equipo ?? item.id_equipo ?? item.id);
const getNombre = (item: Item) => String(item.Nombre ?? item.nombre ?? 'Sin nombre');
const getTipo = (item?: Item | null) => String(item?.Tipo ?? item?.tipo ?? '').toUpperCase().trim();
const getCertamenNombre = (item?: Item | null) =>
  String(item?.Nombre ?? item?.nombre ?? 'Certamen sin nombre');

const paramNumber = (value: string | string[] | undefined) => {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

// Construye la URL pública del PDF guardado en Laravel (storage/app/public/...)
const obtenerUrlDocumentoPdf = (rutaReporte: string) => {
  const limpio = String(rutaReporte || '').trim();
  if (!limpio) return '';
  if (limpio.startsWith('http://') || limpio.startsWith('https://')) {
    return limpio;
  }

  const apiBase =
    process.env.EXPO_PUBLIC_API_URL ||
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    '';

  const servidorRaiz = String(apiBase).replace(/\/api\/?$/, '').replace(/\/+$/, '');
  const rutaArchivo = limpio.replace(/^\/+/, '');

  if (!servidorRaiz) return '';
  return `${servidorRaiz}/storage/${rutaArchivo}`;
};

export default function EquiposIndexScreen() {
  const params = useLocalSearchParams<{ id_certamen?: string | string[] }>();
  const [certamenes, setCertamenes] = useState<Item[]>([]);
  const [idCertamen, setIdCertamen] = useState<number | null>(paramNumber(params.id_certamen));
  const [modalCertamenVisible, setModalCertamenVisible] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroSala, setFiltroSala] = useState<'TODOS' | 'CON_SALA' | 'SIN_SALA'>('TODOS');
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [equipoDetalle, setEquipoDetalle] = useState<Equipo | null>(null);
  const [equipoEliminar, setEquipoEliminar] = useState<Equipo | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [resultado, setResultado] = useState<ResultState>({
    visible: false,
    success: false,
    title: '',
    message: '',
  });

  const cargarDatos = useCallback(async () => {
    let activo = true;
    setCargando(true);
    try {
      const respuestaCertamenes = await getCertamenes();
      const listaCertamenes = readList(respuestaCertamenes);
      setCertamenes(listaCertamenes);

      const solicitado = paramNumber(params.id_certamen);
      const idElegido =
        (solicitado && listaCertamenes.some((c) => getId(c) === solicitado) ? solicitado : null) ??
        (idCertamen && listaCertamenes.some((c) => getId(c) === idCertamen) ? idCertamen : null) ??
        (listaCertamenes.length ? getId(listaCertamenes[0]) : null);

      setIdCertamen(idElegido);
      if (!idElegido) {
        setEquipos([]);
        return;
      }
      const respuestaEquipos = await getEquipos(idElegido);
      if (activo) setEquipos(readList(respuestaEquipos) as Equipo[]);
    } catch (error: any) {
      if (activo) {
        setResultado({
          visible: true,
          success: false,
          title: 'Error al cargar datos',
          message:
            error?.message ||
            'No se pudieron cargar los certámenes y equipos. Verifica la conexión con Laravel.',
        });
        setEquipos([]);
      }
    } finally {
      if (activo) setCargando(false);
    }

    return () => {
      activo = false;
    };
  }, [params.id_certamen, idCertamen]);

  useFocusEffect(
    useCallback(() => {
      void cargarDatos();
      return undefined;
    }, [cargarDatos])
  );

  const elegirCertamen = (item: Item) => {
    const nuevoId = getId(item);
    if (!Number.isFinite(nuevoId)) return;
    setIdCertamen(nuevoId);
    setBusqueda('');
    setFiltroSala('TODOS');
    setModalCertamenVisible(false);
  };

  const certamenSeleccionado = certamenes.find((item) => getId(item) === idCertamen) ?? null;
  const esInnovaTec = getTipo(certamenSeleccionado).includes('INNOVATEC');

  const equiposFiltrados = useMemo(() => {
    const query = busqueda.trim().toLocaleLowerCase();

    return equipos.filter((equipo) => {
      if (esInnovaTec) {
        const tieneSala = Boolean(equipo.Id_sala ?? equipo.idSala ?? equipo.id_sala);
        if (filtroSala === 'CON_SALA' && !tieneSala) return false;
        if (filtroSala === 'SIN_SALA' && tieneSala) return false;
      }

      if (!query) return true;

      const nombreEquipo = getNombre(equipo).toLocaleLowerCase();
      const nombreDesafio = String(
        equipo.desafio?.Nombre ?? equipo.desafio?.nombre ?? ''
      ).toLocaleLowerCase();
      const nombreCategoria = String(
        equipo.categoriaCertamen?.Nombre ??
          equipo.categoriaCertamen?.nombre ??
          equipo.categoria_certamen?.Nombre ??
          equipo.categoria_certamen?.nombre ??
          ''
      ).toLocaleLowerCase();
      const nombreSala = esInnovaTec
        ? String(equipo.sala?.Nombre ?? equipo.sala?.nombre ?? '').toLocaleLowerCase()
        : '';

      const listaIntegrantes = Array.isArray(equipo.integrantes) ? equipo.integrantes : [];
      const textoIntegrantes = listaIntegrantes
        .map((ing: any) => `${ing.Nombre ?? ''} ${ing.no_control ?? ''} ${ing.Carrera ?? ''}`)
        .join(' ')
        .toLocaleLowerCase();

      return (
        nombreEquipo.includes(query) ||
        nombreDesafio.includes(query) ||
        nombreCategoria.includes(query) ||
        nombreSala.includes(query) ||
        textoIntegrantes.includes(query)
      );
    });
  }, [equipos, busqueda, filtroSala, esInnovaTec]);

  const confirmarEliminacion = async () => {
    if (!equipoEliminar) return;
    const equipo = equipoEliminar;
    setEquipoEliminar(null);
    try {
      setEliminando(true);
      await eliminarEquipo(getEquipoId(equipo));
      setEquipos((actuales) => actuales.filter((item) => getEquipoId(item) !== getEquipoId(equipo)));
      setResultado({
        visible: true,
        success: true,
        title: '¡Equipo eliminado!',
        message: `El equipo "${getNombre(equipo)}" se eliminó correctamente.`,
      });
    } catch (error: any) {
      setResultado({
        visible: true,
        success: false,
        title: 'No se pudo eliminar',
        message:
          error?.message ||
          'No se pudo eliminar el equipo. Comprueba si tiene registros relacionados y revisa la API.',
      });
    } finally {
      setEliminando(false);
    }
  };

  const cerrarResultado = () => setResultado((actual) => ({ ...actual, visible: false }));

  const abrirEnlace = async (urlRaw: string) => {
    const limpio = String(urlRaw || '').trim();
    if (!limpio) {
      setResultado({
        visible: true,
        success: false,
        title: 'Archivo no disponible',
        message: 'No se encontró la ruta del archivo en el servidor.',
      });
      return;
    }
    const url =
      limpio.startsWith('http://') || limpio.startsWith('https://') ? limpio : `https://${limpio}`;
    try {
      await Linking.openURL(url);
    } catch {
      setResultado({
        visible: true,
        success: false,
        title: 'No se pudo abrir',
        message: 'No fue posible abrir el documento o enlace en este dispositivo.',
      });
    }
  };

  const abrirDocumentoPdf = async (rutaReporte: string) => {
    const urlPdf = obtenerUrlDocumentoPdf(rutaReporte);
    if (!urlPdf) {
      setResultado({
        visible: true,
        success: false,
        title: 'No se pudo construir la ruta',
        message:
          'Verifica que EXPO_PUBLIC_API_URL esté configurada y que el archivo exista en el servidor.',
      });
      return;
    }
    await abrirEnlace(urlPdf);
  };

  const listHeader = (
    <View style={styles.headerWrapper}>
      {/* Encabezado estilo Gestión de jurados */}
      <View style={styles.topHeader}>
        <View style={styles.headerIconBox}>
          <Ionicons name="people-outline" size={28} color="#fff" />
        </View>
        <Text style={styles.headerTitle}>Gestión de equipos</Text>
        <Text style={styles.headerSubtitle}>
          Consulta los equipos registrados, sus integrantes y entregables.
        </Text>
      </View>

      {/* Selector de certamen */}
      <Text style={styles.sectionLabel}>Certamen seleccionado</Text>
      <TouchableOpacity
        style={styles.certamenSelector}
        onPress={() => setModalCertamenVisible(true)}
        disabled={certamenes.length === 0}
        activeOpacity={0.85}
      >
        <View style={styles.certamenIcon}>
          <Ionicons
            name={esInnovaTec ? 'bulb-outline' : 'trophy-outline'}
            size={24}
            color="#0369a1"
          />
        </View>
        <View style={styles.certamenInfo}>
          <Text style={styles.certamenName}>
            {certamenSeleccionado
              ? getCertamenNombre(certamenSeleccionado)
              : 'No hay certámenes registrados'}
          </Text>
          <Text style={styles.certamenType}>
            {certamenSeleccionado
              ? esInnovaTec
                ? 'INNOVATECNM'
                : getTipo(certamenSeleccionado) || 'RALLY'
              : 'Sin certámenes'}
          </Text>
          <Text style={styles.certamenHelp}>Toca para cambiar de certamen</Text>
        </View>
        <Ionicons name="chevron-down-circle" size={24} color="#64748b" />
      </TouchableOpacity>

      {/* Buscador ancho completo */}
      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={20} color="#64748b" />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por equipo, desafío, categoría o integrante..."
          placeholderTextColor="#94a3b8"
          value={busqueda}
          onChangeText={setBusqueda}
          returnKeyType="search"
        />
        {busqueda.length > 0 && (
          <TouchableOpacity onPress={() => setBusqueda('')} accessibilityLabel="Limpiar búsqueda">
            <Ionicons name="close-circle" size={19} color="#94a3b8" />
          </TouchableOpacity>
        )}
      </View>

      {/* Si es InnovaTec muestra filtros de sala; si es Rally muestra aviso informativo */}
      {certamenSeleccionado ? (
        esInnovaTec ? (
          <View style={styles.chipsRow}>
            <Text style={styles.chipLabel}>Sala:</Text>
            {[
              { key: 'TODOS', label: 'TODOS' },
              { key: 'CON_SALA', label: 'Con sala' },
              { key: 'SIN_SALA', label: 'Sin sala' },
            ].map((chip) => {
              const activo = filtroSala === chip.key;
              return (
                <TouchableOpacity
                  key={chip.key}
                  style={[styles.chip, activo && styles.chipActive]}
                  onPress={() => setFiltroSala(chip.key as any)}
                >
                  <Text style={[styles.chipText, activo && styles.chipTextActive]}>{chip.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.rallyNotice}>
            <Ionicons name="information-circle-outline" size={17} color="#0369a1" />
            <Text style={styles.rallyNoticeText}>
              Rally no utiliza salas; la asignación de salas aplica únicamente en InnovaTecNM.
            </Text>
          </View>
        )
      ) : null}

      {/* Título de lista con contador */}
      <Text style={styles.listHeaderTitle}>
        Equipos de {certamenSeleccionado ? getCertamenNombre(certamenSeleccionado) : 'certamen'}{' '}
        <Text style={styles.listHeaderCount}>{equiposFiltrados.length}</Text>
      </Text>
    </View>
  );

  const integrantesDetalle = Array.isArray(equipoDetalle?.integrantes)
    ? equipoDetalle.integrantes
    : [];

  return (
    <View style={styles.container}>
      <FlatList
        style={{ flex: 1 }}
        ListHeaderComponent={listHeader}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        data={cargando ? [] : equiposFiltrados}
        keyExtractor={(item, index) => String(getEquipoId(item) || index)}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          cargando ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#002b45" />
              <Text style={styles.loadingText}>Cargando equipos...</Text>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <Ionicons name="people-outline" size={34} color="#94a3b8" />
              <Text style={styles.emptyTitle}>No hay equipos para mostrar</Text>
              <Text style={styles.emptyText}>
                {busqueda.trim() || (esInnovaTec && filtroSala !== 'TODOS')
                  ? 'No hay equipos que coincidan con los filtros aplicados.'
                  : `No hay equipos registrados en ${
                      certamenSeleccionado ? getCertamenNombre(certamenSeleccionado) : 'este certamen'
                    }.`}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const id = getEquipoId(item);
          const nombreEquipo = getNombre(item);
          const idSala = item.Id_sala ?? item.idSala ?? item.id_sala ?? null;
          const salaNombre =
            item.sala?.Nombre ?? item.sala?.nombre ?? (idSala ? `Sala #${idSala}` : 'Sin Sala');
          const desafioNombre =
            item.desafio?.Nombre ??
            item.desafio?.nombre ??
            `ID #${item.Id_desafio ?? item.id_desafio ?? '?'}`;
          const categoriaNombre =
            item.categoriaCertamen?.Nombre ??
            item.categoriaCertamen?.nombre ??
            item.categoria_certamen?.Nombre ??
            item.categoria_certamen?.nombre ??
            `ID #${item.Id_categCertamen ?? item.id_categCertamen ?? '?'}`;
          const video = item.Video ?? item.video;
          const reporte = item.Reporte ?? item.reporte;
          const totalIntegrantes = Array.isArray(item.integrantes) ? item.integrantes.length : 0;

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.titleColumn}>
                  <Text style={styles.idText}>
                    EQUIPO-{id} · {totalIntegrantes} INTEGRANTE(S)
                  </Text>
                  <Text style={styles.nombreText}>{nombreEquipo}</Text>
                </View>

                {/* La insignia de sala solo se muestra en InnovaTecNM */}
                {esInnovaTec && (
                  <View style={[styles.salaBadge, idSala ? styles.salaAsignada : styles.sinSala]}>
                    <Text style={styles.salaText}>{salaNombre}</Text>
                  </View>
                )}
              </View>

              <View style={styles.infoContainer}>
                <View style={styles.infoRow}>
                  <Ionicons name="trophy-outline" size={15} color="#002b45" />
                  <Text style={styles.infoText}>
                    <Text style={styles.infoLabel}>Desafío: </Text>
                    {desafioNombre}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="pricetag-outline" size={15} color="#002b45" />
                  <Text style={styles.infoText}>
                    <Text style={styles.infoLabel}>Categoría: </Text>
                    {categoriaNombre}
                  </Text>
                </View>
                <View style={styles.deliverablesRow}>
                  <View style={styles.deliverable}>
                    <Ionicons
                      name="logo-youtube"
                      size={14}
                      color={video ? '#dc3545' : '#94a3b8'}
                    />
                    <Text style={styles.deliverableText}>
                      {video ? 'Video adjunto' : 'Sin video'}
                    </Text>
                  </View>
                  <View style={styles.deliverable}>
                    <Ionicons
                      name="document-text-outline"
                      size={14}
                      color={reporte ? '#0284c7' : '#94a3b8'}
                    />
                    <Text style={styles.deliverableText}>
                      {reporte ? 'Reporte PDF' : 'Sin reporte'}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[styles.btnAction, styles.btnDetails]}
                  onPress={() => setEquipoDetalle(item)}
                >
                  <Ionicons name="eye-outline" size={16} color="#fff" />
                  <Text style={styles.btnActionText}>Ver detalles</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnAction, styles.btnDelete]}
                  onPress={() => setEquipoEliminar(item)}
                  disabled={eliminando}
                  accessibilityLabel={`Eliminar ${nombreEquipo}`}
                >
                  <Ionicons name="trash-outline" size={16} color="#fff" />
                  <Text style={styles.btnActionText}>Eliminar</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      {/* Modal: Detalles completos del equipo e integrantes */}
      <Modal
        visible={equipoDetalle !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEquipoDetalle(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.detailModal}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.idText}>
                  EQUIPO-{equipoDetalle ? getEquipoId(equipoDetalle) : ''}
                </Text>
                <Text style={styles.detailModalTitle}>
                  {equipoDetalle ? getNombre(equipoDetalle) : ''}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setEquipoDetalle(null)}>
                <Ionicons name="close" size={25} color="#334155" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
              {/* Información general */}
              <Text style={styles.detailSectionTitle}>Información del proyecto</Text>
              <View style={styles.detailBox}>
                <Text style={styles.detailRowText}>
                  <Text style={styles.infoLabel}>Desafío: </Text>
                  {equipoDetalle?.desafio?.Nombre ??
                    equipoDetalle?.desafio?.nombre ??
                    'No especificado'}
                </Text>
                <Text style={styles.detailRowText}>
                  <Text style={styles.infoLabel}>Categoría: </Text>
                  {equipoDetalle?.categoriaCertamen?.Nombre ??
                    equipoDetalle?.categoria_certamen?.Nombre ??
                    'No especificada'}
                </Text>
                {esInnovaTec && (
                  <Text style={styles.detailRowText}>
                    <Text style={styles.infoLabel}>Sala asignada: </Text>
                    {equipoDetalle?.sala?.Nombre ??
                      (equipoDetalle?.Id_sala
                        ? `Sala #${equipoDetalle.Id_sala}`
                        : 'Sin sala asignada')}
                  </Text>
                )}
              </View>

              {/* Entregables */}
              <Text style={styles.detailSectionTitle}>Entregables</Text>
              <View style={styles.detailBox}>
                {equipoDetalle?.Video ? (
                  <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => abrirEnlace(equipoDetalle.Video)}
                  >
                    <Ionicons name="logo-youtube" size={18} color="#dc2626" />
                    <Text style={styles.linkButtonText} numberOfLines={1}>
                      Ver video: {equipoDetalle.Video}
                    </Text>
                    <Ionicons name="open-outline" size={16} color="#0369a1" />
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.detailMutedText}>• Sin video registrado</Text>
                )}

                {equipoDetalle?.Reporte ? (
                  <TouchableOpacity
                    style={styles.linkButton}
                    onPress={() => abrirDocumentoPdf(equipoDetalle.Reporte)}
                  >
                    <Ionicons name="document-text" size={18} color="#0369a1" />
                    <Text style={styles.linkButtonText} numberOfLines={1}>
                      Abrir PDF: {String(equipoDetalle.Reporte).split('/').pop()}
                    </Text>
                    <Ionicons name="open-outline" size={16} color="#0369a1" />
                  </TouchableOpacity>
                ) : (
                  <Text style={styles.detailMutedText}>• Sin reporte PDF adjunto</Text>
                )}
              </View>

              {/* Lista de Integrantes */}
              <Text style={styles.detailSectionTitle}>
                Integrantes ({integrantesDetalle.length})
              </Text>
              {integrantesDetalle.length === 0 ? (
                <View style={styles.detailBox}>
                  <Text style={styles.detailMutedText}>
                    No hay integrantes registrados en este equipo.
                  </Text>
                </View>
              ) : (
                integrantesDetalle.map((ing: any, idx: number) => (
                  <View key={ing.Id_integrante ?? ing.no_control ?? idx} style={styles.memberCard}>
                    <View style={styles.memberHeader}>
                      <View style={styles.memberAvatar}>
                        <Ionicons name="person-outline" size={16} color="#0369a1" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.memberName}>{ing.Nombre || 'Sin nombre'}</Text>
                        <Text style={styles.memberControl}>
                          No. Control: {ing.no_control || 'N/A'} · {ing.Rol || 'Participante'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.memberMeta}>
                      {ing.Carrera ? (
                        <Text style={styles.memberMetaText}>Carrera: {ing.Carrera}</Text>
                      ) : null}
                      <Text style={styles.memberMetaText}>
                        Semestre: {ing.Semestre || 'N/A'} · Sexo:{' '}
                        {String(ing.Sexo).toUpperCase() === 'M' ? 'Masculino' : 'Femenino'}
                      </Text>
                      {ing.Correo ? (
                        <Text style={styles.memberMetaText}>Correo: {ing.Correo}</Text>
                      ) : null}
                    </View>
                  </View>
                ))
              )}
            </ScrollView>

            <TouchableOpacity
              style={[styles.confirmButtonFull, { marginTop: 10 }]}
              onPress={() => setEquipoDetalle(null)}
            >
              <Text style={styles.confirmButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Selector Certamen */}
      <Modal
        visible={modalCertamenVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalCertamenVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.selectorModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.dialogTitle}>Seleccionar certamen</Text>
              <TouchableOpacity onPress={() => setModalCertamenVisible(false)}>
                <Ionicons name="close" size={24} color="#334155" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={certamenes}
              keyExtractor={(item, index) => String(getId(item) || index)}
              ListEmptyComponent={<Text style={styles.emptyText}>No hay certámenes registrados.</Text>}
              renderItem={({ item }) => {
                const selected = getId(item) === idCertamen;
                return (
                  <TouchableOpacity
                    style={[styles.certamenOption, selected && styles.certamenOptionActive]}
                    onPress={() => elegirCertamen(item)}
                  >
                    <View style={styles.certamenOptionIcon}>
                      <Ionicons
                        name={getTipo(item).includes('INNOVATEC') ? 'bulb-outline' : 'trophy-outline'}
                        size={22}
                        color={selected ? '#15803d' : '#036b8a'}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.certamenName, selected && styles.certamenOptionTextActive]}>
                        {getCertamenNombre(item)}
                      </Text>
                      <Text style={[styles.certamenType, selected && styles.certamenOptionTextActive]}>
                        {getTipo(item).includes('INNOVATEC')
                          ? 'InnovaTecNM'
                          : getTipo(item) === 'RALLY'
                          ? 'Rally'
                          : getTipo(item)}
                      </Text>
                    </View>
                    {selected && <Ionicons name="checkmark-circle" size={20} color="#15803d" />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </View>
      </Modal>

      {/* Modal Confirmar Eliminación */}
      <Modal
        visible={equipoEliminar !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEquipoEliminar(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <View style={[styles.iconCircle, styles.warningCircle]}>
              <Ionicons name="trash-outline" size={30} color="#b91c1c" />
            </View>
            <Text style={styles.dialogTitle}>Confirmar eliminación</Text>
            <Text style={styles.dialogMessage}>
              ¿Deseas eliminar el equipo "{equipoEliminar ? getNombre(equipoEliminar) : ''}"? Esta
              acción no se puede deshacer.
            </Text>
            <View style={styles.dialogActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setEquipoEliminar(null)}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteConfirmButton} onPress={confirmarEliminacion}>
                <Text style={styles.confirmButtonText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Cargando Eliminación */}
      <Modal transparent visible={eliminando} animationType="fade" onRequestClose={() => {}}>
        <View style={styles.overlay}>
          <View style={styles.loadingModal}>
            <ActivityIndicator size="large" color="#002b45" />
            <Text style={styles.modalMessage}>Eliminando equipo...</Text>
          </View>
        </View>
      </Modal>

      {/* Modal Resultado */}
      <Modal visible={resultado.visible} transparent animationType="fade" onRequestClose={cerrarResultado}>
        <View style={styles.overlay}>
          <View style={styles.dialog}>
            <View style={[styles.iconCircle, resultado.success ? styles.successCircle : styles.errorCircle]}>
              <Ionicons
                name={resultado.success ? 'checkmark-circle-outline' : 'alert-circle-outline'}
                size={34}
                color={resultado.success ? '#15803d' : '#b91c1c'}
              />
            </View>
            <Text style={styles.dialogTitle}>{resultado.title}</Text>
            <Text style={styles.dialogMessage}>{resultado.message}</Text>
            <TouchableOpacity style={styles.confirmButtonFull} onPress={cerrarResultado}>
              <Text style={styles.confirmButtonText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9', paddingHorizontal: 16 },
  headerWrapper: { width: '100%', paddingTop: 18, marginBottom: 8 },
  topHeader: { alignItems: 'center', marginBottom: 16 },
  headerIconBox: {
    width: 56,
    height: 56,
    borderRadius: 17,
    backgroundColor: '#002b45',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 23, fontWeight: '800', color: '#002b45', marginTop: 10 },
  headerSubtitle: { fontSize: 12, color: '#64748b', textAlign: 'center', marginTop: 4 },
  sectionLabel: { fontSize: 14, fontWeight: '800', color: '#002b45', marginBottom: 8 },
  certamenSelector: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    gap: 12,
    marginBottom: 14,
  },
  certamenIcon: {
    width: 52,
    height: 52,
    borderRadius: 13,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  certamenInfo: { flex: 1 },
  certamenName: { fontSize: 16, color: '#0f172a', fontWeight: '800' },
  certamenType: { fontSize: 12, color: '#64748b', marginTop: 2 },
  certamenHelp: { fontSize: 12, color: '#0e7490', fontWeight: '700', marginTop: 5 },
  certamenOptionIcon: {
    width: 42,
    height: 42,
    borderRadius: 11,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  certamenOption: {
    paddingVertical: 13,
    paddingHorizontal: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: 1,
    borderColor: '#eef2f6',
  },
  certamenOptionActive: { backgroundColor: '#ecfdf5', borderColor: '#bbf7d0' },
  certamenOptionTextActive: { color: '#166534' },
  searchBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 11,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#dbe3ee',
    gap: 8,
    marginBottom: 12,
  },
  searchInput: { flex: 1, height: 45, color: '#0f172a', fontSize: 14 },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chipLabel: { fontSize: 13, fontWeight: '700', color: '#334155', marginRight: 2 },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#e2e8f0',
  },
  chipActive: { backgroundColor: '#002b45' },
  chipText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  chipTextActive: { color: '#fff' },
  rallyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#e0f2fe',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 16,
  },
  rallyNoticeText: { flex: 1, fontSize: 12, color: '#0369a1', fontWeight: '600', lineHeight: 17 },
  listHeaderTitle: { fontSize: 16, fontWeight: '800', color: '#002b45', marginBottom: 6 },
  listHeaderCount: { fontSize: 13, color: '#0369a1' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 30 },
  loadingText: { marginTop: 10, color: '#002b45', fontWeight: '600' },
  listContent: { paddingBottom: 32, flexGrow: 1 },
  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  emptyTitle: { fontSize: 15, fontWeight: '800', color: '#1e293b', marginTop: 10 },
  emptyText: { textAlign: 'center', color: '#64748b', marginTop: 5, fontSize: 13, lineHeight: 18 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 13,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  titleColumn: { flex: 1, paddingRight: 4 },
  idText: { fontSize: 11, color: '#94a3b8', fontWeight: '800' },
  nombreText: { fontSize: 17, fontWeight: '800', color: '#002b45', marginTop: 3 },
  salaBadge: { paddingVertical: 5, paddingHorizontal: 9, borderRadius: 7, maxWidth: '46%' },
  salaAsignada: { backgroundColor: '#dcfce7' },
  sinSala: { backgroundColor: '#fef3c7' },
  salaText: { fontSize: 11, fontWeight: '800', color: '#334155' },
  infoContainer: { marginTop: 12, gap: 8, backgroundColor: '#f8fafc', padding: 11, borderRadius: 9 },
  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 7 },
  infoText: { fontSize: 13, color: '#475569', flex: 1, lineHeight: 18 },
  infoLabel: { fontWeight: '700', color: '#334155' },
  deliverablesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginTop: 4,
    paddingTop: 9,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  deliverable: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  deliverableText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 13, justifyContent: 'flex-end' },
  btnAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 8,
    gap: 5,
  },
  btnDetails: { backgroundColor: '#0284c7' },
  btnDelete: { backgroundColor: '#dc2626' },
  btnActionText: { color: '#fff', fontSize: 12, fontWeight: '800' },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.48)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },
  detailModal: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
  },
  detailModalTitle: { fontSize: 19, fontWeight: '800', color: '#002b45', marginTop: 2 },
  detailSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#002b45',
    marginTop: 12,
    marginBottom: 6,
  },
  detailBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 8,
  },
  detailRowText: { fontSize: 13, color: '#334155', lineHeight: 19, flex: 1 },
  detailMutedText: { fontSize: 13, color: '#94a3b8' },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  linkButtonText: { flex: 1, fontSize: 12, color: '#0369a1', fontWeight: '700' },
  memberCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 11,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 8,
  },
  memberHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  memberAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberName: { fontSize: 14, fontWeight: '800', color: '#0f172a' },
  memberControl: { fontSize: 11, color: '#0369a1', fontWeight: '700', marginTop: 1 },
  memberMeta: { marginTop: 7, paddingTop: 7, borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 2 },
  memberMetaText: { fontSize: 12, color: '#475569' },
  selectorModal: {
    width: '100%',
    maxWidth: 480,
    maxHeight: '75%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingBottom: 12,
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  dialog: {
    width: '100%',
    maxWidth: 430,
    backgroundColor: '#fff',
    padding: 22,
    borderRadius: 16,
    alignItems: 'center',
    elevation: 8,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  warningCircle: { backgroundColor: '#fee2e2' },
  successCircle: { backgroundColor: '#dcfce7' },
  errorCircle: { backgroundColor: '#fee2e2' },
  dialogTitle: { fontSize: 18, color: '#0f172a', fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  dialogMessage: { color: '#475569', fontSize: 14, textAlign: 'center', lineHeight: 21, marginBottom: 20 },
  dialogActions: { flexDirection: 'row', width: '100%', gap: 10 },
  cancelButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: { color: '#334155', fontWeight: '600' },
  deleteConfirmButton: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonFull: {
    alignSelf: 'stretch',
    height: 44,
    borderRadius: 8,
    backgroundColor: '#002b45',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: { color: '#fff', fontWeight: 'bold' },
  loadingModal: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 26,
    paddingVertical: 24,
    minWidth: 220,
    alignItems: 'center',
  },
  modalMessage: { fontSize: 14, color: '#334155', fontWeight: '600', marginTop: 12, textAlign: 'center' },
});