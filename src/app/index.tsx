// src/app/index.tsx
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