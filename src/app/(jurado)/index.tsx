// src/app/(jurado)/index.tsx

import { Ionicons } from '@expo/vector-icons';

import { File } from 'expo-file-system';

import { useRouter } from 'expo-router';

import { useCallback, useEffect, useRef, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  getMiPerfilJurado,
  getMisAsignacionesJurado,
  guardarMiPerfilJurado,
} from '../../services/api';

type ArchivoPDF = {
  uri: string;
  name: string;
  mimeType?: string;
  size?: number;
  file: File;
};

export default function JuradoIndex() {
  const router = useRouter();

  // ==========================================================
  // ESTADOS GENERALES
  // ==========================================================

  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [guardandoPerfil, setGuardandoPerfil] = useState(false);

  const [error, setError] = useState('');

  const [perfilCompleto, setPerfilCompleto] = useState(false);

  const [asignaciones, setAsignaciones] = useState<any[]>([]);

  // ==========================================================
  // ESTADOS DEL PERFIL
  // ==========================================================

  const [institucion, setInstitucion] = useState('');
  const [puesto, setPuesto] = useState('');
  const [sexo, setSexo] = useState('');

  const [areaParticipacion, setAreaParticipacion] =
    useState('');

  const [areaEspecializada, setAreaEspecializada] =
    useState('');

  const [curriculum, setCurriculum] =
    useState<ArchivoPDF | null>(null);

  const [curriculumExistente, setCurriculumExistente] =
    useState<string | null>(null);

  // ==========================================================
  // SELECTOR DE SEXO
  // ==========================================================

  const [mostrarOpcionesSexo, setMostrarOpcionesSexo] =
    useState(false);

  // ==========================================================
  // CONTROL DE CARGAS
  // ==========================================================

  const cargandoRef = useRef(false);

  const cargaInicialRealizada =
    useRef(false);

  // ==========================================================
  // EXTRAER LISTA
  // ==========================================================

  const extraerLista = (respuesta: any) => {
    if (Array.isArray(respuesta)) {
      return respuesta;
    }

    if (Array.isArray(respuesta?.data)) {
      return respuesta.data;
    }

    if (
      Array.isArray(
        respuesta?.data?.data
      )
    ) {
      return respuesta.data.data;
    }

    return [];
  };

  // ==========================================================
  // COMPROBAR PERFIL
  // ==========================================================

  const comprobarPerfil = useCallback(
    async () => {

      try {

        console.log(
          'JuradoIndex: comprobando perfil...'
        );

        const respuesta =
          await getMiPerfilJurado();

        console.log(
          'Respuesta perfil jurado:',
          respuesta
        );

        if (
          !respuesta?.completo ||
          !respuesta?.perfil
        ) {

          console.log(
            'JuradoIndex: perfil incompleto.'
          );

          setPerfilCompleto(false);

          return false;
        }

        console.log(
          'JuradoIndex: perfil completo.'
        );

        const perfil =
          respuesta.perfil;

        setPerfilCompleto(true);

        setInstitucion(
          perfil.Institucion ?? ''
        );

        setPuesto(
          perfil.Puesto ?? ''
        );

        setSexo(
          perfil.Sexo ?? ''
        );

        setAreaParticipacion(
          perfil.Area_participacion ?? ''
        );

        setAreaEspecializada(
          perfil.Area_especializada ?? ''
        );

        setCurriculumExistente(
          perfil.Curriculum ?? null
        );

        return true;

      } catch (err: any) {

        console.log(
          'Error comprobando perfil:',
          err
        );

        setError(
          err?.message ||
            'No se pudo comprobar el perfil.'
        );

        return false;
      }

    },
    []
  );

  // ==========================================================
  // CARGAR PANEL
  // ==========================================================

  const cargarPanel = useCallback(
    async (
      mostrarCarga = true
    ) => {

      if (cargandoRef.current) {

        console.log(
          'JuradoIndex: carga ya en proceso.'
        );

        return;
      }

      cargandoRef.current = true;

      try {

        if (mostrarCarga) {
          setCargando(true);
        }

        setError('');

        console.log(
          'JuradoIndex: iniciando carga...'
        );

        const tienePerfil =
          await comprobarPerfil();

        if (!tienePerfil) {

          console.log(
            'JuradoIndex: no se cargarán asignaciones.'
          );

          setAsignaciones([]);

          return;
        }

        console.log(
          'JuradoIndex: cargando asignaciones...'
        );

        const respuesta =
          await getMisAsignacionesJurado();

        console.log(
          'Respuesta asignaciones jurado:',
          respuesta
        );

        const lista =
          extraerLista(respuesta);

        setAsignaciones(lista);

      } catch (err: any) {

        console.log(
          'Error cargando panel:',
          err
        );

        setError(
          err?.message ||
            'No se pudo cargar el panel.'
        );

      } finally {

        cargandoRef.current = false;

        setCargando(false);
        setActualizando(false);

        console.log(
          'JuradoIndex: carga finalizada.'
        );
      }

    },
    [comprobarPerfil]
  );

  // ==========================================================
  // CARGA INICIAL
  // ==========================================================

  useEffect(() => {

    if (
      cargaInicialRealizada.current
    ) {
      return;
    }

    cargaInicialRealizada.current = true;

    console.log(
      'JuradoIndex: EJECUTANDO CARGA INICIAL UNA SOLA VEZ.'
    );

    cargarPanel(true);

  }, [cargarPanel]);

  // ==========================================================
  // ACTUALIZAR PANEL
  // ==========================================================

  const actualizar = async () => {

    if (cargandoRef.current) {
      return;
    }

    setActualizando(true);

    await cargarPanel(false);

  };

  // ==========================================================
  // SELECCIONAR CURRÍCULUM PDF
  // ==========================================================

  const seleccionarCurriculum =
    async () => {

      try {

        setError('');

        const resultado =
          await File.pickFileAsync({
            multipleFiles: false,
            mimeTypes: ['application/pdf'],
          });

        if (
          resultado.canceled
        ) {
          return;
        }

        const archivo =
          resultado.result;

        if (!archivo) {
          return;
        }

        const esPDF =
          archivo.type ===
            'application/pdf' ||
          archivo.name
            ?.toLowerCase()
            .endsWith('.pdf');

        if (!esPDF) {

          Alert.alert(
            'Archivo no válido',
            'El currículum debe estar en formato PDF.'
          );

          return;
        }

        if (
          archivo.size !==
            undefined &&
          archivo.size >
            10 * 1024 * 1024
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
          mimeType:
            archivo.type ||
            'application/pdf',
          size: archivo.size,
          file: archivo,
        });

        setCurriculumExistente(
          null
        );

      } catch (err) {

        console.log(
          'Error seleccionando PDF:',
          err
        );

        Alert.alert(
          'Error',
          'No se pudo seleccionar el currículum.'
        );

      }
    };

  // ==========================================================
  // GUARDAR PERFIL
  // ==========================================================

  const guardarPerfil =
    async () => {

      setError('');

      if (
        !institucion.trim()
      ) {

        Alert.alert(
          'Campo requerido',
          'Ingresa la institución.'
        );

        return;
      }

      if (
        !sexo
      ) {

        Alert.alert(
          'Campo requerido',
          'Selecciona tu sexo.'
        );

        return;
      }

      if (
        !areaParticipacion.trim()
      ) {

        Alert.alert(
          'Campo requerido',
          'Ingresa el área de participación.'
        );

        return;
      }

      try {

        setGuardandoPerfil(
          true
        );

        const formData =
          new FormData();

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
          sexo
        );

        formData.append(
          'Area_participacion',
          areaParticipacion.trim()
        );

        formData.append(
          'Area_especializada',
          areaEspecializada.trim()
        );

        /*
         * IMPORTANTE:
         * Se utiliza directamente el File
         * obtenido por expo-file-system.
         *
         * Esto evita volver a construir el archivo
         * desde la URI y evita el error:
         *
         * Missing 'READ' permission for accessing the file.
         */

        if (curriculum) {

          formData.append(
            'Curriculum',
            curriculum.file
          );
        }

        console.log(
          'JuradoIndex: guardando perfil...'
        );

        const respuesta =
          await guardarMiPerfilJurado(
            formData
          );

        console.log(
          'Respuesta guardar perfil:',
          respuesta
        );

        setPerfilCompleto(
          true
        );

        Alert.alert(
          'Perfil guardado',
          'Tu perfil profesional se guardó correctamente.',
          [
            {
              text: 'Continuar',
              onPress: () => {

                cargarPanel(true);

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

        setError(
          mensaje
        );

        Alert.alert(
          'Error',
          mensaje
        );

      } finally {

        setGuardandoPerfil(
          false
        );
      }
    };

  // ==========================================================
  // RENDER
  // ==========================================================

  if (cargando) {

    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
        />

        <Text style={styles.loadingText}>
          Cargando panel...
        </Text>
      </View>
    );
  }

  // ==========================================================
  // PERFIL INCOMPLETO
  // ==========================================================

  if (!perfilCompleto) {

    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >

        <ScrollView
          contentContainerStyle={
            styles.profileContainer
          }
          keyboardShouldPersistTaps="handled"
        >

          <View style={styles.profileHeader}>

            <View
              style={styles.profileIconContainer}
            >

              <Ionicons
                name="person-outline"
                size={32}
                color="#fff"
              />

            </View>

            <Text
              style={styles.profileTitle}
            >
              Perfil profesional
            </Text>

            <Text
              style={styles.profileSubtitle}
            >
              Completa tu información profesional
              para continuar.
            </Text>

          </View>

          {error ? (
            <View
              style={styles.errorContainer}
            >

              <Ionicons
                name="alert-circle-outline"
                size={20}
                color="#b91c1c"
              />

              <Text
                style={styles.errorText}
              >
                {error}
              </Text>

            </View>
          ) : null}

          {/* INSTITUCIÓN */}

          <View style={styles.fieldContainer}>

            <Text style={styles.label}>
              Institución *
            </Text>

            <View
              style={styles.inputContainer}
            >

              <Ionicons
                name="business-outline"
                size={20}
                color="#64748b"
              />

              <TextInput
                style={styles.input}
                value={institucion}
                onChangeText={
                  setInstitucion
                }
                placeholder="Ingresa tu institución"
                placeholderTextColor="#94a3b8"
              />

            </View>

          </View>

          {/* PUESTO */}

          <View style={styles.fieldContainer}>

            <Text style={styles.label}>
              Puesto
            </Text>

            <View
              style={styles.inputContainer}
            >

              <Ionicons
                name="briefcase-outline"
                size={20}
                color="#64748b"
              />

              <TextInput
                style={styles.input}
                value={puesto}
                onChangeText={
                  setPuesto
                }
                placeholder="Ingresa tu puesto"
                placeholderTextColor="#94a3b8"
              />

            </View>

          </View>

          {/* SEXO */}

          <View style={styles.fieldContainer}>

            <Text style={styles.label}>
              Sexo *
            </Text>

            <TouchableOpacity
              style={styles.inputContainer}
              onPress={() =>
                setMostrarOpcionesSexo(
                  !mostrarOpcionesSexo
                )
              }
              activeOpacity={0.8}
            >

              <Ionicons
                name="person-outline"
                size={20}
                color="#64748b"
              />

              <Text
                style={[
                  styles.input,
                  !sexo &&
                    styles.placeholderText,
                ]}
              >
                {sexo ||
                  'Selecciona tu sexo'}
              </Text>

              <Ionicons
                name={
                  mostrarOpcionesSexo
                    ? 'chevron-up'
                    : 'chevron-down'
                }
                size={20}
                color="#64748b"
              />

            </TouchableOpacity>

            {mostrarOpcionesSexo && (

              <View
                style={
                  styles.optionsContainer
                }
              >

                {[
                  'Masculino',
                  'Femenino',
                  'Otro',
                ].map((opcion) => (

                  <TouchableOpacity
                    key={opcion}
                    style={
                      styles.optionItem
                    }
                    onPress={() => {

                      setSexo(opcion);

                      setMostrarOpcionesSexo(
                        false
                      );

                    }}
                  >

                    <Text
                      style={
                        styles.optionText
                      }
                    >
                      {opcion}
                    </Text>

                  </TouchableOpacity>

                ))}

              </View>

            )}

          </View>

          {/* ÁREA DE PARTICIPACIÓN */}

          <View style={styles.fieldContainer}>

            <Text style={styles.label}>
              Área de participación *
            </Text>

            <View
              style={styles.inputContainer}
            >

              <Ionicons
                name="people-outline"
                size={20}
                color="#64748b"
              />

              <TextInput
                style={styles.input}
                value={
                  areaParticipacion
                }
                onChangeText={
                  setAreaParticipacion
                }
                placeholder="Ingresa el área de participación"
                placeholderTextColor="#94a3b8"
              />

            </View>

          </View>

          {/* ÁREA ESPECIALIZADA */}

          <View style={styles.fieldContainer}>

            <Text style={styles.label}>
              Área especializada
            </Text>

            <View
              style={styles.inputContainer}
            >

              <Ionicons
                name="school-outline"
                size={20}
                color="#64748b"
              />

              <TextInput
                style={styles.input}
                value={
                  areaEspecializada
                }
                onChangeText={
                  setAreaEspecializada
                }
                placeholder="Ingresa tu área especializada"
                placeholderTextColor="#94a3b8"
              />

            </View>

          </View>

          {/* CURRÍCULUM */}

          <View style={styles.fieldContainer}>

            <Text style={styles.label}>
              Currículum PDF
            </Text>

            <TouchableOpacity
              style={
                styles.curriculumButton
              }
              onPress={
                seleccionarCurriculum
              }
              activeOpacity={0.8}
            >

              <View
                style={
                  styles.curriculumIcon
                }
              >

                <Ionicons
                  name="document-text-outline"
                  size={26}
                  color="#2563eb"
                />

              </View>

              <View
                style={
                  styles.curriculumInfo
                }
              >

                <Text
                  style={
                    styles.curriculumTitle
                  }
                >
                  {curriculum
                    ? curriculum.name
                    : curriculumExistente
                      ? 'Currículum cargado'
                      : 'Seleccionar currículum'}
                </Text>

                <Text
                  style={
                    styles.curriculumSubtitle
                  }
                >
                  PDF · Máximo 10 MB
                </Text>

              </View>

              <Ionicons
                name="cloud-upload-outline"
                size={24}
                color="#2563eb"
              />

            </TouchableOpacity>

          </View>

          {/* BOTÓN GUARDAR */}

          <TouchableOpacity
            style={[
              styles.saveButton,
              guardandoPerfil &&
                styles.saveButtonDisabled,
            ]}
            onPress={
              guardarPerfil
            }
            disabled={
              guardandoPerfil
            }
            activeOpacity={0.8}
          >

            {guardandoPerfil ? (

              <ActivityIndicator
                color="#fff"
              />

            ) : (

              <>
                <Ionicons
                  name="save-outline"
                  size={21}
                  color="#fff"
                />

                <Text
                  style={
                    styles.saveButtonText
                  }
                >
                  Guardar perfil
                </Text>
              </>

            )}

          </TouchableOpacity>

        </ScrollView>

      </KeyboardAvoidingView>
    );
  }

  // ==========================================================
  // PANEL DEL JURADO
  // ==========================================================

  return (
    <View style={styles.container}>

      <ScrollView
        contentContainerStyle={
          styles.panelContainer
        }
        refreshControl={
          <RefreshControl
            refreshing={
              actualizando
            }
            onRefresh={
              actualizar
            }
          />
        }
      >

        {/* ENCABEZADO */}

        <View
          style={styles.header}
        >

          <View>

            <Text
              style={styles.welcomeText}
            >
              Panel del jurado
            </Text>

            <Text
              style={styles.headerSubtitle}
            >
              Revisa tus equipos asignados
            </Text>

          </View>

          <TouchableOpacity
            style={
              styles.profileButton
            }
            onPress={() =>
              router.push(
                '/(jurado)/perfil'
              )
            }
          >

            <Ionicons
              name="person-outline"
              size={23}
              color="#2563eb"
            />

          </TouchableOpacity>

        </View>

        {/* ERROR */}

        {error ? (

          <View
            style={styles.errorContainer}
          >

            <Ionicons
              name="alert-circle-outline"
              size={20}
              color="#b91c1c"
            />

            <Text
              style={styles.errorText}
            >
              {error}
            </Text>

          </View>

        ) : null}

        {/* TÍTULO ASIGNACIONES */}

        <View
          style={styles.sectionHeader}
        >

          <View>

            <Text
              style={styles.sectionTitle}
            >
              Mis asignaciones
            </Text>

            <Text
              style={styles.sectionSubtitle}
            >
              Equipos que debes evaluar
            </Text>

          </View>

          <View
            style={styles.countBadge}
          >

            <Text
              style={styles.countText}
            >
              {asignaciones.length}
            </Text>

          </View>

        </View>

        {/* LISTA */}

        {asignaciones.length === 0 ? (

          <View
            style={styles.emptyContainer}
          >

            <View
              style={styles.emptyIcon}
            >

              <Ionicons
                name="people-outline"
                size={38}
                color="#94a3b8"
              />

            </View>

            <Text
              style={styles.emptyTitle}
            >
              No tienes asignaciones
            </Text>

            <Text
              style={styles.emptyText}
            >
              Cuando tengas equipos asignados,
              aparecerán aquí.
            </Text>

          </View>

        ) : (

          asignaciones.map(
            (item, index) => (

              <TouchableOpacity
                key={
                  item?.Id_asignacion ??
                  item?.id ??
                  index
                }
                style={
                  styles.assignmentCard
                }
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname:
                      '/(jurado)/equipos',
                    params: {
                      idAsignacion:
                        String(
                          item?.Id_asignacion ??
                            item?.id ??
                            ''
                        ),
                    },
                  })
                }
              >

                <View
                  style={
                    styles.assignmentIcon
                  }
                >

                  <Ionicons
                    name="people"
                    size={25}
                    color="#2563eb"
                  />

                </View>

                <View
                  style={
                    styles.assignmentInfo
                  }
                >

                  <Text
                    style={
                      styles.assignmentTitle
                    }
                  >
                    {item?.Nombre_equipo ??
                      item?.nombre_equipo ??
                      item?.Equipo ??
                      `Equipo ${index + 1}`}
                  </Text>

                  <Text
                    style={
                      styles.assignmentSubtitle
                    }
                  >
                    {item?.Nombre_certamen ??
                      item?.Certamen ??
                      'Certamen'}
                  </Text>

                </View>

                <Ionicons
                  name="chevron-forward"
                  size={23}
                  color="#94a3b8"
                />

              </TouchableOpacity>

            )
          )

        )}

      </ScrollView>

    </View>
  );
}

