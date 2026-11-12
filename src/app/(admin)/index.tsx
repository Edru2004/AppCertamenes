// @ts-nocheck

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';
import {
  useCallback,
  useEffect,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  getCategCertamenes,
  getDesafios,
  getEquipos,
  getModalidadSeleccionada,
  getSalas,
} from '../../services/api';

type Modalidad = 'RALLY' | 'INNOVATEC';

type Cantidades = {
  categorias: number;
  desafios: number;
  salas: number;
  equipos: number;
};

type TarjetaResumen = {
  titulo: string;
  cantidad: number;
  detalle: string;
  icono: React.ComponentProps<
    typeof Ionicons
  >['name'];
  color: string;
  fondoIcono: string;
};

/* ==============================================
   CONTAR REGISTROS
============================================== */

const contarRegistros = (
  respuesta: any
): number => {

  if (Array.isArray(respuesta)) {
    return respuesta.length;
  }

  if (
    !respuesta ||
    typeof respuesta !== 'object'
  ) {
    return 0;
  }

  const posiblesListas = [
    respuesta.data,
    respuesta.data?.data,
    respuesta.registros,
    respuesta.categorias,
    respuesta.desafios,
    respuesta.salas,
    respuesta.equipos,
  ];

  for (const lista of posiblesListas) {

    if (Array.isArray(lista)) {
      return lista.length;
    }

  }

  return 0;
};

/* ==============================================
   PANTALLA PRINCIPAL
============================================== */

