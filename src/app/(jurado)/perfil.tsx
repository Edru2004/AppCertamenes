import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';

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

import {
  getMiPerfilJurado,
  guardarMiPerfilJurado,
} from '../../services/api';

type Perfil = {
  Institucion?: string;
  Puesto?: string;
  Sexo?: string;
  Area_participacion?: string;
  Area_especializada?: string;
  Curriculum?: string;
};

type ArchivoPDF = {
  uri: string;
  name: string;
  mimeType?: string;
  size?: number;
};

export default function JuradoPerfil() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    inicial?: string;
  }>();

  const esInicial = params.inicial === '1';

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [perfilExiste, setPerfilExiste] = useState(false);

  const [institucion, setInstitucion] = useState('');
  const [puesto, setPuesto] = useState('');
  const [sexo, setSexo] = useState('');
  const [areaParticipacion, setAreaParticipacion] = useState('');
  const [areaEspecializada, setAreaEspecializada] = useState('');

  const [curriculum, setCurriculum] =
    useState<ArchivoPDF | null>(null);

  const [curriculumExistente, setCurriculumExistente] =
    useState<string | null>(null);

  const [error, setError] = useState('');

  // ======================================================
  // CARGAR PERFIL
  // ======================================================

  const cargarPerfil = useCallback(async () => {
    try {
      setCargando(true);
      setError('');

      const respuesta = await getMiPerfilJurado();

      console.log('Respuesta perfil jurado:', respuesta);

      if (!respuesta?.completo || !respuesta?.perfil) {
        setPerfilExiste(false);

        // Si no existe perfil, obligamos al jurado
        // a completar sus datos.
        return;
      }

      const datos: Perfil = respuesta.perfil;

      setPerfilExiste(true);

      setInstitucion(datos.Institucion ?? '');
      setPuesto(datos.Puesto ?? '');
      setSexo(datos.Sexo ?? '');
      setAreaParticipacion(
        datos.Area_participacion ?? ''
      );
      setAreaEspecializada(
        datos.Area_especializada ?? ''
      );

      setCurriculumExistente(
        datos.Curriculum ?? null
      );

    } catch (err: any) {
      console.log(
        'Error cargando perfil del jurado:',
        err
      );

      setError(
        err?.message ||
          'No se pudo cargar el perfil profesional.'
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarPerfil();
  }, [cargarPerfil]);

  // ======================================================
  // SELECCIONAR CURRÍCULUM
  // ======================================================

  const seleccionarCurriculum = async () => {
    try {
      setError('');

      const resultado =
        await DocumentPicker.getDocumentAsync({
          type: 'application/pdf',
          copyToCacheDirectory: true,
          multiple: false,
        });

      if (resultado.canceled) {
        return;
      }

      const archivo = resultado.assets?.[0];

      if (!archivo) {
        return;
      }

      // Validación adicional por seguridad
      const esPDF =
        archivo.mimeType === 'application/pdf' ||
        archivo.name?.toLowerCase().endsWith('.pdf');

      if (!esPDF) {
        Alert.alert(
          'Archivo no válido',
          'El currículum debe estar en formato PDF.'
        );
        return;
      }

      // Laravel permite máximo 10 MB
      if (
        archivo.size !== undefined &&
        archivo.size > 10 * 1024 * 1024
      ) {
        Alert.alert(
          'Archivo demasiado grande',
          'El currículum no puede superar los 10 MB.'
        );
        return;
      }

      setCurriculum({
        uri: archivo.uri,
        name: archivo.name,
        mimeType: archivo.mimeType,
        size: archivo.size,
      });

      // Si se seleccionó uno nuevo, ya no mostramos
      // el anterior como archivo seleccionado.
      setCurriculumExistente(null);

    } catch (err: any) {
      console.log(
        'Error seleccionando currículum:',
        err
      );

      Alert.alert(
        'Error',
        'No se pudo seleccionar el currículum.'
      );
    }
  };

  // ======================================================
  // GUARDAR PERFIL
  // ======================================================

  const guardarPerfil = async () => {
    setError('');

    if (!institucion.trim()) {
      Alert.alert(
        'Campo requerido',
        'Ingresa la institución.'
      );
      return;
    }

    if (!areaParticipacion.trim()) {
      Alert.alert(
        'Campo requerido',
        'Ingresa el área de participación.'
      );
      return;
    }

    try {
      setGuardando(true);

      const formData = new FormData();

      formData.append(
        'Institucion',
        institucion.trim()
      );

      formData.append(
        'Puesto',
        puesto.trim()
      );

      formData.append(
        'Sexo',
        sexo.trim()
      );

      formData.append(
        'Area_participacion',
        areaParticipacion.trim()
      );

      formData.append(
        'Area_especializada',
        areaEspecializada.trim()
      );

      // Solo agregamos el archivo si el usuario
      // seleccionó uno nuevo.
      if (curriculum) {
        formData.append(
          'Curriculum',
          {
            uri: curriculum.uri,
            name: curriculum.name,
            type:
              curriculum.mimeType ||
              'application/pdf',
          } as any
        );
      }

      console.log(
        'Guardando perfil profesional del jurado...'
      );

      const respuesta =
        await guardarMiPerfilJurado(formData);

      console.log(
        'Respuesta guardar perfil:',
        respuesta
      );

      setPerfilExiste(true);

      Alert.alert(
        'Perfil guardado',
        'Tu perfil profesional se guardó correctamente.',
        [
          {
            text: 'Continuar',
            onPress: () => {
              router.replace('/(jurado)');
            },
          },
        ]
      );

    } catch (err: any) {
      console.log(
        'Error guardando perfil:',
        err
      );

      const mensaje =
        err?.message ||
        'No se pudo guardar el perfil profesional.';

      setError(mensaje);

      Alert.alert(
        'No se pudo guardar',
        mensaje
      );

    } finally {
      setGuardando(false);
    }
  };

  // ======================================================
  // CARGANDO
  // ======================================================

  if (cargando) {
    return (
      <View style={styles.loadingPage}>
        <ActivityIndicator
          size="large"
          color="#0B4F6C"
        />

        <Text style={styles.loadingText}>
          Cargando perfil...
        </Text>
      </View>
    );
  }

  // ======================================================
  // PANTALLA
  // ======================================================

  return (
    <View style={styles.page}>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >

          {/* HEADER */}

          <View style={styles.header}>

            {!esInicial && (
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Ionicons
                  name="arrow-back"
                  size={25}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            )}

            <View
              style={[
                styles.headerTitleContainer,
                esInicial && styles.headerTitleInitial,
              ]}
            >
              <Text style={styles.title}>
                {esInicial
                  ? 'Completa tu perfil'
                  : 'Mi perfil'}
              </Text>

              <Text style={styles.subtitle}>
                {esInicial
                  ? 'Antes de comenzar debes completar tu información profesional.'
                  : 'Información profesional del jurado'}
              </Text>
            </View>

          </View>

          {/* AVISO INICIAL */}

          {esInicial && (
            <View style={styles.noticeCard}>

              <View style={styles.noticeIcon}>
                <Ionicons
                  name="information-circle"
                  size={28}
                  color="#0B4F6C"
                />
              </View>

              <View style={styles.noticeContent}>
                <Text style={styles.noticeTitle}>
                  Información requerida
                </Text>

                <Text style={styles.noticeText}>
                  Completa los siguientes datos para
                  poder acceder al panel del jurado.
                </Text>
              </View>

            </View>
          )}

          {/* PERFIL */}

          <View style={styles.profileCard}>

            <View style={styles.avatar}>
              <Ionicons
                name="person-outline"
                size={45}
                color="#FFFFFF"
              />
            </View>

            <Text style={styles.name}>
              Jurado
            </Text>

            <Text style={styles.role}>
              Jurado evaluador
            </Text>

          </View>

          {/* FORMULARIO */}

          <View style={styles.formCard}>

            <Text style={styles.sectionTitle}>
              Información profesional
            </Text>

            {/* INSTITUCIÓN */}

            <Text style={styles.label}>
              Institución *
            </Text>

            <View style={styles.inputContainer}>

              <Ionicons
                name="business-outline"
                size={21}
                color="#0B4F6C"
              />

              <TextInput
                style={styles.input}
                placeholder="Ej. Universidad Tecnológica"
                placeholderTextColor="#94A3B8"
                value={institucion}
                onChangeText={setInstitucion}
                editable={!guardando}
              />

            </View>

            {/* PUESTO */}

            <Text style={styles.label}>
              Puesto
            </Text>

            <View style={styles.inputContainer}>

              <Ionicons
                name="briefcase-outline"
                size={21}
                color="#0B4F6C"
              />

              <TextInput
                style={styles.input}
                placeholder="Ej. Docente, investigador..."
                placeholderTextColor="#94A3B8"
                value={puesto}
                onChangeText={setPuesto}
                editable={!guardando}
              />

            </View>

            {/* SEXO */}

            <Text style={styles.label}>
              Sexo
            </Text>

            <View style={styles.inputContainer}>

              <Ionicons
                name="person-outline"
                size={21}
                color="#0B4F6C"
              />

              <TextInput
                style={styles.input}
                placeholder="Especifica tu sexo"
                placeholderTextColor="#94A3B8"
                value={sexo}
                onChangeText={setSexo}
                editable={!guardando}
              />

            </View>

            {/* ÁREA DE PARTICIPACIÓN */}

            <Text style={styles.label}>
              Área de participación *
            </Text>

            <View style={styles.inputContainer}>

              <Ionicons
                name="layers-outline"
                size={21}
                color="#0B4F6C"
              />

              <TextInput
                style={styles.input}
                placeholder="Ej. Tecnología, negocios..."
                placeholderTextColor="#94A3B8"
                value={areaParticipacion}
                onChangeText={setAreaParticipacion}
                editable={!guardando}
              />

            </View>

            {/* ÁREA ESPECIALIZADA */}

            <Text style={styles.label}>
              Área especializada
            </Text>

            <View style={styles.inputContainer}>

              <Ionicons
                name="school-outline"
                size={21}
                color="#0B4F6C"
              />

              <TextInput
                style={styles.input}
                placeholder="Ej. Inteligencia Artificial"
                placeholderTextColor="#94A3B8"
                value={areaEspecializada}
                onChangeText={setAreaEspecializada}
                editable={!guardando}
              />

            </View>

            {/* CURRÍCULUM */}

            <Text style={styles.label}>
              Currículum
            </Text>

            <TouchableOpacity
              style={styles.pdfButton}
              onPress={seleccionarCurriculum}
              disabled={guardando}
            >

              <View style={styles.pdfIcon}>
                <Ionicons
                  name="document-text-outline"
                  size={27}
                  color="#FFFFFF"
                />
              </View>

              <View style={styles.pdfInfo}>

                <Text style={styles.pdfTitle}>
                  {curriculum
                    ? curriculum.name
                    : curriculumExistente
                    ? obtenerNombreArchivo(
                        curriculumExistente
                      )
                    : 'Seleccionar currículum'}
                </Text>

                <Text style={styles.pdfSubtitle}>
                  {curriculum
                    ? 'Nuevo archivo seleccionado'
                    : curriculumExistente
                    ? 'Currículum registrado actualmente'
                    : 'Formato PDF · Máximo 10 MB'}
                </Text>

              </View>

              <Ionicons
                name="chevron-forward"
                size={22}
                color="#64748B"
              />

            </TouchableOpacity>

            {/* ERROR */}

            {error !== '' && (
              <View style={styles.errorBox}>

                <Ionicons
                  name="alert-circle-outline"
                  size={22}
                  color="#B91C1C"
                />

                <Text style={styles.errorText}>
                  {error}
                </Text>

              </View>
            )}

            {/* GUARDAR */}

            <TouchableOpacity
              style={[
                styles.saveButton,
                guardando &&
                  styles.saveButtonDisabled,
              ]}
              onPress={guardarPerfil}
              disabled={guardando}
            >

              {guardando ? (
                <ActivityIndicator
                  size="small"
                  color="#FFFFFF"
                />
              ) : (
                <>
                  <Ionicons
                    name="save-outline"
                    size={22}
                    color="#FFFFFF"
                  />

                  <Text style={styles.saveButtonText}>
                    {perfilExiste
                      ? 'Guardar cambios'
                      : 'Guardar perfil'}
                  </Text>
                </>
              )}

            </TouchableOpacity>

          </View>

          {/* TEXTO INFERIOR */}

          <Text style={styles.requiredText}>
            * Campos obligatorios
          </Text>

        </ScrollView>

      </KeyboardAvoidingView>

      {/* NAV */}

      {!esInicial && (
        <View style={styles.bottomNav}>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() =>
              router.replace('/(jurado)')
            }
          >

            <Ionicons
              name="home-outline"
              size={24}
              color="#64748B"
            />

            <Text style={styles.navText}>
              Inicio
            </Text>

          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() =>
              router.push('/(jurado)/equipos')
            }
          >

            <Ionicons
              name="people-outline"
              size={24}
              color="#64748B"
            />

            <Text style={styles.navText}>
              Equipos
            </Text>

          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
          >

            <Ionicons
              name="person"
              size={24}
              color="#0B4F6C"
            />

            <Text style={styles.navTextActive}>
              Perfil
            </Text>

          </TouchableOpacity>

        </View>
      )}

    </View>
  );
}

