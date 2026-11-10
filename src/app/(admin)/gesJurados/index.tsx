// @ts-nocheck

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';

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
  crearAsignacion,
  eliminarAsignacion,
  eliminarJurado,
  getAsignaciones,
  getCertamenes,
  getEquipos,
  getJurados,
} from '../../../services/api';


// =====================================================
// HELPERS
// =====================================================

const extraerLista = (r: any): any[] => {
  if (Array.isArray(r)) return r;
  if (Array.isArray(r?.data)) return r.data;
  if (Array.isArray(r?.data?.data)) return r.data.data;
  if (Array.isArray(r?.equipos)) return r.equipos;
  if (Array.isArray(r?.asignaciones)) return r.asignaciones;
  if (Array.isArray(r?.jurados)) return r.jurados;

  return [];
};

const idCertamenDe = (x: any) =>
  Number(
    x?.Id_certamen ??
    x?.Id_Certamen ??
    x?.id_certamen ??
    x?.idCertamen ??
    x?.id
  );

const idJuradoDe = (x: any) =>
  Number(
    x?.Id_jurado ??
    x?.id_jurado ??
    x?.id
  );

const idUsuarioDe = (x: any) =>
  Number(
    x?.Id_usuario ??
    x?.id_usuario ??
    x?.usuario?.Id_usuario ??
    x?.usuario?.id
  );

const idEquipoDe = (x: any) =>
  Number(
    x?.Id_Equipo ??
    x?.Id_equipo ??
    x?.id_equipo ??
    x?.idEquipo ??
    x?.equipo?.Id_equipo ??
    x?.equipo?.id
  );

const idAsignacionDe = (x: any) =>
  Number(
    x?.Id_asignacion ??
    x?.id_asignacion ??
    x?.id
  );

const tipoDe = (x: any) =>
  String(
    x?.Tipo_certamen ??
    x?.Tipo ??
    x?.tipo ??
    ''
  )
    .trim()
    .toUpperCase();

const nombreJurado = (j: any) =>
  String(
    j?.Nombre_usuario ??
    j?.usuario?.Nombre ??
    j?.usuario?.name ??
    `Usuario #${idUsuarioDe(j) || '?'}`
  );

const nombreCertamen = (j: any) =>
  String(
    j?.Nombre_certamen ??
    j?.certamen?.Nombre ??
    j?.certamen?.nombre ??
    `Certamen #${j?.Id_certamen ?? '?'}`
  );

const nombreEquipo = (e: any) =>
  String(
    e?.Nombre ??
    e?.nombre ??
    e?.Nombre_equipo ??
    e?.nombre_equipo ??
    `Equipo #${idEquipoDe(e)}`
  );

const integrantesEquipo = (e: any): any[] => {
  if (Array.isArray(e?.integrantes)) return e.integrantes;
  if (Array.isArray(e?.Integrantes)) return e.Integrantes;
  if (Array.isArray(e?.miembros)) return e.miembros;
  if (Array.isArray(e?.Miembros)) return e.Miembros;

  return [];
};

const nombreIntegrante = (i: any) =>
  String(
    i?.Nombre ??
    i?.nombre ??
    i?.Nombre_completo ??
    i?.nombre_completo ??
    i?.no_control ??
    i?.No_control ??
    'Integrante'
  );

const estadoInicial = {
  visible: false,
  titulo: '',
  mensaje: '',
  exito: false,
};


// =====================================================
// COMPONENTE
// =====================================================

