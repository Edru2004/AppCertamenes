import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function RootIndex() {
  const router = useRouter();

  useEffect(() => {
    const validarSesion = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const rol = await AsyncStorage.getItem('userRole');
        const modalidad = await AsyncStorage.getItem(
          'modalidadSeleccionada'
        );

        // No hay sesión
        if (!token || !rol) {
          router.replace('/login');
          return;
        }

        const rolLimpio = String(rol)
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .toLowerCase()
          .trim();

        // ADMINISTRADOR
        if (
          rolLimpio === 'admin' ||
          rolLimpio === 'administrador' ||
          rolLimpio.includes('administrador')
        ) {
          // Si todavía no ha elegido modalidad,
          // primero debe ir a la pantalla de selección.
          if (
            modalidad !== 'RALLY' &&
            modalidad !== 'INNOVATEC'
          ) {
            router.replace('/(admin)/seleccion' as any);
            return;
          }

          // Ya tiene modalidad seleccionada
          router.replace('/(admin)' as any);
          return;
        }

        // LÍDER
        if (rolLimpio.includes('lider')) {
          router.replace('/(lider)' as any);
          return;
        }

        // Cualquier otro rol
        router.replace('/login');
      } catch (error) {
        console.error('Error al validar la sesión:', error);
        router.replace('/login');
      }
    };

    validarSesion();
  }, [router]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#002b45',
      }}
    >
      <ActivityIndicator size="large" color="#9eb23b" />
    </View>
  );
}