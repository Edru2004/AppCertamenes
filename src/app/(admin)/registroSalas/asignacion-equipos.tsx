import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { useEffect, useState } from 'react';

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
  actualizarEquipo,
  getCertamenes,
  getEquipos,
  getSalas,
} from '../../../services/api';

type Registro = Record<string, any>;

const estadoInicialResultado = {
  visible: false,
  titulo: '',
  mensaje: '',
  exito: false,
};

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

  // Estados para modales personalizados estilo form de equipos
  const [resultado, setResultado] = useState(estadoInicialResultado);
  const [equipoAQuitar, setEquipoAQuitar] = useState<Registro | null>(null);

  const certamenActual = certamenes.find(
    (item) => idCertamen(item) === certamenSeleccionado
  );

  const mostrarResultado = (titulo: string, mensaje: string, exito = false) =>
    setResultado({ visible: true, titulo, mensaje, exito });

  const cerrarResultado = () => setResultado(estadoInicialResultado);

  // =========================================================
  // FORMATEAR ERRORES Y PREPARAR INTEGRANTES
  // =========================================================

  const formatearMensajeError = (error: any, fallback: string) => {
    const raw = String(error?.response?.data?.message || error?.message || '');

    if (raw.includes('integrantes field is required')) {
      return 'El equipo no tiene integrantes registrados. Agrega al menos un integrante antes de modificarlo.';
    }
    if (raw.includes('Correo field must be a valid email')) {
      return 'Uno de los integrantes tiene un correo electrónico con formato inválido.';
    }
    if (raw.includes('exclusivas de certámenes INNOVATEC')) {
      return 'Las salas solo pueden asignarse a equipos de certámenes InnovaTecNM.';
    }
    if (raw.includes('mismo certamen')) {
      return 'La sala seleccionada no pertenece al mismo certamen que el equipo.';
    }
    if (raw.includes('Network request failed')) {
      return 'Verifica la conexión con el servidor.';
    }

    return raw || fallback;
  };

  const prepararIntegrantes = (lista: any[]) => {
    if (!Array.isArray(lista) || lista.length === 0) {
      return [
        {
          no_control: '00000000',
          Nombre: 'Integrante pendiente',
          Carrera: null,
          Rol: 'Participante',
          Sexo: null,
          Correo: null,
          Semestre: null,
        },
      ];
    }

    return lista.map((ing: any) => {
      const correoLimpio =
        typeof ing.Correo === 'string' ? ing.Correo.trim() : '';
      return {
        no_control: String(ing.no_control || '00000000'),
        Nombre: ing.Nombre || 'Sin nombre',
        Carrera: ing.Carrera || null,
        Rol: ing.Rol || 'Participante',
        Sexo: ing.Sexo || null,
        Correo: correoLimpio.includes('@') ? correoLimpio : null,
        Semestre: ing.Semestre ? Number(ing.Semestre) : null,
      };
    });
  };

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
        mostrarResultado(
          'Error al cargar',
          formatearMensajeError(error, 'No se pudieron cargar los certámenes.'),
          false
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

      setEquipos(obtenerLista(respuestaEquipos));

      setSalas(
        obtenerLista(respuestaSalas).filter(
          (sala) =>
            idCertamen(sala) === Number(id)
        )
      );
    } catch (error: any) {
      mostrarResultado(
        'Error al cargar',
        formatearMensajeError(error, 'No se pudieron cargar los datos.'),
        false
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
      mostrarResultado(
        'Sin equipos',
        'No hay equipos registrados en este certamen.',
        false
      );
      return;
    }

    if (salas.length === 0) {
      mostrarResultado(
        'Sin salas',
        'No hay salas registradas en este certamen.',
        false
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
    if (!equipoSeleccionado || !salaSeleccionada) {
      mostrarResultado(
        'Datos incompletos',
        'Selecciona el equipo y la sala correspondientes.',
        false
      );
      return;
    }

    const equipoObj = equipos.find(
      (e) => Number(e.Id_equipo) === Number(equipoSeleccionado)
    );
    const salaObj = salas.find(
      (s) => Number(s.Id_sala) === Number(salaSeleccionada)
    );

    if (!equipoObj) {
      mostrarResultado(
        'Equipo no encontrado',
        'No se pudo recuperar la información del equipo.',
        false
      );
      return;
    }

    try {
      setGuardando(true);

      await actualizarEquipo(Number(equipoSeleccionado), {
        Nombre: equipoObj.Nombre,
        Id_desafio: Number(equipoObj.Id_desafio),
        Id_categCertamen: Number(equipoObj.Id_categCertamen),
        Id_sala: Number(salaSeleccionada),
        Video: equipoObj.Video ?? null,
        Reporte: equipoObj.Reporte ?? null,
        Id_lider: equipoObj.Id_lider ?? null,
        integrantes: prepararIntegrantes(equipoObj.integrantes),
      });

      setModalVisible(false);
      setEquipoSeleccionado(null);
      setSalaSeleccionada(null);

      if (certamenSeleccionado !== null) {
        await cargarDatos(certamenSeleccionado);
      }

      mostrarResultado(
        '¡Sala asignada!',
        `El equipo "${equipoObj.Nombre}" ha sido asignado exitosamente a la sala "${salaObj?.Nombre || 'seleccionada'}".`,
        true
      );
    } catch (error: any) {
      mostrarResultado(
        'No se pudo asignar',
        formatearMensajeError(error, 'Verifica la conexión con el servidor.'),
        false
      );
    } finally {
      setGuardando(false);
    }
  };

  // =========================================================
  // QUITAR SALA
  // =========================================================

  const solicitarQuitarSala = (equipo: Registro) => {
    setEquipoAQuitar(equipo);
  };

  const confirmarQuitarSala = async () => {
    if (!equipoAQuitar || guardando) return;
    const equipo = equipoAQuitar;
    setEquipoAQuitar(null);

    try {
      setGuardando(true);

      await actualizarEquipo(Number(equipo.Id_equipo), {
        Nombre: equipo.Nombre,
        Id_desafio: Number(equipo.Id_desafio),
        Id_categCertamen: Number(equipo.Id_categCertamen),
        Id_sala: null,
        Video: equipo.Video ?? null,
        Reporte: equipo.Reporte ?? null,
        Id_lider: equipo.Id_lider ?? null,
        integrantes: prepararIntegrantes(equipo.integrantes),
      });

      if (certamenSeleccionado !== null) {
        await cargarDatos(certamenSeleccionado);
      }

      mostrarResultado(
        '¡Sala quitada!',
        `Se ha desvinculado la sala del equipo "${equipo.Nombre}" correctamente.`,
        true
      );
    } catch (error: any) {
      mostrarResultado(
        'No se pudo quitar',
        formatearMensajeError(error, 'Verifica la conexión con el servidor.'),
        false
      );
    } finally {
      setGuardando(false);
    }
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
                    onPress={() => solicitarQuitarSala(equipo)}
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
            <Text style={styles.etiqueta}>Seleccionar equipo</Text>

            <View style={styles.selector}>
              <Picker
                selectedValue={equipoSeleccionado ?? ''}
                onValueChange={(value) => {
                  setEquipoSeleccionado(
                    value === '' || value == null ? null : Number(value)
                  );
                }}
              >
                <Picker.Item label="Selecciona un equipo" value="" />

                {equipos.map((equipo) => (
                  <Picker.Item
                    key={equipo.Id_equipo}
                    label={equipo.Nombre || `Equipo ${equipo.Id_equipo}`}
                    value={Number(equipo.Id_equipo)}
                  />
                ))}
              </Picker>
            </View>

            {/* SALA */}
            <Text style={styles.etiqueta}>Seleccionar sala</Text>

            <View style={styles.selector}>
              <Picker
                selectedValue={salaSeleccionada ?? ''}
                onValueChange={(value) => {
                  setSalaSeleccionada(
                    value === '' || value == null ? null : Number(value)
                  );
                }}
              >
                <Picker.Item label="Selecciona una sala" value="" />

                {salas.map((sala) => (
                  <Picker.Item
                    key={sala.Id_sala}
                    label={`${sala.Nombre} - ${sala.Ubicacion || 'Sin ubicación'}`}
                    value={Number(sala.Id_sala)}
                  />
                ))}
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

      {/* =====================================================
          MODAL DE CONFIRMACIÓN PARA QUITAR SALA
          ===================================================== */}

      <Modal
        visible={equipoAQuitar !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setEquipoAQuitar(null)}
      >
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIcon, styles.errorIcon]}>
              <Ionicons name="help-circle-outline" size={30} color="#b91c1c" />
            </View>
            <Text style={styles.modalTitle}>¿Quitar sala asignada?</Text>
            <Text style={styles.modalMessage}>
              {equipoAQuitar
                ? `Equipo: ${equipoAQuitar.Nombre}\nSala actual: ${nombreSala(idSala(equipoAQuitar))}`
                : ''}
            </Text>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButtonMsg}
                onPress={() => setEquipoAQuitar(null)}
              >
                <Text style={styles.cancelTextMsg}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButtonMsg, styles.dangerButtonMsg, { flex: 1 }]}
                onPress={() => void confirmarQuitarSala()}
              >
                <Text style={styles.confirmTextMsg}>Quitar sala</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* =====================================================
          MODAL DE RESULTADO (ÉXITO / ERROR ESTILO MISEQUIPOS)
          ===================================================== */}

      <Modal
        visible={resultado.visible}
        transparent
        animationType="fade"
        onRequestClose={cerrarResultado}
      >
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <View
              style={[
                styles.modalIcon,
                resultado.exito ? styles.successIcon : styles.errorIcon,
              ]}
            >
              <Ionicons
                name={
                  resultado.exito
                    ? 'checkmark-circle-outline'
                    : 'alert-circle-outline'
                }
                size={30}
                color={resultado.exito ? '#15803d' : '#b91c1c'}
              />
            </View>
            <Text style={styles.modalTitle}>{resultado.titulo}</Text>
            <Text style={styles.modalMessage}>{resultado.mensaje}</Text>
            <TouchableOpacity
              style={styles.confirmButtonMsg}
              onPress={cerrarResultado}
            >
              <Text style={styles.confirmTextMsg}>Aceptar</Text>
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
    fontSize: 23,
    fontWeight: '800',
    color: '#002b45',
    textAlign: 'center',
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

  fondoModalCertamen: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.52)',
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
    justifyContent: 'space-between',
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

  tarjeta: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 20,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  vacio: {
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderRadius: 16,
    alignItems: 'center',
  },

  fondoModal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
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

  // =======================================================
  // ESTILOS DE MODALES DE CONFIRMACIÓN Y RESULTADO
  // =======================================================

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.52)',
    justifyContent: 'center',
    padding: 20,
  },

  modalCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },

  modalIcon: {
    alignSelf: 'center',
    marginBottom: 10,
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#e0f2fe',
  },

  successIcon: {
    backgroundColor: '#dcfce7',
  },

  errorIcon: {
    backgroundColor: '#fee2e2',
  },

  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 8,
  },

  modalMessage: {
    fontSize: 13,
    lineHeight: 19,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 18,
  },

  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },

  cancelButtonMsg: {
    minHeight: 46,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    flex: 1,
  },

  cancelTextMsg: {
    color: '#334155',
    fontWeight: '700',
    fontSize: 14,
  },

  confirmButtonMsg: {
    minHeight: 46,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#002b45',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    width: '100%',
  },

  dangerButtonMsg: {
    backgroundColor: '#dc2626',
  },

  confirmTextMsg: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
});