export default function JuradosIndexScreen() {
  const router = useRouter();

  // ---------------------------------------------------
  // CERTÁMENES
  // ---------------------------------------------------

  const [certamenes, setCertamenes] = useState<any[]>([]);
  const [idCertamenSel, setIdCertamenSel] = useState<number | null>(null);
  const idCertamenRef = useRef<number | null>(null);

  const [selectorCertamenVisible, setSelectorCertamenVisible] =
    useState(false);


  // ---------------------------------------------------
  // JURADOS
  // ---------------------------------------------------

  const [jurados, setJurados] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [invitacionFiltro, setInvitacionFiltro] = useState('TODOS');


  // ---------------------------------------------------
  // CARGA
  // ---------------------------------------------------

  const [cargando, setCargando] = useState(true);
  const [eliminando, setEliminando] = useState(false);


  // ---------------------------------------------------
  // ELIMINAR JURADO
  // ---------------------------------------------------

  const [confirmarEliminar, setConfirmarEliminar] = useState(false);
  const [juradoPendiente, setJuradoPendiente] = useState<any>(null);


  // ---------------------------------------------------
  // RESULTADO
  // ---------------------------------------------------

  const [resultado, setResultado] = useState(estadoInicial);


  // =====================================================
  // ASIGNACIONES
  // =====================================================

  const [asignaciones, setAsignaciones] = useState<any[]>([]);

  const [equipos, setEquipos] = useState<any[]>([]);

  const [cargandoEquipos, setCargandoEquipos] = useState(false);

  const [cargandoAsignaciones, setCargandoAsignaciones] =
    useState(false);


  // Modal asignar equipo
  const [modalAsignarEquipo, setModalAsignarEquipo] =
    useState(false);

  const [juradoParaAsignar, setJuradoParaAsignar] =
    useState<any>(null);

  const [equipoSeleccionado, setEquipoSeleccionado] =
    useState<any>(null);


  // Confirmación asignación
  const [confirmarAsignacion, setConfirmarAsignacion] =
    useState(false);

  const [asignando, setAsignando] = useState(false);


  // Detalles de equipos asignados
  const [modalEquiposAsignados, setModalEquiposAsignados] =
    useState(false);

  const [juradoEquipos, setJuradoEquipos] =
    useState<any>(null);


  // =====================================================
  // RESULTADO
  // =====================================================

  const mostrarResultado = (
    titulo: string,
    mensaje: string,
    exito = false
  ) => {
    setResultado({
      visible: true,
      titulo,
      mensaje,
      exito,
    });
  };


  // =====================================================
  // CERTAMEN ACTUAL
  // =====================================================

  const certamenActual =
    certamenes.find(
      (x) =>
        idCertamenDe(x) === Number(idCertamenSel)
    ) ?? null;


  // =====================================================
  // CARGAR TODO
  // =====================================================

  const cargarTodo = useCallback(async () => {
    setCargando(true);

    try {
      const [
        rCertamenes,
        rJurados,
        rAsignaciones,
      ] = await Promise.all([
        getCertamenes(),
        getJurados(),
        getAsignaciones(),
      ]);

      const listaCertamenes = extraerLista(rCertamenes)
        .filter(
          (x) =>
            Number.isFinite(idCertamenDe(x)) &&
            idCertamenDe(x) > 0
        );

      setCertamenes(listaCertamenes);

      const elegido =
        listaCertamenes.find(
          (x) =>
            idCertamenDe(x) ===
            Number(idCertamenRef.current)
        ) ??
        listaCertamenes.find(
          (x) =>
            tipoDe(x) === 'RALLY'
        ) ??
        listaCertamenes[0] ??
        null;

      const idElegido =
        elegido
          ? idCertamenDe(elegido)
          : null;

      idCertamenRef.current = idElegido;

      setIdCertamenSel(idElegido);

      setJurados(extraerLista(rJurados));

      setAsignaciones(extraerLista(rAsignaciones));

    } catch (error: any) {
      mostrarResultado(
        'No se pudieron cargar los datos',
        error?.message ||
          'Verifica la conexión con Laravel y tu sesión.',
        false
      );
    } finally {
      setCargando(false);
    }
  }, []);


  useFocusEffect(
    useCallback(() => {
      void cargarTodo();
    }, [cargarTodo])
  );


  // =====================================================
  // SELECCIONAR CERTAMEN
  // =====================================================

  const seleccionarCertamen = (id: number) => {
    idCertamenRef.current = id;
    setIdCertamenSel(id);

    setSelectorCertamenVisible(false);

    // Limpiar selección anterior
    setEquipoSeleccionado(null);
  };


  // =====================================================
  // JURADOS DEL CERTAMEN
  // =====================================================

  const juradosDelCertamen = useMemo(() => {
    return jurados.filter(
      (j) =>
        Number(
          j.Id_certamen ??
          j.id_certamen ??
          j.certamen?.Id_certamen
        ) === Number(idCertamenSel)
    );
  }, [jurados, idCertamenSel]);


  // =====================================================
  // FILTRO JURADOS
  // =====================================================

  const juradosFiltrados = useMemo(() => {
    const q = busqueda
      .trim()
      .toLocaleLowerCase();

    return juradosDelCertamen.filter((j) => {
      const texto = [
        nombreJurado(j),
        j.Institucion,
        j.Puesto,
        j.Area_participacion,
        j.Area_especializada,
        j.Sexo,
      ]
        .map((v) =>
          String(v ?? '')
            .toLocaleLowerCase()
        )
        .join(' ');

      return (
        (!q || texto.includes(q)) &&
        (
          invitacionFiltro === 'TODOS' ||
          j.Invitacion === invitacionFiltro
        )
      );
    });
  }, [
    juradosDelCertamen,
    busqueda,
    invitacionFiltro,
  ]);


  // =====================================================
  // ABRIR ASIGNAR EQUIPO
  // =====================================================

  const abrirAsignarEquipo = async (jurado: any) => {
    setJuradoParaAsignar(jurado);
    setEquipoSeleccionado(null);
    setModalAsignarEquipo(true);

    setCargandoEquipos(true);

    try {
      const respuesta = await getEquipos(
        Number(idCertamenSel)
      );

      const lista = extraerLista(respuesta);

      setEquipos(lista);
    } catch (error: any) {
      setEquipos([]);

      mostrarResultado(
        'No se pudieron cargar los equipos',
        error?.message ||
          'No fue posible consultar los equipos del certamen.',
        false
      );
    } finally {
      setCargandoEquipos(false);
    }
  };


  // =====================================================
  // EQUIPOS YA ASIGNADOS A UN JURADO
  // =====================================================

  const asignacionesDelJurado = (jurado: any) => {
    const idUsuario = idUsuarioDe(jurado);

    return asignaciones.filter(
      (a) =>
        idUsuarioDe(a) === idUsuario
    );
  };


  // =====================================================
  // EQUIPO YA ASIGNADO
  // =====================================================

  const equipoYaAsignado = (
    idEquipo: number,
    idUsuario: number
  ) => {
    return asignaciones.some(
      (a) =>
        idUsuarioDe(a) === idUsuario &&
        idEquipoDe(a) === idEquipo
    );
  };


  // =====================================================
  // SELECCIONAR EQUIPO
  // =====================================================

  const seleccionarEquipo = (equipo: any) => {
    const idEquipo = idEquipoDe(equipo);
    const idUsuario =
      idUsuarioDe(juradoParaAsignar);

    if (
      equipoYaAsignado(
        idEquipo,
        idUsuario
      )
    ) {
      mostrarResultado(
        'Equipo ya asignado',
        'Este equipo ya está asignado a este jurado.',
        false
      );

      return;
    }

    setEquipoSeleccionado(equipo);
  };


  // =====================================================
  // CONFIRMAR ASIGNACIÓN
  // =====================================================

  const abrirConfirmacionAsignacion = () => {
    if (
      !juradoParaAsignar ||
      !equipoSeleccionado
    ) {
      mostrarResultado(
        'Falta seleccionar equipo',
        'Selecciona un equipo antes de continuar.',
        false
      );

      return;
    }

    setConfirmarAsignacion(true);
  };


  // =====================================================
  // GUARDAR ASIGNACIÓN
  // =====================================================

  const confirmarAsignacionEquipo = async () => {
    if (
      asignando ||
      !juradoParaAsignar ||
      !equipoSeleccionado
    ) {
      return;
    }

    const idUsuario =
      idUsuarioDe(juradoParaAsignar);

    const idEquipo =
      idEquipoDe(equipoSeleccionado);

    if (!idUsuario || !idEquipo) {
      mostrarResultado(
        'Datos incompletos',
        'No se pudo identificar al jurado o al equipo.',
        false
      );

      return;
    }

    if (
      equipoYaAsignado(
        idEquipo,
        idUsuario
      )
    ) {
      setConfirmarAsignacion(false);

      mostrarResultado(
        'Equipo ya asignado',
        'Este equipo ya está asignado a este jurado.',
        false
      );

      return;
    }

    setConfirmarAsignacion(false);
    setAsignando(true);

    try {
      const respuesta = await crearAsignacion({
        Id_usuario: idUsuario,
        Id_Equipo: idEquipo,

        // Rally no utiliza sala.
        // InnovaTecNM podrá utilizar sala posteriormente.
        Id_sala: null,

        Hora_inicio: null,
      });

      const nuevaAsignacion = {
        ...respuesta,
        Id_usuario: idUsuario,
        Id_Equipo: idEquipo,
        Id_sala: null,
        equipo:
          respuesta?.equipo ??
          equipoSeleccionado,
      };

      setAsignaciones((prev) => [
        ...prev,
        nuevaAsignacion,
      ]);

      setEquipoSeleccionado(null);

      setModalAsignarEquipo(false);

      mostrarResultado(
        'Equipo asignado',
        `El equipo "${nombreEquipo(
          equipoSeleccionado
        )}" fue asignado correctamente a ${nombreJurado(
          juradoParaAsignar
        )}.`,
        true
      );

    } catch (error: any) {
      const extra =
        error?.errors
          ? Object.values(error.errors)
              .flat()
              .join('\n')
          : '';

      mostrarResultado(
        'No se pudo asignar el equipo',
        error?.message ||
          extra ||
          'Verifica la conexión con el servidor.',
        false
      );
    } finally {
      setAsignando(false);
    }
  };


  // =====================================================
  // MOSTRAR EQUIPOS ASIGNADOS
  // =====================================================

  const abrirEquiposAsignados = (jurado: any) => {
    setJuradoEquipos(jurado);
    setModalEquiposAsignados(true);
  };


  // =====================================================
  // ELIMINAR ASIGNACIÓN
  // =====================================================

  const quitarAsignacion = async (
    asignacion: any
  ) => {
    const id = idAsignacionDe(asignacion);

    if (!id) {
      mostrarResultado(
        'No se pudo quitar',
        'La asignación no tiene un identificador válido.',
        false
      );

      return;
    }

    try {
      await eliminarAsignacion(id);

      setAsignaciones((prev) =>
        prev.filter(
          (a) =>
            idAsignacionDe(a) !== id
        )
      );

      mostrarResultado(
        'Asignación eliminada',
        'El equipo dejó de estar asignado al jurado.',
        true
      );

    } catch (error: any) {
      mostrarResultado(
        'No se pudo quitar la asignación',
        error?.message ||
          'Verifica la conexión con el servidor.',
        false
      );
    }
  };


  // =====================================================
  // ELIMINAR JURADO
  // =====================================================

  const abrirEliminar = (jurado: any) => {
    setJuradoPendiente(jurado);
    setConfirmarEliminar(true);
  };


  const confirmarEliminacion = async () => {
    if (
      !juradoPendiente ||
      eliminando
    ) {
      return;
    }

    setConfirmarEliminar(false);
    setEliminando(true);

    try {
      await eliminarJurado(
        idJuradoDe(juradoPendiente)
      );

      setJurados((prev) =>
        prev.filter(
          (j) =>
            idJuradoDe(j) !==
            idJuradoDe(juradoPendiente)
        )
      );

      setAsignaciones((prev) =>
        prev.filter(
          (a) =>
            idUsuarioDe(a) !==
            idUsuarioDe(juradoPendiente)
        )
      );

      mostrarResultado(
        'Jurado eliminado',
        `Se eliminó a ${nombreJurado(
          juradoPendiente
        )}.`,
        true
      );

    } catch (error: any) {
      mostrarResultado(
        'No se pudo eliminar',
        error?.message ||
          'El jurado podría tener evaluaciones asociadas.',
        false
      );
    } finally {
      setEliminando(false);
      setJuradoPendiente(null);
    }
  };


  // =====================================================
  // CERRAR RESULTADO
  // =====================================================

  const cerrarResultado = () => {
    setResultado(estadoInicial);
  };


  // =====================================================
  // RENDER
  // =====================================================

  return (
    <View style={styles.page}>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator
        keyboardShouldPersistTaps="handled"
      >

        {/* =================================================
            ENCABEZADO
        ================================================= */}

        <View style={styles.header}>

          <View style={styles.headerIcon}>
            <Ionicons
              name="people-outline"
              size={27}
              color="#fff"
            />
          </View>

          <Text style={styles.title}>
            Gestión de jurados
          </Text>

          <Text style={styles.subtitle}>
            Administra jurados, equipos y asignaciones de evaluación.
          </Text>

        </View>


        {/* =================================================
            CERTAMEN
        ================================================= */}

        <Text style={styles.sectionTitle}>
          Certamen seleccionado
        </Text>


        {certamenActual ? (

          <TouchableOpacity
            style={styles.certamenSeleccionadoCard}
            onPress={() =>
              setSelectorCertamenVisible(true)
            }
            disabled={
              cargando ||
              eliminando
            }
            activeOpacity={0.85}
          >

            <View style={styles.certamenIconBox}>

              <Ionicons
                name={
                  [
                    'INNOVATEC',
                    'INNOVATECNM',
                  ].includes(
                    tipoDe(certamenActual)
                  )
                    ? 'bulb-outline'
                    : 'trophy-outline'
                }
                size={27}
                color="#0369a1"
              />

            </View>


            <View style={{ flex: 1 }}>

              <Text style={styles.certamenSeleccionadoNombre}>
                {certamenActual.Nombre ??
                  certamenActual.nombre ??
                  'Certamen'}
              </Text>

              <Text style={styles.certamenSeleccionadoTipo}>
                {[
                  'INNOVATEC',
                  'INNOVATECNM',
                ].includes(
                  tipoDe(certamenActual)
                )
                  ? 'InnovaTecNM'
                  : (
                    certamenActual.Tipo ??
                    certamenActual.tipo ??
                    'Rally'
                  )}
              </Text>

              <Text style={styles.certamenAyuda}>
                Toca para cambiar de certamen
              </Text>

            </View>


            <Ionicons
              name="chevron-down-circle"
              size={27}
              color="#64748b"
            />

          </TouchableOpacity>

        ) : (

          <View style={styles.emptyCard}>

            <Text style={styles.emptyText}>
              No hay certámenes registrados.
            </Text>

          </View>

        )}


        {/* =================================================
            NUEVO JURADO
        ================================================= */}

        <TouchableOpacity
          style={styles.newButton}
          onPress={() =>
            router.push({
              pathname:
                '/gesJurados/form' as any,
              params: {
                idCertamen:
                  String(
                    idCertamenSel ?? ''
                  ),
                juradoEditar: '',
              },
            })
          }
          disabled={
            !idCertamenSel ||
            eliminando
          }
        >

          <Ionicons
            name="add-circle-outline"
            size={20}
            color="#fff"
          />

          <Text style={styles.newButtonText}>
            Nuevo jurado
          </Text>

        </TouchableOpacity>


        {/* =================================================
            BUSCADOR
        ================================================= */}

        <View style={styles.searchBox}>

          <Ionicons
            name="search-outline"
            size={19}
            color="#64748b"
          />

          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, institución, puesto o área..."
            placeholderTextColor="#94a3b8"
            value={busqueda}
            onChangeText={setBusqueda}
          />

        </View>


        {/* =================================================
            FILTROS
        ================================================= */}

        <View style={styles.chipsRow}>

          <Text style={styles.filterLabel}>
            Invitación:
          </Text>

          {[
            'TODOS',
            'Aceptada',
            'Pendiente',
            'Rechazada',
          ].map((e) => (

            <TouchableOpacity
              key={e}
              style={[
                styles.chip,
                invitacionFiltro === e &&
                  styles.chipActive,
              ]}
              onPress={() =>
                setInvitacionFiltro(e)
              }
            >

              <Text
                style={[
                  styles.chipText,
                  invitacionFiltro === e &&
                    styles.chipTextActive,
                ]}
              >
                {e}
              </Text>

            </TouchableOpacity>

          ))}

        </View>


        {/* =================================================
            TÍTULO LISTA
        ================================================= */}

        <Text style={styles.listTitle}>
          Jurados de{' '}
          {certamenActual?.Nombre ??
            'el certamen seleccionado'}{' '}

          <Text style={styles.count}>
            {juradosFiltrados.length}
          </Text>

        </Text>


        {/* =================================================
            LISTA
        ================================================= */}

        {cargando ? (

          <View style={styles.center}>

            <ActivityIndicator
              size="large"
              color="#002b45"
            />

            <Text style={styles.loadingText}>
              Cargando jurados...
            </Text>

          </View>

        ) : juradosFiltrados.length === 0 ? (

          <View style={styles.emptyCard}>

            <Ionicons
              name="people-outline"
              size={32}
              color="#94a3b8"
            />

            <Text style={styles.emptyTitle}>
              No hay jurados para mostrar
            </Text>

            <Text style={styles.emptyText}>
              No hay registros de jurados
              para este certamen con los
              filtros seleccionados.
            </Text>

          </View>

        ) : (

          juradosFiltrados.map((j, idx) => {

            const innov =
              tipoDe(j) === 'INNOVATEC' ||
              [
                'INNOVATEC',
                'INNOVATECNM',
              ].includes(
                tipoDe(certamenActual)
              );

            const badge =
              j.Invitacion === 'Aceptada'
                ? styles.statusAceptada
                : j.Invitacion === 'Rechazada'
                  ? styles.statusRechazada
                  : styles.statusPendiente;


            const equiposAsignados =
              asignacionesDelJurado(j);


            return (

              <View
                key={
                  idJuradoDe(j) ||
                  `jurado-${idx}`
                }
                style={styles.card}
              >

                {/* =========================================
                    CABECERA
                ========================================= */}

                <View style={styles.cardHeader}>

                  <View style={styles.avatar}>

                    <Ionicons
                      name="person-outline"
                      size={21}
                      color="#0369a1"
                    />

                  </View>


                  <View style={{ flex: 1 }}>

                    <Text style={styles.cardName}>
                      {nombreJurado(j)}
                    </Text>

                    <Text style={styles.cardId}>
                      JURADO-{idJuradoDe(j)}
                    </Text>

                  </View>


                  <View
                    style={[
                      styles.statusBadge,
                      badge,
                    ]}
                  >

                    <Text style={styles.statusText}>
                      {j.Invitacion ??
                        'Pendiente'}
                    </Text>

                  </View>

                </View>


                {/* =========================================
                    INFORMACIÓN
                ========================================= */}

                <View style={styles.infoBox}>

                  <Text style={styles.infoText}>
                    <Ionicons
                      name="business-outline"
                      size={14}
                      color="#002b45"
                    />{' '}
                    {j.Institucion ||
                      'Sin institución'}
                  </Text>


                  <Text style={styles.infoText}>
                    <Ionicons
                      name="briefcase-outline"
                      size={14}
                      color="#002b45"
                    />{' '}
                    {j.Puesto ||
                      'Puesto no especificado'}
                    {j.Sexo
                      ? ` · ${j.Sexo}`
                      : ''}
                  </Text>


                  <Text style={styles.infoText}>
                    <Ionicons
                      name="ribbon-outline"
                      size={14}
                      color="#002b45"
                    />{' '}
                    Área:{' '}
                    {j.Area_participacion ||
                      'N/A'}
                  </Text>


                  <Text style={styles.infoText}>
                    <Ionicons
                      name="extension-puzzle-outline"
                      size={14}
                      color="#002b45"
                    />{' '}
                    Especialidad:{' '}
                    {j.Area_especializada ||
                      'N/A'}
                  </Text>


                  <Text style={styles.infoText}>
                    <Ionicons
                      name="trophy-outline"
                      size={14}
                      color="#002b45"
                    />{' '}
                    Certamen:{' '}
                    {nombreCertamen(j)}
                  </Text>


                  {innov ? (

                    <Text style={styles.infoText}>
                      <Ionicons
                        name="business-outline"
                        size={14}
                        color="#002b45"
                      />{' '}
                      Sala:{' '}
                      {j.Nombre_sala ??
                        j.sala?.Nombre ??
                        (
                          j.Id_sala
                            ? `Sala #${j.Id_sala}`
                            : 'Sin asignación'
                        )}
                    </Text>

                  ) : (

                    <Text style={styles.infoText}>
                      Rally: sin sala
                      (no aplica).
                    </Text>

                  )}

                </View>


                {/* =========================================
                    EQUIPOS ASIGNADOS
                ========================================= */}

                {equiposAsignados.length > 0 ? (

                  <TouchableOpacity
                    style={
                      styles.equiposDetallesButton
                    }
                    onPress={() =>
                      abrirEquiposAsignados(j)
                    }
                  >

                    <Ionicons
                      name="people-outline"
                      size={18}
                      color="#166534"
                    />

                    <Text
                      style={
                        styles.equiposDetallesText
                      }
                    >
                      Mostrar detalles de equipos
                      seleccionados
                    </Text>

                    <View
                      style={
                        styles.equiposCountBadge
                      }
                    >
                      <Text
                        style={
                          styles.equiposCountText
                        }
                      >
                        {equiposAsignados.length}
                      </Text>
                    </View>

                  </TouchableOpacity>

                ) : (

                  <View
                    style={
                      styles.sinEquiposBox
                    }
                  >

                    <Ionicons
                      name="people-outline"
                      size={17}
                      color="#94a3b8"
                    />

                    <Text
                      style={
                        styles.sinEquiposText
                      }
                    >
                      Sin equipos asignados
                    </Text>

                  </View>

                )}


                {/* =========================================
                    BOTONES
                ========================================= */}

                <View style={styles.actions}>

                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() =>
                      router.push({
                        pathname:
                          '/gesJurados/form' as any,
                        params: {
                          juradoEditar:
                            JSON.stringify(j),
                          idCertamen:
                            String(
                              idCertamenSel
                            ),
                        },
                      })
                    }
                    disabled={eliminando}
                  >

                    <Ionicons
                      name="create-outline"
                      size={16}
                      color="#fff"
                    />

                    <Text style={styles.actionText}>
                      Editar
                    </Text>

                  </TouchableOpacity>


                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() =>
                      abrirEliminar(j)
                    }
                    disabled={eliminando}
                  >

                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color="#fff"
                    />

                    <Text style={styles.actionText}>
                      Eliminar
                    </Text>

                  </TouchableOpacity>


                  <TouchableOpacity
                    style={
                      styles.assignButton
                    }
                    onPress={() =>
                      void abrirAsignarEquipo(j)
                    }
                    disabled={eliminando}
                  >

                    <Ionicons
                      name="add-circle-outline"
                      size={16}
                      color="#fff"
                    />

                    <Text style={styles.actionText}>
                      Asignar equipo
                    </Text>

                  </TouchableOpacity>

                </View>

              </View>

            );

          })

        )}

      </ScrollView>


      {/* ===================================================
          MODAL SELECCIONAR CERTAMEN
      =================================================== */}

      <Modal
        visible={selectorCertamenVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setSelectorCertamenVisible(false)
        }
      >

        <View style={styles.backdrop}>

          <View
            style={
              styles.selectorModalCard
            }
          >

            <View
              style={
                styles.selectorHeader
              }
            >

              <Text style={styles.modalTitle}>
                Seleccionar certamen
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setSelectorCertamenVisible(
                    false
                  )
                }
                style={styles.closeSelector}
              >

                <Ionicons
                  name="close"
                  size={25}
                  color="#334155"
                />

              </TouchableOpacity>

            </View>


            <ScrollView
              style={styles.selectorScroll}
              contentContainerStyle={
                styles.selectorList
              }
              showsVerticalScrollIndicator
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >

              {certamenes.map((c) => {

                const id =
                  idCertamenDe(c);

                const activo =
                  id ===
                  Number(
                    idCertamenSel
                  );

                const innov =
                  [
                    'INNOVATEC',
                    'INNOVATECNM',
                  ].includes(
                    tipoDe(c)
                  );

                return (

                  <TouchableOpacity
                    key={id}
                    style={[
                      styles.opcionCertamen,
                      activo &&
                        styles.opcionCertamenActiva,
                    ]}
                    onPress={() =>
                      seleccionarCertamen(
                        id
                      )
                    }
                    activeOpacity={0.8}
                  >

                    <Ionicons
                      name={
                        innov
                          ? 'bulb-outline'
                          : 'trophy-outline'
                      }
                      size={23}
                      color={
                        activo
                          ? '#15803d'
                          : '#0369a1'
                      }
                    />


                    <View
                      style={{
                        flex: 1,
                      }}
                    >

                      <Text
                        style={[
                          styles.opcionNombre,
                          activo &&
                            styles.opcionNombreActivo,
                        ]}
                      >
                        {c.Nombre ??
                          c.nombre ??
                          'Certamen'}
                      </Text>


                      <Text
                        style={[
                          styles.opcionTipo,
                          activo &&
                            styles.opcionNombreActivo,
                        ]}
                      >
                        {innov
                          ? 'InnovaTecNM'
                          : (
                            c.Tipo ??
                            c.tipo ??
                            'Rally'
                          )}
                      </Text>

                    </View>


                    {activo ? (

                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color="#15803d"
                      />

                    ) : null}

                  </TouchableOpacity>

                );

              })}

            </ScrollView>

          </View>

        </View>

      </Modal>


      {/* ===================================================
          MODAL ASIGNAR EQUIPO
      =================================================== */}

      <Modal
        visible={modalAsignarEquipo}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setModalAsignarEquipo(false)
        }
      >

        <View style={styles.backdrop}>

          <View
            style={
              styles.assignmentModalCard
            }
          >

            <View
              style={
                styles.selectorHeader
              }
            >

              <Text style={styles.modalTitle}>
                Asignar equipo
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setModalAsignarEquipo(
                    false
                  )
                }
                style={styles.closeSelector}
              >

                <Ionicons
                  name="close"
                  size={25}
                  color="#334155"
                />

              </TouchableOpacity>

            </View>


            <Text
              style={
                styles.assignmentSubtitle
              }
            >
              Jurado:{' '}
              <Text
                style={
                  styles.assignmentSubtitleBold
                }
              >
                {nombreJurado(
                  juradoParaAsignar ??
                    {}
                )}
              </Text>
            </Text>


            <Text
              style={
                styles.assignmentSectionTitle
              }
            >
              Selecciona un equipo
            </Text>


            {cargandoEquipos ? (

              <View style={styles.center}>

                <ActivityIndicator
                  size="large"
                  color="#0369a1"
                />

                <Text
                  style={
                    styles.loadingText
                  }
                >
                  Cargando equipos...
                </Text>

              </View>

            ) : equipos.length === 0 ? (

              <View
                style={
                  styles.noTeamsBox
                }
              >

                <Ionicons
                  name="people-outline"
                  size={32}
                  color="#94a3b8"
                />

                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  No hay equipos
                </Text>

                <Text
                  style={
                    styles.emptyText
                  }
                >
                  Este certamen no tiene
                  equipos registrados.
                </Text>

              </View>

            ) : (

              <ScrollView
                style={
                  styles.teamList
                }
                nestedScrollEnabled
                showsVerticalScrollIndicator
              >

                {equipos.map((equipo) => {

                  const id =
                    idEquipoDe(
                      equipo
                    );

                  const seleccionado =
                    Number(
                      idEquipoDe(
                        equipoSeleccionado
                      )
                    ) === id;

                  const yaAsignado =
                    equipoYaAsignado(
                      id,
                      idUsuarioDe(
                        juradoParaAsignar
                      )
                    );

                  return (

                    <TouchableOpacity
                      key={id}
                      style={[
                        styles.teamOption,
                        seleccionado &&
                          styles.teamOptionSelected,
                        yaAsignado &&
                          styles.teamOptionDisabled,
                      ]}
                      onPress={() =>
                        seleccionarEquipo(
                          equipo
                        )
                      }
                      disabled={
                        yaAsignado
                      }
                    >

                      <View
                        style={
                          styles.teamIcon
                        }
                      >

                        <Ionicons
                          name="people-outline"
                          size={23}
                          color={
                            yaAsignado
                              ? '#94a3b8'
                              : seleccionado
                                ? '#166534'
                                : '#0369a1'
                          }
                        />

                      </View>


                      <View
                        style={{
                          flex: 1,
                        }}
                      >

                        <Text
                          style={[
                            styles.teamName,
                            yaAsignado &&
                              styles.teamNameDisabled,
                          ]}
                        >
                          {nombreEquipo(
                            equipo
                          )}
                        </Text>


                        <Text
                          style={
                            styles.teamId
                          }
                        >
                          Equipo #{id}
                        </Text>


                        {yaAsignado ? (

                          <Text
                            style={
                              styles.alreadyAssigned
                            }
                          >
                            Ya asignado a este
                            jurado
                          </Text>

                        ) : null}

                      </View>


                      {seleccionado ? (

                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color="#15803d"
                        />

                      ) : null}

                    </TouchableOpacity>

                  );

                })}

              </ScrollView>

            )}


            {/* =========================================
                INFORMACIÓN DEL EQUIPO
            ========================================= */}

            {equipoSeleccionado ? (

              <View
                style={
                  styles.teamDetailBox
                }
              >

                <Text
                  style={
                    styles.teamDetailTitle
                  }
                >
                  Información del equipo
                </Text>


                <Text
                  style={
                    styles.teamDetailName
                  }
                >
                  {nombreEquipo(
                    equipoSeleccionado
                  )}
                </Text>


                <Text
                  style={
                    styles.integrantesTitle
                  }
                >
                  Integrantes
                </Text>


                {integrantesEquipo(
                  equipoSeleccionado
                ).length > 0 ? (

                  integrantesEquipo(
                    equipoSeleccionado
                  ).map(
                    (
                      integrante,
                      index
                    ) => (

                      <View
                        key={
                          String(
                            integrante?.no_control ??
                              integrante?.No_control ??
                              index
                          )
                        }
                        style={
                          styles.integranteRow
                        }
                      >

                        <Ionicons
                          name="person-outline"
                          size={16}
                          color="#0369a1"
                        />

                        <View
                          style={{
                            flex: 1,
                          }}
                        >

                          <Text
                            style={
                              styles.integranteNombre
                            }
                          >
                            {nombreIntegrante(
                              integrante
                            )}
                          </Text>

                          {integrante?.Carrera ||
                          integrante?.carrera ? (

                            <Text
                              style={
                                styles.integranteSub
                              }
                            >
                              {integrante.Carrera ??
                                integrante.carrera}
                            </Text>

                          ) : null}

                        </View>

                      </View>

                    )
                  )

                ) : (

                  <Text
                    style={
                      styles.emptyText
                    }
                  >
                    No se encontraron
                    integrantes del equipo.
                  </Text>

                )}

              </View>

            ) : (

              <View
                style={
                  styles.selectHint
                }
              >

                <Ionicons
                  name="information-circle-outline"
                  size={19}
                  color="#0369a1"
                />

                <Text
                  style={
                    styles.selectHintText
                  }
                >
                  Selecciona un equipo
                  para visualizar su
                  información e integrantes.
                </Text>

              </View>

            )}


            {/* =========================================
                BOTONES
            ========================================= */}

            <View
              style={
                styles.modalActions
              }
            >

              <TouchableOpacity
                style={
                  styles.cancelButton
                }
                onPress={() =>
                  setModalAsignarEquipo(
                    false
                  )
                }
                disabled={
                  asignando
                }
              >

                <Text
                  style={
                    styles.cancelText
                  }
                >
                  Cancelar
                </Text>

              </TouchableOpacity>


              <TouchableOpacity
                style={[
                  styles.assignConfirmButton,
                  (
                    !equipoSeleccionado ||
                    asignando
                  ) &&
                    styles.disabledButton,
                ]}
                onPress={
                  abrirConfirmacionAsignacion
                }
                disabled={
                  !equipoSeleccionado ||
                  asignando
                }
              >

                {asignando ? (

                  <ActivityIndicator
                    color="#fff"
                  />

                ) : (

                  <>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={18}
                      color="#fff"
                    />

                    <Text
                      style={
                        styles.confirmText
                      }
                    >
                      Asignar
                    </Text>
                  </>

                )}

              </TouchableOpacity>

            </View>

          </View>

        </View>

      </Modal>


      {/* ===================================================
          CONFIRMAR ASIGNACIÓN
      =================================================== */}

      <Modal
        visible={confirmarAsignacion}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setConfirmarAsignacion(false)
        }
      >

        <View style={styles.backdrop}>

          <View
            style={
              styles.modalCard
            }
          >

            <View
              style={[
                styles.modalIcon,
                styles.successIcon,
              ]}
            >

              <Ionicons
                name="help-circle-outline"
                size={29}
                color="#15803d"
              />

            </View>


            <Text
              style={
                styles.modalTitle
              }
            >
              ¿Seguro que deseas asignar
              este equipo?
            </Text>


            <Text
              style={
                styles.modalMessage
              }
            >
              {`El equipo "${nombreEquipo(
                equipoSeleccionado ??
                  {}
              )}" será asignado al jurado "${nombreJurado(
                juradoParaAsignar ??
                  {}
              )}".`}
            </Text>


            <View
              style={
                styles.modalActions
              }
            >

              <TouchableOpacity
                style={
                  styles.cancelButton
                }
                onPress={() =>
                  setConfirmarAsignacion(
                    false
                  )
                }
              >

                <Text
                  style={
                    styles.cancelText
                  }
                >
                  No, cancelar
                </Text>

              </TouchableOpacity>


              <TouchableOpacity
                style={
                  styles.assignConfirmButton
                }
                onPress={() =>
                  void confirmarAsignacionEquipo()
                }
              >

                <Ionicons
                  name="checkmark-outline"
                  size={18}
                  color="#fff"
                />

                <Text
                  style={
                    styles.confirmText
                  }
                >
                  Sí, asignar
                </Text>

              </TouchableOpacity>

            </View>

          </View>

        </View>

      </Modal>


      {/* ===================================================
          MODAL EQUIPOS ASIGNADOS
      =================================================== */}

      <Modal
        visible={modalEquiposAsignados}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setModalEquiposAsignados(false)
        }
      >

        <View style={styles.backdrop}>

          <View
            style={
              styles.assignmentModalCard
            }
          >

            <View
              style={
                styles.selectorHeader
              }
            >

              <Text
                style={
                  styles.modalTitle
                }
              >
                Equipos asignados
              </Text>


              <TouchableOpacity
                onPress={() =>
                  setModalEquiposAsignados(
                    false
                  )
                }
                style={
                  styles.closeSelector
                }
              >

                <Ionicons
                  name="close"
                  size={25}
                  color="#334155"
                />

              </TouchableOpacity>

            </View>


            <Text
              style={
                styles.assignmentSubtitle
              }
            >
              Jurado:{' '}
              <Text
                style={
                  styles.assignmentSubtitleBold
                }
              >
                {nombreJurado(
                  juradoEquipos ??
                    {}
                )}
              </Text>
            </Text>


            {asignacionesDelJurado(
              juradoEquipos
            ).length === 0 ? (

              <View
                style={
                  styles.noTeamsBox
                }
              >

                <Ionicons
                  name="people-outline"
                  size={34}
                  color="#94a3b8"
                />

                <Text
                  style={
                    styles.emptyTitle
                  }
                >
                  Sin equipos asignados
                </Text>

              </View>

            ) : (

              <ScrollView
                style={
                  styles.assignedTeamsList
                }
                nestedScrollEnabled
              >

                {asignacionesDelJurado(
                  juradoEquipos
                ).map(
                  (
                    asignacion,
                    index
                  ) => {

                    const equipo =
                      asignacion.equipo ??
                      equipos.find(
                        (e) =>
                          idEquipoDe(
                            e
                          ) ===
                          idEquipoDe(
                            asignacion
                          )
                      );

                    const integrantes =
                      integrantesEquipo(
                        equipo
                      );

                    return (

                      <View
                        key={
                          idAsignacionDe(
                            asignacion
                          ) ||
                          index
                        }
                        style={
                          styles.assignedTeamCard
                        }
                      >

                        <View
                          style={
                            styles.assignedTeamHeader
                          }
                        >

                          <View
                            style={
                              styles.assignedTeamIcon
                            }
                          >

                            <Ionicons
                              name="people-outline"
                              size={22}
                              color="#166534"
                            />

                          </View>


                          <View
                            style={{
                              flex: 1,
                            }}
                          >

                            <Text
                              style={
                                styles.assignedTeamName
                              }
                            >
                              {nombreEquipo(
                                equipo ??
                                  asignacion
                              )}
                            </Text>

                            <Text
                              style={
                                styles.assignedTeamId
                              }
                            >
                              Equipo #
                              {idEquipoDe(
                                asignacion
                              )}
                            </Text>

                          </View>

                        </View>


                        <Text
                          style={
                            styles.integrantesTitle
                          }
                        >
                          Integrantes
                        </Text>


                        {integrantes.length >
                        0 ? (

                          integrantes.map(
                            (
                              integrante,
                              i
                            ) => (

                              <View
                                key={
                                  String(
                                    integrante?.no_control ??
                                      integrante?.No_control ??
                                      i
                                  )
                                }
                                style={
                                  styles.integranteRow
                                }
                              >

                                <Ionicons
                                  name="person-outline"
                                  size={15}
                                  color="#0369a1"
                                />

                                <Text
                                  style={
                                    styles.integranteNombre
                                  }
                                >
                                  {nombreIntegrante(
                                    integrante
                                  )}
                                </Text>

                              </View>

                            )
                          )

                        ) : (

                          <Text
                            style={
                              styles.emptyText
                            }
                          >
                            No se encontraron
                            integrantes.
                          </Text>

                        )}


                        <TouchableOpacity
                          style={
                            styles.removeAssignmentButton
                          }
                          onPress={() =>
                            void quitarAsignacion(
                              asignacion
                            )
                          }
                        >

                          <Ionicons
                            name="trash-outline"
                            size={16}
                            color="#b91c1c"
                          />

                          <Text
                            style={
                              styles.removeAssignmentText
                            }
                          >
                            Quitar asignación
                          </Text>

                        </TouchableOpacity>

                      </View>

                    );

                  }
                )}

              </ScrollView>

            )}


            <TouchableOpacity
              style={
                styles.closeModalButton
              }
              onPress={() =>
                setModalEquiposAsignados(
                  false
                )
              }
            >

              <Text
                style={
                  styles.confirmText
                }
              >
                Cerrar
              </Text>

            </TouchableOpacity>

          </View>

        </View>

      </Modal>


      {/* ===================================================
          MODAL ELIMINAR JURADO
      =================================================== */}

      <Modal
        visible={confirmarEliminar}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setConfirmarEliminar(false)
        }
      >

        <View style={styles.backdrop}>

          <View
            style={
              styles.modalCard
            }
          >

            <View
              style={[
                styles.modalIcon,
                styles.errorIcon,
              ]}
            >

              <Ionicons
                name="trash-outline"
                size={28}
                color="#b91c1c"
              />

            </View>


            <Text
              style={
                styles.modalTitle
              }
            >
              ¿Eliminar jurado?
            </Text>


            <Text
              style={
                styles.modalMessage
              }
            >
              {`Se eliminará el registro de ${nombreJurado(
                juradoPendiente ??
                  {}
              )}. Si tiene evaluaciones relacionadas, el servidor rechazará la operación.`}
            </Text>


            <View
              style={
                styles.modalActions
              }
            >

              <TouchableOpacity
                style={
                  styles.cancelButton
                }
                onPress={() =>
                  setConfirmarEliminar(
                    false
                  )
                }
              >

                <Text
                  style={
                    styles.cancelText
                  }
                >
                  Cancelar
                </Text>

              </TouchableOpacity>


              <TouchableOpacity
                style={
                  styles.deleteConfirmButton
                }
                onPress={() =>
                  void confirmarEliminacion()
                }
              >

                <Text
                  style={
                    styles.confirmText
                  }
                >
                  Eliminar
                </Text>

              </TouchableOpacity>

            </View>

          </View>

        </View>

      </Modal>


      {/* ===================================================
          MODAL RESULTADO
      =================================================== */}

      <Modal
        visible={resultado.visible}
        transparent
        animationType="fade"
        onRequestClose={
          cerrarResultado
        }
      >

        <View style={styles.backdrop}>

          <View
            style={
              styles.modalCard
            }
          >

            <View
              style={[
                styles.modalIcon,
                resultado.exito
                  ? styles.successIcon
                  : styles.errorIcon,
              ]}
            >

              <Ionicons
                name={
                  resultado.exito
                    ? 'checkmark-circle-outline'
                    : 'alert-circle-outline'
                }
                size={29}
                color={
                  resultado.exito
                    ? '#15803d'
                    : '#b91c1c'
                }
              />

            </View>


            <Text
              style={
                styles.modalTitle
              }
            >
              {resultado.titulo}
            </Text>


            <Text
              style={
                styles.modalMessage
              }
            >
              {resultado.mensaje}
            </Text>


            <TouchableOpacity
              style={
                styles.confirmButton
              }
              onPress={
                cerrarResultado
              }
            >

              <Text
                style={
                  styles.confirmText
                }
              >
                Aceptar
              </Text>

            </TouchableOpacity>

          </View>

        </View>

      </Modal>

    </View>
  );
}


