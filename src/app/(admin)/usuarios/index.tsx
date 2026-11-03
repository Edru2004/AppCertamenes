
import {
  eliminarUsuarioAdmin,
  getUsuariosCatalogo,
} from '@/services/api';

import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type Usuario = {
  Id_usuario: number;
  Usuario: string;
  Nombre: string;
  Nom?: string | null;
  App?: string | null;
  Apm?: string | null;
  Correo: string;
  Carrera?: string | null;
  Rol: string;
  Foto?: string | null;
};

const extraerLista = (respuesta: any): Usuario[] => {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.data)) return respuesta.data;
  if (Array.isArray(respuesta?.usuarios)) return respuesta.usuarios;
  return [];
};

const nombreCompleto = (usuario: Usuario) =>
  [
    usuario.Nombre,
    usuario.Nom,
    usuario.App,
    usuario.Apm,
  ]
    .filter(Boolean)
    .join(' ');

const colorRol = (rol: string) => {
  const valor = rol.toLowerCase();

  if (valor === 'administrador' || valor === 'admin') {
    return {
      fondo: '#EDE9FE',
      texto: '#6D28D9',
    };
  }

  if (valor === 'jurado') {
    return {
      fondo: '#DBEAFE',
      texto: '#1D4ED8',
    };
  }

  return {
    fondo: '#DCFCE7',
    texto: '#15803D',
  };
};

