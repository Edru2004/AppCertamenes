import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  Modal,
  PanResponder,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  getCertamenes,
  getEquipos,
  getIntegrantes,
  getJurados,
  getModalidadSeleccionada,
  guardarModalidadSeleccionada,
  limpiarModalidadSeleccionada,
} from '../../services/api';

// ======================================================
// TIPOS DE ELEMENTOS EDITABLES (TEXTO O IMAGEN/FIRMA)
// ======================================================

type AlineacionTexto = 'left' | 'center' | 'right';

type ElementoLienzo =
  | {
      tipo: 'texto';
      id: string;
      etiqueta: string;
      texto: string;
      xPct: number;
      yPct: number;
      anchoPct: number;
      fontSize: number;
      color: string;
      negrita: boolean;
      alineacion: AlineacionTexto;
    }
  | {
      tipo: 'imagen';
      id: string;
      etiqueta: string;
      uri: string;
      base64: string;
      mime: string;
      aspectRatio: number;
      xPct: number;
      yPct: number;
      anchoPct: number;
    };

const ELEMENTOS_INICIALES: ElementoLienzo[] = [
  {
    tipo: 'texto',
    id: 'cuadro_1',
    etiqueta: 'Cuadro 1 (Nombre)',
    texto: 'Cuadro 1',
    xPct: 50,
    yPct: 41,
    anchoPct: 78,
    fontSize: 16,
    color: '#002B45',
    negrita: true,
    alineacion: 'center',
  },
  {
    tipo: 'texto',
    id: 'cuadro_2',
    etiqueta: 'Cuadro 2 (Equipo / Rol)',
    texto: 'Cuadro 2',
    xPct: 50,
    yPct: 50,
    anchoPct: 78,
    fontSize: 12,
    color: '#334155',
    negrita: false,
    alineacion: 'center',
  },
  {
    tipo: 'texto',
    id: 'cuadro_3',
    etiqueta: 'Cuadro 3 (Certamen)',
    texto: 'Cuadro 3',
    xPct: 50,
    yPct: 59,
    anchoPct: 78,
    fontSize: 12,
    color: '#087B8B',
    negrita: true,
    alineacion: 'center',
  },
  {
    tipo: 'texto',
    id: 'cuadro_4',
    etiqueta: 'Cuadro 4 (Fecha / Sede)',
    texto: 'Cuadro 4',
    xPct: 50,
    yPct: 68,
    anchoPct: 72,
    fontSize: 10,
    color: '#64748B',
    negrita: false,
    alineacion: 'center',
  },
];

const COLORES_DISPONIBLES = [
  '#002B45',
  '#087B8B',
  '#0F172A',
  '#82A323',
  '#B45309',
  '#DC2626',
  '#FFFFFF',
];

// ======================================================
// HELPERS PARA NORMALIZAR RESPUESTAS DE LARAVEL
// ======================================================

const extraerLista = (respuesta: any, claveOpcional?: string): any[] => {
  if (Array.isArray(respuesta)) return respuesta;
  if (claveOpcional && Array.isArray(respuesta?.[claveOpcional])) {
    return respuesta[claveOpcional];
  }
  if (Array.isArray(respuesta?.data)) return respuesta.data;
  if (Array.isArray(respuesta?.data?.data)) return respuesta.data.data;
  return [];
};

const formatearNombrePersona = (obj: any, fallback: string): string => {
  if (!obj) return fallback;

  const directo =
    obj?.Nombre_usuario ??
    obj?.nombre_usuario ??
    obj?.Nombre_completo ??
    obj?.nombre_completo ??
    obj?.Nombre_jurado ??
    obj?.nombre_jurado ??
    obj?.usuario?.Nombre_completo;

  if (typeof directo === 'string' && directo.trim()) {
    return directo.trim();
  }

  const u = obj?.usuario ?? obj?.user ?? obj?.perfil ?? obj;

  const nombre = [
    u?.Nombre ?? u?.Nom ?? u?.nombre ?? obj?.Nombre ?? obj?.Nom ?? obj?.nombre ?? '',
    u?.App ?? u?.apellido_paterno ?? obj?.App ?? obj?.apellido_paterno ?? '',
    u?.Apm ?? u?.apellido_materno ?? obj?.Apm ?? obj?.apellido_materno ?? '',
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  if (nombre) return nombre;

  const respaldo =
    obj?.Nombre_login ??
    obj?.Correo_usuario ??
    u?.Correo ??
    obj?.Correo;

  if (typeof respaldo === 'string' && respaldo.trim()) {
    return respaldo.trim();
  }

  return fallback;
};

// ======================================================
// COMPONENTE ARRASTRABLE (TEXTO O FIRMA PNG)
// ======================================================

function ElementoArrastrable({
  elemento,
  seleccionado,
  tamanoLienzo,
  onSeleccionar,
  onMover,
  onToggleArrastre,
}: {
  elemento: ElementoLienzo;
  seleccionado: boolean;
  tamanoLienzo: { width: number; height: number };
  onSeleccionar: () => void;
  onMover: (nuevoXPct: number, nuevoYPct: number) => void;
  onToggleArrastre: (arrastrando: boolean) => void;
}) {
  const estadoRef = useRef({
    elemento,
    tamanoLienzo,
    onSeleccionar,
    onMover,
    onToggleArrastre,
  });

  useEffect(() => {
    estadoRef.current = {
      elemento,
      tamanoLienzo,
      onSeleccionar,
      onMover,
      onToggleArrastre,
    };
  }, [elemento, tamanoLienzo, onSeleccionar, onMover, onToggleArrastre]);

  const posInicial = useRef({ x: 0, y: 0 });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        const {
          elemento: el,
          tamanoLienzo: tl,
          onSeleccionar: sel,
          onToggleArrastre: tog,
        } = estadoRef.current;
        sel();
        tog(true);
        posInicial.current = {
          x: (el.xPct / 100) * tl.width,
          y: (el.yPct / 100) * tl.height,
        };
      },
      onPanResponderMove: (_, gestureState) => {
        const { tamanoLienzo: tl, onMover: mov } = estadoRef.current;
        if (!tl.width || !tl.height) return;

        const nuevaX = Math.max(
          10,
          Math.min(tl.width - 10, posInicial.current.x + gestureState.dx)
        );
        const nuevaY = Math.max(
          10,
          Math.min(tl.height - 10, posInicial.current.y + gestureState.dy)
        );

        const xPct = Number(((nuevaX / tl.width) * 100).toFixed(1));
        const yPct = Number(((nuevaY / tl.height) * 100).toFixed(1));
        mov(xPct, yPct);
      },
      onPanResponderRelease: () => {
        estadoRef.current.onToggleArrastre(false);
      },
      onPanResponderTerminate: () => {
        estadoRef.current.onToggleArrastre(false);
      },
    })
  ).current;

  if (!tamanoLienzo.width) return null;

  const anchoPx = (elemento.anchoPct / 100) * tamanoLienzo.width;
  const altoImagenPx =
    elemento.tipo === 'imagen' ? anchoPx / (elemento.aspectRatio || 2.2) : 32;

  const leftPx = (elemento.xPct / 100) * tamanoLienzo.width - anchoPx / 2;
  const topPx =
    (elemento.yPct / 100) * tamanoLienzo.height -
    (elemento.tipo === 'imagen' ? altoImagenPx / 2 : 16);

  return (
    <View
      {...panResponder.panHandlers}
      style={[
        elemento.tipo === 'imagen'
          ? styles.firmaArrastrable
          : styles.cuadroArrastrable,
        {
          width: anchoPx,
          left: leftPx,
          top: topPx,
        },
        seleccionado && styles.cuadroSeleccionado,
      ]}
    >
      {seleccionado && (
        <View style={styles.indicadorArrastre}>
          <Ionicons name="move" size={11} color="#FFFFFF" />
        </View>
      )}

      {elemento.tipo === 'texto' ? (
        <Text
          style={{
            fontSize: elemento.fontSize,
            color: elemento.color,
            fontWeight: elemento.negrita ? '800' : '500',
            textAlign: elemento.alineacion,
          }}
        >
          {elemento.texto || elemento.etiqueta}
        </Text>
      ) : (
        <Image
          source={{ uri: elemento.uri }}
          style={{
            width: '100%',
            height: altoImagenPx,
          }}
          resizeMode="contain"
        />
      )}
    </View>
  );
}

