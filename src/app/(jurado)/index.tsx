import {
  getMiPerfilJurado,
  getMisAsignacionesJurado,
  logoutUsuario,
} from '@/services/api';

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

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

export default function JuradoIndex() {
  const router = useRouter();

  // =========================================================
  // ESTADOS
  // =========================================================

  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);

  const [perfilCompleto, setPerfilCompleto] = useState(false);

  const [nombreJurado, setNombreJurado] = useState('Jurado');

  const [asignaciones, setAsignaciones] = useState<any[]>([]);

  const [evaluacionesRealizadas, setEvaluacionesRealizadas] =
    useState(0);

  const [evaluacionesPendientes, setEvaluacionesPendientes] =
    useState(0);

  const [error, setError] = useState('');

  // =========================================================
  // CARGAR NOMBRE DEL USUARIO
  // =========================================================

  const cargarDatosUsuario = useCallback(async () => {
    try {
      const usuarioGuardado =
        await AsyncStorage.getItem('userData');

      if (!usuarioGuardado) {
        return;
      }

      const usuario = JSON.parse(usuarioGuardado);

      const nombre = [
        usuario?.Nombre || usuario?.Nom || '',
        usuario?.App || '',
        usuario?.Apm || '',
      ]
        .filter(Boolean)
        .join(' ')
        .trim();

      if (nombre) {
        setNombreJurado(nombre);
      }
    } catch (e) {
      console.log(
        'Error cargando datos del usuario:',
        e
      );
    }
  }, []);

  // =========================================================
  // EXTRAER LISTA DE ASIGNACIONES
  // =========================================================

  const extraerLista = (respuesta: any): any[] => {
    if (Array.isArray(respuesta)) {
      return respuesta;
    }

    if (Array.isArray(respuesta?.data)) {
      return respuesta.data;
    }

    if (Array.isArray(respuesta?.asignaciones)) {
      return respuesta.asignaciones;
    }

    if (Array.isArray(respuesta?.data?.data)) {
      return respuesta.data.data;
    }

    return [];
  };

  // =========================================================
  // DETERMINAR SI UNA ASIGNACIÓN YA FUE EVALUADA
  // =========================================================

  const estaEvaluada = (item: any): boolean => {
    if (!item) {
      return false;
    }

    if (
      item.evaluado === true ||
      item.Evaluado === true
    ) {
      return true;
    }

    if (
      item.evaluacion_completada === true ||
      item.Evaluacion_completada === true
    ) {
      return true;
    }

    if (
      item.estado_evaluacion === 'Evaluada' ||
      item.Estado_evaluacion === 'Evaluada'
    ) {
      return true;
    }

    if (
      item.estado_evaluacion === 'Completada' ||
      item.Estado_evaluacion === 'Completada'
    ) {
      return true;
    }

    if (
      item.evaluacion ||
      item.Evaluacion
    ) {
      return true;
    }

    if (
      Array.isArray(item.evaluaciones) &&
      item.evaluaciones.length > 0
    ) {
      return true;
    }

    return false;
  };

  // =========================================================
  // COMPROBAR PERFIL
  // =========================================================

  const comprobarPerfil = useCallback(async () => {
    try {
      console.log(
        'JuradoIndex: comprobando perfil...'
      );

      const respuesta =
        await getMiPerfilJurado();

      console.log(
        'Respuesta perfil jurado:',
        respuesta
      );

      const completo =
        respuesta?.completo === true;

      setPerfilCompleto(completo);

      return completo;
    } catch (e: any) {
      console.log(
        'Error comprobando perfil:',
        e
      );

      setPerfilCompleto(false);

      return false;
    }
  }, []);

  // =========================================================
  // CARGAR ASIGNACIONES
  // =========================================================

  const cargarAsignaciones = useCallback(async () => {
    try {
      console.log(
        'JuradoIndex: cargando asignaciones...'
      );

      const respuesta =
        await getMisAsignacionesJurado();

      console.log(
        'Respuesta asignaciones jurado:',
        respuesta
      );

      const lista =
        extraerLista(respuesta);

      setAsignaciones(lista);

      // ===============================================
      // CALCULAR ESTADÍSTICAS
      // ===============================================

      const realizadas =
        lista.filter(estaEvaluada).length;

      const pendientes =
        Math.max(
          lista.length - realizadas,
          0
        );

      setEvaluacionesRealizadas(
        realizadas
      );

      setEvaluacionesPendientes(
        pendientes
      );
    } catch (e: any) {
      console.log(
        'Error cargando asignaciones:',
        e
      );

      setAsignaciones([]);

      setEvaluacionesRealizadas(0);
      setEvaluacionesPendientes(0);
    }
  }, []);

  // =========================================================
  // CARGA INICIAL
  // =========================================================

  const cargarPanel = useCallback(async () => {
    try {
      setError('');

      console.log(
        'JuradoIndex: iniciando carga...'
      );

      await cargarDatosUsuario();

      const completo =
        await comprobarPerfil();

      // ===============================================
      // SI EL PERFIL ESTÁ INCOMPLETO
      // ===============================================

      if (!completo) {
        console.log(
          'JuradoIndex: perfil incompleto.'
        );

        console.log(
          'JuradoIndex: no se cargarán asignaciones.'
        );

        setCargando(false);

        router.replace(
          '/(jurado)/perfil'
        );

        return;
      }

      console.log(
        'JuradoIndex: perfil completo.'
      );

      // ===============================================
      // PERFIL COMPLETO
      // ===============================================

      await cargarAsignaciones();

      console.log(
        'JuradoIndex: carga finalizada.'
      );
    } catch (e: any) {
      console.log(
        'Error cargando panel del jurado:',
        e
      );

      setError(
        'No fue posible cargar el panel del jurado.'
      );
    } finally {
      setCargando(false);
    }
  }, [
    cargarDatosUsuario,
    comprobarPerfil,
    cargarAsignaciones,
    router,
  ]);

  // =========================================================
  // EJECUTAR CARGA INICIAL
  // =========================================================

  useEffect(() => {
    console.log(
      'JuradoIndex: EJECUTANDO CARGA INICIAL UNA SOLA VEZ.'
    );

    cargarPanel();
  }, [cargarPanel]);

  // =========================================================
  // ACTUALIZAR
  // =========================================================

  const actualizar = async () => {
    try {
      setActualizando(true);

      const completo =
        await comprobarPerfil();

      if (!completo) {
        router.replace(
          '/(jurado)/perfil'
        );

        return;
      }

      await cargarDatosUsuario();

      await cargarAsignaciones();
    } catch (e) {
      console.log(
        'Error actualizando panel:',
        e
      );
    } finally {
      setActualizando(false);
    }
  };

  // =========================================================
  // CERRAR SESIÓN
  // =========================================================

  const cerrarSesion = async () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
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
              await logoutUsuario();
            } catch (e) {
              console.log(
                'Error cerrando sesión:',
                e
              );
            } finally {
              await AsyncStorage.multiRemove([
                'userToken',
                'userRole',
                'userData',
              ]);

              router.replace('/login');
            }
          },
        },
      ]
    );
  };

  // =========================================================
  // CARGANDO
  // =========================================================

  if (cargando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#002b45"
        />

        <Text style={styles.loadingText}>
          Cargando panel del jurado...
        </Text>
      </View>
    );
  }

  // =========================================================
  // PANEL PRINCIPAL
  // =========================================================

  return (
    <View style={styles.container}>

      {/* =================================================
          ENCABEZADO
      ================================================= */}

      <View style={styles.topHeader}>

        <View style={styles.headerText}>

          <Text style={styles.panelTitle}>
            Panel del Jurado
          </Text>

          <Text style={styles.welcomeTitle}>
            ¡Hola, {nombreJurado}!
          </Text>

          <Text style={styles.welcomeSubtitle}>
            Jurado
          </Text>

        </View>

        {/* CERRAR SESIÓN */}

        <TouchableOpacity
          style={styles.btnLogout}
          onPress={cerrarSesion}
          accessibilityLabel="Cerrar sesión"
          activeOpacity={0.8}
        >
          <Ionicons
            name="log-out-outline"
            size={22}
            color="#ff4d4d"
          />
        </TouchableOpacity>

      </View>

      {/* =================================================
          CONTENIDO
      ================================================= */}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.scrollContent
        }
        refreshControl={
          <RefreshControl
            refreshing={actualizando}
            onRefresh={actualizar}
            colors={['#002b45']}
            tintColor="#002b45"
          />
        }
        keyboardShouldPersistTaps="handled"
      >

        {/* =================================================
            ERROR
        ================================================= */}

        {error ? (
          <View style={styles.errorBox}>

            <Ionicons
              name="alert-circle-outline"
              size={22}
              color="#b91c1c"
            />

            <Text style={styles.errorText}>
              {error}
            </Text>

          </View>
        ) : null}

        {/* =================================================
            TÍTULO DE SECCIÓN
        ================================================= */}

        <View style={styles.sectionHeader}>

          <View>
            <Text style={styles.sectionTitle}>
              Resumen de evaluaciones
            </Text>

            <Text style={styles.sectionSubtitle}>
              Estado de tus actividades como jurado
            </Text>
          </View>

          {/* ACTUALIZAR */}

          <TouchableOpacity
            onPress={actualizar}
            disabled={actualizando}
            style={styles.refreshButton}
            accessibilityLabel="Actualizar información"
            activeOpacity={0.8}
          >
            {actualizando ? (
              <ActivityIndicator
                size="small"
                color="#002b45"
              />
            ) : (
              <Ionicons
                name="refresh-outline"
                size={19}
                color="#002b45"
              />
            )}
          </TouchableOpacity>

        </View>

        {/* =================================================
            TARJETAS DE ESTADÍSTICAS
        ================================================= */}

        <View style={styles.statsGrid}>

          {/* EVALUACIONES REALIZADAS */}

          <View style={styles.statCard}>

            <View style={styles.statTextContainer}>

              <Text style={styles.statTitle}>
                EVALUACIONES
              </Text>

              <Text style={styles.statNumber}>
                {evaluacionesRealizadas}
              </Text>

              <View style={styles.statFooter}>

                <Ionicons
                  name="checkmark-circle"
                  size={13}
                  color="#2563eb"
                />

                <Text
                  style={[
                    styles.statDetail,
                    {
                      color: '#2563eb',
                    },
                  ]}
                >
                  Evaluaciones realizadas
                </Text>

              </View>

            </View>

            <View
              style={[
                styles.statIconBox,
                styles.blueIcon,
              ]}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={25}
                color="#2563eb"
              />
            </View>

          </View>

          {/* EQUIPOS ASIGNADOS */}

          <View style={styles.statCard}>

            <View style={styles.statTextContainer}>

              <Text style={styles.statTitle}>
                EQUIPOS
              </Text>

              <Text style={styles.statNumber}>
                {asignaciones.length}
              </Text>

              <View style={styles.statFooter}>

                <Ionicons
                  name="people"
                  size={13}
                  color="#059669"
                />

                <Text
                  style={[
                    styles.statDetail,
                    {
                      color: '#059669',
                    },
                  ]}
                >
                  Equipos asignados
                </Text>

              </View>

            </View>

            <View
              style={[
                styles.statIconBox,
                styles.greenIcon,
              ]}
            >
              <Ionicons
                name="people-outline"
                size={25}
                color="#059669"
              />
            </View>

          </View>

        </View>

        {/* =================================================
            EVALUACIONES PENDIENTES
        ================================================= */}

        <View style={styles.pendingCard}>

          <View style={styles.pendingLeft}>

            <View style={styles.pendingIcon}>

              <Ionicons
                name="time-outline"
                size={27}
                color="#f97316"
              />

            </View>

            <View style={styles.pendingInfo}>

              <Text style={styles.pendingTitle}>
                EVALUACIONES PENDIENTES
              </Text>

              <Text style={styles.pendingSubtitle}>
                Equipos que todavía debes evaluar
              </Text>

            </View>

          </View>

          <Text style={styles.pendingNumber}>
            {evaluacionesPendientes}
          </Text>

        </View>

        {/* =================================================
            MIS ASIGNACIONES
        ================================================= */}

        <Text style={styles.subsectionTitle}>
          Acciones
        </Text>

        <TouchableOpacity
          style={styles.assignmentsCard}
          onPress={() =>
            router.push(
              '/(jurado)/asignaciones'
            )
          }
          activeOpacity={0.8}
        >

          <View style={styles.assignmentsIcon}>

            <Ionicons
              name="clipboard-outline"
              size={26}
              color="#2563eb"
            />

          </View>

          <View style={styles.assignmentsInfo}>

            <Text style={styles.assignmentsTitle}>
              Mis asignaciones
            </Text>

            <Text style={styles.assignmentsSubtitle}>
              Consulta los equipos que debes evaluar
            </Text>

          </View>

          <Ionicons
            name="chevron-forward"
            size={24}
            color="#94a3b8"
          />

        </TouchableOpacity>

        {/* =================================================
            INFORMACIÓN
        ================================================= */}

        <View style={styles.infoCard}>

          <View style={styles.infoIcon}>

            <Ionicons
              name="information-circle-outline"
              size={24}
              color="#002b45"
            />

          </View>

          <View style={styles.infoContent}>

            <Text style={styles.infoTitle}>
              Panel del jurado
            </Text>

            <Text style={styles.infoText}>
              Desde este panel puedes consultar
              tus equipos asignados, revisar tus
              evaluaciones pendientes y acceder
              al módulo de evaluación.
            </Text>

          </View>

        </View>

      </ScrollView>

      {/* =================================================
          BARRA INFERIOR
      ================================================= */}

      <View style={styles.bottomBar}>

        {/* INICIO */}

        <TouchableOpacity
          style={styles.bottomTab}
          activeOpacity={0.8}
        >

          <Ionicons
            name="home"
            size={22}
            color="#002b45"
          />

          <Text
            style={[
              styles.tabText,
              styles.activeTabText,
            ]}
          >
            Inicio
          </Text>

        </TouchableOpacity>

        {/* PERFIL */}

        <TouchableOpacity
          style={styles.bottomTab}
          onPress={() =>
            router.push('/(jurado)/perfil')
          }
          activeOpacity={0.8}
        >

          <Ionicons
            name="person-outline"
            size={22}
            color="#666"
          />

          <Text style={styles.tabText}>
            Perfil
          </Text>

        </TouchableOpacity>

      </View>

    </View>
  );
}

