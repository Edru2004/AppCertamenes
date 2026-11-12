import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  actualizarEquipo,
  getCertamenes,
  getEquipos,
  getSalas,
} from '../../../services/api';

type Registro = Record<string, any>;

const obtenerLista = (respuesta: any): Registro[] => {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.data)) return respuesta.data;
  return [];
};

const idCertamen = (item: Registro) =>
  Number(
    item.Id_certamen ??
    item.id_certamen ??
    item.Id_Certamen ??
    item.certamen?.Id_certamen ??
    item.certamen?.id_certamen ??
    item.Certamen?.Id_certamen ??
    0
  );

const tipoCertamen = (item: Registro) =>
  String(
    item.Tipo ??
    item.Tipo_certamen ??
    item.TipoCertamen ??
    ''
  )
    .trim()
    .toUpperCase();

const idSala = (item: Registro): number | null => {
  const valor = item.Id_sala ?? item.id_sala;
  return valor == null ? null : Number(valor);
};

const nombreCertamen = (item: Registro) =>
  String(item.Nombre ?? item.nombre ?? 'Certamen sin nombre');

const encargadoSala = (item: Registro) =>
  String(
    item?.Encargado ??
    item?.encargado ??
    'Sin encargado'
  );

const esRally = (item: Registro) =>
  tipoCertamen(item) === 'RALLY';

