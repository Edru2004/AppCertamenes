
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { createElement, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SeleccionModalidadScreen() {
  const router = useRouter();
  const [verificando, setVerificando] = useState(true);
  const [nombre, setNombre] = useState('Administrador');

  useEffect(() => {
    const verificarAcceso = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const datosUsuario = await AsyncStorage.getItem('userData');
        const rolGuardado = (await AsyncStorage.getItem('userRole') || '')
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .trim();

        if (!token || !datosUsuario) {
          router.replace('/login' as any);
          return;
        }

        const usuario = JSON.parse(datosUsuario);
        const esAdmin =
          ['admin', 'administrador', 'administrador de sistema',
           'administrador general'].includes(rolGuardado);

        if (!esAdmin) {
          Alert.alert(
            'Acceso denegado',
            'Esta pantalla es exclusiva para administradores.'
          );
          router.replace('/login' as any);
          return;
        }

        setNombre(
          usuario.Nombre ||
          usuario.Usuario ||
          usuario.name ||
          'Administrador'
        );
      } catch (error) {
        console.error('Error verificando el acceso:', error);
        router.replace('/login' as any);
      } finally {
        setVerificando(false);
      }
    };

    verificarAcceso();
  }, [router]);

  const entrar = async (tipo: 'RALLY' | 'INNOVATEC') => {
    // Conservamos la modalidad elegida para usarla en el panel.
    await AsyncStorage.setItem('modalidadSeleccionada', tipo);

    // Por ahora, ambas opciones abren el panel existente.
    // En el siguiente paso filtraremos los registros por modalidad.
    router.replace({
      pathname: '/(admin)',
      params: { tipo },
    } as any);
  };

  if (verificando) {
    return createElement(
      View,
      { style: styles.loading },
      createElement(ActivityIndicator, { size: 'large', color: '#002b45' }),
      createElement(Text, { style: styles.loadingText }, 'Verificando acceso...'),
    );
  }

  return createElement(
    View,
    { style: styles.container },
    createElement(
      View,
      { style: styles.header },
      createElement(
        View,
        { style: styles.logo },
        createElement(Ionicons, { name: 'shield-checkmark', size: 34, color: '#002b45' }),
      ),
      createElement(Text, { style: styles.title }, 'AppCertámenes'),
      createElement(Text, { style: styles.subtitle }, 'Panel de administración · ITSSMT'),
    ),
    createElement(
      View,
      { style: styles.content },
      createElement(Text, { style: styles.welcome }, `¡Bienvenido, ${nombre}!`),
      createElement(Text, { style: styles.heading }, 'Selecciona una modalidad'),
      createElement(Text, { style: styles.description }, 'Elige el sistema que deseas administrar.'),
      createElement(
        TouchableOpacity,
        {
          style: [styles.card, styles.rallyCard],
          activeOpacity: 0.85,
          onPress: () => entrar('RALLY'),
        },
        createElement(
          View,
          { style: [styles.iconBox, styles.rallyIcon] },
          createElement(Ionicons, { name: 'trophy', size: 34, color: '#0369a1' }),
        ),
        createElement(
          View,
          { style: styles.cardText },
          createElement(Text, { style: styles.cardTitle }, 'Rally'),
          createElement(Text, { style: styles.cardDescription }, 'Administración de certámenes Rally.'),
        ),
        createElement(Ionicons, { name: 'chevron-forward', size: 25, color: '#0369a1' }),
      ),
      createElement(
        TouchableOpacity,
        {
          style: [styles.card, styles.innovaCard],
          activeOpacity: 0.85,
          onPress: () => entrar('INNOVATEC'),
        },
        createElement(
          View,
          { style: [styles.iconBox, styles.innovaIcon] },
          createElement(Ionicons, { name: 'bulb', size: 34, color: '#7e22ce' }),
        ),
        createElement(
          View,
          { style: styles.cardText },
          createElement(Text, { style: styles.cardTitle }, 'InnovaTecNM'),
          createElement(Text, { style: styles.cardDescription }, 'Administración de certámenes InnovaTecNM.'),
        ),
        createElement(Ionicons, { name: 'chevron-forward', size: 25, color: '#7e22ce' }),
      ),
    ),
    createElement(Text, { style: styles.footer }, 'Comité Organizador de Certámenes · ITSSMT'),
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f7fa',
  },
  loadingText: {
    marginTop: 12,
    color: '#002b45',
  },
  header: {
    backgroundColor: '#002b45',
    alignItems: 'center',
    paddingTop: 55,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  logo: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#ffffff',
    fontSize: 25,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#c3d3e2',
    fontSize: 12,
    marginTop: 6,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 24,
  },
  welcome: {
    color: '#64748b',
    fontSize: 14,
    marginBottom: 8,
  },
  heading: {
    color: '#002b45',
    fontSize: 24,
    fontWeight: 'bold',
  },
  description: {
    color: '#64748b',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 26,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
  },
  rallyCard: {
    borderColor: '#bfdbfe',
  },
  innovaCard: {
    borderColor: '#e9d5ff',
  },
  iconBox: {
    width: 58,
    height: 58,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rallyIcon: {
    backgroundColor: '#e0f2fe',
  },
  innovaIcon: {
    backgroundColor: '#f3e8ff',
  },
  cardText: {
    flex: 1,
    marginHorizontal: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#002b45',
  },
  cardDescription: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 5,
    lineHeight: 18,
  },
  footer: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: 11,
    paddingHorizontal: 15,
    paddingBottom: 18,
  },
});