// =========================================================
// ESTILOS
// =========================================================

const styles = StyleSheet.create({

  // =======================================================
  // CONTENEDOR
  // =======================================================

  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },

  // =======================================================
  // CARGANDO
  // =======================================================

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  loadingText: {
    marginTop: 10,
    color: '#002b45',
    fontSize: 14,
  },

  // =======================================================
  // HEADER
  // =======================================================

  topHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 20,
    backgroundColor: '#002b45',
  },

  headerText: {
    flex: 1,
    paddingRight: 12,
  },

  panelTitle: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
  },

  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },

  welcomeSubtitle: {
    fontSize: 12,
    color: '#a0b2c6',
    marginTop: 3,
  },

  btnLogout: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff1a',
    borderRadius: 10,
    marginTop: 2,
  },

  // =======================================================
  // SCROLL
  // =======================================================

  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },

  // =======================================================
  // ERROR
  // =======================================================

  errorBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },

  errorText: {
    flex: 1,
    color: '#991b1b',
    fontSize: 13,
    marginLeft: 8,
  },

  // =======================================================
  // SECCIÓN
  // =======================================================

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#002b45',
    marginTop: 18,
    marginBottom: 2,
  },

  sectionSubtitle: {
    fontSize: 11,
    color: '#7b8794',
    marginBottom: 8,
  },

  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e8eef5',
  },

  // =======================================================
  // TARJETAS DE ESTADÍSTICAS
  // =======================================================

  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },

  statCard: {
    width: '48.5%',
    minHeight: 132,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dce5ef',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    elevation: 2,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },

  statTextContainer: {
    flex: 1,
    paddingRight: 5,
  },

  statTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.45,
    color: '#8190a5',
  },

  statNumber: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#002b45',
    marginTop: 5,
    marginBottom: 4,
  },

  statFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  statDetail: {
    fontSize: 9,
    flexShrink: 1,
  },

  statIconBox: {
    width: 44,
    height: 44,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },

  blueIcon: {
    backgroundColor: '#eff6ff',
  },

  greenIcon: {
    backgroundColor: '#ecfdf5',
  },

  // =======================================================
  // PENDIENTES
  // =======================================================

  pendingCard: {
    marginTop: 18,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dce5ef',
    minHeight: 105,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    elevation: 2,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },

  pendingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  pendingIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff7ed',
    justifyContent: 'center',
    alignItems: 'center',
  },

  pendingInfo: {
    flex: 1,
    marginLeft: 12,
  },

  pendingTitle: {
    color: '#334155',
    fontSize: 11,
    fontWeight: '800',
  },

  pendingSubtitle: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 5,
  },

  pendingNumber: {
    color: '#f97316',
    fontSize: 30,
    fontWeight: '800',
    marginLeft: 10,
  },

  // =======================================================
  // ACCIONES
  // =======================================================

  subsectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#002b45',
    marginTop: 20,
    marginBottom: 10,
  },

  assignmentsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#dce5ef',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',

    elevation: 2,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },

  assignmentsIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  assignmentsInfo: {
    flex: 1,
    marginHorizontal: 13,
  },

  assignmentsTitle: {
    color: '#002b45',
    fontSize: 15,
    fontWeight: '800',
  },

  assignmentsSubtitle: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 5,
  },

  // =======================================================
  // INFORMACIÓN
  // =======================================================

  infoCard: {
    marginTop: 18,
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dce5ef',
    flexDirection: 'row',
    alignItems: 'flex-start',

    elevation: 2,

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },

  infoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#e8eef5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#002b45',
    marginBottom: 5,
  },

  infoText: {
    fontSize: 11,
    lineHeight: 17,
    color: '#64748b',
  },

  // =======================================================
  // BARRA INFERIOR
  // =======================================================

  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 65,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    elevation: 8,
  },

  bottomTab: {
    alignItems: 'center',
    minWidth: 70,
  },

  tabText: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },

  activeTabText: {
    color: '#002b45',
    fontWeight: 'bold',
  },

});