import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import { useEffect, useState } from 'react';

import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type Modalidad = 'RALLY' | 'INNOVATEC';

function CustomDrawerContent({ navigation }: any) {
  const router = useRouter();

  const [nombreUsuario, setNombreUsuario] =
    useState('Usuario');

  const [rolUsuario, setRolUsuario] =
    useState('Administrador');

  const [modalidad, setModalidad] =
    useState<Modalidad | null>(null);

  const [nombreCertamen, setNombreCertamen] =
    useState<string | null>(null);

  const [salasAbierto, setSalasAbierto] =
    useState(false);

  /*
   * ==========================================
   * OBTENER NOMBRE COMPLETO
   * ==========================================
   */

  const obtenerNombreCompleto = (usuario: any): string => {
    if (!usuario) {
      return 'Usuario';
    }

    /*
     * Primero buscamos un campo que ya contenga
     * el nombre completo.
     */
    const nombreCompleto =
      usuario.NombreCompleto ||
      usuario.nombreCompleto ||
      usuario.Nombre_completo ||
      usuario.nombre_completo ||
      usuario.fullName ||
      usuario.full_name;

    if (
      nombreCompleto &&
      String(nombreCompleto).trim()
    ) {
      return String(nombreCompleto).trim();
    }

    /*
     * Después intentamos construirlo.
     */

    const nombres =
      usuario.Nombres ||
      usuario.nombres ||
      usuario.Nombre ||
      usuario.nombre ||
      '';

    const apellidoPaterno =
      usuario.ApellidoPaterno ||
      usuario.apellidoPaterno ||
      usuario.Apellido_paterno ||
      usuario.apellido_paterno ||
      usuario.Apellido ||
      usuario.apellido ||
      '';

    const apellidoMaterno =
      usuario.ApellidoMaterno ||
      usuario.apellidoMaterno ||
      usuario.Apellido_materno ||
      usuario.apellido_materno ||
      '';

    const partes = [
      nombres,
      apellidoPaterno,
      apellidoMaterno,
    ]
      .map((valor) => String(valor || '').trim())
      .filter(Boolean);

    if (partes.length > 0) {
      return partes.join(' ');
    }

    /*
     * Últimos posibles campos.
     */

    const usuarioNombre =
      usuario.Usuario ||
      usuario.usuario ||
      usuario.username ||
      usuario.email;

    if (usuarioNombre) {
      return String(usuarioNombre).trim();
    }

    return 'Usuario';
  };

  /*
   * ==========================================
   * CARGAR DATOS
   * ==========================================
   */

  const cargarDatos = async () => {
    try {
      /*
       * ----------------------------------------
       * USUARIO
       * ----------------------------------------
       */

      const datosGuardados =
        await AsyncStorage.getItem('userData');

      const rolGuardado =
        await AsyncStorage.getItem('userRole');

      /*
       * ----------------------------------------
       * MODALIDAD
       * ----------------------------------------
       */

      const modalidadGuardada =
        await AsyncStorage.getItem(
          'modalidadSeleccionada'
        );

      /*
       * ----------------------------------------
       * CERTAMEN SELECCIONADO
       * ----------------------------------------
       */

      const certamenGuardado =
        await AsyncStorage.getItem(
          'nombreCertamenSeleccionado'
        );

      console.log(
        '================================'
      );

      console.log(
        'Modalidad:',
        modalidadGuardada
      );

      console.log(
        'Certamen:',
        certamenGuardado
      );

      console.log(
        '================================'
      );

      /*
       * ========================================
       * MODALIDAD
       * ========================================
       */

      if (
        modalidadGuardada === 'RALLY' ||
        modalidadGuardada === 'INNOVATEC'
      ) {
        setModalidad(
          modalidadGuardada
        );
      } else {
        setModalidad(null);
      }

      /*
       * ========================================
       * CERTAMEN
       * ========================================
       */

      if (
        modalidadGuardada === 'INNOVATEC' &&
        certamenGuardado &&
        certamenGuardado.trim()
      ) {
        setNombreCertamen(
          certamenGuardado.trim()
        );
      } else {
        setNombreCertamen(null);
      }

      /*
       * ========================================
       * DATOS DEL USUARIO
       * ========================================
       */

      if (datosGuardados) {
        try {
          const usuario =
            JSON.parse(datosGuardados);

          console.log(
            'Usuario almacenado:',
            usuario
          );

          /*
           * NOMBRE COMPLETO
           */

          const nombreCompleto =
            obtenerNombreCompleto(
              usuario
            );

          setNombreUsuario(
            nombreCompleto
          );

          /*
           * ROL
           */

          const rol =
            usuario.Rol ||
            usuario.rol ||
            usuario.role ||
            usuario.Tipo_usuario ||
            usuario.tipo_usuario;

          if (rol) {
            setRolUsuario(
              String(rol)
            );
          }
        } catch (error) {
          console.error(
            'Error procesando userData:',
            error
          );
        }
      }

      /*
       * Si existe userRole separado,
       * lo usamos.
       */

      if (rolGuardado) {
        setRolUsuario(
          String(rolGuardado)
        );
      }

    } catch (error) {
      console.error(
        'Error cargando datos del Drawer:',
        error
      );
    }
  };

  /*
   * ==========================================
   * CARGA INICIAL
   * ==========================================
   */

  useEffect(() => {
    cargarDatos();

    /*
     * Cada vez que se abre el Drawer,
     * volvemos a cargar:
     *
     * - nombre
     * - rol
     * - modalidad
     * - certamen
     */

    const unsubscribe =
      navigation.addListener(
        'drawerOpen',
        () => {
          cargarDatos();
        }
      );

    return unsubscribe;
  }, [navigation]);

  /*
   * ==========================================
   * NAVEGACIÓN
   * ==========================================
   */

  const irA = (ruta: string) => {
    navigation.navigate(ruta);
  };

  /*
   * ==========================================
   * CERRAR SESIÓN
   * ==========================================
   */

  const cerrarSesion = () => {
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
              await AsyncStorage.multiRemove([
                'userToken',
                'userData',
                'userRole',
                'modalidadSeleccionada',
                'idCertamenSeleccionado',
                'nombreCertamenSeleccionado',
              ]);

              setModalidad(null);
              setNombreCertamen(null);
              setSalasAbierto(false);

              navigation.closeDrawer();

              navigation
                .getParent()
                ?.navigate('index');

            } catch (error) {
              console.error(
                'Error al cerrar sesión:',
                error
              );
            }
          },
        },
      ]
    );
  };

  /*
   * ==========================================
   * TEXTO SECUNDARIO
   * ==========================================
   *
   * RALLY:
   *    Administrador
   *
   * INNOVATEC:
   *    Nombre del certamen seleccionado
   *
   * Si todavía no hay certamen seleccionado:
   *    INNOVATEC
   */

  const textoSecundario =
    modalidad === 'INNOVATEC'
      ? nombreCertamen || 'INNOVATEC'
      : 'Administrador';

  return (
    <View style={styles.drawerContainer}>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={
          styles.scrollContent
        }
        showsVerticalScrollIndicator={false}
      >

        {/* =====================================
            PERFIL
        ===================================== */}

        <View style={styles.perfil}>

          <View style={styles.avatar}>
            <Ionicons
              name="person"
              size={38}
              color="#002B45"
            />
          </View>

          {/* NOMBRE COMPLETO */}

          <Text
            style={styles.nombre}
            numberOfLines={3}
          >
            {nombreUsuario}
          </Text>

          {/* =================================
              ROL / CERTAMEN
          ================================= */}

          <Text
            style={styles.rol}
            numberOfLines={2}
          >
            {textoSecundario}
          </Text>

          {/* =================================
              MODALIDAD
          ================================= */}

          {modalidad && (
            <View
              style={
                styles.modalidadBadge
              }
            >

              <Ionicons
                name={
                  modalidad === 'INNOVATEC'
                    ? 'bulb-outline'
                    : 'trophy-outline'
                }
                size={15}
                color="#FFFFFF"
              />

              <Text
                style={
                  styles.modalidadTexto
                }
              >
                {modalidad}
              </Text>

            </View>
          )}

        </View>

        {/* =====================================
            SEPARADOR
        ===================================== */}

        <View
          style={styles.separador}
        />

        {/* =====================================
            MENÚ
        ===================================== */}

        <View style={styles.menu}>

          {/* INICIO */}

          <MenuItem
            icon="home-outline"
            label="Inicio"
            onPress={() =>
              irA('index')
            }
          />

          {/* REGISTRAR EVENTO */}

          <MenuItem
            icon="trophy-outline"
            label="Registrar certamen"
            onPress={() =>
              irA('registroEvento')
            }
          />

          {/* CATEGORÍAS */}

          <MenuItem
            icon="folder-outline"
            label="Categorías"
            onPress={() =>
              irA('categorias')
            }
          />

          {/* DESAFÍOS */}

          <MenuItem
            icon="bulb-outline"
            label="Desafíos"
            onPress={() =>
              irA('desafios')
            }
          />

          {/* EQUIPOS */}

          <MenuItem
            icon="people-outline"
            label="Equipos"
            onPress={() =>
              irA('equipos')
            }
          />

          {/* JURADOS */}

          <MenuItem
            icon="people-circle-outline"
            label="Jurados"
            onPress={() =>
              irA('gesJurados')
            }
          />

          {/* =================================
              GESTIONAR SALAS
              SOLO INNOVATEC
          ================================= */}

          {modalidad === 'INNOVATEC' && (
            <>
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.75}
                onPress={() =>
                  setSalasAbierto(
                    !salasAbierto
                  )
                }
              >

                <View style={styles.icono}>

                  <Ionicons
                    name="business-outline"
                    size={24}
                    color="#002B45"
                  />

                </View>

                <Text
                  style={styles.menuTexto}
                >
                  Salas
                </Text>

                <Ionicons
                  name={
                    salasAbierto
                      ? 'chevron-up-outline'
                      : 'chevron-down-outline'
                  }
                  size={22}
                  color="#FFFFFF"
                />

              </TouchableOpacity>

              {/* =================================
                  SUBMENÚ
              ================================= */}

              {salasAbierto && (
                <View
                  style={styles.subMenu}
                >

                  {/* REGISTRO */}

                  <TouchableOpacity
                    style={
                      styles.subMenuItem
                    }
                    activeOpacity={0.75}
                    onPress={() => {

                      setSalasAbierto(
                        false
                      );

                      router.push(
                        '/(admin)/registroSalas'
                      );

                    }}
                  >

                    <View
                      style={
                        styles.subIcono
                      }
                    >

                      <Ionicons
                        name="add-circle-outline"
                        size={21}
                        color="#FFFFFF"
                      />

                    </View>

                    <Text
                      style={
                        styles.subMenuTexto
                      }
                    >
                      Registro de salas
                    </Text>

                  </TouchableOpacity>

                  {/* ASIGNACIÓN JURADOS */}

                  <TouchableOpacity
                    style={
                      styles.subMenuItem
                    }
                    activeOpacity={0.75}
                    onPress={() => {

                      setSalasAbierto(
                        false
                      );

                      router.push(
                        '/(admin)/registroSalas/asignacion-jurados'
                      );

                    }}
                  >

                    <View
                      style={
                        styles.subIcono
                      }
                    >

                      <Ionicons
                        name="people-outline"
                        size={21}
                        color="#FFFFFF"
                      />

                    </View>

                    <Text
                      style={
                        styles.subMenuTexto
                      }
                    >
                      Asignación salas jurados
                    </Text>

                  </TouchableOpacity>

                  {/* ASIGNACIÓN EQUIPOS */}

                  <TouchableOpacity
                    style={
                      styles.subMenuItem
                    }
                    activeOpacity={0.75}
                    onPress={() => {

                      setSalasAbierto(
                        false
                      );

                      router.push(
                        '/(admin)/registroSalas/asignacion-equipos'
                      );

                    }}
                  >

                    <View
                      style={
                        styles.subIcono
                      }
                    >

                      <Ionicons
                        name="people-circle-outline"
                        size={21}
                        color="#FFFFFF"
                      />

                    </View>

                    <Text
                      style={
                        styles.subMenuTexto
                      }
                    >
                      Asignación salas a equipo
                    </Text>

                  </TouchableOpacity>

                </View>
              )}

            </>
          )}

          {/* RÚBRICAS */}

          <MenuItem
            icon="ribbon-outline"
            label="Rúbricas"
            onPress={() =>
              irA('Rubricas')
            }
          />

          {/* USUARIOS */}

          <MenuItem
            icon="person-outline"
            label="Usuarios"
            onPress={() =>
              irA('usuarios')
            }
          />

        </View>

      </ScrollView>

      {/* =====================================
          CERRAR SESIÓN
      ===================================== */}

      <View
        style={
          styles.logoutContainer
        }
      >

        <TouchableOpacity
          style={styles.logoutButton}
          activeOpacity={0.8}
          onPress={cerrarSesion}
        >

          <View
            style={styles.logoutIcon}
          >

            <Ionicons
              name="log-out-outline"
              size={25}
              color="#FFFFFF"
            />

          </View>

          <Text
            style={styles.logoutText}
          >
            Cerrar sesión
          </Text>

        </TouchableOpacity>

      </View>

    </View>
  );
}