// ======================================================
// PANTALLA PRINCIPAL DEL EDITOR DE CONSTANCIAS
// ======================================================

export default function EditorConstanciasScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const posEditorY = useRef<number>(0);

  // Modalidad y certamen
  const [modalidad, setModalidad] = useState<'RALLY' | 'INNOVATEC'>('RALLY');
  const [certamenes, setCertamenes] = useState<any[]>([]);
  const [idCertamenActivo, setIdCertamenActivo] = useState<number | null>(null);

  // Sección desplegable de destinatarios: Equipos vs Jurados
  const [listaDestinatariosAbierta, setListaDestinatariosAbierta] =
    useState<boolean>(false);
  const [pestanaDestinatarios, setPestanaDestinatarios] = useState<
    'equipos' | 'jurados'
  >('equipos');
  const [equipos, setEquipos] = useState<any[]>([]);
  const [jurados, setJurados] = useState<any[]>([]);
  const [equipoExpandidoId, setEquipoExpandidoId] = useState<number | null>(
    null
  );
  const [destinatarioSeleccionado, setDestinatarioSeleccionado] =
    useState<string>('');
  const [cargandoDatos, setCargandoDatos] = useState<boolean>(false);
  const [errorCarga, setErrorCarga] = useState<string>('');
  const [busqueda, setBusqueda] = useState<string>('');

  // Lienzo y plantilla
  const [imagenUri, setImagenUri] = useState<string | null>(null);
  const [imagenBase64, setImagenBase64] = useState<string | null>(null);
  const [imagenMime, setImagenMime] = useState<string>('image/png');

  const [elementos, setElementos] =
    useState<ElementoLienzo[]>(ELEMENTOS_INICIALES);
  const [idSeleccionado, setIdSeleccionado] = useState<string>('cuadro_1');

  const [tamanoLienzo, setTamanoLienzo] = useState({ width: 0, height: 0 });
  const [tamanoPreview, setTamanoPreview] = useState({ width: 0, height: 0 });

  const [arrastrando, setArrastrando] = useState(false);
  const [vistaPreviaVisible, setVistaPreviaVisible] = useState(false);
  const [generandoPdf, setGenerandoPdf] = useState(false);

  const actual =
    elementos.find((e) => e.id === idSeleccionado) ?? elementos[0] ?? null;

  const certamenActualObj = certamenes.find(
    (c) =>
      Number(c?.Id_certamen ?? c?.id_certamen ?? c?.id) ===
      Number(idCertamenActivo)
  );
  const nombreCertamenTexto =
    certamenActualObj?.Nombre ??
    certamenActualObj?.nombre ??
    (modalidad === 'RALLY' ? 'Rally' : 'InnovaTecNM');

  // ====================================================
  // CARGAR CERTÁMENES, EQUIPOS (CON INTEGRANTES) Y JURADOS
  // ====================================================

  const cargarDatosPorModalidad = useCallback(
    async (mod: 'RALLY' | 'INNOVATEC', idCertamenManual?: number | null) => {
      try {
        setCargandoDatos(true);
        setErrorCarga('');
        await guardarModalidadSeleccionada(mod);

        const coincideModalidad = (textoTipo: any): boolean => {
          const t = String(textoTipo ?? '').toUpperCase().trim();
          if (!t) return true;
          if (mod === 'RALLY') return t.includes('RALLY');
          return t.includes('INNOVATEC');
        };

        // 1) Obtener certámenes
        const respCertamenes = await getCertamenes();
        let listaCertamenes = extraerLista(respCertamenes, 'certamenes');

        if (listaCertamenes.length === 0) {
          await limpiarModalidadSeleccionada();
          const todosCert = await getCertamenes();
          await guardarModalidadSeleccionada(mod);
          listaCertamenes = extraerLista(todosCert, 'certamenes').filter(
            (c: any) =>
              coincideModalidad(c?.Tipo ?? c?.tipo ?? c?.Nombre ?? c?.nombre)
          );
        }

        setCertamenes(listaCertamenes);

        let idCert = idCertamenManual ?? null;
        if (
          idCert == null ||
          !listaCertamenes.some(
            (c) =>
              Number(c?.Id_certamen ?? c?.id_certamen ?? c?.id) ===
              Number(idCert)
          )
        ) {
          const primero = listaCertamenes[0];
          idCert = primero
            ? Number(primero?.Id_certamen ?? primero?.id_certamen ?? primero?.id)
            : null;
        }
        setIdCertamenActivo(idCert);

        // 2) Obtener equipos
        let listaEquipos = extraerLista(
          await getEquipos(idCert ?? undefined),
          'equipos'
        );

        if (listaEquipos.length === 0) {
          const todosMod = extraerLista(await getEquipos(), 'equipos');
          listaEquipos =
            idCert != null
              ? todosMod.filter(
                  (eq: any) =>
                    Number(
                      eq?.Id_certamen ??
                        eq?.id_certamen ??
                        eq?.desafio?.Id_certamen ??
                        eq?.certamen?.Id_certamen
                    ) === Number(idCert)
                )
              : todosMod;
          if (listaEquipos.length === 0) listaEquipos = todosMod;
        }

        if (listaEquipos.length === 0) {
          await limpiarModalidadSeleccionada();
          const todosGlobal = extraerLista(await getEquipos(), 'equipos');
          await guardarModalidadSeleccionada(mod);

          const idsCertamenesMod = new Set(
            listaCertamenes.map((c: any) =>
              Number(c?.Id_certamen ?? c?.id_certamen ?? c?.id)
            )
          );

          listaEquipos = todosGlobal.filter((eq: any) => {
            const idEqCert = Number(
              eq?.Id_certamen ??
                eq?.id_certamen ??
                eq?.desafio?.Id_certamen ??
                eq?.certamen?.Id_certamen
            );
            if (idCert != null && idEqCert === Number(idCert)) return true;
            if (idsCertamenesMod.size > 0 && idsCertamenesMod.has(idEqCert)) {
              return true;
            }
            return coincideModalidad(
              eq?.Tipo ??
                eq?.tipo ??
                eq?.certamen?.Tipo ??
                eq?.certamen?.Nombre
            );
          });
        }

        // 3) Integrantes y Jurados
        let listaJurados = extraerLista(
          await getJurados(idCert ?? undefined).catch(() => []),
          'jurados'
        );

        if (listaJurados.length === 0) {
          await limpiarModalidadSeleccionada();
          const todosJurados = extraerLista(
            await getJurados().catch(() => []),
            'jurados'
          );
          await guardarModalidadSeleccionada(mod);
          listaJurados = todosJurados;
        }

        const respIntegrantes = await getIntegrantes().catch(() => []);
        const listaIntegrantes = extraerLista(respIntegrantes, 'integrantes');

        const equiposEnriquecidos = listaEquipos.map((eq: any) => {
          const idEq = Number(eq?.Id_equipo ?? eq?.id_equipo ?? eq?.id);
          if (Array.isArray(eq?.integrantes) && eq.integrantes.length > 0) {
            return eq;
          }
          const susIntegrantes = listaIntegrantes.filter(
            (intg: any) =>
              Number(intg?.Id_equipo ?? intg?.id_equipo) === idEq
          );
          return {
            ...eq,
            integrantes: susIntegrantes,
          };
        });

        setEquipos(equiposEnriquecidos);
        setJurados(listaJurados);
      } catch (err: any) {
        console.log('Error cargando datos de constancias:', err);
        setErrorCarga(err?.message || 'Error al consultar el servidor.');
        setEquipos([]);
        setJurados([]);
      } finally {
        setCargandoDatos(false);
      }
    },
    []
  );

  useEffect(() => {
    (async () => {
      const modGuardada = await getModalidadSeleccionada();
      const inicial = modGuardada ?? 'RALLY';
      setModalidad(inicial);
      await cargarDatosPorModalidad(inicial);
    })();
  }, [cargarDatosPorModalidad]);

  const cambiarModalidad = async (nuevaMod: 'RALLY' | 'INNOVATEC') => {
    setModalidad(nuevaMod);
    setEquipoExpandidoId(null);
    setDestinatarioSeleccionado('');
    await cargarDatosPorModalidad(nuevaMod, null);
  };

  const cambiarEdicionCertamen = async (nuevoIdCert: number) => {
    setIdCertamenActivo(nuevoIdCert);
    setEquipoExpandidoId(null);
    setDestinatarioSeleccionado('');
    await cargarDatosPorModalidad(modalidad, nuevoIdCert);
  };

  // ====================================================
  // APLICAR DATOS DEL INTEGRANTE O JURADO A LA PLANTILLA
  // ====================================================

  const cargarConstanciaIntegrante = (
    equipo: any,
    integrante: any,
    index: number
  ) => {
    const nombreCompleto = formatearNombrePersona(
      integrante,
      `Integrante ${index + 1}`
    ).toUpperCase();

    const rolIntegrante =
      integrante?.Rol ?? integrante?.rol ?? 'Integrante';

    const nombreEq =
      equipo?.Nombre ?? equipo?.nombre ?? 'Equipo participante';
    const desafio =
      equipo?.desafio?.Nombre ??
      equipo?.Desafio?.Nombre ??
      equipo?.categoria_certamen?.Nombre ??
      equipo?.categoriaCertamen?.Nombre ??
      '';

    const rolTexto = `${rolIntegrante} del equipo "${nombreEq}"`;
    const certamenLinea = desafio
      ? `Por su destacada participación en ${nombreCertamenTexto} · ${desafio}`
      : `Por su destacada participación en ${nombreCertamenTexto}`;

    setElementos((prev) =>
      prev.map((el) => {
        if (el.tipo !== 'texto') return el;
        if (el.id === 'cuadro_1') return { ...el, texto: nombreCompleto };
        if (el.id === 'cuadro_2') return { ...el, texto: rolTexto };
        if (el.id === 'cuadro_3') return { ...el, texto: certamenLinea };
        return el;
      })
    );

    setDestinatarioSeleccionado(`${nombreCompleto} (${nombreEq})`);
    setIdSeleccionado('cuadro_1');

    scrollRef.current?.scrollTo({
      y: Math.max(0, posEditorY.current - 12),
      animated: true,
    });
  };

  const cargarConstanciaJurado = (jurado: any, index: number) => {
    const nombreCompleto = formatearNombrePersona(
      jurado,
      `Jurado ${index + 1}`
    ).toUpperCase();

    const especialidad =
      jurado?.Area_especializada ??
      jurado?.Area_participacion ??
      jurado?.Puesto ??
      jurado?.Institucion ??
      '';

    const rolTexto = especialidad
      ? `Jurado Evaluador · ${especialidad}`
      : 'Por su valiosa participación como Jurado Evaluador';
    const certamenLinea = `En el certamen ${nombreCertamenTexto}`;

    setElementos((prev) =>
      prev.map((el) => {
        if (el.tipo !== 'texto') return el;
        if (el.id === 'cuadro_1') return { ...el, texto: nombreCompleto };
        if (el.id === 'cuadro_2') return { ...el, texto: rolTexto };
        if (el.id === 'cuadro_3') return { ...el, texto: certamenLinea };
        return el;
      })
    );

    setDestinatarioSeleccionado(`${nombreCompleto} (Jurado)`);
    setIdSeleccionado('cuadro_1');

    scrollRef.current?.scrollTo({
      y: Math.max(0, posEditorY.current - 12),
      animated: true,
    });
  };

  // ====================================================
  // SUBIR IMAGEN BASE (FONDO DE CONSTANCIA)
  // ====================================================

  const seleccionarImagenFondo = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert(
        'Permiso requerido',
        'Necesitamos acceso a tu galería para subir la plantilla.'
      );
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.75,
      base64: true,
    });

    if (!res.canceled && res.assets?.length > 0) {
      const asset = res.assets[0];
      setImagenUri(asset.uri);
      setImagenBase64(asset.base64 ?? null);
      setImagenMime(
        asset.mimeType ||
          (asset.uri.toLowerCase().endsWith('.png')
            ? 'image/png'
            : 'image/jpeg')
      );
    }
  };

  // ====================================================
  // AGREGAR FIRMA O LOGO SIN FONDO (PNG / IMAGEN)
  // ====================================================

  const agregarFirmaImagen = async () => {
    const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert(
        'Permiso requerido',
        'Necesitamos acceso a tu galería para seleccionar la firma.'
      );
      return;
    }

    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.85,
      base64: true,
    });

    if (!res.canceled && res.assets?.length > 0) {
      const asset = res.assets[0];
      if (!asset.base64) {
        Alert.alert('Error', 'No se pudo leer la imagen de la firma.');
        return;
      }

      const numFirmas =
        elementos.filter((e) => e.tipo === 'imagen').length + 1;
      const nuevoId = `firma_${Date.now()}`;
      const ratio =
        asset.width && asset.height ? asset.width / asset.height : 2.2;

      const nuevaFirma: ElementoLienzo = {
        tipo: 'imagen',
        id: nuevoId,
        etiqueta: `Firma ${numFirmas}`,
        uri: asset.uri,
        base64: asset.base64,
        mime:
          asset.mimeType ||
          (asset.uri.toLowerCase().endsWith('.png')
            ? 'image/png'
            : 'image/jpeg'),
        aspectRatio: ratio,
        xPct: 50,
        yPct: 80,
        anchoPct: 24,
      };

      setElementos((prev) => [...prev, nuevaFirma]);
      setIdSeleccionado(nuevoId);
    }
  };

  // ====================================================
  // MANIPULAR ELEMENTOS DEL LIENZO
  // ====================================================

  const actualizarElemento = (
    id: string,
    cambios: Partial<ElementoLienzo>
  ) => {
    setElementos((prev) =>
      prev.map((e) =>
        e.id === id ? ({ ...e, ...cambios } as ElementoLienzo) : e
      )
    );
  };

  const agregarNuevoTexto = () => {
    const numTextos = elementos.filter((e) => e.tipo === 'texto').length + 1;
    const nuevoId = `cuadro_${Date.now()}`;
    const nuevo: ElementoLienzo = {
      tipo: 'texto',
      id: nuevoId,
      etiqueta: `Cuadro ${numTextos}`,
      texto: `Cuadro ${numTextos}`,
      xPct: 50,
      yPct: 50,
      anchoPct: 65,
      fontSize: 13,
      color: '#002B45',
      negrita: true,
      alineacion: 'center',
    };
    setElementos((prev) => [...prev, nuevo]);
    setIdSeleccionado(nuevoId);
  };

  const eliminarElementoActual = () => {
    if (!actual) return;
    if (elementos.length <= 1) {
      Alert.alert('Aviso', 'Debe quedar al menos un elemento en la hoja.');
      return;
    }

    const restantes = elementos.filter((e) => e.id !== actual.id);
    setElementos(restantes);
    setIdSeleccionado(restantes[0].id);
  };

  const onLayoutLienzo = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setTamanoLienzo({ width, height });
  };

  const onLayoutPreview = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setTamanoPreview({ width, height });
  };

  // ====================================================
  // GENERAR Y DESCARGAR PDF NATIVO
  // ====================================================

  const generarPdf = async () => {
    if (!imagenBase64) {
      Alert.alert(
        'Falta imagen',
        'Sube primero la imagen base de la constancia para generar el PDF.'
      );
      return;
    }

    try {
      setGenerandoPdf(true);

      const factorEscala = tamanoLienzo.width ? 792 / tamanoLienzo.width : 2.2;

      const capasHtml = elementos
        .map((el) => {
          if (el.tipo === 'texto') {
            if (!el.texto.trim()) return '';
            return `
              <div style="
                position: absolute;
                left: ${el.xPct}%;
                top: ${el.yPct}%;
                transform: translate(-50%, -50%);
                width: ${el.anchoPct}%;
                font-size: ${Math.round(el.fontSize * factorEscala)}px;
                color: ${el.color};
                font-weight: ${el.negrita ? 'bold' : 'normal'};
                text-align: ${el.alineacion};
                font-family: Helvetica, Arial, sans-serif;
                line-height: 1.25;
                word-wrap: break-word;
              ">
                ${el.texto.replace(/\n/g, '<br/>')}
              </div>
            `;
          }

          return `
            <img
              src="data:${el.mime};base64,${el.base64}"
              style="
                position: absolute;
                left: ${el.xPct}%;
                top: ${el.yPct}%;
                transform: translate(-50%, -50%);
                width: ${el.anchoPct}%;
                height: auto;
                object-fit: contain;
              "
            />
          `;
        })
        .join('');

      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <style>
              @page { size: letter landscape; margin: 0; }
              * { box-sizing: border-box; margin: 0; padding: 0; }
              html, body {
                width: 792pt;
                height: 612pt;
                overflow: hidden;
              }
              .hoja {
                position: relative;
                width: 792pt;
                height: 612pt;
              }
              .fondo {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                object-fit: fill;
              }
            </style>
          </head>
          <body>
            <div class="hoja">
              <img class="fondo" src="data:${imagenMime};base64,${imagenBase64}" />
              ${capasHtml}
            </div>
          </body>
        </html>
      `;

      await Print.printAsync({ html });
    } catch (error: any) {
      console.error('Error generando PDF:', error);
      Alert.alert(
        'Error al generar PDF',
        error?.message || 'No se pudo abrir la vista de descarga del PDF.'
      );
    } finally {
      setGenerandoPdf(false);
    }
  };

  // Filtrado por buscador
  const textoFiltro = busqueda.trim().toLowerCase();

  const equiposFiltrados = equipos.filter((eq) => {
    if (!textoFiltro) return true;
    const nomEq = String(eq?.Nombre ?? eq?.nombre ?? '').toLowerCase();
    const coincideIntegrante = Array.isArray(eq?.integrantes)
      ? eq.integrantes.some((i: any) =>
          formatearNombrePersona(i, '').toLowerCase().includes(textoFiltro)
        )
      : false;
    return nomEq.includes(textoFiltro) || coincideIntegrante;
  });

  const juradosFiltrados = jurados.filter((j) => {
    if (!textoFiltro) return true;
    const nomJurado = formatearNombrePersona(j, '').toLowerCase();
    const esp = String(
      j?.Area_especializada ??
        j?.Area_participacion ??
        j?.Institucion ??
        ''
    ).toLowerCase();
    return nomJurado.includes(textoFiltro) || esp.includes(textoFiltro);
  });

  const escalaPreview =
    tamanoLienzo.width && tamanoPreview.width
      ? tamanoPreview.width / tamanoLienzo.width
      : 1;

  return (
    <KeyboardAvoidingView
      style={styles.contenedor}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scrollRef}
        scrollEnabled={!arrastrando}
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ==================================================
            1. SELECTOR DE MODALIDAD (RALLY / INNOVATEC)
        ================================================== */}
        <View style={styles.tabsCertamen}>
          {(
            [
              { key: 'RALLY', label: 'Rally', icon: 'trophy-outline' },
              { key: 'INNOVATEC', label: 'InnovaTecNM', icon: 'bulb-outline' },
            ] as const
          ).map((item) => {
            const activo = modalidad === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.tabBtn, activo && styles.tabBtnActivo]}
                onPress={() => void cambiarModalidad(item.key)}
              >
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={activo ? '#FFFFFF' : '#334155'}
                />
                <Text style={[styles.tabTexto, activo && styles.tabTextoActivo]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* CHIPS DE EDICIONES DEL CERTAMEN (SI HAY MÁS DE UNA) */}
        {certamenes.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsCertamenes}
          >
            {certamenes.map((c) => {
              const idC = Number(c?.Id_certamen ?? c?.id_certamen ?? c?.id);
              const activo = idC === Number(idCertamenActivo);
              return (
                <TouchableOpacity
                  key={idC}
                  style={[
                    styles.chipCertamen,
                    activo && styles.chipCertamenActivo,
                  ]}
                  onPress={() => void cambiarEdicionCertamen(idC)}
                >
                  <Text
                    style={[
                      styles.chipCertamenTexto,
                      activo && styles.chipCertamenTextoActivo,
                    ]}
                  >
                    {c?.Nombre ?? c?.nombre ?? `Certamen #${idC}`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* ==================================================
            2. DESTINATARIOS DESPLEGABLE: EQUIPOS Y JURADOS
        ================================================== */}
        <View style={styles.tarjetaDestinatarios}>
          <TouchableOpacity
            style={styles.headerDesplegable}
            onPress={() => setListaDestinatariosAbierta((prev) => !prev)}
            activeOpacity={0.8}
          >
            <View style={styles.headerDesplegableIzq}>
              <View style={styles.iconoDesplegable}>
                <Ionicons name="people" size={18} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.tituloDestinatarios}>
                  Destinatarios ({nombreCertamenTexto})
                </Text>
                <Text style={styles.subtituloDesplegable}>
                  {equipos.length} equipos · {jurados.length} jurados · Toca para{' '}
                  {listaDestinatariosAbierta ? 'ocultar' : 'desplegar'}
                </Text>
              </View>
            </View>

            <Ionicons
              name={listaDestinatariosAbierta ? 'chevron-up' : 'chevron-down'}
              size={22}
              color="#002B45"
            />
          </TouchableOpacity>

          {listaDestinatariosAbierta && (
            <View style={styles.contenidoDesplegable}>
              {/* Sub-pestañas Equipos | Jurados */}
              <View style={styles.subTabs}>
                <TouchableOpacity
                  style={[
                    styles.subTabBtn,
                    pestanaDestinatarios === 'equipos' &&
                      styles.subTabBtnActivo,
                  ]}
                  onPress={() => setPestanaDestinatarios('equipos')}
                >
                  <Ionicons
                    name="people-outline"
                    size={16}
                    color={
                      pestanaDestinatarios === 'equipos'
                        ? '#FFFFFF'
                        : '#334155'
                    }
                  />
                  <Text
                    style={[
                      styles.subTabTexto,
                      pestanaDestinatarios === 'equipos' &&
                        styles.subTabTextoActivo,
                    ]}
                  >
                    Equipos ({equipos.length})
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.subTabBtn,
                    pestanaDestinatarios === 'jurados' &&
                      styles.subTabBtnActivo,
                  ]}
                  onPress={() => setPestanaDestinatarios('jurados')}
                >
                  <Ionicons
                    name="ribbon-outline"
                    size={16}
                    color={
                      pestanaDestinatarios === 'jurados'
                        ? '#FFFFFF'
                        : '#334155'
                    }
                  />
                  <Text
                    style={[
                      styles.subTabTexto,
                      pestanaDestinatarios === 'jurados' &&
                        styles.subTabTextoActivo,
                    ]}
                  >
                    Jurados ({jurados.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Buscador rápido */}
              <View style={styles.buscadorBox}>
                <Ionicons name="search-outline" size={16} color="#64748B" />
                <TextInput
                  style={styles.buscadorInput}
                  value={busqueda}
                  onChangeText={setBusqueda}
                  placeholder={
                    pestanaDestinatarios === 'equipos'
                      ? 'Buscar equipo o integrante...'
                      : 'Buscar jurado...'
                  }
                  placeholderTextColor="#94A3B8"
                />
                {busqueda.length > 0 && (
                  <TouchableOpacity onPress={() => setBusqueda('')}>
                    <Ionicons name="close-circle" size={17} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>

              {cargandoDatos ? (
                <View style={styles.loadingInline}>
                  <ActivityIndicator color="#087B8B" />
                  <Text style={styles.loadingInlineText}>
                    Cargando registros de {nombreCertamenTexto}...
                  </Text>
                </View>
              ) : errorCarga ? (
                <Text style={[styles.textoVacioTabla, { color: '#DC2626' }]}>
                  {errorCarga}
                </Text>
              ) : pestanaDestinatarios === 'equipos' ? (
                /* LISTA ACORDEÓN DE EQUIPOS E INTEGRANTES */
                equiposFiltrados.length === 0 ? (
                  <Text style={styles.textoVacioTabla}>
                    No hay equipos registrados en este certamen.
                  </Text>
                ) : (
                  <View style={styles.listaRegistros}>
                    {equiposFiltrados.map((eq, idx) => {
                      const idEq = Number(
                        eq?.Id_equipo ?? eq?.id_equipo ?? eq?.id ?? idx
                      );
                      const expandido = equipoExpandidoId === idEq;
                      const integrantes: any[] = Array.isArray(eq?.integrantes)
                        ? eq.integrantes
                        : [];

                      return (
                        <View key={idEq} style={styles.acordeonEquipo}>
                          <TouchableOpacity
                            style={styles.acordeonHeader}
                            onPress={() =>
                              setEquipoExpandidoId(expandido ? null : idEq)
                            }
                            activeOpacity={0.8}
                          >
                            <View style={styles.iconoEquipoMini}>
                              <Ionicons
                                name="people"
                                size={16}
                                color="#FFFFFF"
                              />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.nombreEquipoItem}>
                                {eq?.Nombre ?? eq?.nombre ?? `Equipo #${idEq}`}
                              </Text>
                              <Text style={styles.subEquipoItem}>
                                {integrantes.length} integrante
                                {integrantes.length === 1 ? '' : 's'} · Toca
                                para ver
                              </Text>
                            </View>
                            <Ionicons
                              name={expandido ? 'chevron-up' : 'chevron-down'}
                              size={19}
                              color="#475569"
                            />
                          </TouchableOpacity>

                          {expandido && (
                            <View style={styles.listaIntegrantesBox}>
                              {integrantes.length === 0 ? (
                                <Text style={styles.textoVacioTabla}>
                                  Este equipo aún no tiene integrantes
                                  capturados.
                                </Text>
                              ) : (
                                integrantes.map((intg: any, iIdx: number) => {
                                  const nomInt = formatearNombrePersona(
                                    intg,
                                    `Integrante ${iIdx + 1}`
                                  );
                                  const rolInt =
                                    intg?.Rol ?? intg?.rol ?? 'Integrante';
                                  const esLider =
                                    rolInt.toLowerCase().includes('líder') ||
                                    rolInt.toLowerCase().includes('lider');

                                  return (
                                    <View
                                      key={
                                        intg?.Id_integrante ??
                                        intg?.id_integrante ??
                                        intg?.id ??
                                        iIdx
                                      }
                                      style={styles.filaIntegrante}
                                    >
                                      <View style={{ flex: 1 }}>
                                        <Text style={styles.nombreIntegrante}>
                                          {nomInt}
                                        </Text>
                                        <Text style={styles.rolIntegrante}>
                                          {esLider ? `★ ${rolInt}` : rolInt}
                                        </Text>
                                      </View>

                                      <TouchableOpacity
                                        style={styles.btnIconoConstancia}
                                        onPress={() => {
                                          cargarConstanciaIntegrante(
                                            eq,
                                            intg,
                                            iIdx
                                          );
                                          setListaDestinatariosAbierta(false);
                                        }}
                                        activeOpacity={0.8}
                                      >
                                        <Ionicons
                                          name="ribbon-outline"
                                          size={17}
                                          color="#FFFFFF"
                                        />
                                        <Text style={styles.txtBtnConstancia}>
                                          Editar
                                        </Text>
                                      </TouchableOpacity>
                                    </View>
                                  );
                                })
                              )}
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )
              ) : /* TABLA DE JURADOS CON ÍCONO DE CONSTANCIA */
              juradosFiltrados.length === 0 ? (
                <Text style={styles.textoVacioTabla}>
                  No hay jurados registrados en este certamen.
                </Text>
              ) : (
                <View style={styles.tablaJurados}>
                  <View style={styles.tablaEncabezado}>
                    <Text style={[styles.colHeader, { flex: 1 }]}>JURADO</Text>
                    <Text style={styles.colHeader}>CONSTANCIA</Text>
                  </View>

                  {juradosFiltrados.map((jurado, jIdx) => {
                    const nomJurado = formatearNombrePersona(
                      jurado,
                      `Jurado ${jIdx + 1}`
                    );
                    const especialidad =
                      jurado?.Area_especializada ??
                      jurado?.Area_participacion ??
                      jurado?.Institucion ??
                      'Evaluador';

                    return (
                      <View
                        key={
                          jurado?.Id_jurado ??
                          jurado?.Id_usuario ??
                          jurado?.id ??
                          jIdx
                        }
                        style={styles.filaJurado}
                      >
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={styles.nombreJurado}>{nomJurado}</Text>
                          <Text style={styles.espJurado}>{especialidad}</Text>
                        </View>

                        <TouchableOpacity
                          style={styles.btnIconoConstancia}
                          onPress={() => {
                            cargarConstanciaJurado(jurado, jIdx);
                            setListaDestinatariosAbierta(false);
                          }}
                          activeOpacity={0.8}
                        >
                          <Ionicons
                            name="ribbon-outline"
                            size={17}
                            color="#FFFFFF"
                          />
                          <Text style={styles.txtBtnConstancia}>Editar</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </View>

        {/* ==================================================
            3. DISEÑADOR DE CONSTANCIA (PLANTILLA + FIRMAS)
        ================================================== */}
        <View
          onLayout={(e) => {
            posEditorY.current = e.nativeEvent.layout.y;
          }}
        >
          {destinatarioSeleccionado ? (
            <View style={styles.bannerEditando}>
              <Ionicons name="checkmark-circle" size={18} color="#059669" />
              <Text style={styles.bannerEditandoTexto} numberOfLines={1}>
                Editando constancia de: {destinatarioSeleccionado}
              </Text>
            </View>
          ) : null}

          {/* BOTONES DE CARGA: FONDO Y FIRMAS PNG */}
          <View style={styles.filaBotonesCarga}>
            <TouchableOpacity
              style={styles.botonSubir}
              onPress={seleccionarImagenFondo}
              activeOpacity={0.85}
            >
              <Ionicons name="image-outline" size={20} color="#0369A1" />
              <Text style={styles.textoSubir}>
                {imagenUri ? 'Cambiar fondo' : 'Subir fondo'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botonSubirFirma}
              onPress={agregarFirmaImagen}
              activeOpacity={0.85}
            >
              <Ionicons name="create-outline" size={20} color="#6D28D9" />
              <Text style={styles.textoSubirFirma}>+ Firma / Logo</Text>
            </TouchableOpacity>
          </View>

          {/* LIENZO INTERACTIVO */}
          <View style={styles.tarjetaLienzo}>
            <View style={styles.barraSuperiorLienzo}>
              <Text style={styles.ayudaLienzo}>
                Arrastra textos y firmas con tu dedo
              </Text>

              <TouchableOpacity
                style={styles.botonVistaPrevia}
                onPress={() => setVistaPreviaVisible(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="eye-outline" size={16} color="#002B45" />
                <Text style={styles.textoVistaPrevia}>Vista previa</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.lienzo} onLayout={onLayoutLienzo}>
              {imagenUri ? (
                <Image
                  source={{ uri: imagenUri }}
                  style={styles.imagenFondo}
                  resizeMode="stretch"
                />
              ) : (
                <View style={styles.lienzoVacio}>
                  <Ionicons
                    name="document-outline"
                    size={40}
                    color="#94A3B8"
                  />
                  <Text style={styles.lienzoVacioTexto}>
                    Sube tu plantilla y agrega textos o firmas PNG sin fondo
                  </Text>
                </View>
              )}

              {elementos.map((el) => (
                <ElementoArrastrable
                  key={el.id}
                  elemento={el}
                  seleccionado={el.id === actual?.id}
                  tamanoLienzo={tamanoLienzo}
                  onSeleccionar={() => setIdSeleccionado(el.id)}
                  onMover={(xPct, yPct) =>
                    actualizarElemento(el.id, { xPct, yPct })
                  }
                  onToggleArrastre={setArrastrando}
                />
              ))}
            </View>
          </View>

          {/* PANEL DE EDICIÓN DEL ELEMENTO SELECCIONADO */}
          {actual && (
            <View style={styles.panelEdicion}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipsCampos}
              >
                {elementos.map((el) => {
                  const activo = el.id === actual.id;
                  return (
                    <TouchableOpacity
                      key={el.id}
                      style={[
                        styles.chipCampo,
                        activo && styles.chipCampoActivo,
                      ]}
                      onPress={() => setIdSeleccionado(el.id)}
                    >
                      <Ionicons
                        name={
                          el.tipo === 'imagen'
                            ? 'create-outline'
                            : 'text-outline'
                        }
                        size={13}
                        color={activo ? '#FFFFFF' : '#334155'}
                      />
                      <Text
                        style={[
                          styles.chipCampoTexto,
                          activo && styles.chipCampoTextoActivo,
                        ]}
                      >
                        {el.etiqueta}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={styles.chipAgregar}
                  onPress={agregarNuevoTexto}
                >
                  <Ionicons name="add" size={16} color="#087B8B" />
                  <Text style={styles.chipAgregarTexto}>Nuevo texto</Text>
                </TouchableOpacity>
              </ScrollView>

              {actual.tipo === 'imagen' ? (
                <View>
                  <View style={styles.filaLabelTexto}>
                    <Text style={styles.controlLabel}>
                      Ajuste de {actual.etiqueta} (PNG / Logo)
                    </Text>
                    <TouchableOpacity onPress={eliminarElementoActual}>
                      <Text style={styles.textoEliminarCuadro}>
                        Eliminar firma
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.controlGrupo}>
                    <Text style={styles.controlLabel}>
                      Tamaño de la firma en la hoja
                    </Text>
                    <View style={styles.stepper}>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() =>
                          actualizarElemento(actual.id, {
                            anchoPct: Math.max(8, actual.anchoPct - 2),
                          })
                        }
                      >
                        <Ionicons name="remove" size={18} color="#0F172A" />
                      </TouchableOpacity>
                      <Text style={styles.stepperValor}>
                        {actual.anchoPct}%
                      </Text>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() =>
                          actualizarElemento(actual.id, {
                            anchoPct: Math.min(65, actual.anchoPct + 2),
                          })
                        }
                      >
                        <Ionicons name="add" size={18} color="#0F172A" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ) : (
                <View>
                  <View style={styles.filaLabelTexto}>
                    <Text style={styles.controlLabel}>Contenido del cuadro</Text>
                    <TouchableOpacity onPress={eliminarElementoActual}>
                      <Text style={styles.textoEliminarCuadro}>
                        Eliminar cuadro
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TextInput
                    style={styles.inputTextoLibre}
                    value={actual.texto}
                    onChangeText={(txt) =>
                      actualizarElemento(actual.id, { texto: txt })
                    }
                    placeholder="Escribe aquí el texto del cuadro..."
                    placeholderTextColor="#94A3B8"
                    multiline
                  />

                  <View style={styles.controlesFila}>
                    <View style={styles.controlGrupo}>
                      <Text style={styles.controlLabel}>Letra</Text>
                      <View style={styles.stepper}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() =>
                            actualizarElemento(actual.id, {
                              fontSize: Math.max(8, actual.fontSize - 1),
                            })
                          }
                        >
                          <Ionicons name="remove" size={17} color="#0F172A" />
                        </TouchableOpacity>
                        <Text style={styles.stepperValor}>
                          {actual.fontSize}px
                        </Text>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() =>
                            actualizarElemento(actual.id, {
                              fontSize: Math.min(34, actual.fontSize + 1),
                            })
                          }
                        >
                          <Ionicons name="add" size={17} color="#0F172A" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.controlGrupo}>
                      <Text style={styles.controlLabel}>Ancho cuadro</Text>
                      <View style={styles.stepper}>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() =>
                            actualizarElemento(actual.id, {
                              anchoPct: Math.max(25, actual.anchoPct - 5),
                            })
                          }
                        >
                          <Ionicons name="remove" size={17} color="#0F172A" />
                        </TouchableOpacity>
                        <Text style={styles.stepperValor}>
                          {actual.anchoPct}%
                        </Text>
                        <TouchableOpacity
                          style={styles.stepperBtn}
                          onPress={() =>
                            actualizarElemento(actual.id, {
                              anchoPct: Math.min(95, actual.anchoPct + 5),
                            })
                          }
                        >
                          <Ionicons name="add" size={17} color="#0F172A" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  <View style={styles.controlesFila}>
                    {(['left', 'center', 'right'] as AlineacionTexto[]).map(
                      (align) => (
                        <TouchableOpacity
                          key={align}
                          style={[
                            styles.btnEstilo,
                            actual.alineacion === align &&
                              styles.btnEstiloActivo,
                          ]}
                          onPress={() =>
                            actualizarElemento(actual.id, {
                              alineacion: align,
                            })
                          }
                        >
                          <Ionicons
                            name={
                              align === 'left'
                                ? 'reorder-two-outline'
                                : align === 'center'
                                  ? 'menu-outline'
                                  : 'reorder-three-outline'
                            }
                            size={20}
                            color={
                              actual.alineacion === align
                                ? '#FFFFFF'
                                : '#0F172A'
                            }
                          />
                        </TouchableOpacity>
                      )
                    )}

                    <TouchableOpacity
                      style={[
                        styles.btnEstilo,
                        actual.negrita && styles.btnEstiloActivo,
                      ]}
                      onPress={() =>
                        actualizarElemento(actual.id, {
                          negrita: !actual.negrita,
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.btnEstiloTexto,
                          actual.negrita && { color: '#FFFFFF' },
                        ]}
                      >
                        B
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.controlLabel}>Color del texto</Text>
                  <View style={styles.filaColores}>
                    {COLORES_DISPONIBLES.map((hex) => (
                      <TouchableOpacity
                        key={hex}
                        style={[
                          styles.circuloColor,
                          { backgroundColor: hex },
                          actual.color === hex && styles.circuloColorActivo,
                        ]}
                        onPress={() =>
                          actualizarElemento(actual.id, { color: hex })
                        }
                      />
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* BOTÓN EXPORTAR PDF */}
          <TouchableOpacity
            style={styles.botonGenerarPdf}
            onPress={generarPdf}
            disabled={generandoPdf}
            activeOpacity={0.85}
          >
            {generandoPdf ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="download-outline" size={21} color="#FFFFFF" />
                <Text style={styles.textoGenerarPdf}>
                  Generar y descargar constancia PDF
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ==================================================
          MODAL DE VISTA PREVIA COMPLETA (SIN GUÍAS)
      ================================================== */}
      <Modal
        visible={vistaPreviaVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setVistaPreviaVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalHeader}>
            <View style={styles.modalTituloRow}>
              <Ionicons name="eye" size={20} color="#FFFFFF" />
              <Text style={styles.modalTitulo}>
                Vista previa · {nombreCertamenTexto}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.modalCerrarBtn}
              onPress={() => setVistaPreviaVisible(false)}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitulo}>
            Así quedará la constancia final con firmas y textos
          </Text>

          <View style={styles.hojaPreview} onLayout={onLayoutPreview}>
            {imagenUri ? (
              <Image
                source={{ uri: imagenUri }}
                style={styles.imagenFondo}
                resizeMode="stretch"
              />
            ) : (
              <View style={styles.lienzoVacio}>
                <Ionicons name="image-outline" size={44} color="#94A3B8" />
                <Text style={styles.lienzoVacioTexto}>
                  Aún no has subido una imagen de fondo
                </Text>
              </View>
            )}

            {tamanoPreview.width > 0 &&
              elementos.map((el) => {
                const anchoPx = (el.anchoPct / 100) * tamanoPreview.width;
                const leftPx =
                  (el.xPct / 100) * tamanoPreview.width - anchoPx / 2;

                if (el.tipo === 'imagen') {
                  const altoPx = anchoPx / (el.aspectRatio || 2.2);
                  const topPx =
                    (el.yPct / 100) * tamanoPreview.height - altoPx / 2;

                  return (
                    <Image
                      key={el.id}
                      source={{ uri: el.uri }}
                      style={{
                        position: 'absolute',
                        width: anchoPx,
                        height: altoPx,
                        left: leftPx,
                        top: topPx,
                      }}
                      resizeMode="contain"
                    />
                  );
                }

                if (!el.texto.trim()) return null;

                const topPx =
                  (el.yPct / 100) * tamanoPreview.height -
                  16 * escalaPreview;

                return (
                  <View
                    key={el.id}
                    style={{
                      position: 'absolute',
                      width: anchoPx,
                      left: leftPx,
                      top: topPx,
                      paddingHorizontal: 6 * escalaPreview,
                      paddingVertical: 4 * escalaPreview,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: el.fontSize * escalaPreview,
                        color: el.color,
                        fontWeight: el.negrita ? '800' : '500',
                        textAlign: el.alineacion,
                      }}
                    >
                      {el.texto}
                    </Text>
                  </View>
                );
              })}
          </View>

          <View style={styles.modalAcciones}>
            <TouchableOpacity
              style={styles.btnVolverEditar}
              onPress={() => setVistaPreviaVisible(false)}
            >
              <Ionicons name="create-outline" size={19} color="#FFFFFF" />
              <Text style={styles.textoVolverEditar}>Seguir editando</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnDescargarModal}
              onPress={() => {
                setVistaPreviaVisible(false);
                void generarPdf();
              }}
            >
              <Ionicons name="download-outline" size={19} color="#FFFFFF" />
              <Text style={styles.textoVolverEditar}>Descargar PDF</Text>
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
  contenedor: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  contenido: {
    padding: 16,
    paddingBottom: 45,
  },
  tabsCertamen: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 12,
    padding: 4,
    marginBottom: 10,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 9,
    gap: 6,
  },
  tabBtnActivo: {
    backgroundColor: '#002B45',
  },
  tabTexto: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  tabTextoActivo: {
    color: '#FFFFFF',
  },
  chipsCertamenes: {
    gap: 8,
    paddingBottom: 10,
  },
  chipCertamen: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  chipCertamenActivo: {
    backgroundColor: '#087B8B',
    borderColor: '#087B8B',
  },
  chipCertamenTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  chipCertamenTextoActivo: {
    color: '#FFFFFF',
  },
  tarjetaDestinatarios: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  headerDesplegable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerDesplegableIzq: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  iconoDesplegable: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#087B8B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tituloDestinatarios: {
    fontSize: 14,
    fontWeight: '800',
    color: '#002B45',
  },
  subtituloDesplegable: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  contenidoDesplegable: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  subTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  subTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    gap: 6,
  },
  subTabBtnActivo: {
    backgroundColor: '#087B8B',
  },
  subTabTexto: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  subTabTextoActivo: {
    color: '#FFFFFF',
  },
  buscadorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    gap: 6,
    marginBottom: 10,
  },
  buscadorInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  loadingInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  loadingInlineText: {
    fontSize: 12,
    color: '#64748B',
  },
  textoVacioTabla: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 12,
    paddingVertical: 14,
  },
  listaRegistros: {
    gap: 8,
  },
  acordeonEquipo: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
  },
  acordeonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 11,
    gap: 10,
  },
  iconoEquipoMini: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: '#002B45',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nombreEquipoItem: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  subEquipoItem: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  listaIntegrantesBox: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  filaIntegrante: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 8,
  },
  nombreIntegrante: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  rolIntegrante: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  tablaJurados: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tablaEncabezado: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  colHeader: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
  },
  filaJurado: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  nombreJurado: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  espJurado: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  btnIconoConstancia: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#087B8B',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 9,
    gap: 5,
  },
  txtBtnConstancia: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  bannerEditando: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 7,
    marginBottom: 10,
  },
  bannerEditandoTexto: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  filaBotonesCarga: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  botonSubir: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  textoSubir: {
    color: '#0369A1',
    fontWeight: '800',
    fontSize: 13,
  },
  botonSubirFirma: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDE9FE',
    borderWidth: 1,
    borderColor: '#DDD6FE',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 6,
  },
  textoSubirFirma: {
    color: '#6D28D9',
    fontWeight: '800',
    fontSize: 13,
  },
  tarjetaLienzo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  barraSuperiorLienzo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  ayudaLienzo: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    flex: 1,
  },
  botonVistaPrevia: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 5,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  textoVistaPrevia: {
    color: '#002B45',
    fontSize: 12,
    fontWeight: '800',
  },
  lienzo: {
    width: '100%',
    aspectRatio: 11 / 8.5,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
    position: 'relative',
  },
  imagenFondo: {
    width: '100%',
    height: '100%',
  },
  lienzoVacio: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  lienzoVacioTexto: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
  cuadroArrastrable: {
    position: 'absolute',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(8, 123, 139, 0.5)',
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  firmaArrastrable: {
    position: 'absolute',
    padding: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(109, 40, 217, 0.55)',
    backgroundColor: 'transparent',
  },
  cuadroSeleccionado: {
    borderStyle: 'solid',
    borderColor: '#087B8B',
    borderWidth: 2,
    backgroundColor: 'rgba(224, 242, 254, 0.35)',
  },
  indicadorArrastre: {
    position: 'absolute',
    top: -10,
    right: -8,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#087B8B',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  panelEdicion: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  chipsCampos: {
    gap: 8,
    paddingBottom: 12,
  },
  chipCampo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  chipCampoActivo: {
    backgroundColor: '#087B8B',
    borderColor: '#087B8B',
  },
  chipCampoTexto: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  chipCampoTextoActivo: {
    color: '#FFFFFF',
  },
  chipAgregar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 4,
  },
  chipAgregarTexto: {
    fontSize: 12,
    fontWeight: '800',
    color: '#087B8B',
  },
  filaLabelTexto: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  textoEliminarCuadro: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  inputTextoLibre: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    marginBottom: 14,
  },
  controlesFila: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginBottom: 14,
  },
  controlGrupo: {
    flex: 1,
  },
  controlLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 4,
  },
  stepperBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValor: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  btnEstilo: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnEstiloActivo: {
    backgroundColor: '#002B45',
    borderColor: '#002B45',
  },
  btnEstiloTexto: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  filaColores: {
    flexDirection: 'row',
    gap: 11,
    marginTop: 2,
  },
  circuloColor: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  circuloColorActivo: {
    borderWidth: 3,
    borderColor: '#82A323',
    transform: [{ scale: 1.12 }],
  },
  botonGenerarPdf: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#82A323',
    borderRadius: 13,
    minHeight: 54,
    gap: 8,
  },
  textoGenerarPdf: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    justifyContent: 'center',
    padding: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  modalTituloRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitulo: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  modalCerrarBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSubtitulo: {
    color: '#CBD5E1',
    fontSize: 12,
    marginBottom: 16,
  },
  hojaPreview: {
    width: '100%',
    aspectRatio: 11 / 8.5,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  modalAcciones: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  btnVolverEditar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
    minHeight: 48,
    borderRadius: 12,
    gap: 7,
  },
  btnDescargarModal: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#82A323',
    minHeight: 48,
    borderRadius: 12,
    gap: 7,
  },
  textoVolverEditar: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});