export default function AsignacionEquiposScreen() {
  const [certamenes, setCertamenes] = useState<Registro[]>([]);
  const [certamenSeleccionado, setCertamenSeleccionado] =
    useState<number | null>(null);

  const [modalCertamenVisible, setModalCertamenVisible] =
    useState(false);

  const [equipos, setEquipos] = useState<Registro[]>([]);
  const [salas, setSalas] = useState<Registro[]>([]);

  const [equipoSeleccionado, setEquipoSeleccionado] =
    useState<number | null>(null);

  const [salaSeleccionada, setSalaSeleccionada] =
    useState<number | null>(null);

  const [modalVisible, setModalVisible] = useState(false);

  const [cargando, setCargando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const certamenActual = certamenes.find(
    (item) => idCertamen(item) === certamenSeleccionado
  );

  // =========================================================
  // CARGAR CERTÁMENES
  // =========================================================

  useEffect(() => {
    const iniciar = async () => {
      try {
        setCargando(true);

        const respuesta = await getCertamenes();

        const disponibles = obtenerLista(respuesta).filter(
          (item) => tipoCertamen(item) === 'INNOVATEC'
        );

        setCertamenes(disponibles);

        if (disponibles.length > 0) {
          setCertamenSeleccionado(
            idCertamen(disponibles[0])
          );
        }
      } catch (error: any) {
        Alert.alert(
          'Error',
          error?.message ||
          'No se pudieron cargar los certámenes.'
        );
      } finally {
        setCargando(false);
      }
    };

    iniciar();
  }, []);

  // =========================================================
  // CARGAR EQUIPOS Y SALAS
  // =========================================================

  const cargarDatos = async (id: number) => {
    try {
      setCargando(true);

      const [
        respuestaEquipos,
        respuestaSalas,
      ] = await Promise.all([
        getEquipos(id),
        getSalas(id),
      ]);

      // Laravel ya devuelve los equipos filtrados
      // por certamen.
      setEquipos(obtenerLista(respuestaEquipos));

      // Mantener únicamente las salas
      // pertenecientes al certamen seleccionado.
      setSalas(
        obtenerLista(respuestaSalas).filter(
          (sala) =>
            idCertamen(sala) === Number(id)
        )
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.message ||
        'No se pudieron cargar los datos.'
      );
    } finally {
      setCargando(false);
    }
  };

  // =========================================================
  // CAMBIO DE CERTAMEN
  // =========================================================

  useEffect(() => {
    if (certamenSeleccionado !== null) {
      setEquipoSeleccionado(null);
      setSalaSeleccionada(null);

      cargarDatos(certamenSeleccionado);
    } else {
      setEquipos([]);
      setSalas([]);
    }
  }, [certamenSeleccionado]);

  const seleccionarCertamen = (id: number) => {
    setModalCertamenVisible(false);

    if (id !== certamenSeleccionado) {
      setCertamenSeleccionado(id);
    }
  };

  // =========================================================
  // ABRIR MODAL DE ASIGNACIÓN
  // =========================================================

  const abrirAsignacion = () => {
    if (equipos.length === 0) {
      Alert.alert(
        'Aviso',
        'No hay equipos registrados en este certamen.'
      );
      return;
    }

    if (salas.length === 0) {
      Alert.alert(
        'Aviso',
        'No hay salas registradas en este certamen.'
      );
      return;
    }

    setEquipoSeleccionado(null);
    setSalaSeleccionada(null);
    setModalVisible(true);
  };

  // =========================================================
  // GUARDAR ASIGNACIÓN
  // =========================================================

  const guardarAsignacion = async () => {
    if (
      !equipoSeleccionado ||
      !salaSeleccionada
    ) {
      Alert.alert(
        'Datos incompletos',
        'Selecciona un equipo y una sala.'
      );
      return;
    }

    try {
      setGuardando(true);

      await actualizarEquipo(
        equipoSeleccionado,
        {
          Id_sala: salaSeleccionada,
        }
      );

      setModalVisible(false);
      setEquipoSeleccionado(null);
      setSalaSeleccionada(null);

      if (certamenSeleccionado !== null) {
        await cargarDatos(certamenSeleccionado);
      }

      Alert.alert(
        'Correcto',
        'La sala se asignó al equipo correctamente.'
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.message ||
        'No se pudo asignar la sala.'
      );
    } finally {
      setGuardando(false);
    }
  };

  // =========================================================
  // QUITAR SALA
  // =========================================================

  const quitarSala = async (
    equipo: Registro
  ) => {
    Alert.alert(
      'Quitar sala',
      '¿Deseas quitar la sala asignada a este equipo?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },

        {
          text: 'Quitar',
          style: 'destructive',

          onPress: async () => {
            try {
              setGuardando(true);

              await actualizarEquipo(
                Number(equipo.Id_equipo),
                {
                  Id_sala: null,
                }
              );

              if (
                certamenSeleccionado !== null
              ) {
                await cargarDatos(
                  certamenSeleccionado
                );
              }

              Alert.alert(
                'Correcto',
                'Se quitó la sala del equipo.'
              );
            } catch (error: any) {
              Alert.alert(
                'Error',
                error?.message ||
                'No se pudo quitar la sala.'
              );
            } finally {
              setGuardando(false);
            }
          },
        },
      ]
    );
  };

  // =========================================================
  // OBTENER NOMBRE DE SALA
  // =========================================================

  const nombreSala = (
    id: number | null
  ) => {
    if (!id) {
      return 'Sin sala asignada';
    }

    return (
      salas.find(
        (sala) =>
          Number(sala.Id_sala) === id
      )?.Nombre ||
      'Sala no encontrada'
    );
  };

  // =========================================================
  // SELECTOR DE CERTAMEN
  // =========================================================

  const renderSelectorCertamen = () => (
    <>
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.tarjetaCertamen}
        onPress={() =>
          setModalCertamenVisible(true)
        }
        disabled={certamenes.length === 0}
      >
        {/* ÍCONO DEL CERTAMEN */}
        <View style={styles.iconoCertamen}>
          <Ionicons
            name={
              certamenActual &&
                esRally(certamenActual)
                ? 'trophy-outline'
                : 'bulb-outline'
            }
            size={27}
            color="#087B9B"
          />
        </View>

        {/* INFORMACIÓN */}
        <View style={styles.infoCertamen}>
          <Text
            style={styles.nombreCertamen}
            numberOfLines={1}
          >
            {certamenActual
              ? nombreCertamen(
                certamenActual
              )
              : 'Cargando...'}
          </Text>

          <Text
            style={styles.tipoCertamen}
            numberOfLines={1}
          >
            {certamenActual
              ? esRally(
                certamenActual
              )
                ? 'RALLY'
                : 'INNOVATECNM'
              : ''}
          </Text>

          <Text
            style={styles.indicacionCertamen}
            numberOfLines={1}
          >
            Toca para cambiar de certamen
          </Text>
        </View>

        {/* FLECHA */}
        <View style={styles.flechaCertamen}>
          <Ionicons
            name="chevron-down"
            size={21}
            color="#FFFFFF"
          />
        </View>
      </TouchableOpacity>

      {/* =====================================================
          MODAL PARA SELECCIONAR CERTAMEN
          ===================================================== */}

      <Modal
        visible={modalCertamenVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setModalCertamenVisible(false)
        }
      >
        <View
          style={styles.fondoModalCertamen}
        >
          <View
            style={styles.modalCertamen}
          >
            <View
              style={
                styles.encabezadoModalCertamen
              }
            >
              <Text
                style={
                  styles.tituloModalCertamen
                }
              >
                Seleccionar certamen
              </Text>

              <TouchableOpacity
                onPress={() =>
                  setModalCertamenVisible(
                    false
                  )
                }
              >
                <Ionicons
                  name="close"
                  size={30}
                  color="#263449"
                />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={
                false
              }
              contentContainerStyle={
                styles.listaCertamenes
              }
            >
              {certamenes.map((item) => {
                const id =
                  idCertamen(item);

                const seleccionado =
                  id ===
                  certamenSeleccionado;

                const rally =
                  esRally(item);

                return (
                  <TouchableOpacity
                    key={id}
                    activeOpacity={0.8}
                    style={[
                      styles.opcionCertamen,
                      seleccionado &&
                      styles.opcionCertamenActiva,
                    ]}
                    onPress={() =>
                      seleccionarCertamen(
                        id
                      )
                    }
                  >
                    <Ionicons
                      name={
                        rally
                          ? 'trophy-outline'
                          : 'bulb-outline'
                      }
                      size={32}
                      color={
                        seleccionado
                          ? '#16834D'
                          : '#087B9B'
                      }
                    />

                    <View
                      style={
                        styles.infoOpcionCertamen
                      }
                    >
                      <Text
                        style={[
                          styles.nombreOpcionCertamen,
                          seleccionado &&
                          styles.textoOpcionActivo,
                        ]}
                      >
                        {nombreCertamen(
                          item
                        )}
                      </Text>

                      <Text
                        style={[
                          styles.tipoOpcionCertamen,
                          seleccionado &&
                          styles.textoOpcionActivo,
                        ]}
                      >
                        {rally
                          ? 'RALLY'
                          : 'INNOVATECNM'}
                      </Text>
                    </View>

                    {seleccionado && (
                      <Ionicons
                        name="checkmark-circle"
                        size={31}
                        color="#16834D"
                      />
                    )}
                  </TouchableOpacity>
                );
              })}

              {certamenes.length === 0 && (
                <Text
                  style={
                    styles.sinCertamenes
                  }
                >
                  No hay certámenes InnovaTec
                  registrados.
                </Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );

  // =========================================================
  // PANTALLA
  // =========================================================

  return (
    <View style={styles.contenedor}>
      <ScrollView
        contentContainerStyle={
          styles.contenido
        }
        showsVerticalScrollIndicator={
          false
        }
      >

        {/* =================================================
            ENCABEZADO CENTRADO
            ================================================= */}

        <View
          style={
            styles.encabezadoPrincipal
          }
        >
          <View
            style={
              styles.iconoInstitucion
            }
          >
            <Ionicons
              name="school-outline"
              size={38}
              color="#0F766E"
            />
          </View>

          <Text
            style={styles.titulo}
          >
            Asignación de salas a equipos
          </Text>
        </View>

        {/* CERTAMEN */}
        <Text
          style={styles.etiqueta}
        >
          Certamen InnovaTec
        </Text>

        {/* SELECTOR */}
        {renderSelectorCertamen()}

        {/* =================================================
            BOTÓN ASIGNAR SALA
            ================================================= */}

        <TouchableOpacity
          style={
            styles.botonPrincipal
          }
          onPress={
            abrirAsignacion
          }
          disabled={
            cargando ||
            certamenSeleccionado ===
            null
          }
        >
          <Ionicons
            name="link-outline"
            size={21}
            color="#FFFFFF"
          />

          <Text
            style={
              styles.textoBoton
            }
          >
            Asignar sala a equipo
          </Text>
        </TouchableOpacity>

        {/* =================================================
            EQUIPOS REGISTRADOS
            ================================================= */}

        <View
          style={styles.encabezado}
        >
          <Text
            style={styles.subtitulo}
          >
            Equipos registrados
          </Text>

          <TouchableOpacity
            onPress={() =>
              certamenSeleccionado !==
              null &&
              cargarDatos(
                certamenSeleccionado
              )
            }
            disabled={
              cargando ||
              certamenSeleccionado ===
              null
            }
          >
            <Ionicons
              name="refresh"
              size={25}
              color="#2563EB"
            />
          </TouchableOpacity>
        </View>

        {/* =================================================
            CARGANDO
            ================================================= */}

        {cargando ? (
          <ActivityIndicator
            size="large"
            color="#0F766E"
          />
        ) : equipos.length === 0 ? (

          /* SIN EQUIPOS */

          <View
            style={styles.vacio}
          >
            <Ionicons
              name="people-outline"
              size={35}
              color="#64748B"
            />

            <Text
              style={
                styles.descripcion
              }
            >
              No hay equipos registrados
              en este certamen.
            </Text>
          </View>

        ) : (

          /* =================================================
             LISTA DE EQUIPOS
             ================================================= */

          equipos.map((equipo) => {
            const salaActual = idSala(equipo);

            const salaAsignada =
              salas.find(
                (sala) => idSala(sala) === salaActual
              ) ?? null;

            return (
              <View
                key={equipo.Id_equipo}
                style={styles.tarjeta}
              >

                {/* CERTAMEN */}
                <View style={styles.datoTarjeta}>
                  <Ionicons
                    name="trophy-outline"
                    size={18}
                    color="#2563EB"
                  />

                  <View style={styles.datoContenido}>
                    <Text style={styles.etiquetaTarjeta}>
                      Certamen
                    </Text>

                    <Text style={styles.valorTarjeta}>
                      {certamenActual
                        ? nombreCertamen(certamenActual)
                        : 'Certamen sin nombre'}
                    </Text>
                  </View>
                </View>

                {/* EQUIPO */}
                <View style={styles.datoTarjeta}>
                  <Ionicons
                    name="people-outline"
                    size={18}
                    color="#2563EB"
                  />

                  <View style={styles.datoContenido}>
                    <Text style={styles.etiquetaTarjeta}>
                      Equipo
                    </Text>

                    <Text style={styles.valorTarjeta}>
                      {equipo.Nombre || 'Equipo'}
                    </Text>
                  </View>
                </View>

                {/* SALA */}
                <View style={styles.datoTarjeta}>
                  <Ionicons
                    name="business-outline"
                    size={18}
                    color="#2563EB"
                  />

                  <View style={styles.datoContenido}>
                    <Text style={styles.etiquetaTarjeta}>
                      Sala
                    </Text>

                    <Text style={styles.valorTarjeta}>
                      {salaAsignada
                        ? nombreSala(idSala(salaAsignada))
                        : 'Sin sala asignada'}
                    </Text>
                  </View>
                </View>

                {/* ENCARGADO */}
                <View style={styles.datoTarjeta}>
                  <Ionicons
                    name="person-outline"
                    size={18}
                    color="#2563EB"
                  />

                  <View style={styles.datoContenido}>
                    <Text style={styles.etiquetaTarjeta}>
                      Encargado de sala
                    </Text>

                    <Text style={styles.valorTarjeta}>
                      {salaAsignada
                        ? encargadoSala(salaAsignada)
                        : 'Sin encargado'}
                    </Text>
                  </View>
                </View>

                {/* QUITAR SALA */}
                {salaActual !== null && (
                  <TouchableOpacity
                    style={styles.botonQuitar}
                    onPress={() => quitarSala(equipo)}
                    disabled={guardando}
                  >
                    <Text style={styles.textoBoton}>
                      Quitar sala
                    </Text>
                  </TouchableOpacity>
                )}

              </View>
            );
          })
        )}
      </ScrollView>

      {/* =====================================================
          MODAL PARA ASIGNAR SALA
          ===================================================== */}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() =>
          setModalVisible(false)
        }
      >
        <View
          style={styles.fondoModal}
        >
          <View
            style={styles.modal}
          >
            <Text
              style={
                styles.tituloModal
              }
            >
              Asignar sala a equipo
            </Text>

            {/* EQUIPO */}

            <Text
              style={styles.etiqueta}
            >
              Seleccionar equipo
            </Text>

            <View
              style={styles.selector}
            >
              <Picker
                selectedValue={
                  equipoSeleccionado
                }
                onValueChange={(
                  value
                ) => {
                  setEquipoSeleccionado(
                    value == null
                      ? null
                      : Number(
                        value
                      )
                  );
                }}
              >
                <Picker.Item
                  label="Selecciona un equipo"
                  value={null}
                />

                {equipos.map(
                  (equipo) => (
                    <Picker.Item
                      key={
                        equipo.Id_equipo
                      }
                      label={
                        equipo.Nombre ||
                        `Equipo ${equipo.Id_equipo}`
                      }
                      value={Number(
                        equipo.Id_equipo
                      )}
                    />
                  )
                )}
              </Picker>
            </View>

            {/* SALA */}

            <Text
              style={styles.etiqueta}
            >
              Seleccionar sala
            </Text>

            <View
              style={styles.selector}
            >
              <Picker
                selectedValue={
                  salaSeleccionada
                }
                onValueChange={(
                  value
                ) => {
                  setSalaSeleccionada(
                    value == null
                      ? null
                      : Number(
                        value
                      )
                  );
                }}
              >
                <Picker.Item
                  label="Selecciona una sala"
                  value={null}
                />

                {salas.map(
                  (sala) => (
                    <Picker.Item
                      key={
                        sala.Id_sala
                      }
                      label={`${sala.Nombre} - ${sala.Ubicacion ||
                        'Sin ubicación'
                        }`}
                      value={Number(
                        sala.Id_sala
                      )}
                    />
                  )
                )}
              </Picker>
            </View>

            {/* GUARDAR */}

            <TouchableOpacity
              style={
                styles.botonGuardar
              }
              onPress={
                guardarAsignacion
              }
              disabled={
                guardando
              }
            >
              <Text
                style={
                  styles.textoBoton
                }
              >
                {guardando
                  ? 'Guardando...'
                  : 'Guardar asignación'}
              </Text>
            </TouchableOpacity>

            {/* CANCELAR */}

            <TouchableOpacity
              style={
                styles.botonCancelar
              }
              onPress={() =>
                setModalVisible(
                  false
                )
              }
              disabled={
                guardando
              }
            >
              <Text
                style={
                  styles.textoCancelar
                }
              >
                Cancelar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// =========================================================
// ESTILOS
// =========================================================

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  contenido: {
    padding: 18,
    paddingBottom: 35,
  },

  // =======================================================
  // ENCABEZADO CENTRADO
  // =======================================================

  encabezadoPrincipal: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  iconoInstitucion: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },

  titulo: {
    fontSize: 23, fontWeight: '800', color: '#002b45', textAlign: 'center'
  },

  descripcion: {
    color: '#64748B',
    marginTop: 7,
    marginBottom: 15,
    fontSize: 15,
  },

  etiqueta: {
    fontSize: 17,
    fontWeight: '700',
    color: '#263449',
    marginTop: 15,
    marginBottom: 12,
  },

  // =======================================================
  // SELECTOR DE CERTAMEN
  // =======================================================

  tarjetaCertamen: {
    height: 94,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 18,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },

  iconoCertamen: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  infoCertamen: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },

  nombreCertamen: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
  },

  tipoCertamen: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },

  indicacionCertamen: {
    fontSize: 9,
    fontWeight: '700',
    color: '#087B8B',
    marginTop: 3,
  },

  flechaCertamen: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#64748B',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 5,
  },

  // =======================================================
  // MODAL DE CERTÁMENES
  // =======================================================

  fondoModalCertamen: {
    flex: 1,
    backgroundColor:
      'rgba(15, 23, 42, 0.52)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 18,
  },

  modalCertamen: {
    width: '100%',
    maxWidth: 520,
    maxHeight: '88%',
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 25,
    paddingBottom: 15,
  },

  encabezadoModalCertamen: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent:
      'space-between',
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },

  tituloModalCertamen: {
    fontSize: 25,
    fontWeight: '800',
    color: '#111827',
    flex: 1,
  },

  listaCertamenes: {
    paddingTop: 12,
    paddingBottom: 10,
  },

  opcionCertamen: {
    minHeight: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 14,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    borderRadius: 18,
  },

  opcionCertamenActiva: {
    backgroundColor: '#E9FBF2',
    borderBottomColor: '#B7EACD',
  },

  infoOpcionCertamen: {
    flex: 1,
  },

  nombreOpcionCertamen: {
    fontSize: 19,
    fontWeight: '800',
    color: '#111827',
  },

  tipoOpcionCertamen: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 6,
  },

  textoOpcionActivo: {
    color: '#16834D',
  },

  sinCertamenes: {
    padding: 25,
    textAlign: 'center',
    color: '#64748B',
    fontSize: 16,
  },

  // =======================================================
  // BOTÓN PRINCIPAL
  // =======================================================

  botonPrincipal: {
    backgroundColor: '#7C9F27',
    padding: 17,
    borderRadius: 17,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginBottom: 25,
  },

  textoBoton: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },

  // =======================================================
  // ENCABEZADO DE EQUIPOS
  // =======================================================

  encabezado: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  subtitulo: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#1E293B',
  },

  // =======================================================
  // TARJETAS DE EQUIPOS
  // =======================================================

  tarjeta: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 20,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  nombre: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#1E293B',
  },

  estado: {
    color: '#15803D',
    fontWeight: '700',
    marginTop: 9,
    fontSize: 16,
  },

  vacio: {
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderRadius: 16,
    alignItems: 'center',
  },

  // =======================================================
  // MODAL DE ASIGNACIÓN
  // =======================================================

  fondoModal: {
    flex: 1,
    backgroundColor:
      'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  modal: {
    width: '100%',
    maxWidth: 430,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },

  tituloModal: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 15,
  },

  selector: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },

  botonGuardar: {
    backgroundColor: '#16A34A',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },

  botonQuitar: {
    backgroundColor: '#DC2626',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 13,
  },

  botonCancelar: {
    padding: 13,
    alignItems: 'center',
    marginTop: 5,
  },

  textoCancelar: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 16,
  },
  datoTarjeta: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  marginBottom: 13,
},

datoContenido: {
  flex: 1,
  marginLeft: 10,
},

etiquetaTarjeta: {
  fontSize: 13,
  fontWeight: '600',
  color: '#64748B',
  marginBottom: 2,
},

valorTarjeta: {
  fontSize: 16,
  fontWeight: '700',
  color: '#1E293B',
},
});