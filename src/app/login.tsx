
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useState } from 'react';
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

import { loginUsuario } from '../services/api';
export default function LoginScreen() {
  const router = useRouter();

  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [cargando, setCargando] = useState(false);

  const normalizarRol = (rol: unknown): string =>
    String(rol ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ');

  const iniciarSesion = async () => {
    if (!correo.trim() || !contrasena) {
      Alert.alert(
        'Campos incompletos',
        'Ingresa tu correo y contraseña para continuar.'
      );
      return;
    }

    if (cargando) return;

    setCargando(true);

    try {
      // La conexión se realiza desde services/api.ts.
      const datos = await loginUsuario(
        correo.trim(),
        contrasena
      );

      if (!datos.access_token || !datos.user) {
        throw new Error(
          'La respuesta de la API no contiene el token o los datos del usuario.'
        );
      }

      const usuario = datos.user;
      const rol = normalizarRol(usuario.Rol);

      const esAdministrador =
        rol === 'admin' || rol === 'administrador';

      const esLider =
        rol === 'lider' ||
        rol === 'lider de equipo' ||
        rol === 'lider de equipos' ||
        rol === 'jefe de equipo';

      if (!esAdministrador && !esLider) {
        Alert.alert(
          'Rol no reconocido',
          `El rol "${usuario.Rol ?? 'sin rol'}" no tiene un panel configurado.`
        );
        return;
      }

      // Guardar los datos de sesión.
      await AsyncStorage.multiSet([
        ['userToken', String(datos.access_token)],
        ['userData', JSON.stringify(usuario)],
        ['userRole', rol],
      ]);

      // Redirigir según el rol.
      if (esAdministrador) {
        router.replace('/');
      } else {
        router.replace('/liderDashboard' as any);
      }
    } catch (error) {
      const mensaje =
        error instanceof Error
          ? error.message
          : 'No fue posible iniciar sesión. Intenta nuevamente.';

      Alert.alert(
        'Error al iniciar sesión',
        mensaje.includes('Network request failed')
          ? 'No se pudo conectar con el servidor. Verifica que la IP configurada sea correcta, que tu dispositivo esté en la misma red Wi-Fi que tu laptop y que Laravel esté funcionando.'
          : mensaje
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.contenedor}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.encabezado}>
          <View style={styles.logo}>
            <Text style={styles.logoTexto}>CT</Text>
          </View>

          <Text style={styles.titulo}>CertamenesTec</Text>

          <Text style={styles.subtitulo}>
            Instituto Tecnologico de San Martin texmelucan Puebla
          </Text>
        </View>

        <View style={styles.tarjeta}>
          <Text style={styles.tituloFormulario}>
            Iniciar sesión
          </Text>

          <Text style={styles.descripcion}>
            Ingresa tus datos para acceder a tu cuenta.
          </Text>

          <Text style={styles.etiqueta}>
            Correo electrónico
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Ingresa tu correo"
            placeholderTextColor="#999"
            value={correo}
            onChangeText={setCorreo}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!cargando}
            returnKeyType="next"
          />

          <Text style={styles.etiqueta}>
            Contraseña
          </Text>

          <View style={styles.contenedorContrasena}>
            <TextInput
              style={styles.inputContrasena}
              placeholder="Ingresa tu contraseña"
              placeholderTextColor="#999"
              value={contrasena}
              onChangeText={setContrasena}
              secureTextEntry={!mostrarContrasena}
              autoCapitalize="none"
              autoCorrect={false}
              editable={!cargando}
              returnKeyType="done"
              onSubmitEditing={iniciarSesion}
            />

            <TouchableOpacity
              onPress={() =>
                setMostrarContrasena(!mostrarContrasena)
              }
              disabled={cargando}
              style={styles.botonMostrar}
            >
              <Text style={styles.textoMostrar}>
                {mostrarContrasena ? 'Ocultar' : 'Ver'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.botonIngresar,
              cargando && styles.botonDeshabilitado,
            ]}
            onPress={iniciarSesion}
            disabled={cargando}
            activeOpacity={0.8}
          >
            {cargando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.textoBoton}>
                Ingresar
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.textoAyuda}>
            Si tienes problemas para ingresar, contacta al administrador.
          </Text>
        </View>

        <Text style={styles.pie}>
          CertamenesTec · Gestión académica
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#002b45',
  },
  contenido: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 35,
  },
  encabezado: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logo: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: '#6C993E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  logoTexto: {
    color: '#000000',
    fontSize: 28,
    fontWeight: 'bold',
  },
  titulo: {
    fontSize: 27,
    fontWeight: 'bold',
    color: '#eff3f0',
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 14,
    color: '#edf6ef',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 21,
  },
  tarjeta: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  tituloFormulario: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#263629',
  },
  descripcion: {
    fontSize: 14,
    color: '#737B74',
    marginTop: 8,
    marginBottom: 25,
    lineHeight: 20,
  },
  etiqueta: {
    fontSize: 14,
    fontWeight: '600',
    color: '#354438',
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#DCE2DA',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#263629',
    backgroundColor: '#FFFFFF',
    marginBottom: 20,
  },
  contenedorContrasena: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#DCE2DA',
    borderRadius: 10,
    marginBottom: 25,
    paddingRight: 12,
  },
  inputContrasena: {
    flex: 1,
    height: 50,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#263629',
  },
  botonMostrar: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  textoMostrar: {
    color: '#6C993E',
    fontSize: 13,
    fontWeight: '600',
  },
  botonIngresar: {
    height: 52,
    backgroundColor: '#6C993E',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  botonDeshabilitado: {
    opacity: 0.7,
  },
  textoBoton: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  textoAyuda: {
    marginTop: 20,
    fontSize: 12,
    color: '#7A817B',
    textAlign: 'center',
    lineHeight: 18,
  },
  pie: {
    textAlign: 'center',
    marginTop: 25,
    fontSize: 12,
    color: '#7A817B',
  },
});