export default function AdminHomeScreen() {

  const router = useRouter();

  const params =
    useLocalSearchParams<{
      tipo?: string;
    }>();

  const [cargando, setCargando] =
    useState(true);

  const [actualizando, setActualizando] =
    useState(false);

  const [usuario, setUsuario] =
    useState<any>(null);

  const [modalidad, setModalidad] =
    useState<Modalidad | null>(null);

  const [cantidades, setCantidades] =
    useState<Cantidades>({
      categorias: 0,
      desafios: 0,
      salas: 0,
      equipos: 0,
    });

  /* ==========================================
     CARGAR CANTIDADES
  ========================================== */

  const cargarCantidades =
    useCallback(async () => {

      setActualizando(true);

      try {

        /*
         * Primero obtenemos la modalidad
         * guardada en AsyncStorage.
         */

        let modalidadActual =
          await getModalidadSeleccionada();

        /*
         * Si todavía no existe,
         * revisamos el parámetro de la ruta.
         */

        if (
          !modalidadActual &&
          params?.tipo
        ) {

          const tipoParametro =
            String(
              params.tipo
            ).toUpperCase();

          if (
            tipoParametro === 'RALLY' ||
            tipoParametro === 'INNOVATEC'
          ) {

            modalidadActual =
              tipoParametro as Modalidad;

            await AsyncStorage.setItem(
              'modalidadSeleccionada',
              modalidadActual
            );

          }

        }

        /*
         * Si no existe modalidad,
         * regresamos a selección.
         */

        if (!modalidadActual) {

          setCargando(false);
          setActualizando(false);

          Alert.alert(
            'Modalidad no seleccionada',

            'No se encontró una modalidad seleccionada. Regresarás a la selección.',

            [
              {
                text: 'OK',

                onPress: () => {

                  router.replace(
                    '/(admin)/seleccion' as any
                  );

                },
              },
            ]
          );

          return;
        }

        setModalidad(
          modalidadActual
        );

        /*
         * CATEGORÍAS
         * DESAFÍOS
         * EQUIPOS
         *
         * Existen en ambas modalidades.
         */

        const consultas: {
          nombre: string;
          peticion: Promise<any>;
        }[] = [

          {
            nombre: 'Categorías',
            peticion:
              getCategCertamenes(),
          },

          {
            nombre: 'Desafíos',
            peticion:
              getDesafios(),
          },

          {
            nombre: 'Equipos',
            peticion:
              getEquipos(),
          },

        ];

        /*
         * SALAS
         *
         * Únicamente INNOVATEC.
         */

        if (
          modalidadActual ===
          'INNOVATEC'
        ) {

          consultas.push({
            nombre: 'Salas',
            peticion: getSalas(),
          });

        }

        /*
         * EJECUTAR PETICIONES
         */

        const resultados =
          await Promise.allSettled(
            consultas.map(
              (consulta) =>
                consulta.peticion
            )
          );

        /*
         * CANTIDADES
         */

        const nuevasCantidades:
          Cantidades = {

            categorias: 0,
            desafios: 0,
            salas: 0,
            equipos: 0,

          };

        const errores: string[] = [];

        /*
         * PROCESAR RESULTADOS
         */

        resultados.forEach(
          (
            resultado,
            index
          ) => {

            const nombre =
              consultas[index].nombre;

            if (
              resultado.status ===
              'fulfilled'
            ) {

              const cantidad =
                contarRegistros(
                  resultado.value
                );

              switch (nombre) {

                case 'Categorías':

                  nuevasCantidades
                    .categorias =
                    cantidad;

                  break;

                case 'Desafíos':

                  nuevasCantidades
                    .desafios =
                    cantidad;

                  break;

                case 'Equipos':

                  nuevasCantidades
                    .equipos =
                    cantidad;

                  break;

                case 'Salas':

                  nuevasCantidades
                    .salas =
                    cantidad;

                  break;

              }

              console.log(
                `${nombre} cargados (${modalidadActual}):`,
                resultado.value
              );

            } else {

              const mensaje =
                resultado.reason?.message ||
                'Error desconocido';

              errores.push(
                `${nombre}: ${mensaje}`
              );

              console.error(
                `Error al consultar ${nombre}:`,
                resultado.reason
              );

            }

          }
        );

        /*
         * RALLY
         *
         * Las salas siempre deben
         * ser 0.
         */

        if (
          modalidadActual ===
          'RALLY'
        ) {

          nuevasCantidades.salas = 0;

        }

        setCantidades(
          nuevasCantidades
        );

        /*
         * MOSTRAR ERRORES
         */

        if (
          errores.length > 0
        ) {

          Alert.alert(
            'Error al cargar algunos registros',
            errores.join('\n\n')
          );

        }

      } catch (error: any) {

        console.error(
          'Error general del panel:',
          error
        );

        Alert.alert(
          'Error del panel',

          error?.message ||
            'No se pudieron cargar los registros.'
        );

      } finally {

        setActualizando(false);
        setCargando(false);

      }

    }, [
      router,
      params?.tipo,
    ]);

  /* ==========================================
     VERIFICAR SESIÓN
  ========================================== */

  useEffect(() => {

    const verificarSesion =
      async () => {

        try {

          const token =
            await AsyncStorage.getItem(
              'userToken'
            );

          const userData =
            await AsyncStorage.getItem(
              'userData'
            );

          if (!token) {

            router.replace(
              '/login'
            );

            return;
          }

          if (userData) {

            setUsuario(
              JSON.parse(
                userData
              )
            );

          }

          await cargarCantidades();

        } catch (error) {

          console.error(
            'Error al verificar la sesión:',
            error
          );

          router.replace(
            '/login'
          );

        }

      };

    verificarSesion();

  }, [
    cargarCantidades,
    router,
  ]);

  /* ==========================================
     CERRAR SESIÓN
  ========================================== */

  const handleCerrarSesion =
    () => {

      Alert.alert(
        'Cerrar sesión',

        '¿Estás seguro de que deseas salir del sistema?',

        [

          {
            text: 'Cancelar',
            style: 'cancel',
          },

          {
            text: 'Cerrar sesión',
            style: 'destructive',

            onPress:
              async () => {

                await AsyncStorage.multiRemove([
                  'userToken',
                  'userData',
                  'userRole',
                  'modalidadSeleccionada',
                  'idCertamenSeleccionado',
                  'nombreCertamenSeleccionado',
                ]);

                router.replace(
                  '/login'
                );

              },

          },

        ]
      );

    };

  /* ==========================================
     CAMBIAR MODALIDAD
  ========================================== */

  const cambiarModalidad =
    () => {

      Alert.alert(
        'Cambiar modalidad',

        `Actualmente estás en ${modalidad}. ¿Deseas regresar a la selección de modalidad?`,

        [

          {
            text: 'Cancelar',
            style: 'cancel',
          },

          {
            text: 'Cambiar',

            onPress:
              async () => {

                await AsyncStorage.multiRemove([
                  'modalidadSeleccionada',
                  'idCertamenSeleccionado',
                  'nombreCertamenSeleccionado',
                ]);

                router.replace(
                  '/(admin)/seleccion' as any
                );

              },

          },

        ]
      );

    };

  /* ==========================================
     TARJETAS
  ========================================== */

  const tarjetas:
    TarjetaResumen[] = [

    {
      titulo: 'CATEGORÍAS',

      cantidad:
        cantidades.categorias,

      detalle:
        'Registradas en el sistema',

      icono:
        'shapes-outline',

      color:
        '#2563eb',

      fondoIcono:
        '#eff6ff',
    },

    {
      titulo: 'DESAFÍOS',

      cantidad:
        cantidades.desafios,

      detalle:
        'Desafíos registrados',

      icono:
        'flame-outline',

      color:
        '#d97706',

      fondoIcono:
        '#fffbeb',
    },

    /*
     * SALAS SOLO INNOVATEC
     */

    ...(modalidad ===
      'INNOVATEC'

      ? [

          {
            titulo:
              'SALAS',

            cantidad:
              cantidades.salas,

            detalle:
              'Salas registradas',

            icono:
              'business-outline',

            color:
              '#0284c7',

            fondoIcono:
              '#f0f9ff',

          } as TarjetaResumen,

        ]

      : []),

    {
      titulo:
        'EQUIPOS',

      cantidad:
        cantidades.equipos,

      detalle:
        'Equipos registrados',

      icono:
        'people-outline',

      color:
        '#059669',

      fondoIcono:
        '#ecfdf5',
    },

  ];

  /* ==========================================
     LOADING
  ========================================== */

  if (cargando) {

    return (

      <View
        style={
          styles.loadingContainer
        }
      >

        <ActivityIndicator
          size="large"
          color="#002b45"
        />

        <Text
          style={
            styles.loadingText
          }
        >
          Cargando panel de
          administración...
        </Text>

      </View>

    );

  }

  /* ==========================================
     PANEL PRINCIPAL
  ========================================== */

  return (

    <View
      style={styles.container}
    >

      {/*
        IMPORTANTE:

        NO ponemos aquí otro botón
        menu-outline.

        El botón ☰ lo genera
        automáticamente el Drawer
        de _layout.tsx.
      */}

      {/* ======================================
          ENCABEZADO DEL PANEL
      ====================================== */}

      <View
        style={styles.topHeader}
      >

        <View
          style={styles.headerText}
        >

          <Text
            style={
              styles.panelTitle
            }
          >
            Panel del Administrador
          </Text>

          <Text
            style={
              styles.welcomeTitle
            }
          >
            ¡Hola,{' '}

            {usuario?.Nombre ||
              usuario?.Nom ||
              usuario?.name ||
              'Usuario'}

            !
          </Text>

          <Text
            style={
              styles.welcomeSubtitle
            }
          >
            {usuario?.Rol
              ? ` ${usuario.Rol}`
              : 'Administrador'}
          </Text>

          {/* MODALIDAD */}

          {modalidad && (

            <TouchableOpacity
              style={
                styles.modalidadBadge
              }

              onPress={
                cambiarModalidad
              }

              activeOpacity={0.8}
            >

              <Ionicons
                name={
                  modalidad ===
                  'RALLY'

                    ? 'flag-outline'
                    : 'bulb-outline'
                }

                size={14}

                color="#fff"
              />

              <Text
                style={
                  styles.modalidadText
                }
              >
                {modalidad}
              </Text>

              <Ionicons
                name="chevron-down-outline"
                size={13}
                color="#fff"
              />

            </TouchableOpacity>

          )}

        </View>

        {/* CERRAR SESIÓN */}

        <TouchableOpacity
          style={
            styles.btnLogout
          }

          onPress={
            handleCerrarSesion
          }

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

      {/* ======================================
          CONTENIDO
      ====================================== */}

      <ScrollView
        showsVerticalScrollIndicator={
          false
        }

        contentContainerStyle={
          styles.scrollContent
        }

        keyboardShouldPersistTaps="handled"
      >

        {/* ==================================
            TÍTULO
        ================================== */}

        <View
          style={
            styles.sectionHeader
          }
        >

          <View>

            <Text
              style={
                styles.sectionTitle
              }
            >
              Resumen de registros
            </Text>

            <Text
              style={
                styles.modalidadDescripcion
              }
            >
              Datos de {modalidad}
            </Text>

          </View>

          {/* ACTUALIZAR */}

          <TouchableOpacity
            onPress={
              cargarCantidades
            }

            disabled={
              actualizando
            }

            style={
              styles.refreshButton
            }

            accessibilityLabel="Actualizar cantidades"

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

        {/* ==================================
            TARJETAS
        ================================== */}

        <View
          style={
            styles.statsGrid
          }
        >

          {tarjetas.map(
            (tarjeta) => (

              <View
                key={
                  tarjeta.titulo
                }

                style={
                  styles.statCard
                }
              >

                <View
                  style={
                    styles.statTextContainer
                  }
                >

                  <Text
                    style={
                      styles.statTitle
                    }
                  >
                    {tarjeta.titulo}
                  </Text>

                  <Text
                    style={
                      styles.statNumber
                    }
                  >
                    {tarjeta.cantidad}
                  </Text>

                  <View
                    style={
                      styles.statFooter
                    }
                  >

                    <Ionicons
                      name="checkmark-circle"
                      size={13}
                      color={
                        tarjeta.color
                      }
                    />

                    <Text
                      style={[
                        styles.statDetail,
                        {
                          color:
                            tarjeta.color,
                        },
                      ]}
                    >
                      {
                        tarjeta.detalle
                      }
                    </Text>

                  </View>

                </View>

                {/* ICONO */}

                <View
                  style={[
                    styles.statIconBox,
                    {
                      backgroundColor:
                        tarjeta.fondoIcono,
                    },
                  ]}
                >

                  <Ionicons
                    name={
                      tarjeta.icono
                    }
                    size={25}
                    color={
                      tarjeta.color
                    }
                  />

                </View>

              </View>

            )
          )}

        </View>

        {/* ==================================
            INFORMACIÓN DE MODALIDAD
        ================================== */}

        <View
          style={
            styles.infoCard
          }
        >

          <View
            style={
              styles.infoIcon
            }
          >

            <Ionicons
              name={
                modalidad ===
                'RALLY'

                  ? 'flag-outline'
                  : 'bulb-outline'
              }

              size={24}

              color="#002b45"
            />

          </View>

          <View
            style={
              styles.infoContent
            }
          >

            <Text
              style={
                styles.infoTitle
              }
            >
              Modalidad {modalidad}
            </Text>

            {modalidad ===
            'RALLY' ? (

              <Text
                style={
                  styles.infoText
                }
              >
                Este panel está mostrando
                únicamente información
                correspondiente al Rally.

                {'\n\n'}

                Las salas no aplican en
                esta modalidad.
              </Text>

            ) : (

              <Text
                style={
                  styles.infoText
                }
              >
                Este panel está mostrando
                únicamente información
                correspondiente a InnovaTec.

                {'\n\n'}

                Las salas están habilitadas
                para esta modalidad.
              </Text>

            )}

          </View>

        </View>

      </ScrollView>

      {/* ======================================
          BARRA INFERIOR
      ====================================== */}

      <View
        style={
          styles.bottomBar
        }
      >

        {/* INICIO */}

        <TouchableOpacity
          style={
            styles.bottomTab
          }

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
          style={
            styles.bottomTab
          }

          onPress={() =>
            console.log(
              'Perfil seleccionado'
            )
          }

          activeOpacity={0.8}
        >

          <Ionicons
            name="person-outline"
            size={22}
            color="#666"
          />

          <Text
            style={
              styles.tabText
            }
          >
            Perfil
          </Text>

        </TouchableOpacity>

      </View>

    </View>

  );
}