// ======================================================
// OBTENER NOMBRE DEL ARCHIVO
// ======================================================

function obtenerNombreArchivo(
  ruta: string
): string {
  if (!ruta) {
    return 'Currículum registrado';
  }

  const partes = ruta.split('/');

  return partes[partes.length - 1] ||
    'Currículum registrado';
}

// ======================================================
// ESTILOS
// ======================================================

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F4F7FA',
  },

  container: {
    padding: 20,
    paddingBottom: 40,
  },

  loadingPage: {
    flex: 1,
    backgroundColor: '#F4F7FA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 22,
  },

  headerTitleContainer: {
    flex: 1,
    marginLeft: 14,
  },

  headerTitleInitial: {
    marginLeft: 0,
  },

  backButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#063B52',
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    color: '#063B52',
    fontSize: 27,
    fontWeight: '900',
  },

  subtitle: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 5,
  },

  noticeCard: {
    backgroundColor: '#E8F4F8',
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#C8E2EC',
  },

  noticeIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  noticeContent: {
    flex: 1,
    marginLeft: 12,
  },

  noticeTitle: {
    color: '#063B52',
    fontSize: 15,
    fontWeight: '900',
  },

  noticeText: {
    color: '#496575',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 3,
  },

  profileCard: {
    backgroundColor: '#063B52',
    borderRadius: 25,
    padding: 28,
    alignItems: 'center',
    marginBottom: 20,
  },

  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#0879AD',
    alignItems: 'center',
    justifyContent: 'center',
  },

  name: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
    marginTop: 15,
  },

  role: {
    color: '#B8D6E3',
    fontSize: 15,
    marginTop: 3,
  },

  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#DDE5EC',
  },

  sectionTitle: {
    color: '#063B52',
    fontSize: 19,
    fontWeight: '900',
    marginBottom: 20,
  },

  label: {
    color: '#334155',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 7,
    marginTop: 12,
  },

  inputContainer: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#D7E0E7',
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },

  input: {
    flex: 1,
    color: '#172033',
    fontSize: 15,
    marginLeft: 10,
    paddingVertical: 12,
  },

  pdfButton: {
    minHeight: 70,
    borderWidth: 1,
    borderColor: '#D7E0E7',
    borderRadius: 15,
    backgroundColor: '#F8FAFC',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginTop: 2,
  },

  pdfIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: '#0B4F6C',
    alignItems: 'center',
    justifyContent: 'center',
  },

  pdfInfo: {
    flex: 1,
    marginLeft: 12,
  },

  pdfTitle: {
    color: '#172033',
    fontSize: 14,
    fontWeight: '800',
  },

  pdfSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 3,
  },

  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 13,
    padding: 12,
    marginTop: 18,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  errorText: {
    flex: 1,
    color: '#991B1B',
    fontSize: 13,
    lineHeight: 19,
    marginLeft: 8,
  },

  saveButton: {
    height: 54,
    borderRadius: 15,
    backgroundColor: '#0B4F6C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 22,
    gap: 9,
  },

  saveButtonDisabled: {
    opacity: 0.65,
  },

  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },

  requiredText: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 12,
    marginBottom: 20,
  },

  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 78,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },

  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 75,
  },

  navText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 3,
  },

  navTextActive: {
    color: '#0B4F6C',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 3,
  },
});