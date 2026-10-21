// src/app/index.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function RootIndex() {
  const router = useRouter();

  // Cantidades de ejemplo. Sustituye estos valores por los conteos de tu API/base de datos.
  const resumen = [
    {
      titulo: 'Categorías',
      cantidad: 11,
      icono: 'shapes-outline' as const,
      color: '#164E83',
      fondo: '#EDF4FF',
      detalle: 'Registradas',
    },
    {
      titulo: 'Desafíos',
      cantidad: 8,
      icono: 'flame-outline' as const,
      color: '#E97818',
      fondo: '#FFF1E7',
      detalle: 'Retos registrados',
    },
    {
      titulo: 'Salas',
      cantidad: 6,
      icono: 'business-outline' as const,
      color: '#0284C7',
      fondo: '#E7F5FF',
      detalle: 'Espacios registrados',
    },
    {
      titulo: 'Equipos',
      cantidad: 24,
      icono: 'people-outline' as const,
      color: '#65A30D',
      fondo: '#F1F7E5',
      detalle: 'Equipos registrados',
    },
  ];

  useEffect(() => {
    const validarSesion = async () => {
      try {
        const token = await AsyncStorage.getItem('userToken');
        const rol = await AsyncStorage.getItem('userRole');

        if (!token || !rol) {
          router.replace('/login');
          return;
        }

        const rolLimpio = String(rol).toLowerCase().trim();

        if (rolLimpio.includes('admin')) {
          router.replace('/(admin)' as any);
        } else if (rolLimpio.includes('lider')) {
          router.replace('/(lider)' as any);
        } else {
          router.replace('/login');
        }
      } catch (e) {
        router.replace('/login');
      }
    };

    validarSesion();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#002b45' }}>
      <ActivityIndicator size="large" color="#9eb23b" />
    </View>
  );
}
