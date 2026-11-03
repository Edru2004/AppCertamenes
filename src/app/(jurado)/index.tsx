// @ts-nocheck

import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { File } from 'expo-file-system';
import { useRouter } from 'expo-router';
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

import {
  getMiPerfilJurado,
  guardarMiPerfilJurado,
} from '@/services/api';

// ==========================================
// TIPOS
// ==========================================

type Usuario = {
  Id_usuario?: number;
  Nombre?: string;
  Usuario?: string;
  Correo?: string;
  Rol?: string;
};

type Perfil = {
  Institucion: string;
  Puesto: string;
  Sexo: string;
  Area_participacion: string;
  Area_especializada: string;
  Curriculum: string;
};

type ArchivoPDF = {
  file: File;
  uri: string;
  name: string;
  mimeType: string;
};

const perfilInicial: Perfil = {
  Institucion: '',
  Puesto: '',
  Sexo: '',
  Area_participacion: '',
  Area_especializada: '',
  Curriculum: '',
};

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================

export default function JuradoHomeScreen() {
  const router = useRouter();

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const [perfilCompleto, setPerfilCompleto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);

  const [datos, setDatos] = useState<Perfil>(perfilInicial);

  const [archivoPDF, setArchivoPDF] = useState<ArchivoPDF | null>(null);

  // ==========================================
  // ACTUALIZAR UN CAMPO
  // ==========================================

  const cambiarCampo = (campo: keyof Perfil, valor: string) => {
    setDatos((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  };

  // ==========================================
  // CARGAR USUARIO Y PERFIL
  // ==========================================

  const cargarDatos = async () => {
    try {
      setCargando(true);

      const userData = await AsyncStorage.getItem('userData');

      if (!userData) {
        Alert.alert(
          'Sesión no encontrada',
          'Inicia sesión nuevamente.',
          [
            {
              text: 'Aceptar',
              onPress: () => router.replace('/login'),
            },
          ]
        );
        return;
      }

      const usuarioActual = JSON.parse(userData);
      setUsuario(usuarioActual);

      const respuesta = await getMiPerfilJurado();

      if (respuesta?.completo && respuesta?.perfil) {
        const perfil = respuesta.perfil;

        setDatos({
          Institucion: perfil.Institucion ?? '',
          Puesto: perfil.Puesto ?? '',
          Sexo: perfil.Sexo ?? '',
          Area_participacion: perfil.Area_participacion ?? '',
          Area_especializada: perfil.Area_especializada ?? '',
          Curriculum: perfil.Curriculum ?? '',
        });

        setPerfilCompleto(true);
      } else {
        setDatos(perfilInicial);
        setPerfilCompleto(false);
      }
    } catch (error: any) {
      console.log('Error cargando perfil:', error);

      Alert.alert(
        'Error de conexión',
        error?.message ||
          'No se pudo consultar tu perfil. Verifica tu conexión con el servidor.'
      );
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // ==========================================
  // SELECCIONAR CURRICULUM PDF
  // ==========================================

  const seleccionarPDF = async () => {
    try {
      // Abre el selector nativo de Android sin copiar el archivo.
      const resultado = await File.pickFileAsync({
        mimeTypes: ['application/pdf'],
        multipleFiles: false,
      });

      if (resultado.canceled || !resultado.result) {
        return;
      }

      const archivo = resultado.result;

      const nombreArchivo =
        archivo.name ||
        archivo.uri.split('/').pop() ||
        'curriculum.pdf';

      const esPDF =
        archivo.type === 'application/pdf' ||
        nombreArchivo.toLowerCase().endsWith('.pdf');

      if (!esPDF) {
        Alert.alert(
          'Archivo no válido',
          'Debes seleccionar un documento PDF.'
        );
        return;
      }

      // Validar tamaño máximo de 10 MB.
      if (
        typeof archivo.size === 'number' &&
        archivo.size > 10 * 1024 * 1024
      ) {
        Alert.alert(
          'Archivo demasiado grande',
          'El curriculum no debe superar los 10 MB.'
        );
        return;
      }

      setArchivoPDF({
        file: archivo,
        uri: archivo.uri,
        name: nombreArchivo,
        mimeType: archivo.type || 'application/pdf',
      });
    } catch (error: any) {
      console.log('Error seleccionando PDF:', error);

      Alert.alert(
        'Error al seleccionar PDF',
        error?.message ||
          'No se pudo abrir el selector de archivos. Intenta nuevamente.'
      );
    }
  };

  // ==========================================
  // GUARDAR PERFIL PROFESIONAL
  // ==========================================

  const guardarPerfil = async () => {
    if (guardando) return;

    if (!datos.Institucion.trim()) {
      Alert.alert(
        'Campo obligatorio',
        'Ingresa tu institución u organización.'
      );
      return;
    }

    if (!datos.Area_participacion.trim()) {
      Alert.alert(
        'Campo obligatorio',
        'Ingresa tu área de participación.'
      );
      return;
    }

    if (!perfilCompleto && !archivoPDF) {
      Alert.alert(
        'Curriculum obligatorio',
        'Selecciona tu Curriculum Vitae en formato PDF.'
      );
      return;
    }

    try {
      setGuardando(true);

      const formulario = new FormData();

      formulario.append(
        'Institucion',
        datos.Institucion.trim()
      );

      formulario.append(
        'Puesto',
        datos.Puesto.trim()
      );

      formulario.append(
        'Sexo',
        datos.Sexo
      );

      formulario.append(
        'Area_participacion',
        datos.Area_participacion.trim()
      );

      formulario.append(
        'Area_especializada',
        datos.Area_especializada.trim()
      );

      if (archivoPDF) {
        const nombreSeguro = archivoPDF.name.replace(
          /[^a-zA-Z0-9._-]/g,
          '_'
        );

        // Adjuntar directamente el File seleccionado.
        // No utilizar FileSystem.copyAsync ni copiar la URI.
        formulario.append(
          'Curriculum',
          archivoPDF.file,
          nombreSeguro
        );
      }

      const respuesta = await guardarMiPerfilJurado(formulario);

      if (respuesta?.completo) {
        setPerfilCompleto(true);
        setModoEdicion(false);
        setArchivoPDF(null);

        if (respuesta.perfil) {
          setDatos({
            Institucion: respuesta.perfil.Institucion ?? '',
            Puesto: respuesta.perfil.Puesto ?? '',
            Sexo: respuesta.perfil.Sexo ?? '',
            Area_participacion:
              respuesta.perfil.Area_participacion ?? '',
            Area_especializada:
              respuesta.perfil.Area_especializada ?? '',
            Curriculum: respuesta.perfil.Curriculum ?? '',
          });
        }

        Alert.alert(
          'Perfil guardado',
          'Tus datos profesionales se guardaron correctamente.'
        );
      } else {
        Alert.alert(
          'Respuesta inesperada',
          'El servidor no confirmó el registro del perfil.'
        );
      }
    } catch (error: any) {
      console.log('Error guardando perfil:', error);

      Alert.alert(
        'No se pudo guardar',
        error?.message ||
          'Verifica los datos e intenta nuevamente.'
      );
    } finally {
      setGuardando(false);
    }
  };

  // ==========================================
  // CERRAR SESIÓN
  // ==========================================

  const handleCerrarSesion = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que deseas salir?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.multiRemove([
              'userToken',
              'userData',
              'userRole',
            ]);

            router.replace('/login');
          },
        },
      ]
    );
  };

  // ==========================================
  // CARGANDO
  // ==========================================

  if (cargando) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#002b45" />

        <Text style={styles.loadingText}>
          Consultando tu perfil...
        </Text>
      </View>
    );
  }

  // ==========================================
  // FORMULARIO DE PRIMER ACCESO
  // ==========================================

  if (!perfilCompleto || modoEdicion) {
    return (
      <View style={styles.container}>
        <View style={styles.formHeader}>
          <View style={styles.formHeaderIcon}>
            <Ionicons
              name="person-circle-outline"
              size={42}
              color="#FFFFFF"
            />
          </View>

          <Text style={styles.formTitle}>
            {modoEdicion
              ? 'Editar perfil profesional'
              : 'Completa tu perfil'}
          </Text>

          <Text style={styles.formSubtitle}>
            {modoEdicion
              ? 'Actualiza tu información profesional.'
              : 'Antes de continuar, necesitamos conocer tu información profesional.'}
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.formContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.notice}>
            <Ionicons
              name="information-circle-outline"
              size={23}
              color="#0369a1"
            />

            <Text style={styles.noticeText}>
              Tus datos serán utilizados para tu registro como jurado
              y podrán ser consultados por el administrador.
            </Text>
          </View>

          {/* INSTITUCIÓN */}

          <Text style={styles.label}>
            Institución u organización *
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Ej. Instituto Tecnológico"
            placeholderTextColor="#94A3B8"
            value={datos.Institucion}
            onChangeText={(v) =>
              cambiarCampo('Institucion', v)
            }
          />

          {/* PUESTO */}

          <Text style={styles.label}>
            Puesto
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Ej. Docente, investigador, gerente"
            placeholderTextColor="#94A3B8"
            value={datos.Puesto}
            onChangeText={(v) =>
              cambiarCampo('Puesto', v)
            }
          />

          {/* SEXO */}

          <Text style={styles.label}>
            Sexo
          </Text>

          <View style={styles.chipsRow}>
            {[
              'Femenino',
              'Masculino',
              'Otro',
              'Prefiero no decir',
            ].map((opcion) => (
              <TouchableOpacity
                key={opcion}
                style={[
                  styles.chip,
                  datos.Sexo === opcion && styles.chipActivo,
                ]}
                onPress={() =>
                  cambiarCampo(
                    'Sexo',
                    datos.Sexo === opcion ? '' : opcion
                  )
                }
              >
                <Text
                  style={[
                    styles.chipText,
                    datos.Sexo === opcion &&
                      styles.chipTextActivo,
                  ]}
                >
                  {opcion}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ÁREA DE PARTICIPACIÓN */}

          <Text style={styles.label}>
            Área de participación *
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Ej. Sistemas e Inteligencia Artificial"
            placeholderTextColor="#94A3B8"
            value={datos.Area_participacion}
            onChangeText={(v) =>
              cambiarCampo('Area_participacion', v)
            }
          />

          {/* ÁREA ESPECIALIZADA */}

          <Text style={styles.label}>
            Área especializada
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Ej. Ciberseguridad, Redes y Telecomunicaciones"
            placeholderTextColor="#94A3B8"
            value={datos.Area_especializada}
            onChangeText={(v) =>
              cambiarCampo('Area_especializada', v)
            }
          />

          {/* CURRICULUM */}

          <Text style={styles.label}>
            Curriculum Vitae (PDF) {!perfilCompleto && '*'}
          </Text>

          <TouchableOpacity
            style={styles.pdfSelector}
            onPress={seleccionarPDF}
            activeOpacity={0.8}
          >
            <Ionicons
              name="document-attach-outline"
              size={25}
              color="#0369a1"
            />

            <View style={{ flex: 1 }}>
              <Text style={styles.pdfTitle}>
                {archivoPDF
                  ? archivoPDF.name
                  : datos.Curriculum
                    ? datos.Curriculum.split('/').pop()
                    : 'Seleccionar documento PDF'}
              </Text>

              <Text style={styles.pdfSubtitle}>
                Selecciona tu archivo desde el teléfono.
              </Text>
            </View>

            <Ionicons
              name="folder-open-outline"
              size={23}
              color="#64748b"
            />
          </TouchableOpacity>

          {archivoPDF && (
            <TouchableOpacity
              onPress={() => setArchivoPDF(null)}
              style={styles.removeFile}
            >
              <Text style={styles.removeFileText}>
                Quitar archivo seleccionado
              </Text>
            </TouchableOpacity>
          )}

          {/* GUARDAR */}

          <TouchableOpacity
            style={[
              styles.saveButton,
              guardando && styles.disabledButton,
            ]}
            onPress={guardarPerfil}
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

                <Text style={styles.saveButtonText}>
                  Guardar perfil
                </Text>
              </>
            )}
          </TouchableOpacity>

          {modoEdicion && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => {
                setModoEdicion(false);
                setArchivoPDF(null);
                cargarDatos();
              }}
              disabled={guardando}
            >
              <Text style={styles.cancelButtonText}>
                Cancelar
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
    );
  }

  // ==========================================
  // DASHBOARD DEL JURADO
  // ==========================================

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.welcomeTitle}>
            ¡Hola, {usuario?.Nombre || 'Jurado'}! 👋
          </Text>

          <Text style={styles.welcomeSubtitle}>
            Panel del Jurado
          </Text>
        </View>

        <TouchableOpacity
          style={styles.btnLogout}
          onPress={handleCerrarSesion}
        >
          <Ionicons
            name="log-out-outline"
            size={22}
            color="#ff4d4d"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.cardInfo}>
          <Ionicons
            name="people-circle-outline"
            size={40}
            color="#002b45"
          />

          <Text style={styles.cardTitle}>
            Mis evaluaciones
          </Text>

          <Text style={styles.cardSubtitle}>
            Consulta integrantes, avances y estatus de registro.
          </Text>
        </View>

        {/* PERFIL PROFESIONAL */}

        <Text style={styles.sectionTitle}>
          Mi información profesional
        </Text>

        <View style={styles.profileCard}>
          <Text style={styles.profileText}>
            <Text style={styles.profileLabel}>Institución: </Text>
            {datos.Institucion}
          </Text>

          <Text style={styles.profileText}>
            <Text style={styles.profileLabel}>Puesto: </Text>
            {datos.Puesto || 'No especificado'}
          </Text>

          <Text style={styles.profileText}>
            <Text style={styles.profileLabel}>Área: </Text>
            {datos.Area_participacion}
          </Text>

          <Text style={styles.profileText}>
            <Text style={styles.profileLabel}>Especialidad: </Text>
            {datos.Area_especializada || 'No especificada'}
          </Text>

          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={() => setModoEdicion(true)}
          >
            <Ionicons
              name="create-outline"
              size={19}
              color="#0369a1"
            />

            <Text style={styles.editProfileText}>
              Editar mi perfil
            </Text>
          </TouchableOpacity>
        </View>

        {/* ACCIONES RÁPIDAS */}

        <Text style={styles.sectionTitle}>
          Acciones rápidas
        </Text>

        <TouchableOpacity
          style={styles.actionCard}
          activeOpacity={0.8}
          onPress={() =>
            router.push('/(lider)/equipos' as any)
          }
        >
          <View style={styles.iconCircle}>
            <Ionicons
              name="people-outline"
              size={24}
              color="#002b45"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>
              Mis evaluaciones
            </Text>

            <Text style={styles.actionSubtitle}>
              Ver lista de integrantes y detalles del proyecto
            </Text>
          </View>

          <Ionicons
            name="chevron-forward"
            size={20}
            color="#666"
          />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ==========================================
