import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type UsuarioSesion = {
  Id_usuario?: number;
  Usuario?: string;
  Nombre?: string;
  App?: string;
  Apm?: string;
  Correo?: string;
  Rol?: string;
};

export default function PersonalApoyoIndex() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);

  useEffect(() => {
    const cargarUsuario = async () => {
      try {
        const data = await AsyncStorage.getItem('userData');
        if (data) {
          setUsuario(JSON.parse(data));
        }
      } catch (error) {
        console.error('Error al cargar datos del usuario:', error);
      }
    };

    cargarUsuario();
  }, []);

  const nombreCompleto = usuario
    ? [usuario.Nombre, usuario.App, usuario.Apm].filter(Boolean).join(' ') ||
      usuario.Usuario ||
      'Personal de Apoyo'
    : 'Personal de Apoyo';

  const cerrarSesion = async () => {
    try {
      await AsyncStorage.multiRemove([
        'userToken',
        'userData',
        'userRole',
      ]);

      if (router.canDismiss()) {
        router.dismissAll();
      }

      router.replace('/' as any);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      Alert.alert('Error', 'No se pudo cerrar la sesión.');
    }
  };

  return (
    <View style={styles.contenedor}>
      {/* ENCABEZADO */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.badgeRol}>
            <Ionicons name="shield-checkmark-outline" size={14} color="#FFFFFF" />
            <Text style={styles.badgeRolTexto}>Personal de Apoyo</Text>
          </View>
        </View>

        <Text style={styles.saludo}>Hola,</Text>
        <Text style={styles.nombreUsuario} numberOfLines={1}>
          {nombreCompleto}
        </Text>
        {usuario?.Correo ? (
          <Text style={styles.correoUsuario}>{usuario.Correo}</Text>
        ) : null}
      </View>

      {/* CONTENIDO PRINCIPAL */}
      <ScrollView
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.tituloSeccion}>Acciones rápidas</Text>

        {/* TARJETA 1: CONTROL DE SALAS */}
        <TouchableOpacity
          style={styles.cardAccion}
          activeOpacity={0.85}
          onPress={() =>
            Alert.alert(
              'Control de Salas',
              'Módulo listo para conectar con la vista de salas asignadas.'
            )
          }
        >
          <View style={[styles.iconoCard, { backgroundColor: '#E0F2FE' }]}>
            <Ionicons name="business-outline" size={26} color="#087B8B" />
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.tituloCard}>Salas y Ubicaciones</Text>
            <Text style={styles.descripcionCard}>
              Consulta la asignación de salas y horarios de exposición
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>

        {/* TARJETA 2: ASISTENCIA DE EQUIPOS */}
        <TouchableOpacity
          style={styles.cardAccion}
          activeOpacity={0.85}
          onPress={() =>
            Alert.alert(
              'Asistencia de Equipos',
              'Módulo listo para registrar llegada y validación de equipos.'
            )
          }
        >
          <View style={[styles.iconoCard, { backgroundColor: '#ECFCCB' }]}>
            <Ionicons name="checkmark-done-circle-outline" size={26} color="#65A30D" />
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.tituloCard}>Registro de Asistencia</Text>
            <Text style={styles.descripcionCard}>
              Verifica la presencia de equipos y jurados en sala
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>

        {/* TARJETA 3: LOGÍSTICA E INCIDENCIAS */}
        <TouchableOpacity
          style={styles.cardAccion}
          activeOpacity={0.85}
          onPress={() =>
            Alert.alert(
              'Apoyo Logístico',
              'Módulo listo para reportar requerimientos técnicos o de sala.'
            )
          }
        >
          <View style={[styles.iconoCard, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="construct-outline" size={26} color="#D97706" />
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.tituloCard}>Soporte y Logística</Text>
            <Text style={styles.descripcionCard}>
              Gestiona requerimientos técnicos durante el certamen
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#94A3B8" />
        </TouchableOpacity>

        {/* BOTÓN CERRAR SESIÓN */}
        <TouchableOpacity
          style={styles.botonCerrarSesion}
          onPress={cerrarSesion}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
          <Text style={styles.textoCerrarSesion}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    flex: 1,
    backgroundColor: '#F4F7FA',
  },
  header: {
    backgroundColor: '#002B45',
    paddingTop: 54,
    paddingHorizontal: 20,
    paddingBottom: 26,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badgeRol: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#087B8B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  badgeRolTexto: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  saludo: {
    color: '#A0B2C6',
    fontSize: 14,
    fontWeight: '600',
  },
  nombreUsuario: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 2,
  },
  correoUsuario: {
    color: '#CBD5E1',
    fontSize: 12,
    marginTop: 4,
  },
  contenido: {
    padding: 18,
    paddingBottom: 40,
  },
  tituloSeccion: {
    color: '#002B45',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 14,
  },
  cardAccion: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  iconoCard: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    flex: 1,
  },
  tituloCard: {
    color: '#172033',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 3,
  },
  descripcionCard: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
  },
  botonCerrarSesion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DC2626',
    minHeight: 50,
    borderRadius: 13,
    gap: 8,
    marginTop: 20,
  },
  textoCerrarSesion: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});