// src/app/(jurado)/asignaciones.tsx

// @ts-nocheck

import { Ionicons } from '@expo/vector-icons';
import {
    useFocusEffect,
    useRouter,
} from 'expo-router';

import { useCallback, useState } from 'react';

import {
    ActivityIndicator,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

import {
    getMisAsignacionesJurado,
} from '../../services/api';

export default function JuradoAsignaciones() {
  const router = useRouter();

  // ==========================================================
  // ESTADOS
  // ==========================================================

  const [asignaciones, setAsignaciones] =
    useState<any[]>([]);

  const [cargando, setCargando] =
    useState(true);

  const [actualizando, setActualizando] =
    useState(false);

  const [error, setError] =
    useState('');

  // ==========================================================
  // EXTRAER LISTA
  // ==========================================================

  const extraerLista = (
    respuesta: any
  ) => {
    if (Array.isArray(respuesta)) {
      return respuesta;
    }

    if (Array.isArray(respuesta?.data)) {
      return respuesta.data;
    }

    if (
      Array.isArray(
        respuesta?.data?.data
      )
    ) {
      return respuesta.data.data;
    }

    return [];
  };

  // ==========================================================
  // OBTENER EQUIPO
  // ==========================================================

  const obtenerEquipo = (
    asignacion: any
  ) => {
    return asignacion?.equipo ?? {};
  };

  // ==========================================================
  // OBTENER ID DEL EQUIPO
  // ==========================================================

  const obtenerIdEquipo = (
    asignacion: any
  ) => {
    const equipo =
      obtenerEquipo(asignacion);

    return (
      asignacion?.Id_Equipo ??
      asignacion?.Id_equipo ??
      asignacion?.id_equipo ??
      equipo?.Id_equipo ??
      equipo?.Id_Equipo ??
      equipo?.id_equipo ??
      equipo?.id ??
      null
    );
  };

  // ==========================================================
  // NOMBRE DEL EQUIPO
  // ==========================================================

  const nombreEquipo = (
    asignacion: any
  ) => {
    const equipo =
      obtenerEquipo(asignacion);

    return String(
      equipo?.Nombre ??
        equipo?.nombre ??
        asignacion?.NombreEquipo ??
        asignacion?.nombre_equipo ??
        `Equipo #${obtenerIdEquipo(
          asignacion
        ) ?? ''}`
    );
  };

  // ==========================================================
  // CERTAMEN
  // ==========================================================

  const nombreCertamen = (
    asignacion: any
  ) => {
    const equipo =
      obtenerEquipo(asignacion);

    return String(
      asignacion?.Nombre_certamen ??
        asignacion?.nombre_certamen ??
        asignacion?.Certamen ??
        equipo?.certamen?.Nombre ??
        equipo?.Certamen?.Nombre ??
        'Certamen'
    );
  };

  // ==========================================================
  // SALA
  // ==========================================================

  const nombreSala = (
    asignacion: any
  ) => {
    const equipo =
      obtenerEquipo(asignacion);

    const sala =
      asignacion?.sala ??
      equipo?.sala;

    if (!sala) {
      return 'Sin sala asignada';
    }

    return String(
      sala?.Nombre ??
        sala?.nombre ??
        'Sala asignada'
    );
  };

  // ==========================================================
  // DESAFÍO
  // ==========================================================

  const nombreDesafio = (
    asignacion: any
  ) => {
    const equipo =
      obtenerEquipo(asignacion);

    return String(
      equipo?.desafio?.Nombre ??
        equipo?.desafio?.nombre ??
        equipo?.Desafio?.Nombre ??
        equipo?.Desafio?.nombre ??
        asignacion?.Nombre_desafio ??
        asignacion?.nombre_desafio ??
        ''
    );
  };

  // ==========================================================
  // CARGAR ASIGNACIONES
  // ==========================================================

  const cargarAsignaciones =
    useCallback(async () => {
      try {
        setError('');

        console.log(
          '================================'
        );

        console.log(
          'JURADO - CARGANDO ASIGNACIONES'
        );

        console.log(
          '================================'
        );

        const respuesta =
          await getMisAsignacionesJurado();

        console.log(
          'Respuesta asignaciones jurado:',
          JSON.stringify(
            respuesta,
            null,
            2
          )
        );

        const lista =
          extraerLista(respuesta);

        console.log(
          'Total de asignaciones:',
          lista.length
        );

        setAsignaciones(lista);

      } catch (err: any) {
        console.log(
          'Error cargando asignaciones:',
          err
        );

        setError(
          err?.message ||
            'No se pudieron cargar tus asignaciones.'
        );

        setAsignaciones([]);

      } finally {
        setCargando(false);
        setActualizando(false);
      }
    }, []);

  // ==========================================================
  // RECARGAR AL ENTRAR
  // ==========================================================

  useFocusEffect(
    useCallback(() => {
      setCargando(true);

      void cargarAsignaciones();
    }, [cargarAsignaciones])
  );

  // ==========================================================
  // ACTUALIZAR
  // ==========================================================

  const actualizar = async () => {
    setActualizando(true);

    await cargarAsignaciones();
  };

  // ==========================================================
  // EVALUAR EQUIPO
  // ==========================================================

  const evaluarEquipo = (
    asignacion: any
  ) => {
    const idEquipo =
      obtenerIdEquipo(asignacion);

    if (
      idEquipo === null ||
      idEquipo === undefined ||
      idEquipo === ''
    ) {
      console.log(
        'ERROR: asignación sin Id_equipo:',
        asignacion
      );

      setError(
        'No se encontró el ID del equipo para iniciar la evaluación.'
      );

      return;
    }

    console.log(
      'Abriendo evaluación del equipo:',
      idEquipo
    );

   router.push({
  pathname: '/evaluar',
  params: {
    idEquipo: String(idEquipo),
    nombreEquipo: nombreEquipo(asignacion),
  },
});
  };

  // ==========================================================
  // VER EQUIPO
  // ==========================================================

  const verEquipo = (
    asignacion: any
  ) => {
    const idEquipo =
      obtenerIdEquipo(asignacion);

    if (
      idEquipo === null ||
      idEquipo === undefined ||
      idEquipo === ''
    ) {
      setError(
        'No se encontró el ID del equipo.'
      );

      return;
    }

    router.push({
      pathname:
        '/(jurado)/equipos',
      params: {
        idEquipo: String(
          idEquipo
        ),
      },
    });
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (cargando) {
    return (
      <View
        style={styles.loadingContainer}
      >
        <ActivityIndicator
          size="large"
          color="#002B45"
        />

        <Text
          style={styles.loadingText}
        >
          Cargando mis asignaciones...
        </Text>
      </View>
    );
  }

  // ==========================================================
  // PANTALLA
  // ==========================================================

  return (
    <View style={styles.page}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.container
        }
        refreshControl={
          <RefreshControl
            refreshing={
              actualizando
            }
            onRefresh={
              actualizar
            }
            colors={[
              '#002B45',
            ]}
            tintColor="#002B45"
          />
        }
      >

        {/* ==================================================
            ENCABEZADO
        ================================================== */}

        <View
          style={styles.header}
        >

          <View
            style={
              styles.headerIcon
            }
          >
            <Ionicons
              name="clipboard-outline"
              size={28}
              color="#FFFFFF"
            />
          </View>

          <View
            style={
              styles.headerText
            }
          >
            <Text
              style={styles.title}
            >
              Mis asignaciones
            </Text>

            <Text
              style={styles.subtitle}
            >
              Equipos que debes evaluar
            </Text>
          </View>

          <View
            style={
              styles.counter
            }
          >
            <Text
              style={
                styles.counterText
              }
            >
              {asignaciones.length}
            </Text>
          </View>

        </View>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error ? (
          <View
            style={styles.errorBox}
          >

            <Ionicons
              name="alert-circle-outline"
              size={24}
              color="#B91C1C"
            />

            <View
              style={
                styles.errorContent
              }
            >

              <Text
                style={
                  styles.errorTitle
                }
              >
                Ocurrió un problema
              </Text>

              <Text
                style={
                  styles.errorText
                }
              >
                {error}
              </Text>

              <TouchableOpacity
                style={
                  styles.retryButton
                }
                onPress={() => {
                  setCargando(true);
                  void cargarAsignaciones();
                }}
              >
                <Text
                  style={
                    styles.retryText
                  }
                >
                  Reintentar
                </Text>
              </TouchableOpacity>

            </View>

          </View>
        ) : null}

        {/* ==================================================
            SIN ASIGNACIONES
        ================================================== */}

        {!error &&
        asignaciones.length === 0 ? (

          <View
            style={
              styles.emptyCard
            }
          >

            <View
              style={
                styles.emptyIcon
              }
            >
              <Ionicons
                name="people-outline"
                size={46}
                color="#94A3B8"
              />
            </View>

            <Text
              style={
                styles.emptyTitle
              }
            >
              No tienes equipos asignados
            </Text>

            <Text
              style={
                styles.emptyText
              }
            >
              Cuando el administrador te
              asigne un equipo, aparecerá
              aquí para que puedas
              evaluarlo.
            </Text>

          </View>

        ) : null}

        {/* ==================================================
            LISTA DE ASIGNACIONES
        ================================================== */}

        {asignaciones.map(
          (
            asignacion,
            index
          ) => {

            const idEquipo =
              obtenerIdEquipo(
                asignacion
              );

            const equipo =
              obtenerEquipo(
                asignacion
              );

            return (
              <View
                key={
                  asignacion?.Id_asignacion ??
                  `${idEquipo}-${index}`
                }
                style={
                  styles.card
                }
              >

                {/* ==========================================
                    CABECERA
                ========================================== */}

                <View
                  style={
                    styles.cardHeader
                  }
                >

                  <View
                    style={
                      styles.teamIcon
                    }
                  >
                    <Ionicons
                      name="people"
                      size={29}
                      color="#FFFFFF"
                    />
                  </View>

                  <View
                    style={
                      styles.teamInfo
                    }
                  >

                    <Text
                      style={
                        styles.teamLabel
                      }
                    >
                      EQUIPO ASIGNADO
                    </Text>

                    <Text
                      style={
                        styles.teamName
                      }
                    >
                      {nombreEquipo(
                        asignacion
                      )}
                    </Text>

                    <Text
                      style={
                        styles.certamen
                      }
                    >
                      {nombreCertamen(
                        asignacion
                      )}
                    </Text>

                  </View>

                  <View
                    style={
                      styles.pendingBadge
                    }
                  >
                    <Text
                      style={
                        styles.pendingText
                      }
                    >
                      Pendiente
                    </Text>
                  </View>

                </View>

                {/* ==========================================
                    INFORMACIÓN
                ========================================== */}

                <View
                  style={
                    styles.infoContainer
                  }
                >

                  <View
                    style={
                      styles.infoRow
                    }
                  >

                    <Ionicons
                      name="location-outline"
                      size={19}
                      color="#64748B"
                    />

                    <Text
                      style={
                        styles.infoText
                      }
                    >
                      Sala:{' '}
                      <Text
                        style={
                          styles.infoValue
                        }
                      >
                        {nombreSala(
                          asignacion
                        )}
                      </Text>
                    </Text>

                  </View>

                  {nombreDesafio(
                    asignacion
                  ) ? (
                    <View
                      style={
                        styles.infoRow
                      }
                    >

                      <Ionicons
                        name="flag-outline"
                        size={19}
                        color="#64748B"
                      />

                      <Text
                        style={
                          styles.infoText
                        }
                      >
                        Desafío:{' '}
                        <Text
                          style={
                            styles.infoValue
                          }
                        >
                          {nombreDesafio(
                            asignacion
                          )}
                        </Text>
                      </Text>

                    </View>
                  ) : null}

                  <View
                    style={
                      styles.infoRow
                    }
                  >

                    <Ionicons
                      name="key-outline"
                      size={19}
                      color="#64748B"
                    />

                    <Text
                      style={
                        styles.infoText
                      }
                    >
                      ID equipo:{' '}
                      <Text
                        style={
                          styles.infoValue
                        }
                      >
                        {idEquipo ??
                          'No disponible'}
                      </Text>
                    </Text>

                  </View>

                </View>

                {/* ==========================================
                    BOTONES
                ========================================== */}

                <View
                  style={
                    styles.buttons
                  }
                >

                  <TouchableOpacity
                    style={
                      styles.viewButton
                    }
                    onPress={() =>
                      verEquipo(
                        asignacion
                      )
                    }
                    activeOpacity={0.8}
                  >

                    <Ionicons
                      name="eye-outline"
                      size={20}
                      color="#0B4F6C"
                    />

                    <Text
                      style={
                        styles.viewButtonText
                      }
                    >
                      Ver equipo
                    </Text>

                  </TouchableOpacity>

                  <TouchableOpacity
                    style={
                      styles.evaluateButton
                    }
                    onPress={() =>
                      evaluarEquipo(
                        asignacion
                      )
                    }
                    activeOpacity={0.8}
                  >

                    <Ionicons
                      name="create-outline"
                      size={20}
                      color="#FFFFFF"
                    />

                    <Text
                      style={
                        styles.evaluateButtonText
                      }
                    >
                      Evaluar equipo
                    </Text>

                  </TouchableOpacity>

                </View>

              </View>
            );
          }
        )}

      </ScrollView>

    </View>
  );
}

