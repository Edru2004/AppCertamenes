// @ts-nocheck

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
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

import { getMisAsignacionesJurado } from '../../services/api';

export default function EquiposJurado() {
  const router = useRouter();

  const [asignaciones, setAsignaciones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState('');

  // ==========================================================
  // EXTRAER LISTA
  // ==========================================================

  const extraerLista = (respuesta: any) => {
    if (Array.isArray(respuesta)) {
      return respuesta;
    }

    if (Array.isArray(respuesta?.data)) {
      return respuesta.data;
    }

    if (Array.isArray(respuesta?.data?.data)) {
      return respuesta.data.data;
    }

    return [];
  };

  // ==========================================================
  // CARGAR EQUIPOS
  // ==========================================================

  const cargarAsignaciones = useCallback(async () => {
    try {
      setError('');

      const respuesta =
        await getMisAsignacionesJurado();

      const lista = extraerLista(respuesta);

      setAsignaciones(lista);
    } catch (error: any) {
      console.log(
        'Error cargando equipos del jurado:',
        error
      );

      setError(
        error?.message ||
          'No se pudieron cargar tus equipos asignados.'
      );
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }, []);

  // ==========================================================
  // RECARGAR AL RECIBIR FOCO
  // ==========================================================

  useFocusEffect(
    useCallback(() => {
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
  // EQUIPO
  // ==========================================================

  const obtenerEquipo = (asignacion: any) => {
    return asignacion?.equipo ?? {};
  };

  // ==========================================================
  // INTEGRANTES
  // ==========================================================

  const obtenerIntegrantes = (asignacion: any) => {
    const equipo = obtenerEquipo(asignacion);

    if (Array.isArray(equipo?.integrantes)) {
      return equipo.integrantes;
    }

    if (Array.isArray(equipo?.Integrantes)) {
      return equipo.Integrantes;
    }

    if (Array.isArray(equipo?.miembros)) {
      return equipo.miembros;
    }

    if (Array.isArray(asignacion?.integrantes)) {
      return asignacion.integrantes;
    }

    return [];
  };

  // ==========================================================
  // NOMBRE EQUIPO
  // ==========================================================

  const nombreEquipo = (asignacion: any) => {
    const equipo = obtenerEquipo(asignacion);

    return String(
      equipo?.Nombre ??
        equipo?.nombre ??
        asignacion?.NombreEquipo ??
        `Equipo #${asignacion?.Id_Equipo ?? ''}`
    );
  };

  // ==========================================================
  // NOMBRE INTEGRANTE
  // ==========================================================

  const nombreIntegrante = (integrante: any) => {
    const nombreCompleto = [
      integrante?.Nom,
      integrante?.App,
      integrante?.Apm,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    return String(
      integrante?.Nombre ??
        integrante?.nombre ??
        integrante?.Nombre_completo ??
        integrante?.nombre_completo ??
        (
          nombreCompleto ||
          integrante?.no_control ||
          'Integrante'
        )
    );
  };

  // ==========================================================
  // CARRERA
  // ==========================================================

  const carreraIntegrante = (integrante: any) => {
    return String(
      integrante?.Carrera ??
        integrante?.carrera ??
        'Carrera no especificada'
    );
  };

  // ==========================================================
  // ROL
  // ==========================================================

  const rolIntegrante = (integrante: any) => {
    return String(
      integrante?.Rol ??
        integrante?.rol ??
        'Integrante'
    );
  };

  // ==========================================================
  // SALA
  // ==========================================================

  const obtenerSala = (asignacion: any) => {
    const equipo = obtenerEquipo(asignacion);

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

  const obtenerDesafio = (asignacion: any) => {
    const equipo = obtenerEquipo(asignacion);

    return String(
      equipo?.desafio?.Nombre ??
        equipo?.desafio?.nombre ??
        equipo?.Desafio?.Nombre ??
        equipo?.Desafio?.nombre ??
        ''
    );
  };

  // ==========================================================
  // ABRIR EVALUACIÓN
  // ==========================================================

  const abrirEvaluacion = (asignacion: any) => {
    const equipo = obtenerEquipo(asignacion);

    router.push({
      pathname: '/(jurado)/evaluar',
      params: {
        idEquipo: String(
          asignacion?.Id_Equipo ??
            equipo?.Id_equipo ??
            equipo?.id_equipo ??
            ''
        ),

        idAsignacion: String(
          asignacion?.Id_asignacion ?? ''
        ),

        nombreEquipo: nombreEquipo(asignacion),
      },
    });
  };

  // ==========================================================
  // CARGANDO
  // ==========================================================

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator
          size="large"
          color="#002B45"
        />

        <Text style={styles.loadingText}>
          Cargando equipos asignados...
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
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl
            refreshing={actualizando}
            onRefresh={actualizar}
            colors={['#002B45']}
            tintColor="#002B45"
          />
        }
      >

        {/* ==================================================
            ENCABEZADO
        ================================================== */}

        <View style={styles.header}>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons
              name="arrow-back"
              size={25}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.title}>
              Mis equipos
            </Text>

            <Text style={styles.subtitle}>
              Equipos asignados para evaluación
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={actualizar}
          >
            <Ionicons
              name="refresh-outline"
              size={22}
              color="#0B4F6C"
            />
          </TouchableOpacity>

        </View>

        {/* ==================================================
            ERROR
        ================================================== */}

        {error ? (
          <View style={styles.errorBox}>

            <Ionicons
              name="alert-circle-outline"
              size={23}
              color="#B91C1C"
            />

            <View style={styles.errorContent}>

              <Text style={styles.errorTitle}>
                No se pudieron cargar los equipos
              </Text>

              <Text style={styles.errorText}>
                {error}
              </Text>

              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setCargando(true);
                  void cargarAsignaciones();
                }}
              >
                <Text style={styles.retryText}>
                  Reintentar
                </Text>
              </TouchableOpacity>

            </View>

          </View>
        ) : null}

        {/* ==================================================
            RESUMEN
        ================================================== */}

        <View style={styles.summaryCard}>

          <View style={styles.summaryIcon}>
            <Ionicons
              name="people-outline"
              size={27}
              color="#0369A1"
            />
          </View>

          <View style={styles.summaryContent}>

            <Text style={styles.summaryTitle}>
              Equipos asignados
            </Text>

            <Text style={styles.summarySubtitle}>
              Estos son los equipos que debes evaluar.
            </Text>

          </View>

          <View style={styles.counter}>

            <Text style={styles.counterText}>
              {asignaciones.length}
            </Text>

          </View>

        </View>

        {/* ==================================================
            SIN EQUIPOS
        ================================================== */}

        {!error && asignaciones.length === 0 ? (
          <View style={styles.emptyCard}>

            <Ionicons
              name="people-outline"
              size={55}
              color="#94A3B8"
            />

            <Text style={styles.emptyTitle}>
              No tienes equipos asignados
            </Text>

            <Text style={styles.emptyText}>
              Cuando el administrador te asigne
              equipos, aparecerán aquí.
            </Text>

          </View>
        ) : null}

        {/* ==================================================
            EQUIPOS
        ================================================== */}

        {asignaciones.map(
          (asignacion, index) => {

            const equipo =
              obtenerEquipo(asignacion);

            const integrantes =
              obtenerIntegrantes(asignacion);

            return (
              <View
                key={
                  asignacion?.Id_asignacion ??
                  `${asignacion?.Id_Equipo}-${index}`
                }
                style={styles.equipoCard}
              >

                {/* ==========================================
                    CABECERA
                ========================================== */}

                <View style={styles.equipoHeader}>

                  <View style={styles.equipoIcon}>
                    <Ionicons
                      name="people"
                      size={27}
                      color="#FFFFFF"
                    />
                  </View>

                  <View style={styles.equipoHeaderText}>

                    <Text style={styles.equipoLabel}>
                      EQUIPO ASIGNADO
                    </Text>

                    <Text style={styles.equipoNombre}>
                      {nombreEquipo(asignacion)}
                    </Text>

                  </View>

                  <View style={styles.numeroEquipo}>

                    <Text style={styles.numeroEquipoText}>
                      {index + 1}
                    </Text>

                  </View>

                </View>

                {/* ==========================================
                    INFORMACIÓN
                ========================================== */}

                <View style={styles.infoContainer}>

                  {/* SALA */}

                  <View style={styles.infoRow}>

                    <Ionicons
                      name="location-outline"
                      size={22}
                      color="#0369A1"
                    />

                    <View style={styles.infoTextContainer}>

                      <Text style={styles.infoLabel}>
                        Sala
                      </Text>

                      <Text style={styles.infoValue}>
                        {obtenerSala(asignacion)}
                      </Text>

                    </View>

                  </View>

                  {/* DESAFÍO */}

                  {obtenerDesafio(asignacion) ? (
                    <View style={styles.infoRow}>

                      <Ionicons
                        name="flag-outline"
                        size={22}
                        color="#0369A1"
                      />

                      <View style={styles.infoTextContainer}>

                        <Text style={styles.infoLabel}>
                          Desafío
                        </Text>

                        <Text style={styles.infoValue}>
                          {obtenerDesafio(asignacion)}
                        </Text>

                      </View>

                    </View>
                  ) : null}

                  {/* INTEGRANTES */}

                  <View style={styles.infoRow}>

                    <Ionicons
                      name="people-outline"
                      size={22}
                      color="#0369A1"
                    />

                    <View style={styles.infoTextContainer}>

                      <Text style={styles.infoLabel}>
                        Integrantes
                      </Text>

                      <Text style={styles.infoValue}>
                        {integrantes.length}{' '}
                        {integrantes.length === 1
                          ? 'integrante'
                          : 'integrantes'}
                      </Text>

                    </View>

                  </View>

                </View>

                {/* ==========================================
                    INTEGRANTES
                ========================================== */}

                {integrantes.length > 0 ? (
                  <View style={styles.integrantesContainer}>

                    <Text style={styles.integrantesTitle}>
                      Integrantes del equipo
                    </Text>

                    {integrantes.map(
                      (
                        integrante: any,
                        integranteIndex: number
                      ) => (

                        <View
                          key={
                            integrante?.no_control ??
                            integrante?.No_control ??
                            integranteIndex
                          }
                          style={styles.integranteRow}
                        >

                          <View style={styles.integranteIcon}>
                            <Ionicons
                              name="person-outline"
                              size={19}
                              color="#0369A1"
                            />
                          </View>

                          <View style={styles.memberInfo}>

                            <Text
                              style={styles.integranteNombre}
                              numberOfLines={1}
                            >
                              {nombreIntegrante(
                                integrante
                              )}
                            </Text>

                            <Text
                              style={styles.integranteDatos}
                              numberOfLines={1}
                            >
                              {carreraIntegrante(
                                integrante
                              )}
                            </Text>

                            <Text style={styles.integranteRol}>
                              Rol: {rolIntegrante(
                                integrante
                              )}
                            </Text>

                          </View>

                        </View>

                      )
                    )}

                  </View>
                ) : (
                  <View style={styles.sinIntegrantes}>

                    <Ionicons
                      name="information-circle-outline"
                      size={19}
                      color="#64748B"
                    />

                    <Text style={styles.sinIntegrantesText}>
                      Este equipo no tiene integrantes
                      registrados.
                    </Text>

                  </View>
                )}

                {/* ==========================================
                    BOTÓN EVALUAR
                ========================================== */}

                <TouchableOpacity
                  style={styles.evaluarButton}
                  activeOpacity={0.82}
                  onPress={() =>
                    abrirEvaluacion(asignacion)
                  }
                >

                  <Ionicons
                    name="create-outline"
                    size={22}
                    color="#FFFFFF"
                  />

                  <Text style={styles.evaluarText}>
                    Evaluar equipo
                  </Text>

                  <Ionicons
                    name="arrow-forward-outline"
                    size={21}
                    color="#FFFFFF"
                  />

                </TouchableOpacity>

              </View>
            );
          }
        )}

      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({

  page: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },

  container: {
    padding: 18,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },

  loadingText: {
    marginTop: 12,
    color: '#475569',
    fontSize: 13,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },

  backButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#063B52',
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerText: {
    flex: 1,
    marginLeft: 13,
  },

  title: {
    color: '#063B52',
    fontSize: 24,
    fontWeight: '900',
  },

  subtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 4,
  },

  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F2FE',
    justifyContent: 'center',
    alignItems: 'center',
  },

  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },

  errorContent: {
    flex: 1,
    marginLeft: 9,
  },

  errorTitle: {
    color: '#991B1B',
    fontSize: 13,
    fontWeight: '900',
  },

  errorText: {
    color: '#7F1D1D',
    fontSize: 11,
    marginTop: 3,
  },

  retryButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    backgroundColor: '#B91C1C',
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },

  retryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },

  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DBE3EE',
    borderRadius: 17,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 17,
  },

  summaryIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  summaryContent: {
    flex: 1,
  },

  summaryTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '900',
  },

  summarySubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 4,
  },

  counter: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: '#063B52',
    alignItems: 'center',
    justifyContent: 'center',
  },

  counterText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DBE3EE',
    borderRadius: 17,
    padding: 35,
    alignItems: 'center',
  },

  emptyTitle: {
    color: '#334155',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 12,
  },

  emptyText: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 7,
  },

  equipoCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DBE3EE',
    borderRadius: 19,
    marginBottom: 17,
    overflow: 'hidden',
  },

  equipoHeader: {
    backgroundColor: '#063B52',
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
  },

  equipoIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: '#0879AD',
    alignItems: 'center',
    justifyContent: 'center',
  },

  equipoHeaderText: {
    flex: 1,
    marginLeft: 13,
  },

  equipoLabel: {
    color: '#B8D6E3',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },

  equipoNombre: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 4,
  },

  numeroEquipo: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  numeroEquipoText: {
    color: '#063B52',
    fontSize: 16,
    fontWeight: '900',
  },

  infoContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
  },

  infoTextContainer: {
    flex: 1,
    marginLeft: 11,
  },

  infoLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
  },

  infoValue: {
    color: '#334155',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },

  integrantesContainer: {
    padding: 16,
  },

  integrantesTitle: {
    color: '#063B52',
    fontSize: 17,
    fontWeight: '900',
    marginBottom: 11,
  },

  integranteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 13,
    padding: 12,
    marginBottom: 9,
  },

  integranteIcon: {
    width: 43,
    height: 43,
    borderRadius: 22,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  memberInfo: {
    flex: 1,
    marginLeft: 11,
  },

  integranteNombre: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '900',
  },

  integranteDatos: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 3,
  },

  integranteRol: {
    color: '#0369A1',
    fontSize: 11,
    marginTop: 3,
    fontWeight: '800',
  },

  sinIntegrantes: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  sinIntegrantesText: {
    color: '#64748B',
    fontSize: 11,
    marginLeft: 7,
  },

  avaliarButton: {
    marginHorizontal: 15,
    marginBottom: 15,
    minHeight: 53,
    borderRadius: 13,
    backgroundColor: '#063B52',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  avaliarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    marginHorizontal: 10,
  },

  evaluarButton: {
    marginHorizontal: 15,
    marginBottom: 15,
    minHeight: 53,
    borderRadius: 13,
    backgroundColor: '#063B52',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  evaluarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    marginHorizontal: 10,
  },
});