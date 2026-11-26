// @ts-nocheck

import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import {
  getFormularioEvaluacion,
  guardarEvaluacionJurado,
} from '../../services/api';

// Construye la URL pública del PDF guardado en Laravel (storage/app/public/...)
const obtenerUrlDocumentoPdf = (rutaReporte: string) => {
  const limpio = String(rutaReporte || '').trim();
  if (!limpio) return '';
  if (limpio.startsWith('http://') || limpio.startsWith('https://')) {
    return limpio;
  }

  const apiBase =
    process.env.EXPO_PUBLIC_API_URL ||
    process.env.EXPO_PUBLIC_API_BASE_URL ||
    '';

  const servidorRaiz = String(apiBase).replace(/\/api\/?$/, '').replace(/\/+$/, '');
  const rutaArchivo = limpio.replace(/^\/+/, '');

  if (!servidorRaiz) return '';
  return `${servidorRaiz}/storage/${rutaArchivo}`;
};

export default function EvaluarEquipo() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const idEquipo = String(params?.idEquipo || '');
  const nombreEquipo = String(params?.nombreEquipo || 'Equipo');

  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [evaluacionExistente, setEvaluacionExistente] = useState(false);

  const [equipo, setEquipo] = useState<any>(null);
  const [categorias, setCategorias] = useState<any[]>([]);

  const [respuestas, setRespuestas] = useState<{
    [key: string]: string;
  }>({});

  const [comentarios, setComentarios] = useState('');
  const [evaluacionEjecutiva, setEvaluacionEjecutiva] =
    useState<number | null>(null);

  const [tipoCertamen, setTipoCertamen] = useState('');

  // ============================================================
  // CARGAR FORMULARIO
  // ============================================================

  useEffect(() => {
    cargarFormulario();
  }, [idEquipo]);

  const cargarFormulario = async () => {
    try {
      if (!idEquipo || isNaN(Number(idEquipo))) {
        Alert.alert('Error', 'No se recibió un ID de equipo válido.');
        return;
      }

      setCargando(true);

      // 1. LIMPIAR ESTADOS ANTERIORES INMEDIATAMENTE AL CAMBIAR DE EQUIPO
      setEvaluacionExistente(false);
      setRespuestas({});
      setComentarios('');
      setEvaluacionEjecutiva(null);
      setCategorias([]);
      setEquipo(null);

      const respuesta = await getFormularioEvaluacion(Number(idEquipo));

      setEquipo(respuesta?.equipo || null);

      const categoriasRecibidas = Array.isArray(respuesta?.categorias)
        ? respuesta.categorias
        : [];

      setCategorias(categoriasRecibidas);
      setTipoCertamen(String(respuesta?.tipo || '').toUpperCase());

      // ========================================================
      // SI YA EXISTE UNA EVALUACIÓN, CARGARLA
      // ========================================================
      if (respuesta?.evaluacion) {
        setEvaluacionExistente(true);
        setComentarios(respuesta.evaluacion.Comentarios || '');

        const respuestasIniciales: any = {};
        let subtotalRubrica = 0;

        if (Array.isArray(respuesta.evaluacion.preguntas)) {
          respuesta.evaluacion.preguntas.forEach((pregunta: any) => {
            const valor = Number(pregunta.Valor ?? 0);
            respuestasIniciales[String(pregunta.Id_rubrica)] = String(
              pregunta.Valor ?? ''
            );
            subtotalRubrica += valor;
          });
        }

        setRespuestas(respuestasIniciales);

        const totalGuardado = Number(
          respuesta.evaluacion.Puntuaje_determinado || 0
        );
        const puntosEjecutivos = totalGuardado - subtotalRubrica;

        if (
          puntosEjecutivos === 2 ||
          puntosEjecutivos === 5 ||
          puntosEjecutivos === 8
        ) {
          setEvaluacionEjecutiva(puntosEjecutivos);
        } else {
          setEvaluacionEjecutiva(null); // Asegurar nulo si no coincide
        }
      } else {
        // 2. REFORZAR LIMPIEZA SI ES UNA EVALUACIÓN NUEVA
        setEvaluacionExistente(false);
        setRespuestas({});
        setComentarios('');
        setEvaluacionEjecutiva(null);
      }
    } catch (error: any) {
      console.error('================================');
      console.error('ERROR AL CARGAR EVALUACIÓN:', error);
      console.error('MENSAJE:', error?.message);
      console.error('================================');

      Alert.alert(
        'Error',
        error?.message || 'No se pudo cargar la rúbrica de evaluación.'
      );
    } finally {
      setCargando(false);
    }
  };

  // ============================================================
  // ABRIR ENTREGABLES (VIDEO / PDF)
  // ============================================================

  const abrirEnlace = async (urlRaw: string) => {
    const limpio = String(urlRaw || '').trim();
    if (!limpio) {
      Alert.alert('No disponible', 'No se encontró la ruta del archivo o enlace.');
      return;
    }
    const url =
      limpio.startsWith('http://') || limpio.startsWith('https://')
        ? limpio
        : `https://${limpio}`;
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        'No se pudo abrir',
        'No fue posible abrir el documento o enlace en este dispositivo.'
      );
    }
  };

  const abrirDocumentoPdf = async (rutaReporte: string) => {
    const urlPdf = obtenerUrlDocumentoPdf(rutaReporte);
    if (!urlPdf) {
      Alert.alert(
        'No disponible',
        'No se pudo construir la ruta del PDF en el servidor.'
      );
      return;
    }
    await abrirEnlace(urlPdf);
  };

  // ============================================================
  // CAMBIAR RESPUESTA
  // ============================================================

  const cambiarRespuesta = (idRubrica: number, valor: string) => {
    setRespuestas((prev) => ({
      ...prev,
      [String(idRubrica)]: valor,
    }));
  };

  // ============================================================
  // VALIDAR FORMULARIO
  // ============================================================

  const validarFormulario = () => {
    if (!idEquipo || isNaN(Number(idEquipo))) {
      Alert.alert('Error', 'El ID del equipo no es válido.');
      return false;
    }

    if (!Array.isArray(categorias) || categorias.length === 0) {
      Alert.alert(
        'Sin rúbrica',
        'No hay categorías o criterios de evaluación disponibles.'
      );
      return false;
    }

    for (const categoria of categorias) {
      const rubricas = Array.isArray(categoria?.rubricas)
        ? categoria.rubricas
        : [];

      for (const rubrica of rubricas) {
        const valorTexto = respuestas[String(rubrica.Id_rubrica)];

        // RESPUESTA VACÍA
        if (
          valorTexto === undefined ||
          valorTexto === null ||
          String(valorTexto).trim() === ''
        ) {
          Alert.alert(
            'Evaluación incompleta',
            `Debes responder el criterio:\n\n${rubrica.Pregunta}`
          );
          return false;
        }

        const valor = Number(valorTexto);
        const valorMax = Number(rubrica.Valor_Max);

        // NO NUMÉRICO
        if (isNaN(valor)) {
          Alert.alert(
            'Valor inválido',
            `La respuesta de "${rubrica.Pregunta}" debe ser numérica.`
          );
          return false;
        }

        // MENOR QUE CERO
        if (valor < 0) {
          Alert.alert(
            'Valor inválido',
            `El valor de "${rubrica.Pregunta}" no puede ser menor que 0.`
          );
          return false;
        }

        // MAYOR AL MÁXIMO
        if (!isNaN(valorMax) && valor > valorMax) {
          Alert.alert(
            'Valor inválido',
            `El criterio "${rubrica.Pregunta}" tiene un máximo de ${valorMax}.`
          );
          return false;
        }
      }
    }

    if (esInnovatecEjecutivo && evaluacionEjecutiva === null) {
      Alert.alert(
        'Evaluación incompleta',
        'Debes seleccionar la evaluación ejecutiva del proyecto.'
      );
      return false;
    }

    return true;
  };

  // ============================================================
  // GUARDAR EVALUACIÓN
  // ============================================================

  const guardar = async () => {
    if (!validarFormulario()) {
      return;
    }

    try {
      setGuardando(true);

      const respuestasArray: {
        Id_rubrica: number;
        Valor: number;
      }[] = [];

      // CONSTRUIR RESPUESTAS
      categorias.forEach((categoria) => {
        const rubricas = Array.isArray(categoria?.rubricas)
          ? categoria.rubricas
          : [];

        rubricas.forEach((rubrica: any) => {
          const idRubrica = Number(rubrica.Id_rubrica);
          const valor = Number(respuestas[String(idRubrica)]);

          respuestasArray.push({
            Id_rubrica: idRubrica,
            Valor: valor,
          });
        });
      });

      // DATOS QUE SE ENVÍAN A LARAVEL
      const datos: any = {
        Id_equipo: Number(idEquipo),
        Comentarios: comentarios.trim(),
        respuestas: respuestasArray,
      };

      // INNOVATEC: enviar la evaluación ejecutiva solamente cuando corresponde.
      if (esInnovatecEjecutivo) {
        datos.evaluacion_ejecutiva = evaluacionEjecutiva;
      }

      console.log('================================');
      console.log('GUARDANDO EVALUACIÓN');
      console.log('ID EQUIPO:', Number(idEquipo));
      console.log('NOMBRE EQUIPO:', nombreEquipo);
      console.log('RESPUESTAS:', JSON.stringify(respuestasArray, null, 2));
      console.log('DATOS COMPLETOS:', JSON.stringify(datos, null, 2));
      console.log('================================');

      // ENVIAR A LARAVEL
      const respuesta = await guardarEvaluacionJurado(datos);

      console.log('================================');
      console.log('RESPUESTA DE LARAVEL:', JSON.stringify(respuesta, null, 2));
      console.log('================================');

      // ÉXITO
      Alert.alert(
        'Evaluación guardada',
        'La evaluación del equipo se guardó correctamente.',
        [
          {
            text: 'Aceptar',
            onPress: () => {
              router.back();
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('================================');
      console.error('ERROR AL GUARDAR EVALUACIÓN:', error);
      console.error('MENSAJE:', error?.message);
      console.error('================================');

      let mensaje = error?.message || 'No se pudo guardar la evaluación.';
      if (typeof mensaje !== 'string') {
        mensaje = 'Laravel rechazó la evaluación.';
      }

      Alert.alert('No se pudo guardar', mensaje);
    } finally {
      setGuardando(false);
    }
  };

  // ============================================================
  // TOTALES
  // ============================================================

  const calcularMaximoRubrica = () => {
    let maximo = 0;

    categorias.forEach((categoria: any) => {
      const rubricas = Array.isArray(categoria?.rubricas)
        ? categoria.rubricas
        : [];

      rubricas.forEach((rubrica: any) => {
        const valorMax = Number(rubrica?.Valor_Max || 0);
        if (!isNaN(valorMax)) {
          maximo += valorMax;
        }
      });
    });

    return maximo;
  };

  const esInnovatecEjecutivo =
    tipoCertamen === 'INNOVATEC' && calcularMaximoRubrica() === 92;

  const calcularTotal = () => {
    let total = 0;

    categorias.forEach((categoria) => {
      const rubricas = Array.isArray(categoria?.rubricas)
        ? categoria.rubricas
        : [];

      rubricas.forEach((rubrica: any) => {
        const valor = Number(respuestas[String(rubrica.Id_rubrica)]);
        if (!isNaN(valor)) {
          total += valor;
        }
      });
    });

    if (esInnovatecEjecutivo && evaluacionEjecutiva !== null) {
      total += evaluacionEjecutiva;
    }

    return total;
  };

  const calcularMaximo = () => {
    let maximo = calcularMaximoRubrica();
    if (esInnovatecEjecutivo) {
      maximo += 8;
    }
    return maximo;
  };

  const total = calcularTotal();
  const maximo = calcularMaximo();
  const porcentaje = maximo > 0 ? Math.round((total / maximo) * 100) : 0;

  // Datos extraídos del equipo para visualizar
  const desafioNombre =
    equipo?.desafio?.Nombre ??
    equipo?.desafio?.nombre ??
    equipo?.Nombre_desafio ??
    'No especificado';

  const categoriaEquipoNombre =
    equipo?.categoriaCertamen?.Nombre ??
    equipo?.categoriaCertamen?.nombre ??
    equipo?.categoria_certamen?.Nombre ??
    equipo?.categoria_certamen?.nombre ??
    equipo?.Nombre_categoria ??
    'No especificada';

  const salaNombre =
    equipo?.sala?.Nombre ??
    equipo?.sala?.nombre ??
    equipo?.Nombre_sala ??
    null;

  const videoEquipo = equipo?.Video ?? equipo?.video ?? null;
  const reporteEquipo = equipo?.Reporte ?? equipo?.reporte ?? null;

  // ============================================================
  // CARGANDO
  // ============================================================

  if (cargando) {
    return (
      <View style={styles.loadingPage}>
        <ActivityIndicator size="large" color="#0879AD" />
        <Text style={styles.loadingText}>Cargando rúbrica...</Text>
      </View>
    );
  }

  // ============================================================
  // PANTALLA
  // ============================================================

  return (
    <View style={styles.page}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* ================================================== */}
        {/* HEADER                                             */}
        {/* ================================================== */}

        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={25} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.headerText}>
            <Text style={styles.kicker}>EVALUACIÓN</Text>
            <Text style={styles.title} numberOfLines={1}>
              {equipo?.Nombre || nombreEquipo}
            </Text>
          </View>
        </View>

        {/* ================================================== */}
        {/* TARJETA EQUIPO (SIN ID VISIBLE)                    */}
        {/* ================================================== */}

        <View style={styles.teamCard}>
          <View style={styles.teamIcon}>
            <Ionicons name="people" size={32} color="#FFFFFF" />
          </View>

          <View style={styles.teamInfo}>
            <Text style={styles.teamLabel}>EQUIPO A EVALUAR</Text>
            <Text style={styles.teamName} numberOfLines={2}>
              {equipo?.Nombre || nombreEquipo}
            </Text>
            {tipoCertamen ? (
              <Text style={styles.teamModality}>
                {tipoCertamen === 'INNOVATEC' ? 'InnovaTecNM' : tipoCertamen}
              </Text>
            ) : null}
          </View>
        </View>

        {/* ================================================== */}
        {/* DATOS DEL PROYECTO Y ENTREGABLES (VIDEO / PDF)     */}
        {/* ================================================== */}

        <View style={styles.projectCard}>
          <View style={styles.projectHeader}>
            <Ionicons name="folder-open-outline" size={20} color="#063B52" />
            <Text style={styles.projectHeaderTitle}>
              Información y entregables del equipo
            </Text>
          </View>

          <View style={styles.projectMetaBox}>
            <View style={styles.projectMetaRow}>
              <Ionicons name="trophy-outline" size={16} color="#0879AD" />
              <Text style={styles.projectMetaText}>
                <Text style={styles.projectMetaLabel}>Desafío: </Text>
                {desafioNombre}
              </Text>
            </View>

            <View style={styles.projectMetaRow}>
              <Ionicons name="pricetag-outline" size={16} color="#0879AD" />
              <Text style={styles.projectMetaText}>
                <Text style={styles.projectMetaLabel}>Categoría: </Text>
                {categoriaEquipoNombre}
              </Text>
            </View>

            {tipoCertamen === 'INNOVATEC' && (
              <View style={styles.projectMetaRow}>
                <Ionicons name="location-outline" size={16} color="#0879AD" />
                <Text style={styles.projectMetaText}>
                  <Text style={styles.projectMetaLabel}>Sala: </Text>
                  {salaNombre || 'Sin sala asignada'}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.deliverablesSectionLabel}>
            Material de apoyo para evaluar
          </Text>

          <View style={styles.deliverablesButtons}>
            {videoEquipo ? (
              <TouchableOpacity
                style={styles.deliverableButton}
                activeOpacity={0.85}
                onPress={() => abrirEnlace(videoEquipo)}
              >
                <Ionicons name="logo-youtube" size={20} color="#DC2626" />
                <Text style={styles.deliverableButtonText} numberOfLines={1}>
                  Ver video demostrativo
                </Text>
                <Ionicons name="open-outline" size={17} color="#0879AD" />
              </TouchableOpacity>
            ) : (
              <View style={styles.deliverableEmpty}>
                <Ionicons name="videocam-off-outline" size={17} color="#94A3B8" />
                <Text style={styles.deliverableEmptyText}>
                  Este equipo no adjuntó video
                </Text>
              </View>
            )}

            {reporteEquipo ? (
              <TouchableOpacity
                style={styles.deliverableButton}
                activeOpacity={0.85}
                onPress={() => abrirDocumentoPdf(reporteEquipo)}
              >
                <Ionicons name="document-text" size={20} color="#0369A1" />
                <Text style={styles.deliverableButtonText} numberOfLines={1}>
                  Abrir reporte PDF
                </Text>
                <Ionicons name="open-outline" size={17} color="#0879AD" />
              </TouchableOpacity>
            ) : (
              <View style={styles.deliverableEmpty}>
                <Ionicons name="document-outline" size={17} color="#94A3B8" />
                <Text style={styles.deliverableEmptyText}>
                  Este equipo no adjuntó reporte PDF
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ================================================== */}
        {/* TÍTULO RÚBRICA                                     */}
        {/* ================================================== */}

        <Text style={styles.sectionTitle}>Rúbrica de evaluación</Text>

        <Text style={styles.description}>
          {evaluacionExistente
            ? 'Esta evaluación ya fue finalizada y solo está disponible para consulta.'
            : 'Evalúa cada criterio de acuerdo con los valores establecidos en la rúbrica.'}
        </Text>

        {evaluacionExistente && (
          <View style={styles.completedBanner}>
            <View style={styles.completedIcon}>
              <Ionicons name="lock-closed" size={20} color="#FFFFFF" />
            </View>

            <View style={styles.completedContent}>
              <Text style={styles.completedTitle}>Evaluación finalizada</Text>
              <Text style={styles.completedText}>
                Ya evaluaste este equipo. Los resultados no pueden modificarse.
              </Text>
            </View>
          </View>
        )}

        {/* ================================================== */}
        {/* CATEGORÍAS                                         */}
        {/* ================================================== */}

        {categorias.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={42} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No hay rúbrica disponible</Text>
            <Text style={styles.emptyText}>
              No se encontraron categorías o criterios de evaluación para este
              certamen.
            </Text>
          </View>
        ) : (
          categorias.map((categoria: any, index: number) => {
            const rubricas = Array.isArray(categoria?.rubricas)
              ? categoria.rubricas
              : [];

            return (
              <View
                key={categoria.Id_categoria || `categoria-${index}`}
                style={styles.categoryCard}
              >
                {/* CATEGORÍA */}
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{index + 1}</Text>
                  </View>

                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryTitle}>
                      {categoria.Nombre || `Categoría ${index + 1}`}
                    </Text>
                    <Text style={styles.categoryCount}>
                      {rubricas.length}{' '}
                      {rubricas.length === 1 ? 'criterio' : 'criterios'}
                    </Text>
                  </View>
                </View>

                {/* PREGUNTAS */}
                {rubricas.map((rubrica: any, rubricaIndex: number) => {
                  const idRubrica = Number(rubrica.Id_rubrica);
                  const valorMax = Number(rubrica?.Valor_Max || 0);

                  return (
                    <View key={idRubrica} style={styles.criterionCard}>
                      <Text style={styles.criterionNumber}>
                        CRITERIO {rubricaIndex + 1}
                      </Text>

                      <Text style={styles.criterionTitle}>
                        {rubrica.Pregunta}
                      </Text>

                      <Text style={styles.maxText}>
                        Valor máximo: {valorMax}
                      </Text>

                      <View style={styles.inputRow}>
                        <TextInput
                          style={[
                            styles.scoreInput,
                            evaluacionExistente && styles.scoreInputReadOnly,
                          ]}
                          value={respuestas[String(idRubrica)] || ''}
                          onChangeText={
                            evaluacionExistente
                              ? undefined
                              : (texto) => cambiarRespuesta(idRubrica, texto)
                          }
                          editable={!evaluacionExistente}
                          selectTextOnFocus={!evaluacionExistente}
                          keyboardType="decimal-pad"
                          placeholder="0"
                          placeholderTextColor="#94A3B8"
                          maxLength={8}
                        />

                        <Text style={styles.maxLabel}>/ {valorMax}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            );
          })
        )}

        {/* ================================================== */}
        {/* EVALUACIÓN EJECUTIVA (INNOVATEC)                   */}
        {/* ================================================== */}

        {esInnovatecEjecutivo && (
          <View style={styles.executiveCard}>
            <View style={styles.executiveHeader}>
              <View style={styles.executiveIcon}>
                <Ionicons name="business-outline" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.executiveHeaderText}>
                <Text style={styles.executiveTitle}>Evaluación ejecutiva</Text>
                <Text style={styles.executiveDescription}>
                  Selecciona el nivel de desarrollo del proyecto. Esta evaluación
                  aporta hasta 8 puntos al resultado final.
                </Text>
              </View>
            </View>

            <View style={styles.executiveOptions}>
              {/* VERDE - 8 PUNTOS */}
              <TouchableOpacity
                style={[
                  styles.executiveOption,
                  styles.executiveOptionGreen,
                  evaluacionEjecutiva === 8 &&
                    styles.executiveOptionGreenSelected,
                  evaluacionExistente && styles.executiveOptionReadOnly,
                ]}
                onPress={() =>
                  !evaluacionExistente && setEvaluacionEjecutiva(8)
                }
                disabled={evaluacionExistente}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.executiveRadio,
                    styles.executiveRadioGreen,
                  ]}
                >
                  {evaluacionEjecutiva === 8 && (
                    <View
                      style={[
                        styles.executiveRadioSelected,
                        styles.executiveRadioGreenSelected,
                      ]}
                    />
                  )}
                </View>

                <View style={styles.executiveOptionContent}>
                  <Text style={styles.executiveOptionTitle}>
                    Proyecto viable
                  </Text>
                  <Text style={styles.executiveOptionDescription}>
                    Proyecto con viabilidad y potencial de implementación.
                  </Text>
                </View>

                <Text
                  style={[styles.executiveScore, styles.executiveScoreGreen]}
                >
                  8 pts
                </Text>
              </TouchableOpacity>

              {/* AMARILLO - 5 PUNTOS */}
              <TouchableOpacity
                style={[
                  styles.executiveOption,
                  styles.executiveOptionYellow,
                  evaluacionEjecutiva === 5 &&
                    styles.executiveOptionYellowSelected,
                  evaluacionExistente && styles.executiveOptionReadOnly,
                ]}
                onPress={() =>
                  !evaluacionExistente && setEvaluacionEjecutiva(5)
                }
                disabled={evaluacionExistente}
                activeOpacity={0.85}
              >
                <View
                  style={[
                    styles.executiveRadio,
                    styles.executiveRadioYellow,
                  ]}
                >
                  {evaluacionEjecutiva === 5 && (
                    <View
                      style={[
                        styles.executiveRadioSelected,
                        styles.executiveRadioYellowSelected,
                      ]}
                    />
                  )}
                </View>

                <View style={styles.executiveOptionContent}>
                  <Text style={styles.executiveOptionTitle}>
                    Proyecto en desarrollo
                  </Text>
                  <Text style={styles.executiveOptionDescription}>
                    El proyecto presenta avances, pero aún requiere desarrollo.
                  </Text>
                </View>

                <Text
                  style={[styles.executiveScore, styles.executiveScoreYellow]}
                >
                  5 pts
                </Text>
              </TouchableOpacity>

              {/* ROJO - 2 PUNTOS */}
              <TouchableOpacity
                style={[
                  styles.executiveOption,
                  styles.executiveOptionRed,
                  evaluacionEjecutiva === 2 &&
                    styles.executiveOptionRedSelected,
                  evaluacionExistente && styles.executiveOptionReadOnly,
                ]}
                onPress={() =>
                  !evaluacionExistente && setEvaluacionEjecutiva(2)
                }
                disabled={evaluacionExistente}
                activeOpacity={0.85}
              >
                <View
                  style={[styles.executiveRadio, styles.executiveRadioRed]}
                >
                  {evaluacionEjecutiva === 2 && (
                    <View
                      style={[
                        styles.executiveRadioSelected,
                        styles.executiveRadioRedSelected,
                      ]}
                    />
                  )}
                </View>

                <View style={styles.executiveOptionContent}>
                  <Text style={styles.executiveOptionTitle}>
                    Proyecto académico
                  </Text>
                  <Text style={styles.executiveOptionDescription}>
                    El proyecto corresponde principalmente a un ejercicio
                    académico.
                  </Text>
                </View>

                <Text style={[styles.executiveScore, styles.executiveScoreRed]}>
                  2 pts
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ================================================== */}
        {/* RESUMEN                                            */}
        {/* ================================================== */}

        <View style={styles.totalCard}>
          <View>
            <Text style={styles.totalLabel}>PUNTAJE TOTAL</Text>
            <Text style={styles.totalValue}>
              {total.toFixed(2)}
              <Text style={styles.totalMax}> / {maximo.toFixed(2)}</Text>
            </Text>
          </View>

          <View style={styles.percentageBox}>
            <Text style={styles.percentageText}>{porcentaje}%</Text>
          </View>
        </View>

        {/* ================================================== */}
        {/* COMENTARIOS                                        */}
        {/* ================================================== */}

        <View style={styles.commentsCard}>
          <Text style={styles.commentsTitle}>Comentarios del jurado</Text>

          <TextInput
            style={[
              styles.commentsInput,
              evaluacionExistente && styles.commentsInputReadOnly,
            ]}
            value={comentarios}
            onChangeText={evaluacionExistente ? undefined : setComentarios}
            editable={!evaluacionExistente}
            placeholder="Escribe aquí tus observaciones..."
            placeholderTextColor="#94A3B8"
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* ================================================== */}
        {/* GUARDAR                                            */}
        {/* ================================================== */}

        {!evaluacionExistente && (
          <TouchableOpacity
            style={[styles.saveButton, guardando && styles.saveButtonDisabled]}
            activeOpacity={0.85}
            disabled={guardando}
            onPress={guardar}
          >
            {guardando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Ionicons
                name="checkmark-circle-outline"
                size={24}
                color="#FFFFFF"
              />
            )}

            <Text style={styles.saveText}>
              {guardando ? 'Guardando...' : 'Guardar evaluación'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  completedBanner: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 17,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  completedIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedContent: {
    flex: 1,
    marginLeft: 11,
  },
  completedTitle: {
    color: '#065F46',
    fontSize: 14,
    fontWeight: '900',
  },
  completedText: {
    color: '#047857',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  scoreInputReadOnly: {
    backgroundColor: '#E2E8F0',
    borderColor: '#CBD5E1',
    color: '#475569',
  },
  executiveOptionReadOnly: {
    opacity: 0.75,
  },
  commentsInputReadOnly: {
    backgroundColor: '#E2E8F0',
    borderColor: '#CBD5E1',
    color: '#475569',
  },
  loadingPage: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
  },
  container: {
    padding: 18,
    paddingBottom: 50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#063B52',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    flex: 1,
    marginLeft: 13,
  },
  kicker: {
    color: '#0B719D',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  title: {
    color: '#063B52',
    fontSize: 23,
    fontWeight: '900',
    marginTop: 2,
  },
  teamCard: {
    backgroundColor: '#063B52',
    borderRadius: 20,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  teamIcon: {
    width: 58,
    height: 58,
    borderRadius: 18,
    backgroundColor: '#0879AD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  teamInfo: {
    flex: 1,
    marginLeft: 14,
  },
  teamLabel: {
    color: '#B8D6E3',
    fontSize: 10,
    fontWeight: '900',
  },
  teamName: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 3,
  },
  teamModality: {
    color: '#B8D6E3',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  projectCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DBE3EE',
    padding: 16,
    marginBottom: 22,
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  projectHeaderTitle: {
    color: '#063B52',
    fontSize: 15,
    fontWeight: '900',
  },
  projectMetaBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 8,
  },
  projectMetaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  projectMetaLabel: {
    fontWeight: '800',
    color: '#1E293B',
  },
  projectMetaText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  deliverablesSectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#063B52',
    marginTop: 14,
    marginBottom: 8,
  },
  deliverablesButtons: {
    gap: 8,
  },
  deliverableButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 13,
  },
  deliverableButtonText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    color: '#063B52',
  },
  deliverableEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 11,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  deliverableEmptyText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#063B52',
    fontSize: 21,
    fontWeight: '900',
  },
  description: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 5,
    marginBottom: 15,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DBE3EE',
    padding: 16,
    marginBottom: 16,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  categoryBadge: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: '#063B52',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBadgeText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
  },
  categoryInfo: {
    flex: 1,
    marginLeft: 12,
  },
  categoryTitle: {
    color: '#172033',
    fontSize: 17,
    fontWeight: '900',
  },
  categoryCount: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2,
  },
  criterionCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 15,
    marginTop: 10,
  },
  criterionNumber: {
    color: '#0879AD',
    fontSize: 10,
    fontWeight: '900',
  },
  criterionTitle: {
    color: '#172033',
    fontSize: 16,
    fontWeight: '900',
    lineHeight: 21,
    marginTop: 5,
  },
  maxText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 7,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  scoreInput: {
    width: 100,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 13,
    paddingHorizontal: 14,
    color: '#063B52',
    fontSize: 18,
    fontWeight: '900',
    textAlign: 'center',
  },
  maxLabel: {
    color: '#64748B',
    fontSize: 16,
    fontWeight: '800',
    marginLeft: 8,
  },
  executiveCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DBE3EE',
    padding: 17,
    marginBottom: 18,
  },
  executiveHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  executiveIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: '#063B52',
    justifyContent: 'center',
    alignItems: 'center',
  },
  executiveHeaderText: {
    flex: 1,
    marginLeft: 12,
  },
  executiveTitle: {
    color: '#063B52',
    fontSize: 17,
    fontWeight: '900',
  },
  executiveDescription: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  executiveOptions: {
    marginTop: 15,
  },
  executiveOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 15,
    padding: 14,
    marginTop: 9,
  },
  executiveRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  executiveRadioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#0879AD',
  },
  executiveOptionContent: {
    flex: 1,
    marginLeft: 11,
    marginRight: 8,
  },
  executiveOptionTitle: {
    color: '#172033',
    fontSize: 14,
    fontWeight: '900',
  },
  executiveOptionDescription: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  executiveScore: {
    color: '#063B52',
    fontSize: 15,
    fontWeight: '900',
  },
  executiveOptionGreen: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  executiveOptionGreenSelected: {
    borderColor: '#16A34A',
    backgroundColor: '#DCFCE7',
    borderWidth: 2,
  },
  executiveOptionYellow: {
    borderColor: '#FDE68A',
    backgroundColor: '#FFFBEB',
  },
  executiveOptionYellowSelected: {
    borderColor: '#D97706',
    backgroundColor: '#FEF3C7',
    borderWidth: 2,
  },
  executiveOptionRed: {
    borderColor: '#FCA5A5',
    backgroundColor: '#FEF2F2',
  },
  executiveOptionRedSelected: {
    borderColor: '#DC2626',
    backgroundColor: '#FEE2E2',
    borderWidth: 2,
  },
  executiveRadioGreen: {
    borderColor: '#16A34A',
  },
  executiveRadioGreenSelected: {
    backgroundColor: '#16A34A',
  },
  executiveRadioYellow: {
    borderColor: '#D97706',
  },
  executiveRadioYellowSelected: {
    backgroundColor: '#D97706',
  },
  executiveRadioRed: {
    borderColor: '#DC2626',
  },
  executiveRadioRedSelected: {
    backgroundColor: '#DC2626',
  },
  executiveScoreGreen: {
    color: '#15803D',
  },
  executiveScoreYellow: {
    color: '#B45309',
  },
  executiveScoreRed: {
    color: '#B91C1C',
  },
  totalCard: {
    backgroundColor: '#063B52',
    borderRadius: 20,
    padding: 20,
    marginTop: 5,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalLabel: {
    color: '#B8D6E3',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  totalValue: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '900',
    marginTop: 4,
  },
  totalMax: {
    color: '#B8D6E3',
    fontSize: 15,
    fontWeight: '700',
  },
  percentageBox: {
    minWidth: 75,
    height: 55,
    borderRadius: 15,
    backgroundColor: '#0879AD',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  percentageText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
  commentsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DBE3EE',
    padding: 17,
    marginBottom: 15,
  },
  commentsTitle: {
    color: '#172033',
    fontSize: 16,
    fontWeight: '900',
  },
  commentsInput: {
    height: 120,
    borderRadius: 13,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 12,
    padding: 13,
    color: '#172033',
    fontSize: 13,
  },
  saveButton: {
    minHeight: 56,
    borderRadius: 15,
    backgroundColor: '#063B52',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
  },
  saveButtonDisabled: {
    opacity: 0.65,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    marginLeft: 9,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DBE3EE',
    padding: 30,
    alignItems: 'center',
    marginBottom: 15,
  },
  emptyTitle: {
    color: '#172033',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 12,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 6,
  },
});