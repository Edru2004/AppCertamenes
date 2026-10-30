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
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { eliminarDesafio, getCertamenes, getDesafios } from '../../../services/api';

type Resultado = {
  visible: boolean;
  titulo: string;
  mensaje: string;
  tipo: 'success' | 'error' | 'warning';
};

type Certamen = {
  id: number;
  nombre: string;
  tipo?: string;
};

type DesafioPendiente = {
  id: number;
  nombre: string;
  equiposCount: number;
};

const resultadoInicial: Resultado = {
  visible: false,
  titulo: '',
  mensaje: '',
  tipo: 'success',
};

const extraerLista = (r: any): any[] => {
  if (Array.isArray(r)) return r;
  if (Array.isArray(r?.data)) return r.data;
  if (Array.isArray(r?.data?.data)) return r.data.data;
  return [];
};

const idCertamenDe = (x: any) => {
  const n = Number(
    x?.Id_certamen ??
    x?.Id_Certamen ??
    x?.idCertamen ??
    x?.id_certamen ??
    x?.certamen?.Id_certamen ??
    x?.id
  );

  return Number.isFinite(n) && n > 0 ? n : null;
};

const tipoVisible = (tipo: any) => {
  const v = String(tipo ?? '').trim().toUpperCase();

  if (v === 'RALLY') return 'Rally';

  if (v === 'INNOVATEC' || v === 'INNOVATECNM') {
    return 'InnovaTecNM';
  }

  return String(tipo ?? '');
};

const getId = (item: any) => {
  const n = Number(
    item?.Id_desafio ??
    item?.idDesafio ??
    item?.id_desafio ??
    item?.id
  );

  return Number.isFinite(n) && n > 0 ? n : null;
};

const getIdCertamenDesafio = (item: any) => {
  const n = Number(
    item?.Id_certamen ??
    item?.idCertamen ??
    item?.id_certamen ??
    item?.certamen?.Id_certamen
  );

  return Number.isFinite(n) && n > 0 ? n : null;
};

const getNombre = (item: any) =>
  String(item?.Nombre ?? item?.nombre ?? 'Sin nombre');

const getDescripcion = (item: any) =>
  String(
    item?.Descripcion ??
    item?.descripcion ??
    item?.descrip ??
    'Sin descripción'
  );

const getEquiposCount = (item: any) =>
  Math.max(
    0,
    Number(
      item?.equipos_count ??
      item?.equiposCount ??
      item?.equipos?.length ??
      0
    ) || 0
  );

