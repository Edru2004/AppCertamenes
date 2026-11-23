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
  KeyboardAvoidingView,
  Platform,
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
};

type CampoFormularioProps = {
  titulo: string;
  valor: string;
  placeholder: string;
  onChangeText: (valor: string) => void;
  teclado?: 'default' | 'email-address';
  seguro?: boolean;
  iconoIzquierdo?: keyof typeof Ionicons.glyphMap;
  iconoDerecho?: React.ReactNode;
  estiloContenedor?: object;
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
};

// ==========================================
// COMPONENTE DE CAMPO
// ==========================================

function CampoFormulario({
  titulo,
  valor,
  placeholder,
  onChangeText,
  teclado = 'default',
  seguro = false,
  iconoIzquierdo,
  iconoDerecho,
  estiloContenedor,
}: CampoFormularioProps) {
  return (
    <View style={[styles.grupoCampo, estiloContenedor]}>
      <Text style={styles.etiqueta}>{titulo}</Text>

      <View style={styles.contenedorInput}>
        {iconoIzquierdo && (
          <Ionicons
            name={iconoIzquierdo}
            size={18}
            color="#64748B"
            style={styles.iconoIzquierdo}
          />
        )}

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

        {iconoDerecho && (
          <View style={styles.iconoDerecho}>
            {iconoDerecho}
          </View>
        )}
      </View>
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
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const esEdicion = idUsuario !== null;

  // ==========================================
  // RECUPERAR DATOS PARA EDITAR
  // ==========================================

  useEffect(() => {
    if (!params.usuario) return;

    try {
      const usuario = JSON.parse(String(params.usuario));

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

  const cambiarCampo = (campo: keyof DatosUsuario, valor: string) => {
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
        'Completa el nombre de usuario, nombre y correo electrónico.'
      );
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.Correo.trim())) {
      Alert.alert(
        'Correo inválido',
        'Escribe una dirección de correo válida.'
      );
      return;
    }

    if (!esEdicion && datos.Contrasena.length < 8) {
      Alert.alert(
        'Contraseña inválida',
        'La contraseña debe tener al menos 8 caracteres.'
      );
      return;
    }

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
    };

    if (datos.Contrasena.trim()) {
      informacion.Contrasena = datos.Contrasena;
    }

    try {
      setGuardando(true);

      if (esEdicion && idUsuario !== null) {
        await actualizarUsuarioAdmin(idUsuario, informacion);

        Alert.alert(
          'Usuario actualizado',
          'Los datos se actualizaron correctamente.',
          [{ text: 'Aceptar', onPress: () => router.back() }]
        );
      } else {
        await crearUsuarioAdmin(informacion);

        Alert.alert(
          'Usuario registrado',
          'El usuario se registró correctamente.',
          [{ text: 'Aceptar', onPress: () => router.back() }]
        );
      }
    } catch (error: any) {
      const erroresApi = error?.errors
        ? Object.values(error.errors).flat().join('\n')
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
    <KeyboardAvoidingView
      style={styles.contenedor}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
      >
        {/* ENCABEZADO */}
        <View style={styles.encabezado}>
          <View style={styles.iconoEncabezado}>
            <Ionicons
              name={esEdicion ? 'person-outline' : 'person-add-outline'}
              size={28}
              color="#FFFFFF"
            />
          </View>

          <Text style={styles.titulo}>
            {esEdicion ? 'Editar Usuario' : 'Nuevo Usuario'}
          </Text>

          <Text style={styles.subtitulo}>
            {esEdicion
              ? 'Actualiza los datos y permisos de la cuenta'
              : 'Completa la información para dar de alta una cuenta'}
          </Text>
        </View>

        {/* TARJETA 1: DATOS PERSONALES */}
        <View style={styles.tarjeta}>
          <View style={styles.encabezadoSeccion}>
            <View style={styles.indicadorSeccion} />
            <Text style={styles.seccion}>Datos Personales</Text>
          </View>

          <CampoFormulario
            titulo="Nombre "
            valor={datos.Nombre}
            onChangeText={(valor) => cambiarCampo('Nombre', valor)}
            placeholder="Ej. Juan"
            iconoIzquierdo="person-outline"
          />

          <CampoFormulario
            titulo="Segundo nombre"
            valor={datos.Nom}
            onChangeText={(valor) => cambiarCampo('Nom', valor)}
            placeholder="Opcional"
            iconoIzquierdo="person-outline"
          />

          <View style={styles.filaDoble}>
            <CampoFormulario
              titulo="Apellido paterno"
              valor={datos.App}
              onChangeText={(valor) => cambiarCampo('App', valor)}
              placeholder="Paterno"
              estiloContenedor={styles.columnaMitad}
            />

            <CampoFormulario
              titulo="Apellido materno"
              valor={datos.Apm}
              onChangeText={(valor) => cambiarCampo('Apm', valor)}
              placeholder="Materno"
              estiloContenedor={styles.columnaMitad}
            />
          </View>

          <CampoFormulario
            titulo="Carrera / Área"
            valor={datos.Carrera}
            onChangeText={(valor) => cambiarCampo('Carrera', valor)}
            placeholder="Ej. Ingeniería en Sistemas"
            iconoIzquierdo="school-outline"
            estiloContenedor={{ marginBottom: 0 }}
          />
        </View>

        {/* TARJETA 2: CREDENCIALES DE ACCESO */}
        <View style={styles.tarjeta}>
          <View style={styles.encabezadoSeccion}>
            <View style={styles.indicadorSeccion} />
            <Text style={styles.seccion}>Credenciales de Acceso</Text>
          </View>

          <CampoFormulario
            titulo="Nombre de usuario *"
            valor={datos.Usuario}
            onChangeText={(valor) => cambiarCampo('Usuario', valor)}
            placeholder="Ej. juan_perez"
            iconoIzquierdo="at-outline"
          />

          <CampoFormulario
            titulo="Correo electrónico *"
            valor={datos.Correo}
            onChangeText={(valor) => cambiarCampo('Correo', valor)}
            placeholder="correo@ejemplo.com"
            teclado="email-address"
            iconoIzquierdo="mail-outline"
          />

          <CampoFormulario
            titulo={
              esEdicion ? 'Nueva contraseña (opcional)' : 'Contraseña *'
            }
            valor={datos.Contrasena}
            onChangeText={(valor) => cambiarCampo('Contrasena', valor)}
            placeholder={
              esEdicion
                ? 'Dejar vacío para conservar la actual'
                : 'Mínimo 8 caracteres'
            }
            seguro={!mostrarContrasena}
            iconoIzquierdo="lock-closed-outline"
            estiloContenedor={{ marginBottom: 0 }}
            iconoDerecho={
              <TouchableOpacity
                onPress={() => setMostrarContrasena(!mostrarContrasena)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={
                    mostrarContrasena ? 'eye-off-outline' : 'eye-outline'
                  }
                  size={20}
                  color="#64748B"
                />
              </TouchableOpacity>
            }
          />
        </View>

        {/* TARJETA 3: ROL Y PERMISOS */}
        <View style={styles.tarjeta}>
          <View style={styles.encabezadoSeccion}>
            <View style={styles.indicadorSeccion} />
            <Text style={styles.seccion}>Rol en el Sistema</Text>
          </View>

          <Text style={styles.etiqueta}>Selecciona el rol *</Text>

          <View style={styles.selector}>
            <Ionicons
              name="shield-checkmark-outline"
              size={18}
              color="#087B8B"
              style={styles.iconoSelector}
            />
            <Picker
              selectedValue={datos.Rol}
              onValueChange={(valor) => cambiarCampo('Rol', String(valor))}
              style={styles.picker}
              dropdownIconColor="#087B8B"
            >
              <Picker.Item label="Administrador" value="Administrador" />
              <Picker.Item label="Jurado" value="Jurado" />
              <Picker.Item label="Líder" value="Lider" />
              <Picker.Item
                label="Personal de Apoyo"
                value="Personal de apoyo"
              />
            </Picker>
          </View>

          <View style={styles.cajaAyuda}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color="#087B8B"
            />
            <Text style={styles.ayuda}>
              Define los módulos y permisos a los que tendrá acceso esta cuenta.
            </Text>
          </View>
        </View>

        {/* BOTONES DE ACCIÓN */}
        <TouchableOpacity
          style={[
            styles.botonGuardar,
            guardando && styles.botonDeshabilitado,
          ]}
          onPress={guardar}
          disabled={guardando}
          activeOpacity={0.85}
        >
          {guardando ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={22}
                color="#FFFFFF"
              />
              <Text style={styles.textoGuardar}>
                {esEdicion ? 'Guardar cambios' : 'Registrar usuario'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.botonCancelar}
          onPress={() => router.back()}
          disabled={guardando}
          activeOpacity={0.7}
        >
          <Text style={styles.textoCancelar}>Cancelar y volver</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ==========================================
// ESTILOS
// ==========================================

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },

  contenido: {
    padding: 18,
    paddingBottom: 45,
    flexGrow: 1,
  },

  encabezado: {
    alignItems: 'center',
    marginBottom: 22,
    paddingTop: 6,
  },

  iconoEncabezado: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#002B45',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#002B45',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  titulo: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },

  subtitulo: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },

  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },

  encabezadoSeccion: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },

  indicadorSeccion: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: '#087B8B',
  },

  seccion: {
    color: '#002B45',
    fontSize: 16,
    fontWeight: '800',
  },

  filaDoble: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },

  columnaMitad: {
    flex: 1,
  },

  grupoCampo: {
    marginBottom: 14,
  },

  etiqueta: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  contenedorInput: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
  },

  iconoIzquierdo: {
    marginRight: 9,
  },

  iconoDerecho: {
    paddingLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },

  input: {
    flex: 1,
    height: 48,
    color: '#0F172A',
    fontSize: 14,
  },

  selector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    paddingLeft: 12,
  },

  iconoSelector: {
    marginRight: 4,
  },

  picker: {
    flex: 1,
    color: '#0F172A',
    height: 50,
  },

  cajaAyuda: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
    gap: 8,
  },

  ayuda: {
    flex: 1,
    color: '#0369A1',
    fontSize: 12,
    lineHeight: 16,
  },

  botonGuardar: {
    backgroundColor: '#82A323',
    minHeight: 54,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    marginTop: 4,
    shadowColor: '#82A323',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
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
    paddingVertical: 14,
    marginTop: 6,
  },

  textoCancelar: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
  },
});