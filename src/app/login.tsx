import { useRouter } from 'expo-router'; // Usa useRouter en lugar de navigation
import { useState } from 'react';
import { Alert, Button, TextInput, View } from 'react-native';
import { loginUsuario } from '../services/api';

export default function LoginScreen() {
  const router = useRouter(); // Hook de navegación de Expo Router
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleLogin = async () => {
    if (!correo || !contrasena) {
      Alert.alert('Atención', 'Por favor ingresa correo y contraseña.');
      return;
    }

    try {
      setCargando(true);
      const respuesta = await loginUsuario(correo, contrasena);
      
      Alert.alert('¡Bienvenido!', `Hola, ${respuesta.user.Nombre}`);
      
      // Redirige al menú principal (index) reemplazando el historial
      router.replace('/'); 
    } catch (error: any) {
      Alert.alert('Error al iniciar sesión', error.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <View style={{ padding: 20, flex: 1, justifyContent: 'center' }}>
      <TextInput
        placeholder="Correo electrónico"
        value={correo}
        onChangeText={setCorreo}
        autoCapitalize="none"
        style={{ borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 5 }}
      />
      <TextInput
        placeholder="Contraseña"
        value={contrasena}
        onChangeText={setContrasena}
        secureTextEntry
        style={{ borderWidth: 1, padding: 10, marginBottom: 20, borderRadius: 5 }}
      />
      <Button 
        title={cargando ? "Cargando..." : "Iniciar Sesión"} 
        onPress={handleLogin} 
        disabled={cargando}
      />
    </View>
  );
}