/*
 * ==========================================
 * ITEM DEL MENÚ
 * ==========================================
 */

function MenuItem({
  icon,
  label,
  onPress,
}: {
  icon: any;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.menuItem}
      activeOpacity={0.75}
      onPress={onPress}
    >

      <View style={styles.icono}>

        <Ionicons
          name={icon}
          size={24}
          color="#002B45"
        />

      </View>

      <Text
        style={styles.menuTexto}
      >
        {label}
      </Text>

    </TouchableOpacity>
  );
}

/*
 * ==========================================
 * LAYOUT ADMIN
 * ==========================================
 */

export default function AdminLayout() {
  return (
    <Drawer
      drawerContent={(props) => (
        <CustomDrawerContent
          {...props}
        />
      )}

      screenOptions={{
        headerShown: true,

        headerStyle: {
          backgroundColor: '#002B45',
          height: 72,
        },

        headerTintColor: '#FFFFFF',

        headerTitleStyle: {
          color: '#FFFFFF',
          fontSize: 20,
          fontWeight: '700',
        },

        headerTitleAlign: 'left',

        drawerType: 'front',

        drawerStyle: {
          width: 315,
          backgroundColor: '#002B45',
        },

        swipeEnabled: true,
      }}
    >

      {/* INICIO */}

      <Drawer.Screen
        name="index"
        options={{
          title: 'Inicio',
        }}
      />

      {/* SELECCIÓN */}

      <Drawer.Screen
        name="seleccion"
        options={{
          title:
            'Seleccionar modalidad',

          drawerItemStyle: {
            display: 'none',
          },

          headerShown: false,
        }}
      />

      {/* REGISTRAR EVENTO */}

      <Drawer.Screen
        name="registroEvento"
        options={{
          title:
            'Registrar certamen',
        }}
      />

      {/* CATEGORÍAS */}

      <Drawer.Screen
        name="categorias"
        options={{
          title:
            'Categorías',
        }}
      />

      {/* DESAFÍOS */}

      <Drawer.Screen
        name="desafios"
        options={{
          title:
            'Desafíos',
        }}
      />

      {/* EQUIPOS */}

      <Drawer.Screen
        name="equipos"
        options={{
          title:
            'Equipos',
        }}
      />

      {/* JURADOS */}

      <Drawer.Screen
        name="gesJurados"
        options={{
          title:
            'Gestion de jurados',
        }}
      />

      {/* SALAS */}

      <Drawer.Screen
        name="registroSalas"
        options={{
          title:
            'Gestion de salas',
        }}
      />

      {/* RÚBRICAS */}

      <Drawer.Screen
        name="Rubricas"
        options={{
          title:
            'Rúbricas',
        }}
      />

      {/* USUARIOS */}

      <Drawer.Screen
        name="usuarios"
        options={{
          title:
            'Usuarios',
        }}
      />

    </Drawer>
  );
}

