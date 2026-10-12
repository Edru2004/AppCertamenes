import { Ionicons } from '@expo/vector-icons';
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

export default function LoginScreen() {
  const router = useRouter();
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);

  const handleLogin = async () => {
    if (!correo.trim() || !contrasena.trim()) {
      Alert.alert('Atención', 'Por favor ingresa correo y contraseña.');
      return;
    }

    try {
      setCargando(true);

      // Enviamos el cuerpo con 'Correo' y 'Contrasena' (ambas con C mayúscula)
      const response = await fetch('http://192.168.1.99:8000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json', // Obliga a Laravel a responder siempre en JSON
        },
        body: JSON.stringify({
          Correo: correo.trim(),
          Contrasena: contrasena.trim(), // Exactamente como lo espera tu AuthController
        }),
      });

      const respuesta = await response.json();

      if (!response.ok) {
        const mensajeError =
          respuesta.message ||
          (respuesta.errors
            ? Object.values(respuesta.errors).flat().join('\n')
            : 'Credenciales inválidas');
        throw new Error(mensajeError);
      }

      // Guardar el token devuelto por Laravel ('access_token')
      if (respuesta.access_token) {
        await AsyncStorage.setItem('userToken', String(respuesta.access_token));
      }

      // Guardar los datos del usuario ('user')
      if (respuesta.user) {
        await AsyncStorage.setItem('userData', JSON.stringify(respuesta.user));
      }

      Alert.alert(
        '¡Bienvenido!',
        `Hola, ${respuesta.user?.Nombre || respuesta.user?.Usuario || 'Usuario'}`
      );

      // Redirige al menú principal (index)
      router.replace('/');
    } catch (error: any) {
      Alert.alert('Error al iniciar sesión', error.message || 'No se pudo conectar al servidor');
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Cabecera / Identidad */}
        <View style={styles.headerSection}>
          <View style={styles.logoCircle}>
            <Ionicons name="trophy" size={42} color="#002b45" />
          </View>
          <Text style={styles.title}>AppCertámenes</Text>
          <Text style={styles.subtitle}>Instituto Tecnológico Superior de San Martín Texmelucan</Text>
        </View>

        {/* Tarjeta del Formulario */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Iniciar Sesión</Text>
          <Text style={styles.cardSubtitle}>Ingresa tus credenciales para acceder al sistema</Text>

          {/* Campo Correo Electrónico */}
          <Text style={styles.label}>Correo Electrónico</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              placeholder="ejemplo@itssmt.edu.mx"
              value={correo}
              onChangeText={setCorreo}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#999"
              style={styles.input}
            />
          </View>

          {/* Campo Contraseña */}
          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              placeholder="••••••••"
              value={contrasena}
              onChangeText={setContrasena}
              secureTextEntry={!mostrarContrasena}
              placeholderTextColor="#999"
              style={styles.input}
            />
            <TouchableOpacity onPress={() => setMostrarContrasena(!mostrarContrasena)}>
              <Ionicons
                name={mostrarContrasena ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          {/* Botón de Iniciar Sesión */}
          <TouchableOpacity
            style={[styles.btnLogin, cargando && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={cargando}
            activeOpacity={0.8}
          >
            {cargando ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Text style={styles.btnLoginText}>Iniciar Sesión</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Pie de página */}
        <Text style={styles.footerText}>
          Comité Organizador de Certámenes • ITSSMT
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#002b45',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 25,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 12,
    color: '#a0b2c6',
    textAlign: 'center',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 22,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#002b45',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
    marginTop: 2,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    paddingHorizontal: 12,
    height: 46,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#333',
    fontSize: 14,
  },
  btnLogin: {
    flexDirection: 'row',
    backgroundColor: '#9eb23b',
    borderRadius: 10,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
    elevation: 2,
  },
  btnDisabled: {
    backgroundColor: '#b5c469',
  },
  btnLoginText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerText: {
    textAlign: 'center',
    color: '#7a92a8',
    fontSize: 11,
    marginTop: 25,
  },
});