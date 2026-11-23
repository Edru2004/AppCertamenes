// @ts-nocheck

import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  actualizarJurado,
  crearJurado,
  getCertamenes,
  getPerfilJuradoPorUsuario,
  getSalas,
  getUsuariosParaJurado,
} from '../../../services/api';

// ======================================================
// FUNCIONES AUXILIARES
// ======================================================

const extraerLista = (respuesta: any): any[] => {
  if (Array.isArray(respuesta)) return respuesta;
  if (Array.isArray(respuesta?.data)) return respuesta.data;
  if (Array.isArray(respuesta?.data?.data)) return respuesta.data.data;
  if (Array.isArray(respuesta?.usuarios)) return respuesta.usuarios;
  if (Array.isArray(respuesta?.certamenes)) return respuesta.certamenes;
  if (Array.isArray(respuesta?.salas)) return respuesta.salas;
  return [];
};

const primerValor = (valor: any) =>
  Array.isArray(valor) ? valor[0] : valor;

const idCertamenDe = (item: any) =>
  Number(
    item?.Id_certamen ??
      item?.Id_Certamen ??
      item?.id_certamen ??
      item?.idCertamen ??
      item?.id
  );

const idUsuarioDe = (item: any) =>
  Number(item?.Id_usuario ?? item?.id_usuario ?? item?.id);

const idSalaDe = (item: any) =>
  Number(item?.Id_sala ?? item?.id_sala ?? item?.id);

const nombreUsuarioDe = (item: any) =>
  String(
    item?.Nombre ??
      item?.nombre ??
      item?.name ??
      item?.Usuario ??
      `Usuario #${idUsuarioDe(item)}`
  );

const tipoVisible = (tipo: any) => {
  const t = String(tipo ?? '').trim().toUpperCase();
  if (t === 'RALLY') return 'Rally';
  if (t === 'INNOVATEC' || t === 'INNOVATECNM') return 'InnovaTecNM';
  return t || 'Tipo no especificado';
};

const esInnova = (certamen: any) => {
  const tipo = String(certamen?.Tipo ?? certamen?.tipo ?? '')
    .trim()
    .toUpperCase();
  return tipo === 'INNOVATEC' || tipo === 'INNOVATECNM';
};

// ======================================================
// COMPONENTE PRINCIPAL
// ======================================================

const resultadoInicial = {
  visible: false,
  titulo: '',
  mensaje: '',
  exito: false,
};

