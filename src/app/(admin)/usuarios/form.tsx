import {
  actualizarUsuarioAdmin,
  crearUsuarioAdmin,
} from '@/services/api';

import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

import {
  useLocalSearchParams,
  useRouter,
} from 'expo-router';

import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

// ==========================================
// TIPOS
// ==========================================

type DatosUsuario = {
  Id_usuario?: number;
  Usuario: string;
  Nombre: string;
  Nom: string;
  App: string;
  Apm: string;
  Correo: string;
  Contrasena: string;
  Carrera: string;
  Rol: string;
  Foto: string;
};

type CampoFormularioProps = {
  titulo: string;
  valor: string;
  placeholder: string;
  onChangeText: (valor: string) => void;
  teclado?: 'default' | 'email-address';
  seguro?: boolean;
};

// ==========================================
// FORMULARIO VACÍO
// ==========================================

const formularioVacio: DatosUsuario = {
  Usuario: '',
  Nombre: '',
  Nom: '',
  App: '',
  Apm: '',
  Correo: '',
  Contrasena: '',
  Carrera: '',
  Rol: 'Jurado',
  Foto: '',
};

// ==========================================
// COMPONENTE DE CAMPO
// SE DECLARA FUERA DE USUARIOFORM
// ==========================================

function CampoFormulario({
  titulo,
  valor,
  placeholder,
  onChangeText,
  teclado = 'default',
  seguro = false,
}: CampoFormularioProps) {
  return (
    <View style={styles.grupoCampo}>
      <Text style={styles.etiqueta}>
        {titulo}
      </Text>

      <TextInput
        style={styles.input}
        value={valor}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={teclado}
        secureTextEntry={seguro}
        autoCapitalize={
          teclado === 'email-address' ? 'none' : 'sentences'
        }
        autoCorrect={false}
        blurOnSubmit={false}
      />
    </View>
  );
}

// ==========================================
// PANTALLA DE REGISTRO Y EDICIÓN
// ==========================================