export default function UsuariosIndex() {
  const router = useRouter();

  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);

  const cargarUsuarios = useCallback(async () => {
    try {
      const respuesta = await getUsuariosCatalogo();
      setUsuarios(extraerLista(respuesta));
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.message || 'No se pudieron cargar los usuarios.'
      );
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      cargarUsuarios();
    }, [cargarUsuarios])
  );

  const usuariosFiltrados = usuarios.filter((usuario) => {
    const texto = busqueda.toLowerCase().trim();

    if (!texto) return true;

    return [
      usuario.Usuario,
      nombreCompleto(usuario),
      usuario.Correo,
      usuario.Rol,
      usuario.Carrera,
    ]
      .filter(Boolean)
      .some((dato) =>
        String(dato).toLowerCase().includes(texto)
      );
  });

  const abrirFormulario = (usuario?: Usuario) => {
  if (usuario) {
    router.push({
      pathname: '/(admin)/usuarios/form',
      params: {
        usuario: JSON.stringify(usuario),
      },
    });
  } else {
    router.push('/(admin)/usuarios/form');
  }
};

  const confirmarEliminar = (usuario: Usuario) => {
    Alert.alert(
      'Eliminar usuario',
      `¿Estás seguro de eliminar a ${nombreCompleto(usuario)}?`,
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await eliminarUsuarioAdmin(
                Number(usuario.Id_usuario)
              );

              setUsuarios((actuales) =>
                actuales.filter(
                  (item) =>
                    Number(item.Id_usuario) !==
                    Number(usuario.Id_usuario)
                )
              );

              Alert.alert(
                'Correcto',
                'El usuario fue eliminado.'
              );
            } catch (error: any) {
              Alert.alert(
                'No se pudo eliminar',
                error?.message ||
                  'El usuario puede tener registros relacionados.'
              );
            }
          },
        },
      ]
    );
  };

  const renderUsuario = (item: Usuario) => {
    const color = colorRol(item.Rol);

    return (
      <View
        key={String(item.Id_usuario)}
        style={styles.tarjeta}
      >
        <View style={styles.usuarioEncabezado}>
          <View style={styles.avatar}>
            <Ionicons
              name="person"
              size={27}
              color="#087B8B"
            />
          </View>

          <View style={styles.datosPrincipales}>
            <Text style={styles.nombre}>
              {nombreCompleto(item) || item.Usuario}
            </Text>

            <Text style={styles.nombreUsuario}>
              @{item.Usuario}
            </Text>
          </View>

          <View
            style={[
              styles.etiquetaRol,
              { backgroundColor: color.fondo },
            ]}
          >
            <Text
              style={[
                styles.textoRol,
                { color: color.texto },
              ]}
            >
              {item.Rol}
            </Text>
          </View>
        </View>

        <View style={styles.detalles}>
          <View style={styles.detalleFila}>
            <Ionicons
              name="mail-outline"
              size={17}
              color="#64748B"
            />

            <Text style={styles.detalleTexto}>
              {item.Correo}
            </Text>
          </View>

          <View style={styles.detalleFila}>
            <Ionicons
              name="school-outline"
              size={17}
              color="#64748B"
            />

            <Text style={styles.detalleTexto}>
              {item.Carrera || 'Sin carrera registrada'}
            </Text>
          </View>

          <Text style={styles.idUsuario}>
            ID de usuario: {item.Id_usuario}
          </Text>
        </View>

        <View style={styles.acciones}>
          <TouchableOpacity
            style={styles.botonEditar}
            onPress={() => abrirFormulario(item)}
          >
            <Ionicons
              name="create-outline"
              size={19}
              color="#FFFFFF"
            />

            <Text style={styles.textoBoton}>
              Editar
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.botonEliminar}
            onPress={() => confirmarEliminar(item)}
          >
            <Ionicons
              name="trash-outline"
              size={19}
              color="#DC2626"
            />

            <Text style={styles.textoEliminar}>
              Eliminar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (cargando) {
    return (
      <View style={styles.cargando}>
        <ActivityIndicator
          size="large"
          color="#087B8B"
        />

        <Text style={styles.textoCargando}>
          Cargando usuarios...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.contenedor}
      contentContainerStyle={styles.contenidoScroll}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl
          refreshing={actualizando}
          onRefresh={() => {
            setActualizando(true);
            cargarUsuarios();
          }}
          colors={['#087B8B']}
        />
      }
    >
      {/* ENCABEZADO */}
      <View style={styles.encabezado}>
        <View style={styles.iconoEncabezado}>
          <Ionicons
            name="people-outline"
            size={30}
            color="#FFFFFF"
          />
        </View>

        <Text style={styles.titulo}>
          Gestión de usuarios
        </Text>

        <Text style={styles.subtitulo}>
          Administra las cuentas registradas en el sistema
        </Text>
      </View>

      {/* CONTADOR */}
      <View style={styles.resumen}>
        <View>
          <Text style={styles.resumenEtiqueta}>
            Usuarios registrados
          </Text>

          <Text style={styles.resumenNumero}>
            {usuarios.length}
          </Text>
        </View>

        <Ionicons
          name="people-circle-outline"
          size={43}
          color="#087B8B"
        />
      </View>

      {/* AGREGAR USUARIO */}
      <TouchableOpacity
        style={styles.botonAgregar}
        onPress={() => abrirFormulario()}
      >
        <Ionicons
          name="person-add-outline"
          size={22}
          color="#FFFFFF"
        />

        <Text style={styles.textoAgregar}>
          Agregar nuevo usuario
        </Text>
      </TouchableOpacity>

      {/* BUSCADOR */}
      <View style={styles.busqueda}>
        <Ionicons
          name="search-outline"
          size={21}
          color="#64748B"
        />

        <TextInput
          style={styles.inputBusqueda}
          placeholder="Buscar por nombre, usuario, correo o rol..."
          placeholderTextColor="#94A3B8"
          value={busqueda}
          onChangeText={setBusqueda}
        />

        {busqueda.length > 0 && (
          <TouchableOpacity
            onPress={() => setBusqueda('')}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color="#64748B"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* TÍTULO DE LA LISTA */}
      <View style={styles.tituloLista}>
        <Text style={styles.tituloListaTexto}>
          Usuarios registrados
        </Text>

        <TouchableOpacity
          onPress={() => {
            setActualizando(true);
            cargarUsuarios();
          }}
        >
          <Ionicons
            name="refresh-outline"
            size={25}
            color="#2563EB"
          />
        </TouchableOpacity>
      </View>

      {/* TARJETAS DE USUARIOS */}
      {usuariosFiltrados.length > 0 ? (
        usuariosFiltrados.map(renderUsuario)
      ) : (
        <View style={styles.vacio}>
          <Ionicons
            name="people-outline"
            size={48}
            color="#94A3B8"
          />

          <Text style={styles.vacioTitulo}>
            No hay usuarios
          </Text>

          <Text style={styles.vacioTexto}>
            {busqueda
              ? 'No se encontraron usuarios con esa búsqueda.'
              : 'Todavía no hay usuarios registrados.'}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#F4F7FA',
    paddingHorizontal: 18,
  },

  contenidoScroll: {
    flexGrow: 1,
    paddingBottom: 45,
  },

  encabezado: {
    alignItems: 'center',
    paddingTop: 22,
    paddingBottom: 17,
  },

  iconoEncabezado: {
    width: 62,
    height: 62,
    borderRadius: 20,
    backgroundColor: '#087B8B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },

  titulo: {
    fontSize: 25,
    fontWeight: '800',
    color: '#172033',
    textAlign: 'center',
  },

  subtitulo: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 5,
  },

  resumen: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  resumenEtiqueta: {
    fontSize: 13,
    color: '#64748B',
  },

  resumenNumero: {
    fontSize: 28,
    fontWeight: '800',
    color: '#002B45',
    marginTop: 3,
  },

  botonAgregar: {
    backgroundColor: '#82A323',
    borderRadius: 15,
    minHeight: 55,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 15,
  },

  textoAgregar: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  busqueda: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 49,
  },

  inputBusqueda: {
    flex: 1,
    color: '#172033',
    fontSize: 13,
    paddingVertical: 10,
    marginLeft: 9,
  },

  tituloLista: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },

  tituloListaTexto: {
    fontSize: 19,
    fontWeight: '800',
    color: '#172033',
  },

  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 15,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  usuarioEncabezado: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  avatar: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#DDF4F7',
    alignItems: 'center',
    justifyContent: 'center',
  },

  datosPrincipales: {
    flex: 1,
    minWidth: 0,
    marginLeft: 11,
  },

  nombre: {
    color: '#172033',
    fontSize: 15,
    fontWeight: '800',
  },

  nombreUsuario: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 3,
  },

  etiquetaRol: {
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 9,
    marginLeft: 5,
  },

  textoRol: {
    fontSize: 10,
    fontWeight: '800',
  },

  detalles: {
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginTop: 13,
    paddingTop: 11,
    gap: 8,
  },

  detalleFila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  detalleTexto: {
    flex: 1,
    color: '#475569',
    fontSize: 12,
  },

  idUsuario: {
    color: '#94A3B8',
    fontSize: 11,
    marginTop: 3,
  },

  acciones: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },

  botonEditar: {
    flex: 1,
    backgroundColor: '#087B8B',
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  textoBoton: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },

  botonEliminar: {
    flex: 1,
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },

  textoEliminar: {
    color: '#DC2626',
    fontWeight: '800',
    fontSize: 13,
  },

  vacio: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 30,
    alignItems: 'center',
    marginTop: 8,
  },

  vacioTitulo: {
    fontSize: 17,
    color: '#334155',
    fontWeight: '800',
    marginTop: 12,
  },

  vacioTexto: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },

  cargando: {
    flex: 1,
    backgroundColor: '#F4F7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  textoCargando: {
    color: '#64748B',
    marginTop: 12,
  },
});