export default function JuradoFormScreen() {
  const router = useRouter();

  const params = useLocalSearchParams<{
    juradoEditar?: string;
    idCertamen?: string;
  }>();

  const juradoParam = primerValor(params.juradoEditar);
  const idCertamenParam = primerValor(params.idCertamen);

  // ====================================================
  // ESTADOS PRINCIPALES
  // ====================================================

  const [idJurado, setIdJurado] = useState<number | null>(null);
  const [certamenes, setCertamenes] = useState<any[]>([]);
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [salas, setSalas] = useState<any[]>([]);

  const [idCertamen, setIdCertamen] = useState<number | null>(
    idCertamenParam ? Number(idCertamenParam) : null
  );
  const [idUsuario, setIdUsuario] = useState<number | null>(null);
  const [idSala, setIdSala] = useState<number | null>(null);

  // ====================================================
  // DATOS PROFESIONALES
  // ====================================================

  const [institucion, setInstitucion] = useState('');
  const [puesto, setPuesto] = useState('');
  const [sexo, setSexo] = useState('');
  const [areaParticipacion, setAreaParticipacion] = useState('');
  const [areaEspecializada, setAreaEspecializada] = useState('');

  // ====================================================
  // CURRICULUM Y PERFIL
  // ====================================================

  const [curriculumArchivo, setCurriculumArchivo] = useState<{
    uri: string;
    name: string;
    mimeType?: string;
    ruta?: string;
    esRemoto?: boolean;
  } | null>(null);

  const [cargandoPerfil, setCargandoPerfil] = useState(false);
  const [perfilEncontrado, setPerfilEncontrado] = useState(false);

  // ====================================================
  // INVITACION
  // ====================================================

  const [invitacionTexto, setInvitacionTexto] = useState('');

  // ====================================================
  // SELECTORES Y MODALES
  // ====================================================

  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [selectorUsuario, setSelectorUsuario] = useState(false);

  const [busquedaCertamen, setBusquedaCertamen] = useState('');
  const [selectorCertamen, setSelectorCertamen] = useState(false);

  const [selectorSala, setSelectorSala] = useState(false);

  // ====================================================
  // ESTADOS GENERALES
  // ====================================================

  const [cargando, setCargando] = useState(true);
  const [cargandoSalas, setCargandoSalas] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [confirmarVisible, setConfirmarVisible] = useState(false);
  const [resultado, setResultado] = useState(resultadoInicial);

  // ====================================================
  // ELEMENTOS SELECCIONADOS
  // ====================================================

  const certamenSeleccionado =
    certamenes.find((item) => idCertamenDe(item) === Number(idCertamen)) ??
    null;

  const esCertamenInnova = esInnova(certamenSeleccionado);

  const usuarioSeleccionado =
    usuarios.find((item) => idUsuarioDe(item) === Number(idUsuario)) ?? null;

  const salaSeleccionada =
    salas.find((item) => idSalaDe(item) === Number(idSala)) ?? null;

  // ====================================================
  // FILTROS DE BÚSQUEDA
  // ====================================================

  const usuariosFiltrados = useMemo(() => {
    const termino = busquedaUsuario.trim().toLocaleLowerCase();
    if (!termino) return usuarios;

    return usuarios.filter((item) => {
      const valores = [
        nombreUsuarioDe(item),
        item?.Correo,
        item?.email,
        item?.Usuario,
      ];
      return valores.some((v) =>
        String(v ?? '').toLocaleLowerCase().includes(termino)
      );
    });
  }, [usuarios, busquedaUsuario]);

  const certamenesFiltrados = useMemo(() => {
    const termino = busquedaCertamen.trim().toLocaleLowerCase();
    if (!termino) return certamenes;

    return certamenes.filter((item) => {
      const nombre = String(item?.Nombre ?? item?.nombre ?? '').toLocaleLowerCase();
      const tipo = String(item?.Tipo ?? item?.tipo ?? '').toLocaleLowerCase();
      return nombre.includes(termino) || tipo.includes(termino);
    });
  }, [certamenes, busquedaCertamen]);

  // ====================================================
  // RESULTADO Y PDF
  // ====================================================

  const mostrarResultado = (
    titulo: string,
    mensaje: string,
    exito = false
  ) => {
    setResultado({ visible: true, titulo, mensaje, exito });
  };

  const seleccionarPdf = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const archivo = res.assets[0];
        if (
          archivo.mimeType === 'application/pdf' ||
          archivo.name?.toLowerCase().endsWith('.pdf')
        ) {
          setCurriculumArchivo({
            uri: archivo.uri,
            name: archivo.name,
            mimeType: archivo.mimeType || 'application/pdf',
          });
        } else {
          mostrarResultado(
            'Formato no válido',
            'El archivo seleccionado debe ser en formato PDF.',
            false
          );
        }
      }
    } catch {
      mostrarResultado('Error', 'No se pudo seleccionar el archivo.', false);
    }
  };

  // ====================================================
  // CARGAR DATOS INICIALES
  // ====================================================

  useEffect(() => {
    let activo = true;

    const cargar = async () => {
      setCargando(true);

      try {
        let original: any = null;
        if (juradoParam) {
          try {
            original = JSON.parse(String(juradoParam));
          } catch {
            original = null;
          }
        }

        if (!juradoParam) {
          setIdJurado(null);
          setIdUsuario(null);
          setIdSala(null);
          setInstitucion('');
          setPuesto('');
          setSexo('');
          setAreaParticipacion('');
          setAreaEspecializada('');
          setInvitacionTexto('');
          setCurriculumArchivo(null);
          setPerfilEncontrado(false);
        }

        const [respCertamenes, respUsuarios] = await Promise.all([
          getCertamenes(),
          getUsuariosParaJurado(),
        ]);

        if (!activo) return;

        const listaCertamenes = extraerLista(respCertamenes).filter(
          (x) => Number.isFinite(idCertamenDe(x)) && idCertamenDe(x) > 0
        );

        const listaUsuarios = extraerLista(respUsuarios).filter(
          (x) => Number.isFinite(idUsuarioDe(x)) && idUsuarioDe(x) > 0
        );

        setCertamenes(listaCertamenes);
        setUsuarios(listaUsuarios);

        if (original) {
          setIdJurado(Number(original.Id_jurado) || null);
          setIdUsuario(Number(original.Id_usuario) || null);
          setIdSala(
            original.Id_sala == null || original.Id_sala === ''
              ? null
              : Number(original.Id_sala)
          );
          setInstitucion(String(original.Institucion ?? ''));
          setPuesto(String(original.Puesto ?? original.puesto ?? ''));
          setSexo(String(original.Sexo ?? original.sexo ?? ''));
          setAreaParticipacion(String(original.Area_participacion ?? ''));
          setAreaEspecializada(String(original.Area_especializada ?? ''));
          setInvitacionTexto(String(original.Invitacion ?? ''));

          if (original.Curriculum) {
            setCurriculumArchivo({
              uri: original.Curriculum,
              name:
                String(original.Curriculum).split('/').pop() ||
                'Curriculum.pdf',
              mimeType: 'application/pdf',
            });
          }
        }

        const idOriginal = Number(
          original?.Id_certamen ??
            original?.id_certamen ??
            original?.certamen?.Id_certamen ??
            idCertamenParam
        );

        const porDefecto =
          listaCertamenes.find((x) => idCertamenDe(x) === idOriginal) ??
          listaCertamenes.find(
            (x) => String(x.Tipo ?? x.tipo).toUpperCase() === 'RALLY'
          ) ??
          listaCertamenes[0] ??
          null;

        setIdCertamen(porDefecto ? idCertamenDe(porDefecto) : null);
      } catch (error: any) {
        if (activo) {
          mostrarResultado(
            'Error',
            error?.message || 'No se pudieron cargar los datos.',
            false
          );
        }
      } finally {
        if (activo) setCargando(false);
      }
    };

    void cargar();
    return () => {
      activo = false;
    };
  }, [juradoParam, idCertamenParam]);

  // ====================================================
  // CARGAR PERFIL PROFESIONAL AL ELEGIR USUARIO
  // ====================================================

  useEffect(() => {
    let activo = true;

    const cargarPerfil = async () => {
      if (!idUsuario) {
        setPerfilEncontrado(false);
        return;
      }

      setCargandoPerfil(true);
      setPerfilEncontrado(false);

      if (!idJurado) {
        setInstitucion('');
        setPuesto('');
        setSexo('');
        setAreaParticipacion('');
        setAreaEspecializada('');
        setCurriculumArchivo(null);
      }

      try {
        const respuesta = await getPerfilJuradoPorUsuario(Number(idUsuario));
        if (!activo) return;

        if (!respuesta?.completo || !respuesta?.perfil) {
          setPerfilEncontrado(false);
          return;
        }

        const perfil = respuesta.perfil;

        setInstitucion((prev) => prev || String(perfil.Institucion ?? ''));
        setPuesto((prev) => prev || String(perfil.Puesto ?? ''));
        setSexo((prev) => prev || String(perfil.Sexo ?? ''));
        setAreaParticipacion(
          (prev) => prev || String(perfil.Area_participacion ?? '')
        );
        setAreaEspecializada(
          (prev) => prev || String(perfil.Area_especializada ?? '')
        );

        if (perfil.Curriculum) {
          setCurriculumArchivo((prev) =>
            prev
              ? prev
              : {
                  uri: respuesta.curriculum_url || '',
                  ruta: String(perfil.Curriculum),
                  name:
                    String(perfil.Curriculum).split('/').pop() ||
                    'Curriculum.pdf',
                  mimeType: 'application/pdf',
                  esRemoto: true,
                }
          );
        }

        setPerfilEncontrado(true);
      } catch (error: any) {
        if (activo) {
          console.log('Error recuperando perfil profesional:', error);
          mostrarResultado(
            'No se pudo cargar el perfil',
            error?.message ||
              'No fue posible consultar los datos profesionales de este usuario.',
            false
          );
        }
      } finally {
        if (activo) setCargandoPerfil(false);
      }
    };

    void cargarPerfil();
    return () => {
      activo = false;
    };
  }, [idUsuario, idJurado]);

  // ====================================================
  // CARGAR SALAS (SOLO INNOVATECNM)
  // ====================================================

  useEffect(() => {
    let activo = true;

    const cargarSalasCertamen = async () => {
      if (!idCertamen || !esCertamenInnova) {
        setSalas([]);
        setIdSala(null);
        return;
      }

      setCargandoSalas(true);

      try {
        const respuesta = await getSalas(idCertamen);
        if (activo) {
          const lista = extraerLista(respuesta).filter(
            (s) =>
              Number(s.Id_certamen ?? s.id_certamen ?? idCertamen) ===
              Number(idCertamen)
          );
          setSalas(lista);
          setIdSala((actual) =>
            actual != null && lista.some((s) => idSalaDe(s) === Number(actual))
              ? actual
              : null
          );
        }
      } catch {
        if (activo) setSalas([]);
      } finally {
        if (activo) setCargandoSalas(false);
      }
    };

    void cargarSalasCertamen();
    return () => {
      activo = false;
    };
  }, [idCertamen, esCertamenInnova]);

  // ====================================================
  // ACCIONES DE GUARDADO
  // ====================================================

  const seleccionarCertamen = (id: number) => {
    if (Number(idCertamen) !== Number(id)) {
      setIdSala(null);
    }
    setIdCertamen(Number(id));
  };

  const validar = () => {
    if (!idCertamen || !certamenSeleccionado) {
      mostrarResultado(
        'Falta el certamen',
        'Selecciona el certamen correspondiente.',
        false
      );
      return false;
    }

    if (!idUsuario || !usuarioSeleccionado) {
      mostrarResultado(
        'Falta seleccionar usuario',
        'Selecciona un usuario existente.',
        false
      );
      return false;
    }

    if (!institucion.trim() || !areaParticipacion.trim()) {
      mostrarResultado(
        'Datos incompletos',
        'Ingresa la institución y el área de participación.',
        false
      );
      return false;
    }

    return true;
  };

  const guardar = () => {
    if (guardando || !validar()) return;
    setConfirmarVisible(true);
  };

  const confirmarGuardado = async () => {
    if (guardando || !idCertamen || !idUsuario) return;

    setConfirmarVisible(false);
    setGuardando(true);

    try {
      const payload = {
        Id_certamen: Number(idCertamen),
        Id_usuario: Number(idUsuario),
        Id_sala: esCertamenInnova && idSala ? Number(idSala) : null,
        Institucion: institucion.trim(),
        Puesto: puesto.trim() || null,
        Sexo: sexo || null,
        Area_participacion: areaParticipacion.trim(),
        Area_especializada: areaEspecializada.trim() || null,
        Invitacion: invitacionTexto.trim() || null,
        Curriculum: curriculumArchivo
          ? curriculumArchivo.ruta || curriculumArchivo.name
          : null,
      };

      if (idJurado) {
        await actualizarJurado(idJurado, payload);
      } else {
        await crearJurado(payload);
      }

      mostrarResultado(
        idJurado ? '¡Jurado actualizado!' : '¡Jurado registrado!',
        `El jurado ${nombreUsuarioDe(usuarioSeleccionado)} quedó guardado correctamente.`,
        true
      );
    } catch (error: any) {
      const extra = error?.errors
        ? Object.values(error.errors).flat().join('\n')
        : '';

      mostrarResultado(
        'No se pudo guardar el jurado',
        error?.message || extra || 'Revisa la conexión con el servidor.',
        false
      );
    } finally {
      setGuardando(false);
    }
  };

  const cerrarResultado = () => {
    const exito = resultado.exito;
    setResultado(resultadoInicial);
    if (exito) router.back();
  };

  // ====================================================
  // PANTALLA DE CARGA
  // ====================================================

  if (cargando) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#002b45" />
        <Text style={styles.loadingText}>Cargando datos del formulario...</Text>
      </View>
    );
  }

  // ====================================================
  // INTERFAZ PRINCIPAL
  // ====================================================

  return (
    <KeyboardAvoidingView
      style={styles.page}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ENCABEZADO */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons
              name={idJurado ? 'create-outline' : 'ribbon-outline'}
              size={28}
              color="#fff"
            />
          </View>

          <Text style={styles.title}>
            {idJurado
              ? 'Editar Jurado Evaluador'
              : 'Registro de Jurado Evaluador'}
          </Text>

          <Text style={styles.subtitle}>
            Cada registro se vincula a un único certamen. Las salas solo aplican
            para eventos InnovaTecNM.
          </Text>
        </View>

        {/* ============================================
            TARJETA 1: CERTAMEN SELECCIONADO
        ============================================ */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>1</Text>
            </View>
            <Text style={styles.sectionTitle}>Certamen Seleccionado</Text>
          </View>

          <TouchableOpacity
            style={styles.certamenSelector}
            activeOpacity={0.8}
            onPress={() => {
              setBusquedaCertamen('');
              setSelectorCertamen(true);
            }}
          >
            <View
              style={[
                styles.certamenSelectorIcon,
                esCertamenInnova && styles.certamenSelectorIconInnova,
              ]}
            >
              <Ionicons
                name={
                  certamenSeleccionado
                    ? esInnova(certamenSeleccionado)
                      ? 'bulb-outline'
                      : 'trophy-outline'
                    : 'trophy-outline'
                }
                size={24}
                color={esCertamenInnova ? '#087B8B' : '#002B45'}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={styles.certamenSelectorNombre}>
                {certamenSeleccionado
                  ? certamenSeleccionado.Nombre
                  : 'Selecciona un certamen'}
              </Text>

              <View style={styles.badgeTipoRow}>
                <View
                  style={[
                    styles.tipoBadge,
                    esCertamenInnova
                      ? styles.tipoBadgeInnova
                      : styles.tipoBadgeRally,
                  ]}
                >
                  <Text
                    style={[
                      styles.tipoBadgeText,
                      esCertamenInnova
                        ? styles.tipoBadgeTextInnova
                        : styles.tipoBadgeTextRally,
                    ]}
                  >
                    {certamenSeleccionado
                      ? tipoVisible(certamenSeleccionado.Tipo)
                      : 'Sin definir'}
                  </Text>
                </View>

                <Text style={styles.certamenSelectorHint}>
                  Toca para cambiar
                </Text>
              </View>
            </View>

            <Ionicons name="chevron-down" size={22} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* ============================================
            TARJETA 2: USUARIO DEL JURADO
        ============================================ */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>2</Text>
            </View>
            <Text style={styles.sectionTitle}>Cuenta de Usuario</Text>
          </View>

          <Text style={styles.label}>Usuario vinculado *</Text>

          <TouchableOpacity
            style={styles.selector}
            activeOpacity={0.8}
            onPress={() => {
              setBusquedaUsuario('');
              setSelectorUsuario(true);
            }}
          >
            <Ionicons
              name="person-circle-outline"
              size={22}
              color="#087B8B"
            />

            <Text
              style={[
                styles.selectorText,
                !usuarioSeleccionado && styles.placeholder,
              ]}
              numberOfLines={1}
            >
              {usuarioSeleccionado
                ? `${nombreUsuarioDe(usuarioSeleccionado)}${
                    usuarioSeleccionado.Correo
                      ? ` · ${usuarioSeleccionado.Correo}`
                      : ''
                  }`
                : 'Selecciona un usuario existente'}
            </Text>

            <Ionicons name="chevron-down" size={19} color="#64748b" />
          </TouchableOpacity>

          <Text style={styles.helper}>
            El usuario debe estar dado de alta previamente en el módulo
            Usuarios.
          </Text>
        </View>

        {/* ============================================
            TARJETA 3: DATOS PROFESIONALES Y CV
        ============================================ */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>3</Text>
            </View>
            <Text style={styles.sectionTitle}>
              Perfil Profesional y Curriculum
            </Text>
          </View>

          {/* BANNER DE ESTADO DEL PERFIL */}
          {cargandoPerfil ? (
            <View style={styles.infoBox}>
              <ActivityIndicator color="#087B8B" />
              <Text style={styles.infoText}>
                Consultando datos y curriculum registrados...
              </Text>
            </View>
          ) : perfilEncontrado ? (
            <View style={[styles.infoBox, styles.infoBoxSuccess]}>
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="#15803d"
              />
              <Text style={[styles.infoText, { color: '#166534' }]}>
                Perfil profesional recuperado automáticamente.
              </Text>
            </View>
          ) : idUsuario ? (
            <View style={styles.infoBox}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#92400e"
              />
              <Text style={styles.infoText}>
                Este usuario aún no tiene un perfil profesional guardado.
              </Text>
            </View>
          ) : null}

          {/* INSTITUCION */}
          <Text style={styles.label}>Institución u organización *</Text>
          <View style={styles.inputContainer}>
            <Ionicons
              name="business-outline"
              size={18}
              color="#64748b"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Ej. ITSSMT / CIDE / UAP"
              placeholderTextColor="#94a3b8"
              value={institucion}
              onChangeText={setInstitucion}
            />
          </View>

          {/* PUESTO */}
          <Text style={styles.label}>Puesto o cargo</Text>
          <View style={styles.inputContainer}>
            <Ionicons
              name="briefcase-outline"
              size={18}
              color="#64748b"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Ej. Docente, investigador, gerente"
              placeholderTextColor="#94a3b8"
              value={puesto}
              onChangeText={setPuesto}
            />
          </View>

          {/* SEXO */}
          <Text style={styles.label}>Sexo</Text>
          <View style={styles.chipsRow}>
            {['Femenino', 'Masculino', 'Otro', 'Prefiero no decir'].map(
              (op) => (
                <TouchableOpacity
                  key={op}
                  style={[styles.chip, sexo === op && styles.chipActivo]}
                  onPress={() => setSexo(sexo === op ? '' : op)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.chipText,
                      sexo === op && styles.chipTextActivo,
                    ]}
                  >
                    {op}
                  </Text>
                </TouchableOpacity>
              )
            )}
          </View>

          {/* AREA PARTICIPACION */}
          <Text style={styles.label}>Área de participación *</Text>
          <View style={styles.inputContainer}>
            <Ionicons
              name="layers-outline"
              size={18}
              color="#64748b"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Ej. Sistemas e Inteligencia Artificial"
              placeholderTextColor="#94a3b8"
              value={areaParticipacion}
              onChangeText={setAreaParticipacion}
            />
          </View>

          {/* AREA ESPECIALIZADA */}
          <Text style={styles.label}>Área especializada</Text>
          <View style={styles.inputContainer}>
            <Ionicons
              name="sparkles-outline"
              size={18}
              color="#64748b"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Ej. Ciberseguridad, Redes y Telecomunicaciones"
              placeholderTextColor="#94a3b8"
              value={areaEspecializada}
              onChangeText={setAreaEspecializada}
            />
          </View>

          {/* CURRICULUM PDF */}
          <Text style={styles.label}>Curriculum Vitae (PDF)</Text>
          <TouchableOpacity
            style={styles.selector}
            onPress={seleccionarPdf}
            activeOpacity={0.8}
          >
            <Ionicons
              name="document-text-outline"
              size={22}
              color="#087B8B"
            />
            <Text
              style={[
                styles.selectorText,
                !curriculumArchivo && styles.placeholder,
              ]}
              numberOfLines={1}
            >
              {curriculumArchivo
                ? curriculumArchivo.name
                : 'Seleccionar archivo PDF del dispositivo'}
            </Text>
            <Ionicons name="attach-outline" size={20} color="#64748b" />
          </TouchableOpacity>

          {/* PREVIEW PDF REMOTO */}
          {curriculumArchivo?.esRemoto && curriculumArchivo.uri ? (
            <TouchableOpacity
              style={styles.pdfPreviewCard}
              activeOpacity={0.8}
              onPress={async () => {
                try {
                  await Linking.openURL(curriculumArchivo.uri);
                } catch {
                  mostrarResultado(
                    'No se pudo abrir el PDF',
                    'Verifica que el archivo siga disponible en el servidor.',
                    false
                  );
                }
              }}
            >
              <Ionicons name="document-text" size={32} color="#dc2626" />
              <View style={{ flex: 1 }}>
                <Text style={styles.pdfPreviewTitle}>
                  Curriculum del jurado
                </Text>
                <Text style={styles.pdfPreviewName} numberOfLines={2}>
                  {curriculumArchivo.name}
                </Text>
                <Text style={styles.pdfPreviewHint}>
                  Toca aquí para visualizar el documento
                </Text>
              </View>
              <Ionicons name="eye-outline" size={22} color="#087B8B" />
            </TouchableOpacity>
          ) : null}

          {/* QUITAR PDF LOCAL */}
          {curriculumArchivo && !curriculumArchivo.esRemoto ? (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setCurriculumArchivo(null)}
            >
              <Ionicons name="trash-outline" size={14} color="#dc2626" />
              <Text style={[styles.clearText, { color: '#dc2626' }]}>
                Quitar archivo PDF
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* ============================================
            TARJETA 4: SALA E INVITACIÓN
        ============================================ */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>4</Text>
            </View>
            <Text style={styles.sectionTitle}>Sala e Invitación</Text>
          </View>

          {esCertamenInnova ? (
            <>
              <Text style={styles.label}>Sala asignada (opcional)</Text>

              <TouchableOpacity
                style={styles.selector}
                onPress={() => setSelectorSala(true)}
                disabled={cargandoSalas}
                activeOpacity={0.8}
              >
                {cargandoSalas ? (
                  <ActivityIndicator color="#087B8B" />
                ) : (
                  <Ionicons
                    name="location-outline"
                    size={20}
                    color="#087B8B"
                  />
                )}

                <Text
                  style={[
                    styles.selectorText,
                    !salaSeleccionada && styles.placeholder,
                  ]}
                  numberOfLines={1}
                >
                  {cargandoSalas
                    ? 'Cargando salas...'
                    : salaSeleccionada
                      ? `${salaSeleccionada.Nombre ?? salaSeleccionada.nombre} · ${salaSeleccionada.Ubicacion ?? ''}`
                      : 'Sin sala asignada'}
                </Text>

                <Ionicons name="chevron-down" size={19} color="#64748b" />
              </TouchableOpacity>

              {idSala ? (
                <TouchableOpacity
                  style={styles.clearButton}
                  onPress={() => setIdSala(null)}
                >
                  <Ionicons
                    name="close-circle-outline"
                    size={15}
                    color="#087B8B"
                  />
                  <Text style={styles.clearText}>
                    Quitar asignación de sala
                  </Text>
                </TouchableOpacity>
              ) : null}
            </>
          ) : (
            <View style={styles.infoBox}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#92400e"
              />
              <Text style={styles.infoText}>
                Los eventos Rally no utilizan salas. El jurado se guardará sin
                sala asignada.
              </Text>
            </View>
          )}

          {/* INVITACION */}
          <Text style={styles.label}>Datos de la Invitación (Contacto)</Text>
          <TextInput
            style={styles.textArea}
            placeholder={`Ejemplo:\nNombre: Dr. Roberto Gómez\nTeléfono: 248 123 4567\nPuesto: Investigador\nCorreo: roberto.gomez@itssmt.edu.mx`}
            placeholderTextColor="#94a3b8"
            value={invitacionTexto}
            onChangeText={setInvitacionTexto}
            multiline={true}
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* ============================================
            BOTÓN GUARDAR
        ============================================ */}
        <TouchableOpacity
          style={[styles.saveButton, guardando && styles.disabled]}
          onPress={guardar}
          disabled={guardando}
          activeOpacity={0.85}
        >
          {guardando ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons
                name="checkmark-circle-outline"
                size={22}
                color="#fff"
              />
              <Text style={styles.saveText}>
                {idJurado ? 'Guardar cambios' : 'Registrar jurado'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.backLink}
          onPress={() => router.back()}
          disabled={guardando}
        >
          <Text style={styles.backLinkText}>Cancelar y regresar</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ==================================================
          MODAL SELECCIONAR CERTAMEN
      ================================================== */}
      <Modal
        visible={selectorCertamen}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectorCertamen(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Seleccionar certamen</Text>
              <TouchableOpacity onPress={() => setSelectorCertamen(false)}>
                <Ionicons name="close" size={26} color="#334155" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={20} color="#64748b" />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nombre o tipo..."
                placeholderTextColor="#94a3b8"
                value={busquedaCertamen}
                onChangeText={setBusquedaCertamen}
                autoCapitalize="none"
              />
              {busquedaCertamen.length > 0 ? (
                <TouchableOpacity onPress={() => setBusquedaCertamen('')}>
                  <Ionicons name="close-circle" size={19} color="#94a3b8" />
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView
              style={{ maxHeight: 400 }}
              keyboardShouldPersistTaps="handled"
            >
              {certamenesFiltrados.length > 0 ? (
                certamenesFiltrados.map((cert) => {
                  const id = idCertamenDe(cert);
                  const seleccionado = Number(idCertamen) === Number(id);
                  const innova = esInnova(cert);

                  return (
                    <TouchableOpacity
                      key={String(id)}
                      style={[
                        styles.certamenOption,
                        seleccionado && styles.certamenOptionSelected,
                      ]}
                      activeOpacity={0.8}
                      onPress={() => {
                        seleccionarCertamen(id);
                        setSelectorCertamen(false);
                        setBusquedaCertamen('');
                      }}
                    >
                      <View
                        style={[
                          styles.certamenOptionIcon,
                          seleccionado && styles.certamenOptionIconSelected,
                        ]}
                      >
                        <Ionicons
                          name={innova ? 'bulb-outline' : 'trophy-outline'}
                          size={22}
                          color={seleccionado ? '#15803d' : '#087B8B'}
                        />
                      </View>

                      <View style={{ flex: 1 }}>
                        <Text
                          style={[
                            styles.certamenOptionNombre,
                            seleccionado && styles.certamenOptionNombreSelected,
                          ]}
                        >
                          {cert.Nombre}
                        </Text>
                        <Text
                          style={[
                            styles.certamenOptionTipo,
                            seleccionado && styles.certamenOptionTipoSelected,
                          ]}
                        >
                          {tipoVisible(cert.Tipo)}
                        </Text>
                      </View>

                      {seleccionado ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={22}
                          color="#15803d"
                        />
                      ) : null}
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.noResultsBox}>
                  <Ionicons name="search-outline" size={30} color="#94a3b8" />
                  <Text style={styles.emptyText}>
                    No se encontraron certámenes.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==================================================
          MODAL SELECCIONAR USUARIO
      ================================================== */}
      <Modal
        visible={selectorUsuario}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectorUsuario(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>Seleccionar usuario</Text>
              <TouchableOpacity onPress={() => setSelectorUsuario(false)}>
                <Ionicons name="close" size={26} color="#334155" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={20} color="#64748b" />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por nombre o correo..."
                placeholderTextColor="#94a3b8"
                value={busquedaUsuario}
                onChangeText={setBusquedaUsuario}
              />
              {busquedaUsuario.length > 0 ? (
                <TouchableOpacity onPress={() => setBusquedaUsuario('')}>
                  <Ionicons name="close-circle" size={19} color="#94a3b8" />
                </TouchableOpacity>
              ) : null}
            </View>

            <ScrollView
              style={{ maxHeight: 360 }}
              keyboardShouldPersistTaps="handled"
            >
              {usuariosFiltrados.length ? (
                usuariosFiltrados.map((u) => {
                  const activo = Number(idUsuario) === idUsuarioDe(u);
                  return (
                    <TouchableOpacity
                      key={idUsuarioDe(u)}
                      style={[
                        styles.option,
                        activo && styles.optionSelected,
                      ]}
                      onPress={() => {
                        setIdUsuario(idUsuarioDe(u));
                        setSelectorUsuario(false);
                      }}
                    >
                      <Ionicons
                        name="person-outline"
                        size={19}
                        color={activo ? '#15803d' : '#087B8B'}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.optionTitle}>
                          {nombreUsuarioDe(u)}
                        </Text>
                        <Text style={styles.optionSub}>
                          {u.Correo ??
                            u.email ??
                            u.Usuario ??
                            `ID ${idUsuarioDe(u)}`}
                        </Text>
                      </View>
                      {activo ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color="#15803d"
                        />
                      ) : null}
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={styles.emptyText}>
                  No hay usuarios que coincidan.
                </Text>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setSelectorUsuario(false)}
            >
              <Text style={styles.cancelText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ==================================================
          MODAL SELECCIONAR SALA
      ================================================== */}
      <Modal
        visible={selectorSala}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectorSala(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalTitle}>
                {`Salas de ${certamenSeleccionado?.Nombre ?? 'InnovaTecNM'}`}
              </Text>
              <TouchableOpacity onPress={() => setSelectorSala(false)}>
                <Ionicons name="close" size={26} color="#334155" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 360 }}>
              <TouchableOpacity
                style={styles.option}
                onPress={() => {
                  setIdSala(null);
                  setSelectorSala(false);
                }}
              >
                <Ionicons
                  name="close-circle-outline"
                  size={19}
                  color="#64748b"
                />
                <Text style={styles.optionTitle}>Sin sala asignada</Text>
              </TouchableOpacity>

              {salas.map((s) => {
                const activa = Number(idSala) === idSalaDe(s);
                return (
                  <TouchableOpacity
                    key={idSalaDe(s)}
                    style={[styles.option, activa && styles.optionSelected]}
                    onPress={() => {
                      setIdSala(idSalaDe(s));
                      setSelectorSala(false);
                    }}
                  >
                    <Ionicons
                      name="business-outline"
                      size={18}
                      color={activa ? '#15803d' : '#087B8B'}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.optionTitle}>
                        {s.Nombre ?? s.nombre}
                      </Text>
                      <Text style={styles.optionSub}>
                        {s.Ubicacion ?? s.ubicacion ?? 'Sin ubicación'}
                      </Text>
                    </View>
                    {activa ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={20}
                        color="#15803d"
                      />
                    ) : null}
                  </TouchableOpacity>
                );
              })}

              {!salas.length && !cargandoSalas ? (
                <Text style={styles.emptyText}>
                  Este certamen no tiene salas registradas.
                </Text>
              ) : null}
            </ScrollView>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setSelectorSala(false)}
            >
              <Text style={styles.cancelText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ==================================================
          MODAL CONFIRMACION
      ================================================== */}
      <Modal
        visible={confirmarVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmarVisible(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <Ionicons
                name="help-circle-outline"
                size={32}
                color="#087B8B"
              />
            </View>

            <Text style={styles.modalTitle}>
              {idJurado
                ? '¿Guardar cambios del jurado?'
                : '¿Registrar este jurado?'}
            </Text>

            <View style={styles.summaryBox}>
              <Text style={styles.summaryLine}>
                <Text style={styles.summaryBold}>Usuario: </Text>
                {usuarioSeleccionado
                  ? nombreUsuarioDe(usuarioSeleccionado)
                  : 'Sin seleccionar'}
              </Text>
              <Text style={styles.summaryLine}>
                <Text style={styles.summaryBold}>Certamen: </Text>
                {certamenSeleccionado?.Nombre ?? 'Sin seleccionar'}
              </Text>
              <Text style={styles.summaryLine}>
                <Text style={styles.summaryBold}>Sala: </Text>
                {esCertamenInnova
                  ? (salaSeleccionada?.Nombre ?? 'Sin asignación')
                  : 'No aplica para Rally'}
              </Text>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setConfirmarVisible(false)}
                disabled={guardando}
              >
                <Text style={styles.cancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => void confirmarGuardado()}
                disabled={guardando}
              >
                <Text style={styles.confirmText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ==================================================
          MODAL RESULTADO
      ================================================== */}
      <Modal
        visible={resultado.visible}
        transparent
        animationType="fade"
        onRequestClose={cerrarResultado}
      >
        <View style={styles.backdrop}>
          <View style={styles.modalCard}>
            <View
              style={[
                styles.modalIcon,
                resultado.exito ? styles.successIcon : styles.errorIcon,
              ]}
            >
              <Ionicons
                name={
                  resultado.exito
                    ? 'checkmark-circle-outline'
                    : 'alert-circle-outline'
                }
                size={32}
                color={resultado.exito ? '#15803d' : '#b91c1c'}
              />
            </View>

            <Text style={styles.modalTitle}>{resultado.titulo}</Text>
            <Text style={styles.modalMessage}>{resultado.mensaje}</Text>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={cerrarResultado}
            >
              <Text style={styles.confirmText}>Aceptar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// ======================================================
// ESTILOS
// ======================================================

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },

  container: {
    padding: 18,
    paddingBottom: 45,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
  },

  loadingText: {
    marginTop: 10,
    color: '#475569',
    fontWeight: '600',
  },

  header: {
    alignItems: 'center',
    marginBottom: 22,
    paddingTop: 4,
  },

  headerIcon: {
    width: 60,
    height: 60,
    borderRadius: 20,
    backgroundColor: '#002B45',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#002B45',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },

  title: {
    textAlign: 'center',
    fontSize: 23,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.3,
  },

  subtitle: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 18,
    color: '#64748B',
    marginTop: 5,
    paddingHorizontal: 10,
  },

  // ====================================================
  // TARJETAS DE SECCIÓN
  // ====================================================

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },

  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },

  stepBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#087B8B',
    alignItems: 'center',
    justifyContent: 'center',
  },

  stepBadgeText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  sectionTitle: {
    fontSize: 16,
    color: '#002B45',
    fontWeight: '800',
  },

  // ====================================================
  // SELECTOR DE CERTAMEN
  // ====================================================

  certamenSelector: {
    minHeight: 82,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  certamenSelectorIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  certamenSelectorIconInnova: {
    backgroundColor: '#CCFBF1',
  },

  certamenSelectorNombre: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },

  badgeTipoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 5,
  },

  tipoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },

  tipoBadgeRally: {
    backgroundColor: '#DBEAFE',
  },

  tipoBadgeInnova: {
    backgroundColor: '#D1FAE5',
  },

  tipoBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },

  tipoBadgeTextRally: {
    color: '#1D4ED8',
  },

  tipoBadgeTextInnova: {
    color: '#047857',
  },

  certamenSelectorHint: {
    color: '#087B8B',
    fontSize: 11,
    fontWeight: '700',
  },

  // ====================================================
  // SELECTORES E INPUTS
  // ====================================================

  selector: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  selectorText: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '500',
  },

  placeholder: {
    color: '#94A3B8',
    fontWeight: '400',
  },

  helper: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 7,
  },

  label: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '700',
    marginTop: 14,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
  },

  inputIcon: {
    marginRight: 9,
  },

  input: {
    flex: 1,
    minHeight: 48,
    color: '#0F172A',
    fontSize: 14,
  },

  textArea: {
    minHeight: 105,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 12,
    color: '#0F172A',
    fontSize: 13,
    lineHeight: 19,
  },

  // ====================================================
  // CHIPS DE SEXO
  // ====================================================

  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  chip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
  },

  chipActivo: {
    backgroundColor: '#002B45',
    borderColor: '#002B45',
  },

  chipText: {
    color: '#334155',
    fontSize: 12,
    fontWeight: '700',
  },

  chipTextActivo: {
    color: '#FFFFFF',
  },

  // ====================================================
  // CAJAS DE INFORMACIÓN Y PDF
  // ====================================================

  infoBox: {
    flexDirection: 'row',
    gap: 9,
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderColor: '#FDE68A',
    borderWidth: 1,
    padding: 11,
    borderRadius: 11,
    marginBottom: 4,
  },

  infoBoxSuccess: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },

  infoText: {
    flex: 1,
    color: '#92400E',
    fontSize: 12,
    lineHeight: 17,
  },

  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },

  clearText: {
    color: '#087B8B',
    fontWeight: '700',
    fontSize: 12,
  },

  pdfPreviewCard: {
    marginTop: 10,
    padding: 13,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FFF7F7',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },

  pdfPreviewTitle: {
    color: '#7F1D1D',
    fontWeight: '800',
    fontSize: 13,
  },

  pdfPreviewName: {
    color: '#334155',
    fontSize: 12,
    marginTop: 2,
  },

  pdfPreviewHint: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 3,
  },

  // ====================================================
  // BOTONES PRINCIPALES
  // ====================================================

  saveButton: {
    marginTop: 6,
    minHeight: 54,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 9,
    borderRadius: 14,
    backgroundColor: '#82A323',
    shadowColor: '#82A323',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },

  saveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  disabled: {
    opacity: 0.6,
  },

  backLink: {
    alignItems: 'center',
    paddingVertical: 14,
    marginTop: 6,
  },

  backLinkText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
  },

  // ====================================================
  // MODALES
  // ====================================================

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.52)',
    justifyContent: 'center',
    padding: 18,
  },

  modalCard: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 18,
    maxHeight: '88%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },

  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },

  modalIcon: {
    alignSelf: 'center',
    marginBottom: 10,
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#E0F2FE',
  },

  successIcon: {
    backgroundColor: '#DCFCE7',
  },

  errorIcon: {
    backgroundColor: '#FEE2E2',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },

  modalMessage: {
    fontSize: 13,
    lineHeight: 19,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 16,
  },

  summaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    gap: 5,
  },

  summaryLine: {
    fontSize: 13,
    color: '#334155',
  },

  summaryBold: {
    fontWeight: '800',
    color: '#002B45',
  },

  searchBox: {
    minHeight: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },

  searchInput: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
    paddingVertical: 7,
  },

  certamenOption: {
    minHeight: 72,
    paddingVertical: 11,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    borderRadius: 12,
  },

  certamenOptionSelected: {
    backgroundColor: '#ECFDF5',
  },

  certamenOptionIcon: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },

  certamenOptionIconSelected: {
    backgroundColor: '#DCFCE7',
  },

  certamenOptionNombre: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },

  certamenOptionNombreSelected: {
    color: '#166534',
  },

  certamenOptionTipo: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },

  certamenOptionTipoSelected: {
    color: '#166534',
  },

  noResultsBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomColor: '#E2E8F0',
    borderBottomWidth: 1,
    borderRadius: 10,
  },

  optionSelected: {
    backgroundColor: '#ECFDF5',
  },

  optionTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },

  optionSub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },

  emptyText: {
    color: '#64748B',
    textAlign: 'center',
    padding: 16,
    fontSize: 12,
  },

  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },

  cancelButton: {
    padding: 13,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    flex: 1,
  },

  cancelText: {
    color: '#334155',
    fontWeight: '700',
  },

  confirmButton: {
    padding: 13,
    borderRadius: 11,
    backgroundColor: '#002B45',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
    flex: 1,
  },

  confirmText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
});