export default function UsuarioForm() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const [datos, setDatos] = useState<DatosUsuario>({
    ...formularioVacio,
  });

  const [idUsuario, setIdUsuario] = useState<number | null>(null);

  const [guardando, setGuardando] = useState(false);

  const esEdicion = idUsuario !== null;

  // ==========================================
  // RECUPERAR DATOS PARA EDITAR
  // ==========================================

  useEffect(() => {
    if (!params.usuario) return;

    try {
      const usuario = JSON.parse(
        String(params.usuario)
      );

      setIdUsuario(Number(usuario.Id_usuario));

      setDatos({
        Id_usuario: Number(usuario.Id_usuario),
        Usuario: usuario.Usuario ?? '',
        Nombre: usuario.Nombre ?? '',
        Nom: usuario.Nom ?? '',
        App: usuario.App ?? '',
        Apm: usuario.Apm ?? '',
        Correo: usuario.Correo ?? '',
        Contrasena: '',
        Carrera: usuario.Carrera ?? '',
        Rol: usuario.Rol ?? 'Jurado',
        Foto: usuario.Foto ?? '',
      });
    } catch {
      Alert.alert(
        'Error',
        'No se pudieron recuperar los datos del usuario.'
      );
    }
  }, [params.usuario]);

  // ==========================================
  // ACTUALIZAR CAMPOS
  // ==========================================

  const cambiarCampo = (
    campo: keyof DatosUsuario,
    valor: string
  ) => {
    setDatos((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  };

  // ==========================================
  // GUARDAR USUARIO
  // ==========================================

  const guardar = async () => {
    if (
      !datos.Usuario.trim() ||
      !datos.Nombre.trim() ||
      !datos.Correo.trim()
    ) {
      Alert.alert(
        'Campos obligatorios',
        'Completa el usuario, nombre y correo electrónico.'
      );
      return;
    }

    // Validar correo electrónico
    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        datos.Correo.trim()
      )
    ) {
      Alert.alert(
        'Correo inválido',
        'Escribe una dirección de correo válida.'
      );
      return;
    }

    // Validar contraseña al registrar
    if (
      !esEdicion &&
      datos.Contrasena.length < 8
    ) {
      Alert.alert(
        'Contraseña inválida',
        'La contraseña debe tener al menos 8 caracteres.'
      );
      return;
    }

    // Validar contraseña al editar
    if (
      esEdicion &&
      datos.Contrasena.length > 0 &&
      datos.Contrasena.length < 8
    ) {
      Alert.alert(
        'Contraseña inválida',
        'La nueva contraseña debe tener al menos 8 caracteres.'
      );
      return;
    }

    const informacion: Record<string, any> = {
      Usuario: datos.Usuario.trim(),
      Nombre: datos.Nombre.trim(),
      Nom: datos.Nom.trim() || null,
      App: datos.App.trim() || null,
      Apm: datos.Apm.trim() || null,
      Correo: datos.Correo.trim(),
      Carrera: datos.Carrera.trim() || null,
      Rol: datos.Rol,
      Foto: datos.Foto.trim() || null,
    };

    if (datos.Contrasena.trim()) {
      informacion.Contrasena = datos.Contrasena;
    }

    try {
      setGuardando(true);

      if (esEdicion && idUsuario !== null) {
        await actualizarUsuarioAdmin(
          idUsuario,
          informacion
        );

        Alert.alert(
          'Usuario actualizado',
          'Los datos se actualizaron correctamente.',
          [
            {
              text: 'Aceptar',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        await crearUsuarioAdmin(informacion);

        Alert.alert(
          'Usuario registrado',
          'El usuario se registró correctamente.',
          [
            {
              text: 'Aceptar',
              onPress: () => router.back(),
            },
          ]
        );
      }
    } catch (error: any) {
      const erroresApi = error?.errors
        ? Object.values(error.errors)
            .flat()
            .join('\n')
        : '';

      Alert.alert(
        'No se pudo guardar',
        erroresApi ||
          error?.message ||
          'Verifica los datos e intenta nuevamente.'
      );
    } finally {
      setGuardando(false);
    }
  };

  // ==========================================
  // INTERFAZ
  // ==========================================

  return (
    <View style={styles.contenedor}>
      <ScrollView
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
      >
        {/* ENCABEZADO */}

        <View style={styles.encabezado}>
          <View style={styles.icono}>
            <Ionicons
              name={
                esEdicion
                  ? 'person-outline'
                  : 'person-add-outline'
              }
              size={30}
              color="#FFFFFF"
            />
          </View>

          <Text style={styles.titulo}>
            {esEdicion
              ? 'Editar usuario'
              : 'Registrar usuario'}
          </Text>

          <Text style={styles.subtitulo}>
            {esEdicion
              ? 'Modifica la información de la cuenta'
              : 'Completa los datos para crear una cuenta'}
          </Text>
        </View>

        {/* INFORMACIÓN DE LA CUENTA */}

        <View style={styles.tarjeta}>
          <Text style={styles.seccion}>
            Información de la cuenta
          </Text>

          <CampoFormulario
            titulo="Nombre de usuario "
            valor={datos.Usuario}
            onChangeText={(valor) =>
              cambiarCampo('Usuario', valor)
            }
            placeholder="Ej. juan_perez"
          />

          <CampoFormulario
            titulo="Nombre *"
            valor={datos.Nombre}
            onChangeText={(valor) =>
              cambiarCampo('Nombre', valor)
            }
            placeholder="Nombre"
          />

          <CampoFormulario
            titulo="Segundo nombre"
            valor={datos.Nom}
            onChangeText={(valor) =>
              cambiarCampo('Nom', valor)
            }
            placeholder="Segundo nombre (opcional)"
          />

          <CampoFormulario
            titulo="Apellido paterno"
            valor={datos.App}
            onChangeText={(valor) =>
              cambiarCampo('App', valor)
            }
            placeholder="Apellido paterno"
          />

          <CampoFormulario
            titulo="Apellido materno"
            valor={datos.Apm}
            onChangeText={(valor) =>
              cambiarCampo('Apm', valor)
            }
            placeholder="Apellido materno"
          />

          <CampoFormulario
            titulo="Correo electrónico *"
            valor={datos.Correo}
            onChangeText={(valor) =>
              cambiarCampo('Correo', valor)
            }
            placeholder="correo@ejemplo.com"
            teclado="email-address"
          />

          <CampoFormulario
            titulo={
              esEdicion
                ? 'Nueva contraseña (opcional)'
                : 'Contraseña *'
            }
            valor={datos.Contrasena}
            onChangeText={(valor) =>
              cambiarCampo('Contrasena', valor)
            }
            placeholder={
              esEdicion
                ? 'Deja vacío para conservar la actual'
                : 'Mínimo 8 caracteres'
            }
            seguro
          />

          <CampoFormulario
            titulo="Carrera"
            valor={datos.Carrera}
            onChangeText={(valor) =>
              cambiarCampo('Carrera', valor)
            }
            placeholder="Ej. Ingeniería en Sistemas"
          />
        </View>

        {/* SELECCIÓN DE ROL */}

        <View style={styles.tarjeta}>
          <Text style={styles.seccion}>
            Rol del usuario
          </Text>

          <Text style={styles.etiqueta}>
            Selecciona el rol *
          </Text>

          <View style={styles.selector}>
            <Picker
              selectedValue={datos.Rol}
              onValueChange={(valor) =>
                cambiarCampo('Rol', String(valor))
              }
              style={styles.picker}
              dropdownIconColor="#087B8B"
            >
              <Picker.Item
                label="Administrador"
                value="Administrador"
              />

              <Picker.Item
                label="Jurado"
                value="Jurado"
              />

              <Picker.Item
                label="Líder"
                value="Lider"
              />
            </Picker>
          </View>

          <Text style={styles.ayuda}>
            El rol determina el tipo de acceso que tendrá la cuenta.
          </Text>
        </View>

        {/* FOTOGRAFÍA */}

        <View style={styles.tarjeta}>
          <Text style={styles.seccion}>
            Fotografía
          </Text>

          <CampoFormulario
            titulo="Ruta o URL de fotografía"
            valor={datos.Foto}
            onChangeText={(valor) =>
              cambiarCampo('Foto', valor)
            }
            placeholder="https://..."
          />

          <Text style={styles.ayuda}>
            Este campo es opcional. Puedes dejarlo vacío.
          </Text>
        </View>

        {/* BOTÓN GUARDAR */}

        <TouchableOpacity
          style={[
            styles.botonGuardar,
            guardando && styles.botonDeshabilitado,
          ]}
          onPress={guardar}
          disabled={guardando}
        >
          {guardando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons
                name="save-outline"
                size={21}
                color="#FFFFFF"
              />

              <Text style={styles.textoGuardar}>
                {esEdicion
                  ? 'Guardar cambios'
                  : 'Registrar usuario'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* BOTÓN CANCELAR */}

        <TouchableOpacity
          style={styles.botonCancelar}
          onPress={() => router.back()}
          disabled={guardando}
        >
          <Text style={styles.textoCancelar}>
            Cancelar
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ==========================================
// ESTILOS
// ==========================================

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#F4F7FA',
  },

  contenido: {
    padding: 18,
    paddingBottom: 45,
    flexGrow: 1,
  },

  encabezado: {
    alignItems: 'center',
    marginBottom: 20,
  },

  icono: {
    width: 60,
    height: 60,
    borderRadius: 19,
    backgroundColor: '#087B8B',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },

  titulo: {
    color: '#172033',
    fontSize: 25,
    fontWeight: '800',
    textAlign: 'center',
  },

  subtitulo: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 5,
    textAlign: 'center',
  },

  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 17,
    padding: 17,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },

  seccion: {
    color: '#002B45',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 16,
  },

  grupoCampo: {
    marginBottom: 14,
  },

  etiqueta: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 7,
  },

  input: {
    height: 49,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    color: '#172033',
    backgroundColor: '#FFFFFF',
    fontSize: 14,
  },

  selector: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },

  picker: {
    color: '#172033',
    height: 52,
  },

  ayuda: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 8,
    lineHeight: 17,
  },

  botonGuardar: {
    backgroundColor: '#82A323',
    minHeight: 54,
    borderRadius: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 5,
  },

  botonDeshabilitado: {
    opacity: 0.6,
  },

  textoGuardar: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  botonCancelar: {
    alignItems: 'center',
    padding: 15,
    marginTop: 5,
  },

  textoCancelar: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
  },
});