// =====================================================
// ESTILOS
// =====================================================

const styles = StyleSheet.create({

  page: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },

  scrollView: {
    flex: 1,
  },

  container: {
    padding: 16,
    paddingBottom: 50,
    flexGrow: 1,
  },

  header: {
    paddingTop: 18,
    alignItems: 'center',
  },

  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 17,
    backgroundColor: '#002b45',
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 23,
    fontWeight: '800',
    color: '#002b45',
    marginTop: 9,
  },

  subtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 5,
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#002b45',
    marginTop: 10,
    marginBottom: 9,
  },

  certamenSeleccionadoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    marginBottom: 8,
    minHeight: 100,
  },

  certamenIconBox: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },

  certamenSeleccionadoNombre: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },

  certamenSeleccionadoTipo: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },

  certamenAyuda: {
    fontSize: 12,
    color: '#0e7490',
    fontWeight: '700',
    marginTop: 7,
  },

  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: '#86a327',
    padding: 13,
    borderRadius: 10,
    marginTop: 16,
    marginBottom: 12,
  },

  newButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },

  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dbe3ee',
    borderRadius: 9,
    paddingHorizontal: 11,
  },

  searchInput: {
    flex: 1,
    height: 43,
    marginLeft: 8,
    color: '#0f172a',
  },

  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 10,
  },

  filterLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },

  chip: {
    paddingVertical: 6,
    paddingHorizontal: 9,
    borderRadius: 16,
    backgroundColor: '#e2e8f0',
  },

  chipActive: {
    backgroundColor: '#002b45',
  },

  chipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#334155',
  },

  chipTextActive: {
    color: '#fff',
  },

  listTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#002b45',
    marginTop: 20,
    marginBottom: 10,
  },

  count: {
    fontSize: 12,
    color: '#0369a1',
  },

  center: {
    alignItems: 'center',
    padding: 25,
  },

  loadingText: {
    marginTop: 8,
    color: '#64748b',
  },

  emptyCard: {
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginTop: 6,
  },

  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#334155',
    marginTop: 9,
  },

  emptyText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 5,
    lineHeight: 18,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginBottom: 12,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  avatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#002b45',
  },

  cardId: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '700',
    marginTop: 2,
  },

  statusBadge: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
  },

  statusAceptada: {
    backgroundColor: '#dcfce7',
  },

  statusPendiente: {
    backgroundColor: '#fef3c7',
  },

  statusRechazada: {
    backgroundColor: '#fee2e2',
  },

  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#334155',
  },

  infoBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 9,
    padding: 10,
    marginTop: 11,
    gap: 5,
  },

  infoText: {
    fontSize: 12,
    color: '#475569',
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 7,
    marginTop: 12,
    flexWrap: 'wrap',
  },

  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#0284c7',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 7,
  },

  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#dc2626',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 7,
  },

  assignButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#16a34a',
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 7,
  },

  actionText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 11,
  },

  equiposDetallesButton: {
    marginTop: 10,
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 9,
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  equiposDetallesText: {
    flex: 1,
    color: '#166534',
    fontSize: 12,
    fontWeight: '800',
  },

  equiposCountBadge: {
    minWidth: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
  },

  equiposCountText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },

  sinEquiposBox: {
    marginTop: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 9,
    padding: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },

  sinEquiposText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.48)',
    justifyContent: 'center',
    padding: 18,
  },

  modalCard: {
    backgroundColor: '#fff',
    padding: 18,
    borderRadius: 15,
  },

  selectorModalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    maxHeight: '82%',
    width: '100%',
    maxWidth: 480,
  },

  assignmentModalCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 16,
    maxHeight: '90%',
    width: '100%',
    maxWidth: 480,
  },

  selectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: 12,
    marginBottom: 8,
  },

  closeSelector: {
    padding: 4,
  },

  selectorScroll: {
    flexGrow: 0,
  },

  selectorList: {
    paddingBottom: 4,
  },

  opcionCertamen: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    borderRadius: 10,
    minHeight: 76,
  },

  opcionCertamenActiva: {
    backgroundColor: '#ecfdf5',
    borderBottomColor: '#bbf7d0',
  },

  opcionNombre: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0f172a',
  },

  opcionTipo: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
  },

  opcionNombreActivo: {
    color: '#166534',
  },

  modalIcon: {
    alignSelf: 'center',
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
    backgroundColor: '#e0f2fe',
  },

  successIcon: {
    backgroundColor: '#dcfce7',
  },

  errorIcon: {
    backgroundColor: '#fee2e2',
  },

  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 7,
  },

  modalMessage: {
    fontSize: 13,
    lineHeight: 19,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 14,
  },

  modalActions: {
    flexDirection: 'row',
    gap: 9,
    marginTop: 12,
  },

  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cancelText: {
    color: '#334155',
    fontWeight: '800',
  },

  confirmButton: {
    padding: 12,
    borderRadius: 9,
    backgroundColor: '#002b45',
    alignItems: 'center',
  },

  assignConfirmButton: {
    flex: 1,
    padding: 12,
    borderRadius: 9,
    backgroundColor: '#16a34a',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },

  deleteConfirmButton: {
    flex: 1,
    padding: 12,
    borderRadius: 9,
    backgroundColor: '#dc2626',
    alignItems: 'center',
  },

  disabledButton: {
    opacity: 0.45,
  },

  confirmText: {
    color: '#fff',
    fontWeight: '800',
  },

  assignmentSubtitle: {
    color: '#64748b',
    fontSize: 12,
    marginBottom: 12,
  },

  assignmentSubtitleBold: {
    color: '#002b45',
    fontWeight: '800',
  },

  assignmentSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#002b45',
    marginBottom: 8,
  },

  teamList: {
    maxHeight: 260,
  },

  teamOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 11,
    borderWidth: 1,
    borderColor: '#dbe3ee',
    borderRadius: 11,
    marginBottom: 8,
    backgroundColor: '#fff',
  },

  teamOptionSelected: {
    borderColor: '#86efac',
    backgroundColor: '#f0fdf4',
  },

  teamOptionDisabled: {
    opacity: 0.55,
    backgroundColor: '#f8fafc',
  },

  teamIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },

  teamName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },

  teamNameDisabled: {
    color: '#64748b',
  },

  teamId: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },

  alreadyAssigned: {
    fontSize: 10,
    color: '#b91c1c',
    fontWeight: '700',
    marginTop: 3,
  },

  teamDetailBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbe3ee',
    padding: 12,
    marginTop: 10,
    maxHeight: 240,
  },

  teamDetailTitle: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
  },

  teamDetailName: {
    fontSize: 17,
    color: '#002b45',
    fontWeight: '900',
    marginTop: 3,
  },

  integrantesTitle: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 5,
  },

  integranteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 4,
  },

  integranteNombre: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },

  integranteSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },

  selectHint: {
    marginTop: 10,
    padding: 11,
    borderRadius: 9,
    backgroundColor: '#eff6ff',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },

  selectHintText: {
    flex: 1,
    fontSize: 11,
    color: '#0369a1',
    lineHeight: 16,
  },

  noTeamsBox: {
    alignItems: 'center',
    padding: 25,
  },

  assignedTeamsList: {
    maxHeight: 450,
  },

  assignedTeamCard: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#dbe3ee',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },

  assignedTeamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  assignedTeamIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  assignedTeamName: {
    fontSize: 15,
    color: '#166534',
    fontWeight: '900',
  },

  assignedTeamId: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },

  removeAssignmentButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 9,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },

  removeAssignmentText: {
    color: '#b91c1c',
    fontSize: 11,
    fontWeight: '800',
  },

  closeModalButton: {
    marginTop: 12,
    padding: 12,
    borderRadius: 9,
    backgroundColor: '#002b45',
    alignItems: 'center',
  },
});