export default function DesafiosIndexScreen() {
  const router = useRouter();

  const [certamenes, setCertamenes] = useState<Certamen[]>([]);
  const [idCertamenSel, setIdCertamenSel] = useState<number | null>(null);

  const idCertamenRef = useRef<number | null>(null);

  const [desafios, setDesafios] = useState<any[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);

  const [confirmacionVisible, setConfirmacionVisible] = useState(false);
  const [eliminando, setEliminando] = useState(false);

  const [pendiente, setPendiente] =
    useState<DesafioPendiente | null>(null);

  const [resultado, setResultado] =
    useState<Resultado>(resultadoInicial);

  const [modalCertamenesVisible, setModalCertamenesVisible] =
    useState(false);

  const mostrarResultado = (
    titulo: string,
    mensaje: string,
    tipo: Resultado['tipo'] = 'success'
  ) => {
    setResultado({
      visible: true,
      titulo,
      mensaje,
      tipo,
    });
  };

  // Cargar desafíos del certamen seleccionado
  const cargarListaDesafios = useCallback(
    async (idCertamen: number | null, texto: string) => {
      if (!idCertamen) {
        setDesafios([]);
        return;
      }

      const respuesta = await getDesafios(idCertamen);
      const lista = extraerLista(respuesta);

      const listaDelCertamen = lista.filter(
        (item: any) => getIdCertamenDesafio(item) === idCertamen
      );

      const termino = texto.trim().toLocaleLowerCase();

      setDesafios(
        termino
          ? listaDelCertamen.filter((item: any) =>
              `${getNombre(item)} ${getDescripcion(item)}`
                .toLocaleLowerCase()
                .includes(termino)
            )
          : listaDelCertamen
      );
    },
    []
  );

  // Buscar desafíos
  const cargarBusqueda = async (
    texto = busqueda,
    idCertamen = idCertamenRef.current
  ) => {
    setCargando(true);

    try {
      await cargarListaDesafios(idCertamen, texto);
    } catch (error: any) {
      mostrarResultado(
        'Error al cargar desafíos',
        error?.message ||
          'No se pudieron consultar los desafíos del certamen.',
        'error'
      );
    } finally {
      setCargando(false);
    }
  };

  // Cargar certámenes al entrar al módulo
  useFocusEffect(
    useCallback(() => {
      let activo = true;

      const iniciar = async () => {
        setCargando(true);

        try {
          const certamenesRespuesta = await getCertamenes();

          const lista = extraerLista(certamenesRespuesta)
            .map((item: any) => {
              const id = idCertamenDe(item);

              if (id === null) return null;

              return {
                id,
                nombre: String(
                  item?.Nombre ??
                  item?.nombre ??
                  `Certamen #${id}`
                ),
                tipo: item?.Tipo ?? item?.tipo,
              } as Certamen;
            })
            .filter(
              (item: Certamen | null): item is Certamen =>
                item !== null
            );

          if (!activo) return;

          setCertamenes(lista);

          const actualValido = lista.find(
            (c) => c.id === idCertamenRef.current
          );

          const rally = lista.find(
            (c) =>
              String(c.tipo ?? '').trim().toUpperCase() === 'RALLY'
          );

          const elegido =
            actualValido ?? rally ?? lista[0] ?? null;

          const id = elegido?.id ?? null;

          idCertamenRef.current = id;
          setIdCertamenSel(id);

          if (id) {
            const respuesta = await getDesafios(id);

            const desafiosLista = extraerLista(respuesta).filter(
              (item: any) => getIdCertamenDesafio(item) === id
            );

            if (activo) setDesafios(desafiosLista);
          } else {
            setDesafios([]);
          }
        } catch (error: any) {
          if (activo) {
            mostrarResultado(
              'Error al cargar',
              error?.message ||
                'No se pudieron cargar certámenes y desafíos.',
              'error'
            );
          }
        } finally {
          if (activo) setCargando(false);
        }
      };

      void iniciar();

      return () => {
        activo = false;
      };
    }, [])
  );

  // Seleccionar otro certamen
  const seleccionarCertamen = async (certamen: Certamen) => {
    idCertamenRef.current = certamen.id;

    setIdCertamenSel(certamen.id);
    setBusqueda('');

    await cargarBusqueda('', certamen.id);
  };

  // Solicitar eliminación
  const solicitarEliminar = (
    id: number,
    nombre: string,
    equiposCount: number
  ) => {
    if (equiposCount > 0) {
      mostrarResultado(
        'No se puede eliminar',
        `El desafío "${nombre}" tiene ${equiposCount} equipo(s) asociado(s). Reasigna o elimina esos equipos antes de eliminarlo.`,
        'warning'
      );

      return;
    }

    setPendiente({
      id,
      nombre,
      equiposCount,
    });

    setConfirmacionVisible(true);
  };

  // Confirmar eliminación
  const confirmarEliminar = async () => {
    if (!pendiente || eliminando) return;

    const actual = pendiente;

    setConfirmacionVisible(false);
    setEliminando(true);

    try {
      await eliminarDesafio(actual.id);

      await cargarListaDesafios(
        idCertamenRef.current,
        busqueda
      );

      mostrarResultado(
        '¡Desafío eliminado!',
        `El desafío "${actual.nombre}" se eliminó correctamente.`
      );

      setPendiente(null);
    } catch (error: any) {
      mostrarResultado(
        'Error al eliminar',
        error?.message ||
          'No se pudo eliminar el desafío. Comprueba si tiene equipos asociados.',
        'error'
      );
    } finally {
      setEliminando(false);
    }
  };

  const cerrarResultado = () => {
    setResultado(resultadoInicial);
  };

  const certamenActual = certamenes.find(
    (c) => c.id === idCertamenSel
  );

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* ENCABEZADO */}
        <View style={styles.header}>
          <Ionicons
            name="trophy-outline"
            size={35}
            color="#002b45"
          />

          <Text style={styles.headerTitle}>
            Gestión de desafíos
          </Text>

          
        </View>

        {/* SELECTOR DE CERTAMEN */}
        <View style={styles.certamenSelectorCard}>
          <Text style={styles.certamenSelectorTitle}>
            Certamen seleccionado
          </Text>

          <Text style={styles.certamenSelectorDescription}>
            Los desafíos mostrados corresponden únicamente al certamen seleccionado.
          </Text>

          {certamenes.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                No hay certámenes registrados. Registra uno antes de crear desafíos.
              </Text>
            </View>
          ) : certamenActual ? (
            <TouchableOpacity
              style={styles.certamenSeleccionado}
              onPress={() => setModalCertamenesVisible(true)}
              disabled={cargando || eliminando}
              activeOpacity={0.85}
            >
              <View style={styles.certamenSeleccionadoIcon}>
                <Ionicons
                  name={
                    String(certamenActual.tipo ?? '')
                      .trim()
                      .toUpperCase() === 'RALLY'
                      ? 'trophy-outline'
                      : 'bulb-outline'
                  }
                  size={30}
                  color="#946200"
                />
              </View>

              <View style={styles.certamenSeleccionadoInfo}>
                <Text style={styles.certamenSeleccionadoNombre}>
                  {certamenActual.nombre}
                </Text>

                <Text style={styles.certamenSeleccionadoTipo}>
                  {tipoVisible(certamenActual.tipo)}
                </Text>

                <Text style={styles.certamenCambiarTexto}>
                  Toca para cambiar de certamen
                </Text>
              </View>

              <Ionicons
                name="chevron-down-circle"
                size={29}
                color="#64748b"
              />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* BOTÓN NUEVO DESAFÍO */}
        <TouchableOpacity
          style={[
            styles.btnNuevo,
            (!idCertamenSel || cargando || eliminando) &&
              styles.btnDisabled,
          ]}
          onPress={() =>
            router.push({
              pathname: '/desafios/form' as any,
              params: {
                idCertamen: String(idCertamenSel ?? ''),
              },
            })
          }
          disabled={!idCertamenSel || cargando || eliminando}
          activeOpacity={0.85}
        >
          <Ionicons
            name="add-circle-outline"
            size={22}
            color="#fff"
          />

          <Text style={styles.btnNuevoText}>
            Nuevo desafío para {certamenActual?.nombre ?? 'certamen'}
          </Text>
        </TouchableOpacity>

        {/* BUSCADOR */}
        <View style={styles.filterCard}>
          <View style={styles.inputContainer}>
            <Ionicons
              name="search-outline"
              size={21}
              color="#64748b"
            />

            <TextInput
              style={styles.input}
              placeholder="Buscar desafío por nombre o descripción..."
              placeholderTextColor="#94a3b8"
              value={busqueda}
              onChangeText={setBusqueda}
              onSubmitEditing={() => void cargarBusqueda(busqueda)}
              returnKeyType="search"
              editable={!cargando && !eliminando}
            />

            {busqueda.length > 0 ? (
              <TouchableOpacity
                onPress={() => {
                  setBusqueda('');
                  void cargarBusqueda('');
                }}
                accessibilityLabel="Limpiar búsqueda"
              >
                <Ionicons
                  name="close-circle"
                  size={19}
                  color="#94a3b8"
                />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            style={[
              styles.btnBuscar,
              (cargando || eliminando) && styles.btnDisabled,
            ]}
            onPress={() => void cargarBusqueda(busqueda)}
            disabled={cargando || eliminando}
          >
            <Ionicons
              name="filter"
              size={18}
              color="#fff"
            />

            <Text style={styles.btnBuscarText}>
              Buscar
            </Text>
          </TouchableOpacity>
        </View>

        {/* LISTA DE DESAFÍOS */}
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            Desafíos de {certamenActual?.nombre ?? 'certamen seleccionado'}
          </Text>

          <View style={styles.counter}>
            <Text style={styles.counterText}>
              {desafios.length}
            </Text>
          </View>
        </View>

        {cargando ? (
          <View style={styles.center}>
            <ActivityIndicator
              size="large"
              color="#002b45"
            />

            <Text style={styles.loadingInlineText}>
              Cargando desafíos...
            </Text>
          </View>
        ) : desafios.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="document-text-outline"
              size={35}
              color="#94a3b8"
            />

            <Text style={styles.emptyTitle}>
              No hay desafíos para mostrar
            </Text>

            <Text style={styles.emptyText}>
              {busqueda.trim()
                ? 'Prueba con otro nombre o descripción.'
                : `Todavía no hay desafíos registrados para ${certamenActual?.nombre ?? 'este certamen'}.`}
            </Text>
          </View>
        ) : (
          desafios.map((item: any, index: number) => {
            const id = getId(item);
            const nombre = getNombre(item);
            const descripcion = getDescripcion(item);
            const equiposCount = getEquiposCount(item);

            return (
              <View
                key={id ?? index}
                style={styles.card}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardTitleBox}>
                    <Text style={styles.cardBadge}>
                      
                    </Text>

                    <Text style={styles.cardTitle}>
                      {nombre}
                    </Text>
                  </View>
                </View>

                <View style={styles.certamenLine}>
                  <Ionicons
                    name="trophy-outline"
                    size={16}
                    color="#64748b"
                  />

                  <Text style={styles.subtext}>
                    Certamen: {certamenActual?.nombre ?? item?.NombreCertamen ?? 'No especificado'}
                  </Text>
                </View>

                <Text style={styles.descText}>
                  {descripcion || 'Sin descripción'}
                </Text>

                <View style={styles.cardFooter}>
                  <View style={styles.teamPill}>
                    <Ionicons
                      name="people-outline"
                      size={16}
                      color="#334155"
                    />

                    <Text style={styles.teamsText}>
                      Equipos asociados:{' '}
                      <Text style={styles.bold}>
                        {equiposCount}
                      </Text>
                    </Text>
                  </View>

                  <View style={styles.actions}>
                    <TouchableOpacity
                      style={[styles.btnAction, styles.btnEdit]}
                      onPress={() =>
                        router.push({
                          pathname: '/desafios/form' as any,
                          params: {
                            id: String(id ?? ''),
                            idCertamen: String(idCertamenSel ?? ''),
                            nombre,
                            descrip:
                              descripcion === 'Sin descripción'
                                ? ''
                                : descripcion,
                          },
                        })
                      }
                      disabled={!id || eliminando}
                    >
                      <Ionicons
                        name="create-outline"
                        size={17}
                        color="#fff"
                      />

                      <Text style={styles.btnActionText}>
                        Editar
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.btnAction,
                        styles.btnDelete,
                        eliminando && styles.btnDisabled,
                      ]}
                      onPress={() =>
                        id &&
                        solicitarEliminar(
                          id,
                          nombre,
                          equiposCount
                        )
                      }
                      disabled={!id || eliminando}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={17}
                        color="#fff"
                      />

                      <Text style={styles.btnActionText}>
                        Eliminar
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* MODAL PARA SELECCIONAR CERTAMEN */}
      <Modal
        transparent
        animationType="fade"
        visible={modalCertamenesVisible}
        onRequestClose={() => setModalCertamenesVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.certamenModalCard}>
            <View style={styles.certamenModalHeader}>
              <Text style={styles.certamenModalTitle}>
                Seleccionar certamen
              </Text>

              <TouchableOpacity
                onPress={() => setModalCertamenesVisible(false)}
                accessibilityLabel="Cerrar selección de certamen"
              >
                <Ionicons
                  name="close"
                  size={28}
                  color="#475569"
                />
              </TouchableOpacity>
            </View>

            {/* SCROLL VERTICAL DE CERTÁMENES */}
            <ScrollView
              style={styles.certamenModalList}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled
              keyboardShouldPersistTaps="handled"
            >
              {certamenes.map((certamen) => {
                const seleccionado =
                  certamen.id === idCertamenSel;

                const esRally =
                  String(certamen.tipo ?? '')
                    .trim()
                    .toUpperCase() === 'RALLY';

                return (
                  <TouchableOpacity
                    key={certamen.id}
                    style={[
                      styles.certamenModalOption,
                      seleccionado &&
                        styles.certamenModalOptionSelected,
                    ]}
                    onPress={() => {
                      setModalCertamenesVisible(false);

                      if (!seleccionado) {
                        void seleccionarCertamen(certamen);
                      }
                    }}
                    disabled={cargando || eliminando}
                    activeOpacity={0.8}
                  >
                    <View style={styles.certamenModalIcon}>
                      <Ionicons
                        name={
                          esRally
                            ? 'trophy-outline'
                            : 'bulb-outline'
                        }
                        size={26}
                        color={seleccionado ? '#166534' : '#0369a1'}
                      />
                    </View>

                    <View style={styles.certamenModalOptionText}>
                      <Text
                        style={[
                          styles.certamenModalOptionName,
                          seleccionado &&
                            styles.certamenModalOptionNameSelected,
                        ]}
                      >
                        {certamen.nombre}
                      </Text>

                      <Text
                        style={[
                          styles.certamenModalOptionType,
                          seleccionado &&
                            styles.certamenModalOptionTypeSelected,
                        ]}
                      >
                        {tipoVisible(certamen.tipo)}
                      </Text>
                    </View>

                    {seleccionado ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={25}
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

      {/* MODAL CONFIRMAR ELIMINACIÓN */}
      <Modal
        transparent
        animationType="fade"
        visible={confirmacionVisible}
        onRequestClose={() => setConfirmacionVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIcon, styles.iconWarning]}>
              <Ionicons
                name="warning-outline"
                size={27}
                color="#92400e"
              />
            </View>

            <Text style={styles.modalTitle}>
              Confirmar eliminación
            </Text>

            <Text style={styles.modalMessage}>
              ¿Deseas eliminar el desafío "{pendiente?.nombre ?? ''}"?
              Esta acción no se puede deshacer.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.buttonSecondary]}
                onPress={() => setConfirmacionVisible(false)}
              >
                <Text style={styles.buttonSecondaryText}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.buttonDanger]}
                onPress={() => void confirmarEliminar()}
              >
                <Text style={styles.buttonPrimaryText}>
                  Sí, eliminar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL ELIMINANDO */}
      <Modal
        transparent
        animationType="fade"
        visible={eliminando}
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator
              size="large"
              color="#002b45"
            />

            <Text style={styles.loadingTitle}>
              Eliminando desafío...
            </Text>

            <Text style={styles.loadingText}>
              Estamos procesando la solicitud y actualizando la lista.
            </Text>
          </View>
        </View>
      </Modal>

      {/* MODAL DE RESULTADOS */}
      <Modal
        transparent
        animationType="fade"
        visible={resultado.visible}
        onRequestClose={cerrarResultado}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View
              style={[
                styles.modalIcon,
                resultado.tipo === 'success'
                  ? styles.iconSuccess
                  : resultado.tipo === 'warning'
                    ? styles.iconWarning
                    : styles.iconError,
              ]}
            >
              <Ionicons
                name={
                  resultado.tipo === 'success'
                    ? 'checkmark-circle-outline'
                    : resultado.tipo === 'warning'
                      ? 'alert-circle-outline'
                      : 'close-circle-outline'
                }
                size={28}
                color={
                  resultado.tipo === 'success'
                    ? '#166534'
                    : resultado.tipo === 'warning'
                      ? '#92400e'
                      : '#991b1b'
                }
              />
            </View>

            <Text style={styles.modalTitle}>
              {resultado.titulo}
            </Text>

            <Text style={styles.modalMessage}>
              {resultado.mensaje}
            </Text>

            <TouchableOpacity
              style={[
                styles.modalButton,
                styles.buttonPrimary,
                styles.resultButton,
              ]}
              onPress={cerrarResultado}
            >
              <Text style={styles.buttonPrimaryText}>
                Aceptar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },

  scrollContent: {
    width: '100%',
    maxWidth: 900,
    alignSelf: 'center',
    paddingHorizontal: 15,
    paddingTop: 18,
    paddingBottom: 35,
  },

  header: {
    alignItems: 'center',
    paddingBottom: 18,
  },

  headerTitle: {
    color: '#002b45',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 12,
  },

  headerSubtitle: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8,
  },

  certamenSelectorCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 15,
    marginBottom: 14,
  },

  certamenSelectorTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 7,
  },

  certamenSelectorDescription: {
    color: '#64748b',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 13,
  },

  certamenSeleccionado: {
    minHeight: 95,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 17,
    padding: 13,
    gap: 12,
  },

  certamenSeleccionadoIcon: {
    width: 65,
    height: 65,
    borderRadius: 17,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },

  certamenSeleccionadoInfo: {
    flex: 1,
    minWidth: 0,
  },

  certamenSeleccionadoNombre: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
  },

  certamenSeleccionadoTipo: {
    color: '#64748b',
    fontSize: 15,
    marginTop: 4,
    fontWeight: '700',
  },

  certamenCambiarTexto: {
    color: '#0369a1',
    fontSize: 13,
    marginTop: 7,
    fontWeight: '800',
  },

  certamenModalCard: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '78%',
    backgroundColor: '#fff',
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 10,
    elevation: 10,
  },

  certamenModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },

  certamenModalTitle: {
    color: '#0f172a',
    fontSize: 20,
    fontWeight: '800',
  },

  certamenModalList: {
    marginTop: 8,
    flexGrow: 0,
  },

  certamenModalOption: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    borderRadius: 12,
    gap: 10,
  },

  certamenModalOptionSelected: {
    backgroundColor: '#ecfdf5',
    borderBottomColor: '#bbf7d0',
    marginVertical: 3,
  },

  certamenModalIcon: {
    width: 45,
    height: 45,
    borderRadius: 13,
    backgroundColor: '#e0f2fe',
    alignItems: 'center',
    justifyContent: 'center',
  },

  certamenModalOptionText: {
    flex: 1,
  },

  certamenModalOptionName: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
  },

  certamenModalOptionNameSelected: {
    color: '#166534',
  },

  certamenModalOptionType: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 5,
  },

  certamenModalOptionTypeSelected: {
    color: '#15803d',
    fontWeight: '700',
  },

  btnNuevo: {
    flexDirection: 'row',
    backgroundColor: '#8aa329',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 13,
    minHeight: 58,
  },

  btnNuevoText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
    textAlign: 'center',
    flexShrink: 1,
  },

  filterCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 13,
    marginBottom: 15,
    elevation: 1,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    paddingHorizontal: 12,
    minHeight: 50,
    gap: 8,
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    paddingVertical: 10,
  },

  btnBuscar: {
    flexDirection: 'row',
    backgroundColor: '#002b45',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 9,
    gap: 7,
    alignItems: 'center',
    marginTop: 10,
    alignSelf: 'flex-end',
  },

  btnBuscarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },

  btnDisabled: {
    opacity: 0.55,
  },

  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },

  listTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#002b45',
    flex: 1,
  },

  counter: {
    backgroundColor: '#dbeafe',
    minWidth: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },

  counterText: {
    color: '#1d4ed8',
    fontSize: 14,
    fontWeight: '800',
  },

  center: {
    flex: 1,
    minHeight: 150,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 9,
    padding: 25,
  },

  loadingInlineText: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 6,
  },

  emptyCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 28,
    alignItems: 'center',
    marginTop: 8,
  },

  emptyTitle: {
    color: '#334155',
    fontWeight: '800',
    fontSize: 16,
    marginTop: 10,
  },

  emptyText: {
    textAlign: 'center',
    color: '#64748b',
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
  },

  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 15,
    marginBottom: 13,
    elevation: 2,
    shadowColor: '#0f172a',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },

  cardTitleBox: {
    flex: 1,
    gap: 5,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#002b45',
  },

  

  certamenLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 9,
  },

  subtext: {
    fontSize: 13,
    color: '#64748b',
    flex: 1,
  },

  descText: {
    fontSize: 14,
    color: '#475569',
    marginTop: 10,
    lineHeight: 20,
  },

  cardFooter: {
    marginTop: 14,
    paddingTop: 11,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    gap: 12,
  },

  teamPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 7,
    gap: 5,
  },

  teamsText: {
    fontSize: 13,
    color: '#334155',
  },

  bold: {
    fontWeight: '800',
    color: '#002b45',
  },

  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },

  btnAction: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 13,
    borderRadius: 8,
    gap: 5,
  },

  btnEdit: {
    backgroundColor: '#0284c7',
  },

  btnDelete: {
    backgroundColor: '#dc2626',
  },

  btnActionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.48)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 22,
  },

  modalCard: {
    width: '100%',
    maxWidth: 430,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 22,
    alignItems: 'center',
    elevation: 8,
  },

  loadingCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 26,
    alignItems: 'center',
    elevation: 8,
  },

  loadingTitle: {
    color: '#002b45',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 12,
  },

  loadingText: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 8,
  },

  modalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  iconSuccess: {
    backgroundColor: '#dcfce7',
  },

  iconWarning: {
    backgroundColor: '#fef3c7',
  },

  iconError: {
    backgroundColor: '#fee2e2',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },

  modalMessage: {
    fontSize: 14,
    lineHeight: 21,
    color: '#475569',
    textAlign: 'center',
    marginTop: 9,
    marginBottom: 20,
  },

  modalActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },

  modalButton: {
    minHeight: 44,
    borderRadius: 9,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonSecondary: {
    backgroundColor: '#f1f5f9',
    flex: 1,
  },

  buttonSecondaryText: {
    color: '#334155',
    fontWeight: '800',
    fontSize: 14,
  },

  buttonPrimary: {
    backgroundColor: '#002b45',
    flex: 1,
  },

  buttonDanger: {
    backgroundColor: '#dc2626',
    flex: 1,
  },

  buttonPrimaryText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },

  resultButton: {
    width: '100%',
    flex: 0,
  },
});