/* ==============================================
   ESTILOS
============================================== */

const styles =
  StyleSheet.create({

    container: {
      flex: 1,
      backgroundColor:
        '#f5f7fa',
    },

    loadingContainer: {
      flex: 1,
      justifyContent:
        'center',
      alignItems:
        'center',
      backgroundColor:
        '#fff',
    },

    loadingText: {
      marginTop: 10,
      color: '#002b45',
      fontSize: 14,
    },

    /* ========================================
       HEADER
    ======================================== */

    topHeader: {
      flexDirection:
        'row',

      alignItems:
        'flex-start',

      paddingTop: 18,

      paddingHorizontal: 18,

      paddingBottom: 20,

      backgroundColor:
        '#002b45',
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

    modalidadBadge: {
      alignSelf:
        'flex-start',

      flexDirection:
        'row',

      alignItems:
        'center',

      gap: 5,

      marginTop: 10,

      paddingHorizontal: 10,

      paddingVertical: 6,

      borderRadius: 20,

      backgroundColor:
        '#ffffff26',

      borderWidth: 1,

      borderColor:
        '#ffffff40',
    },

    modalidadText: {
      color: '#fff',
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.5,
    },

    btnLogout: {
      width: 42,
      height: 42,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#ffffff1a',

      borderRadius: 10,

      marginTop: 2,
    },

    /* ========================================
       SCROLL
    ======================================== */

    scrollContent: {
      padding: 16,
      paddingBottom: 100,
    },

    sectionHeader: {
      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

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

    modalidadDescripcion: {
      fontSize: 11,
      color: '#7b8794',
      marginBottom: 8,
    },

    refreshButton: {
      width: 36,
      height: 36,
      borderRadius: 10,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#e8eef5',
    },

    /* ========================================
       TARJETAS
    ======================================== */

    statsGrid: {
      flexDirection:
        'row',

      flexWrap:
        'wrap',

      justifyContent:
        'space-between',

      rowGap: 14,
    },

    statCard: {
      width: '48.5%',
      minHeight: 132,

      backgroundColor:
        '#fff',

      borderWidth: 1,

      borderColor:
        '#dce5ef',

      borderRadius: 16,

      padding: 14,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',

      elevation: 2,

      shadowColor:
        '#000',

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
      flexDirection:
        'row',

      alignItems:
        'center',

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

      alignItems:
        'center',

      justifyContent:
        'center',
    },

    /* ========================================
       INFORMACIÓN
    ======================================== */

    infoCard: {
      marginTop: 18,

      padding: 16,

      borderRadius: 16,

      backgroundColor:
        '#fff',

      borderWidth: 1,

      borderColor:
        '#dce5ef',

      flexDirection:
        'row',

      alignItems:
        'flex-start',
    },

    infoIcon: {
      width: 44,
      height: 44,

      borderRadius: 12,

      backgroundColor:
        '#e8eef5',

      justifyContent:
        'center',

      alignItems:
        'center',

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

    /* ========================================
       BARRA INFERIOR
    ======================================== */

    bottomBar: {
      position:
        'absolute',

      bottom: 0,

      left: 0,

      right: 0,

      height: 65,

      backgroundColor:
        '#fff',

      flexDirection:
        'row',

      justifyContent:
        'space-around',

      alignItems:
        'center',

      borderTopWidth: 1,

      borderTopColor:
        '#e2e8f0',

      elevation: 8,
    },

    bottomTab: {
      alignItems:
        'center',

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