/*
 * ==========================================
 * ESTILOS
 * ==========================================
 */

const styles = StyleSheet.create({

  drawerContainer: {
    flex: 1,
    backgroundColor: '#002B45',
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    paddingTop: 35,
    paddingBottom: 20,
  },

  /* PERFIL */

  perfil: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },

  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },

  nombre: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 26,
  },

  rol: {
    color: '#B8CED8',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 5,
    textAlign: 'center',
    lineHeight: 20,
  },

  modalidadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor:
      'rgba(158,178,59,0.25)',
    borderWidth: 1,
    borderColor: '#9EB23B',
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 6,
    marginTop: 12,
  },

  modalidadTexto: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 6,
  },

  /* SEPARADOR */

  separador: {
    height: 1,
    backgroundColor:
      'rgba(255,255,255,0.18)',
    marginHorizontal: 25,
    marginBottom: 18,
  },

  /* MENÚ */

  menu: {
    paddingHorizontal: 15,
  },

  menuItem: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    marginBottom: 8,
    borderRadius: 30,
  },

  icono: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },

  menuTexto: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },

  /* SUBMENÚ */

  subMenu: {
    marginLeft: 20,
    marginTop: -2,
    marginBottom: 8,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor:
      'rgba(255,255,255,0.35)',
  },

  subMenuItem: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingLeft: 8,
    paddingRight: 5,
  },

  subIcono: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor:
      'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },

  subMenuTexto: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },

  /* CERRAR SESIÓN */

  logoutContainer: {
    borderTopWidth: 1,
    borderTopColor:
      'rgba(255,255,255,0.18)',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 28,
  },

  logoutButton: {
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    borderRadius: 30,
  },

  logoutIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },

  logoutText: {
    color: '#FF4B5C',
    fontSize: 17,
    fontWeight: '700',
  },

});