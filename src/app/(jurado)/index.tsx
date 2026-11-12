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

      <ScrollView
        contentContainerStyle={
          styles.scrollContainer
        }
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={actualizando}
            onRefresh={actualizar}
            colors={['#002b45']}
            tintColor="#002b45"
          />
        }
      >

        {/* =================================================
            ENCABEZADO
        ================================================== */}

        <View style={styles.header}>

          <View style={styles.greetingContainer}>

            <Text style={styles.greeting}>
              Hola, {nombreJurado} 👋
            </Text>

            <Text style={styles.role}>
              Jurado
            </Text>

          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={cerrarSesion}
            activeOpacity={0.8}
          >
            <Ionicons
              name="log-out-outline"
              size={19}
              color="#fff"
            />

            <Text style={styles.logoutText}>
              Cerrar sesión
            </Text>
          </TouchableOpacity>

        </View>

        {/* =================================================
            ERROR
        ================================================== */}

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
            TARJETAS DE ESTADÍSTICAS
        ================================================== */}

        <View style={styles.statsRow}>

          {/* -----------------------------------------------
              EVALUACIONES REALIZADAS
          ----------------------------------------------- */}

          <View style={styles.statCard}>

            <View
              style={[
                styles.statIcon,
                styles.blueIcon,
              ]}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={26}
                color="#2563eb"
              />
            </View>

            <Text style={styles.statTitle}>
              EVALUACIONES
            </Text>

            <Text style={styles.statTitle}>
              REALIZADAS
            </Text>

            <Text style={styles.statNumber}>
              {evaluacionesRealizadas}
            </Text>

          </View>

          {/* -----------------------------------------------
              EQUIPOS ASIGNADOS
          ----------------------------------------------- */}

          <View style={styles.statCard}>

            <View
              style={[
                styles.statIcon,
                styles.greenIcon,
              ]}
            >
              <Ionicons
                name="people-outline"
                size={26}
                color="#059669"
              />
            </View>

            <Text style={styles.statTitle}>
              EQUIPOS
            </Text>

            <Text style={styles.statTitle}>
              ASIGNADOS
            </Text>

            <Text style={styles.statNumber}>
              {asignaciones.length}
            </Text>

          </View>

        </View>

        {/* =================================================
            EVALUACIONES PENDIENTES
        ================================================== */}

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
            BOTÓN MIS ASIGNACIONES
        ================================================== */}

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

      </ScrollView>

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
    backgroundColor: '#f5f6fb',
  },

  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 40,
  },

  // =======================================================
  // CARGANDO
  // =======================================================

  loadingContainer: {
    flex: 1,
    backgroundColor: '#f5f6fb',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 25,
  },

  loadingText: {
    marginTop: 12,
    color: '#64748b',
    fontSize: 14,
  },

  // =======================================================
  // ENCABEZADO
  // =======================================================

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },

  greetingContainer: {
    flex: 1,
    paddingRight: 10,
  },

  greeting: {
    color: '#0f172a',
    fontSize: 23,
    fontWeight: '700',
  },

  role: {
    color: '#64748b',
    fontSize: 15,
    marginTop: 5,
  },

  // =======================================================
  // CERRAR SESIÓN
  // =======================================================

  logoutButton: {
    backgroundColor: '#ef4444',
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoutText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 5,
  },

  // =======================================================
  // ERROR
  // =======================================================

  errorBox: {
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
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
  // ESTADÍSTICAS
  // =======================================================

  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },

  statCard: {
    flex: 1,
    minHeight: 155,
    backgroundColor: '#fff',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
  },

  statIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  blueIcon: {
    backgroundColor: '#eff6ff',
  },

  greenIcon: {
    backgroundColor: '#ecfdf5',
  },

  statTitle: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },

  statNumber: {
    color: '#0f172a',
    fontSize: 32,
    fontWeight: '800',
    marginTop: 5,
  },

  // =======================================================
  // PENDIENTES
  // =======================================================

  pendingCard: {
    backgroundColor: '#fff',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 18,
    marginBottom: 16,
    minHeight: 105,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  pendingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  pendingIcon: {
    width: 49,
    height: 49,
    borderRadius: 14,
    backgroundColor: '#fff7ed',
    justifyContent: 'center',
    alignItems: 'center',
  },

  pendingInfo: {
    flex: 1,
    marginLeft: 13,
  },

  pendingTitle: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '800',
  },

  pendingSubtitle: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 5,
  },

  pendingNumber: {
    color: '#f97316',
    fontSize: 32,
    fontWeight: '800',
    marginLeft: 10,
  },

  // =======================================================
  // MIS ASIGNACIONES
  // =======================================================

  assignmentsCard: {
    backgroundColor: '#fff',
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },

  assignmentsIcon: {
    width: 49,
    height: 49,
    borderRadius: 14,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  assignmentsInfo: {
    flex: 1,
    marginHorizontal: 13,
  },

  assignmentsTitle: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
  },

  assignmentsSubtitle: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 5,
  },
});