// ==========================================================
// ESTILOS
// ==========================================================

const styles = StyleSheet.create({

  page: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },

  container: {
    padding: 18,
    paddingBottom: 40,
  },

  // ========================================================
  // LOADING
  // ========================================================

  loadingContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
  },

  // ========================================================
  // HEADER
  // ========================================================

  header: {
    backgroundColor: '#002B45',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },

  headerIcon: {
    width: 52,
    height: 52,
    borderRadius: 15,
    backgroundColor: '#0B4F6C',
    alignItems: 'center',
    justifyContent: 'center',
  },

  headerText: {
    flex: 1,
    marginLeft: 13,
  },

  title: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '800',
  },

  subtitle: {
    color: '#D7E5EC',
    fontSize: 12,
    marginTop: 4,
  },

  counter: {
    minWidth: 42,
    height: 42,
    paddingHorizontal: 10,
    borderRadius: 21,
    backgroundColor: '#A4B74D',
    alignItems: 'center',
    justifyContent: 'center',
  },

  counterText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },

  // ========================================================
  // ERROR
  // ========================================================

  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    marginBottom: 18,
  },

  errorContent: {
    flex: 1,
    marginLeft: 9,
  },

  errorTitle: {
    color: '#991B1B',
    fontSize: 14,
    fontWeight: '800',
  },

  errorText: {
    color: '#7F1D1D',
    fontSize: 12,
    marginTop: 4,
  },

  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#B91C1C',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginTop: 9,
  },

  retryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  // ========================================================
  // VACÍO
  // ========================================================

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  emptyIcon: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  emptyTitle: {
    color: '#334155',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },

  emptyText: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },

  // ========================================================
  // CARD
  // ========================================================

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 17,
    overflow: 'hidden',
  },

  cardHeader: {
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
  },

  teamIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  teamInfo: {
    flex: 1,
    marginLeft: 12,
  },

  teamLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
  },

  teamName: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 2,
  },

  certamen: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 3,
  },

  pendingBadge: {
    backgroundColor: '#FFF7ED',
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  pendingText: {
    color: '#EA580C',
    fontSize: 9,
    fontWeight: '900',
  },

  // ========================================================
  // INFO
  // ========================================================

  infoContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 17,
    paddingVertical: 13,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },

  infoText: {
    color: '#64748B',
    fontSize: 12,
    marginLeft: 8,
    flex: 1,
  },

  infoValue: {
    color: '#334155',
    fontWeight: '700',
  },

  // ========================================================
  // BOTONES
  // ========================================================

  buttons: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    padding: 14,
    flexDirection: 'row',
    gap: 10,
  },

  viewButton: {
    flex: 1,
    minHeight: 45,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  viewButtonText: {
    color: '#0B4F6C',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 6,
  },

  evaluateButton: {
    flex: 1.2,
    minHeight: 45,
    borderRadius: 11,
    backgroundColor: '#2563EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  evaluateButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 6,
  },

});