// ==========================================================
// ESTILOS
// ==========================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },

  loadingContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#64748b',
  },

  profileContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },

  profileHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },

  profileIconContainer: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  profileTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0f172a',
    textAlign: 'center',
  },

  profileSubtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },

  fieldContainer: {
    marginBottom: 18,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },

  inputContainer: {
    minHeight: 52,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },

  input: {
    flex: 1,
    fontSize: 15,
    color: '#0f172a',
    marginLeft: 10,
  },

  placeholderText: {
    color: '#94a3b8',
  },

  optionsContainer: {
    marginTop: 5,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    overflow: 'hidden',
  },

  optionItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },

  optionText: {
    fontSize: 15,
    color: '#334155',
  },

  curriculumButton: {
    minHeight: 70,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },

  curriculumIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  curriculumInfo: {
    flex: 1,
    marginHorizontal: 12,
  },

  curriculumTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },

  curriculumSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 4,
  },

  saveButton: {
    minHeight: 52,
    backgroundColor: '#2563eb',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },

  saveButtonDisabled: {
    opacity: 0.7,
  },

  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },

  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 18,
  },

  errorText: {
    flex: 1,
    color: '#b91c1c',
    fontSize: 13,
    marginLeft: 8,
  },

  panelContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 28,
  },

  welcomeText: {
    fontSize: 25,
    fontWeight: '700',
    color: '#0f172a',
  },

  headerSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginTop: 5,
  },

  profileButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#0f172a',
  },

  sectionSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 4,
  },

  countBadge: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },

  countText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563eb',
  },

  emptyContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },

  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },

  emptyText: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 21,
    marginTop: 7,
  },

  assignmentCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },

  assignmentIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
  },

  assignmentInfo: {
    flex: 1,
    marginHorizontal: 13,
  },

  assignmentTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },

  assignmentSubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 5,
  },

});