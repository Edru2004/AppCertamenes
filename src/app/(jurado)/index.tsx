// @ts-nocheck

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { getMisAsignacionesJurado } from '../../services/api';

export default function JuradoIndex() {
  const router = useRouter();

  const [asignaciones, setAsignaciones] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [error, setError] = useState('');

  // ==========================================================
  // EXTRAER LISTA DE LA RESPUESTA
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
  // CARGAR ASIGNACIONES
  // ==========================================================

  const cargarAsignaciones = useCallback(async () => {
    try {
      setError('');

      const respuesta = await getMisAsignacionesJurado();

      const lista = extraerLista(respuesta);

      setAsignaciones(lista);
    } catch (err: any) {
      console.log(
        'Error cargando asignaciones:',
        err
      );

      setError(
        err?.message ||
          'No se pudieron cargar tus equipos asignados.'
      );
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }, []);

  // ==========================================================
  // CARGAR AL ENTRAR A LA PANTALLA
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
  // CERRAR SESIÓN
  // ==========================================================

  const cerrarSesion = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Seguro que deseas cerrar tu sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            try {
              /*
               * Eliminamos los datos de sesión guardados
               * localmente.
               */
              await AsyncStorage.clear();

              /*
               * Regresamos al login.
               *
               * Cambia esta ruta solamente si tu pantalla
               * de login tiene otro nombre.
               */
              router.replace('/login');
            } catch (err) {
              console.log(
                'Error cerrando sesión:',
                err
              );

              Alert.alert(
                'Error',
                'No se pudo cerrar la sesión.'
              );
            }
          },
        },
      ]
    );
  };

  // ==========================================================
  // ESTADÍSTICAS
  // ==========================================================

  const equiposAsignados = asignaciones.length;

  const evaluacionesPendientes =
    asignaciones.filter((item: any) => {
      const estado =
        item?.evaluado ??
        item?.Evaluado ??
        item?.estado_evaluacion ??
        item?.Estado_evaluacion;

      return (
        estado !== true &&
        estado !== 1 &&
        String(estado).toLowerCase() !== 'evaluado'
      );
    }).length;

  const evaluados =
    equiposAsignados - evaluacionesPendientes;

  const pendientes = evaluacionesPendientes;

  // ==========================================================
  // NAVEGACIÓN
  // ==========================================================

  const irAEquipos = () => {
    router.push('/(jurado)/equipos');
  };

  const irAPerfil = () => {
    router.push('/(jurado)/perfil');
  };

  // ==========================================================
  // LOADING
  // ==========================================================

  if (cargando) {
    return (
      <View style={styles.loadingContainer}>

        <ActivityIndicator
          size="small"
          color="#003B54"
        />

        <Text style={styles.loadingText}>
          Cargando panel...
        </Text>

      </View>
    );
  }

  // ==========================================================
  // PANTALLA PRINCIPAL
  // ==========================================================

  return (
    <View style={styles.page}>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={actualizando}
            onRefresh={actualizar}
            colors={['#003B54']}
            tintColor="#003B54"
          />
        }
      >

        {/* ====================================================
            ENCABEZADO
        ==================================================== */}

        <View style={styles.header}>

          <View style={styles.headerTop}>

            {/* MENÚ */}

            <TouchableOpacity
              style={styles.menuButton}
              activeOpacity={0.8}
            >
              <Ionicons
                name="menu-outline"
                size={27}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            {/* TÍTULO */}

            <Text style={styles.headerTitle}>
              Panel del Jurado
            </Text>

            {/* CONFIGURACIÓN */}

            <TouchableOpacity
              style={styles.settingsButton}
              activeOpacity={0.8}
            >
              <Ionicons
                name="settings-outline"
                size={25}
                color="#FFFFFF"
              />
            </TouchableOpacity>

          </View>

          {/* SALUDO */}

          <View style={styles.greetingContainer}>

            <Text style={styles.greeting}>
              ¡Hola, Jurado!
            </Text>

            <Text style={styles.role}>
              Jurado
            </Text>

          </View>

          {/* CERRAR SESIÓN */}

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={cerrarSesion}
            activeOpacity={0.85}
          >

            <Ionicons
              name="log-out-outline"
              size={20}
              color="#FF5A5F"
            />

            <Text style={styles.logoutText}>
              Cerrar sesión
            </Text>

          </TouchableOpacity>

        </View>

        {/* ====================================================
            CONTENIDO
        ==================================================== */}

        <View style={styles.body}>

          {/* ERROR */}

          {error ? (
            <View style={styles.errorCard}>

              <Ionicons
                name="alert-circle-outline"
                size={21}
                color="#C62828"
              />

              <View style={{ flex: 1 }}>

                <Text style={styles.errorTitle}>
                  No se pudieron cargar los datos
                </Text>

                <Text style={styles.errorText}>
                  {error}
                </Text>

                <TouchableOpacity
                  onPress={actualizar}
                  style={styles.retryButton}
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

          <View style={styles.sectionHeader}>

            <Text style={styles.sectionTitle}>
              Resumen de evaluación
            </Text>

            <TouchableOpacity
              style={styles.refreshButton}
              onPress={actualizar}
              activeOpacity={0.7}
            >
              <Ionicons
                name="refresh-outline"
                size={23}
                color="#003B54"
              />
            </TouchableOpacity>

          </View>

          {/* ==================================================
              TARJETAS
          ================================================== */}

          <View style={styles.statsGrid}>

            {/* EQUIPOS */}

            <View style={styles.statCard}>

              <View style={styles.statTop}>

                <Text style={styles.statLabel}>
                  EQUIPOS
                </Text>

                <View style={styles.statIconBlue}>
                  <Ionicons
                    name="people-outline"
                    size={25}
                    color="#087FAF"
                  />
                </View>

              </View>

              <Text style={styles.statNumber}>
                {equiposAsignados}
              </Text>

              <View style={styles.statFooter}>

                <Ionicons
                  name="checkmark-circle"
                  size={15}
                  color="#087FAF"
                />

                <Text style={styles.statFooterBlue}>
                  Asignados
                </Text>

              </View>

            </View>

            {/* EVALUACIONES */}

            <View style={styles.statCard}>

              <View style={styles.statTop}>

                <Text style={styles.statLabel}>
                  EVALUACIONES
                </Text>

                <View style={styles.statIconOrange}>
                  <Ionicons
                    name="clipboard-outline"
                    size={25}
                    color="#D99100"
                  />
                </View>

              </View>

              <Text style={styles.statNumber}>
                {evaluacionesPendientes}
              </Text>

              <View style={styles.statFooter}>

                <Ionicons
                  name="alert-circle"
                  size={15}
                  color="#D99100"
                />

                <Text style={styles.statFooterOrange}>
                  Pendientes
                </Text>

              </View>

            </View>

            {/* EVALUADOS */}

            <View style={styles.statCard}>

              <View style={styles.statTop}>

                <Text style={styles.statLabel}>
                  EVALUADOS
                </Text>

                <View style={styles.statIconGreen}>
                  <Ionicons
                    name="checkmark-done-outline"
                    size={25}
                    color="#159447"
                  />
                </View>

              </View>

              <Text style={styles.statNumber}>
                {evaluados}
              </Text>

              <View style={styles.statFooter}>

                <Ionicons
                  name="checkmark-circle"
                  size={15}
                  color="#159447"
                />

                <Text style={styles.statFooterGreen}>
                  Realizadas
                </Text>

              </View>

            </View>

            {/* PENDIENTES */}

            <View style={styles.statCard}>

              <View style={styles.statTop}>

                <Text style={styles.statLabel}>
                  PENDIENTES
                </Text>

                <View style={styles.statIconRed}>
                  <Ionicons
                    name="time-outline"
                    size={25}
                    color="#D94A4A"
                  />
                </View>

              </View>

              <Text style={styles.statNumber}>
                {pendientes}
              </Text>

              <View style={styles.statFooter}>

                <Ionicons
                  name="time"
                  size={15}
                  color="#D94A4A"
                />

                <Text style={styles.statFooterRed}>
                  Por evaluar
                </Text>

              </View>

            </View>

          </View>

          {/* ==================================================
              MIS EQUIPOS
          ================================================== */}

          <TouchableOpacity
            style={styles.teamsButton}
            onPress={irAEquipos}
            activeOpacity={0.85}
          >

            <View style={styles.teamsButtonIcon}>
              <Ionicons
                name="people"
                size={25}
                color="#FFFFFF"
              />
            </View>

            <View style={styles.teamsButtonTextContainer}>

              <Text style={styles.teamsButtonTitle}>
                Mis equipos
              </Text>

              <Text style={styles.teamsButtonSubtitle}>
                Ver equipos asignados y evaluar
              </Text>

            </View>

            <Ionicons
              name="chevron-forward"
              size={25}
              color="#FFFFFF"
            />

          </TouchableOpacity>

          {/* SIN EQUIPOS */}

          {equiposAsignados === 0 && !error ? (
            <View style={styles.emptyCard}>

              <Ionicons
                name="people-outline"
                size={36}
                color="#7D93A3"
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

        </View>

      </ScrollView>

      {/* ======================================================
          BARRA INFERIOR
      ====================================================== */}

      <View style={styles.bottomBar}>

        {/* INICIO */}

        <TouchableOpacity
          style={styles.bottomItem}
          activeOpacity={0.8}
        >

          <Ionicons
            name="home"
            size={27}
            color="#003B54"
          />

          <Text style={styles.bottomActiveText}>
            Inicio
          </Text>

        </TouchableOpacity>

        {/* PERFIL */}

        <TouchableOpacity
          style={styles.bottomItem}
          onPress={irAPerfil}
          activeOpacity={0.8}
        >

          <Ionicons
            name="person-outline"
            size={27}
            color="#777777"
          />

          <Text style={styles.bottomText}>
            Perfil
          </Text>

        </TouchableOpacity>

      </View>

    </View>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({

  page: {
    flex: 1,
    backgroundColor: '#F4F6FA',
  },

  scrollContent: {
    paddingBottom: 22,
  },

  // ==========================================================
  // LOADING
  // ==========================================================

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F4F6FA',
  },

  loadingText: {
    marginTop: 9,
    fontSize: 14,
    color: '#64788A',
    fontWeight: '600',
  },

  // ==========================================================
  // HEADER
  // ==========================================================

  header: {
    backgroundColor: '#003B54',
    paddingTop: 38,
    paddingHorizontal: 20,
    paddingBottom: 25,
  },

  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  menuButton: {
    width: 43,
    height: 43,
    justifyContent: 'center',
    alignItems: 'center',
  },

  headerTitle: {
    flex: 1,
    marginLeft: 7,
    fontSize: 23,
    color: '#FFFFFF',
    fontWeight: '800',
  },

  settingsButton: {
    width: 47,
    height: 47,
    borderRadius: 24,
    backgroundColor: '#527486',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#698B9B',
  },

  greetingContainer: {
    marginTop: 28,
    paddingLeft: 12,
  },

  greeting: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '900',
  },

  role: {
    marginTop: 3,
    fontSize: 19,
    color: '#B9C9D3',
    fontWeight: '500',
  },

  // ==========================================================
  // CERRAR SESIÓN
  // ==========================================================

  logoutButton: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 8,
    marginTop: 17,
  },

  logoutText: {
    color: '#FF777B',
    fontSize: 13,
    fontWeight: '800',
    marginLeft: 6,
  },

  // ==========================================================
  // BODY
  // ==========================================================

  body: {
    paddingHorizontal: 20,
    paddingTop: 21,
  },

  // ==========================================================
  // ERROR
  // ==========================================================

  errorCard: {
    backgroundColor: '#FFF1F0',
    borderRadius: 15,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 17,
    borderWidth: 1,
    borderColor: '#F4C7C3',
    gap: 9,
  },

  errorTitle: {
    color: '#9B2C25',
    fontSize: 14,
    fontWeight: '800',
  },

  errorText: {
    color: '#7A403C',
    fontSize: 12,
    marginTop: 3,
    lineHeight: 17,
  },

  retryButton: {
    marginTop: 9,
    backgroundColor: '#C62828',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 9,
  },

  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // ==========================================================
  // RESUMEN
  // ==========================================================

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },

  sectionTitle: {
    color: '#003B54',
    fontSize: 21,
    fontWeight: '800',
  },

  refreshButton: {
    width: 43,
    height: 43,
    borderRadius: 13,
    backgroundColor: '#EAF4FA',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ==========================================================
  // ESTADÍSTICAS
  // ==========================================================

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  statCard: {
    width: '48%',
    minHeight: 145,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 15,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: '#DCE4EA',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.07,
    shadowRadius: 5,
    elevation: 2,
  },

  statTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  statLabel: {
    flex: 1,
    fontSize: 14,
    color: '#8796A2',
    fontWeight: '800',
    letterSpacing: 0.3,
  },

  statNumber: {
    marginTop: 4,
    fontSize: 34,
    color: '#003B54',
    fontWeight: '900',
  },

  statIconBlue: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#EAF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  statIconOrange: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#FFF8E8',
    justifyContent: 'center',
    alignItems: 'center',
  },

  statIconGreen: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#E9FAF0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  statIconRed: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },

  statFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },

  statFooterBlue: {
    color: '#087FAF',
    fontSize: 11,
    fontWeight: '700',
  },

  statFooterOrange: {
    color: '#D99100',
    fontSize: 11,
    fontWeight: '700',
  },

  statFooterGreen: {
    color: '#159447',
    fontSize: 11,
    fontWeight: '700',
  },

  statFooterRed: {
    color: '#D94A4A',
    fontSize: 11,
    fontWeight: '700',
  },

  // ==========================================================
  // MIS EQUIPOS
  // ==========================================================

  teamsButton: {
    minHeight: 72,
    backgroundColor: '#003B54',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
    marginBottom: 15,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 3,
  },

  teamsButtonIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#087FAF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  teamsButtonTextContainer: {
    flex: 1,
    marginLeft: 12,
  },

  teamsButtonTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },

  teamsButtonSubtitle: {
    color: '#B9D0DA',
    fontSize: 11,
    marginTop: 2,
  },

  // ==========================================================
  // SIN EQUIPOS
  // ==========================================================

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCE4EA',
  },

  emptyTitle: {
    marginTop: 9,
    fontSize: 16,
    color: '#003B54',
    fontWeight: '800',
    textAlign: 'center',
  },

  emptyText: {
    marginTop: 5,
    fontSize: 12,
    color: '#758895',
    textAlign: 'center',
    lineHeight: 17,
  },

  // ==========================================================
  // BARRA INFERIOR
  // ==========================================================

  bottomBar: {
    height: 73,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E1E6EA',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 8,
  },

  bottomItem: {
    width: '45%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomActiveText: {
    marginTop: 1,
    color: '#003B54',
    fontSize: 14,
    fontWeight: '900',
  },

  bottomText: {
    marginTop: 1,
    color: '#777777',
    fontSize: 14,
    fontWeight: '500',
  },
});