// ESTILOS
// ==========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f7fa',
  },

  loadingText: {
    marginTop: 12,
    color: '#64748b',
  },

  // HEADER

  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 15,
    backgroundColor: '#002b45',
  },

  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },

  welcomeSubtitle: {
    fontSize: 12,
    color: '#a0b2c6',
    marginTop: 2,
  },

  btnLogout: {
    padding: 8,
    backgroundColor: '#ffffff1a',
    borderRadius: 10,
  },

  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  // DASHBOARD

  cardInfo: {
    backgroundColor: '#A4B74D',
    borderRadius: 16,
    padding: 20,
    alignItems: 'flex-start',
    gap: 8,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#002b45',
  },

  cardSubtitle: {
    fontSize: 13,
    color: '#2c3e50',
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#002b45',
    marginTop: 25,
    marginBottom: 12,
  },

  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },

  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#e8f0fe',
    justifyContent: 'center',
    alignItems: 'center',
  },

  actionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },

  actionSubtitle: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
  },

  // FORMULARIO

  formHeader: {
    backgroundColor: '#002b45',
    paddingHorizontal: 22,
    paddingTop: 30,
    paddingBottom: 25,
    alignItems: 'center',
  },

  formHeaderIcon: {
    width: 65,
    height: 65,
    borderRadius: 20,
    backgroundColor: '#A4B74D',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },

  formTitle: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  formSubtitle: {
    fontSize: 13,
    color: '#d5e0e9',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },

  formContent: {
    padding: 20,
    paddingBottom: 45,
  },

  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    backgroundColor: '#e0f2fe',
    borderRadius: 12,
    marginBottom: 20,
  },

  noticeText: {
    flex: 1,
    fontSize: 12,
    color: '#075985',
    lineHeight: 18,
  },

  label: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 12,
  },

  input: {
    minHeight: 49,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 13,
    color: '#172033',
    backgroundColor: '#FFFFFF',
    fontSize: 14,
  },

  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },

  chip: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 13,
    backgroundColor: '#FFFFFF',
  },

  chipActivo: {
    backgroundColor: '#002b45',
    borderColor: '#002b45',
  },

  chipText: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '600',
  },

  chipTextActivo: {
    color: '#FFFFFF',
  },

  pdfSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    padding: 14,
    minHeight: 70,
  },

  pdfTitle: {
    color: '#172033',
    fontSize: 13,
    fontWeight: '700',
  },

  pdfSubtitle: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 4,
  },

  removeFile: {
    marginTop: 9,
    alignSelf: 'flex-start',
  },

  removeFileText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '700',
  },

  saveButton: {
    minHeight: 53,
    borderRadius: 12,
    backgroundColor: '#82A323',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 9,
    marginTop: 25,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  disabledButton: {
    opacity: 0.6,
  },

  cancelButton: {
    alignItems: 'center',
    padding: 16,
  },

  cancelButtonText: {
    color: '#64748b',
    fontWeight: '700',
  },

  // PERFIL

  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 17,
    gap: 11,
    elevation: 2,
  },

  profileText: {
    color: '#475569',
    fontSize: 13,
  },

  profileLabel: {
    color: '#002b45',
    fontWeight: '800',
  },

  editProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
    paddingVertical: 8,
  },

  editProfileText: {
    color: '#0369a1',
    fontWeight: '700',
    fontSize: 13,
  },
});