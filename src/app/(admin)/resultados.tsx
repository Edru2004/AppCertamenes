
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import {
  getEvaluaciones,
  getModalidadSeleccionada,
} from '../../services/api';

type Modalidad = 'RALLY' | 'INNOVATEC';

type EquipoResultado = {
  id: number;
  nombre: string;
  promedio: number;
  evaluaciones: number;
};

type ResultadoCategoria = {
  categoria: string;
  equipo: string;
  promedio: number;
};

const ANCHO_TARJETA = 285;
const ESPACIO_TARJETAS = 14;

const numero = (valor: any): number => {
  const resultado = Number(valor);
  return Number.isFinite(resultado) ? resultado : 0;
};

// Obtiene el arreglo aunque Laravel responda con data,
// data.data o directamente con un arreglo.
const obtenerLista = (respuesta: any): any[] => {
  if (Array.isArray(respuesta)) {
    return respuesta;
  }

  if (!respuesta || typeof respuesta !== 'object') {
    return [];
  }

  const posibles = [
    respuesta.data,
    respuesta.data?.data,
    respuesta.evaluaciones,
    respuesta.registros,
  ];

  for (const elemento of posibles) {
    if (Array.isArray(elemento)) {
      return elemento;
    }
  }

  return [];
};

const obtenerIdEquipo = (equipo: any): number => {
  return numero(
    equipo?.Id_equipo ??
    equipo?.id_equipo ??
    equipo?.id
  );
};

const obtenerNombreEquipo = (equipo: any): string => {
  return (
    equipo?.Nombre ??
    equipo?.nombre ??
    equipo?.nombre_equipo ??
    'Equipo sin nombre'
  );
};

const obtenerNombreCategoria = (categoria: any): string => {
  if (typeof categoria === 'string') {
    return categoria;
  }

  return (
    categoria?.Nombre ??
    categoria?.nombre ??
    categoria?.nombre_categoria ??
    ''
  );
};

// Agrupa las evaluaciones y calcula los promedios.
const procesarResultados = (evaluaciones: any[]) => {
  const equiposMap = new Map<number, {
    id: number;
    nombre: string;
    puntuaciones: number[];
  }>();

  const categoriasMap = new Map<string, Map<number, {
    nombreEquipo: string;
    puntuaciones: number[];
  }>>();

  evaluaciones.forEach((evaluacion) => {
    const equipo = evaluacion?.equipo;

    if (!equipo) return;

    const idEquipo = obtenerIdEquipo(equipo);

    if (!idEquipo) return;

    const nombreEquipo = obtenerNombreEquipo(equipo);

    // PROMEDIO GENERAL DEL EQUIPO
    const puntuacionGeneral = Number(
      evaluacion?.Puntuaje_determinado ??
      evaluacion?.Puntaje_determinado ??
      evaluacion?.puntaje_determinado
    );

    if (Number.isFinite(puntuacionGeneral)) {
      if (!equiposMap.has(idEquipo)) {
        equiposMap.set(idEquipo, {
          id: idEquipo,
          nombre: nombreEquipo,
          puntuaciones: [],
        });
      }

      equiposMap.get(idEquipo)!.puntuaciones.push(
        puntuacionGeneral
      );
    }

    // RESULTADOS POR CATEGORÍA
    const preguntas = Array.isArray(evaluacion?.preguntas)
      ? evaluacion.preguntas
      : [];

    const puntuacionesEvaluacion = new Map<string, number>();

    preguntas.forEach((pregunta: any) => {
      const rubrica = pregunta?.rubrica;
      const categoria = rubrica?.categoria;

      const nombreCategoria =
        obtenerNombreCategoria(categoria);

      if (!nombreCategoria) return;

      const valor = numero(pregunta?.Valor ?? pregunta?.valor);

      puntuacionesEvaluacion.set(
        nombreCategoria,
        (puntuacionesEvaluacion.get(nombreCategoria) ?? 0) + valor
      );
    });

    // Se guarda el total de cada categoría por evaluación.
    puntuacionesEvaluacion.forEach((total, nombreCategoria) => {
      if (!categoriasMap.has(nombreCategoria)) {
        categoriasMap.set(nombreCategoria, new Map());
      }

      const equiposCategoria = categoriasMap.get(nombreCategoria)!;

      if (!equiposCategoria.has(idEquipo)) {
        equiposCategoria.set(idEquipo, {
          nombreEquipo,
          puntuaciones: [],
        });
      }

      equiposCategoria.get(idEquipo)!.puntuaciones.push(total);
    });
  });

  const equipos: EquipoResultado[] = Array.from(
    equiposMap.values()
  ).map((equipo) => ({
    id: equipo.id,
    nombre: equipo.nombre,
    promedio:
      equipo.puntuaciones.reduce((a, b) => a + b, 0) /
      equipo.puntuaciones.length,
    evaluaciones: equipo.puntuaciones.length,
  })).sort((a, b) => b.promedio - a.promedio);

  const resultadosCategoria: ResultadoCategoria[] = [];

  categoriasMap.forEach((equiposCategoria, categoria) => {
    equiposCategoria.forEach((datos) => {
      const promedio =
        datos.puntuaciones.reduce((a, b) => a + b, 0) /
        datos.puntuaciones.length;

      resultadosCategoria.push({
        categoria,
        equipo: datos.nombreEquipo,
        promedio,
      });
    });
  });

  resultadosCategoria.sort((a, b) => {
    if (a.categoria !== b.categoria) {
      return a.categoria.localeCompare(b.categoria);
    }

    return b.promedio - a.promedio;
  });

  return {
    equipos,
    resultadosCategoria,
  };
};

export default function ResultadosScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView | null>(null);

  const [modalidad, setModalidad] = useState<Modalidad | null>(null);
  const [nombreCertamen, setNombreCertamen] = useState('');
  const [equipos, setEquipos] = useState<EquipoResultado[]>([]);
  const [resultadosCategoria, setResultadosCategoria] =
    useState<ResultadoCategoria[]>([]);

  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [indiceActivo, setIndiceActivo] = useState(0);

  const cargarResultados = useCallback(async () => {
    try {
      setActualizando(true);

      const modalidadActual = await getModalidadSeleccionada();

      if (!modalidadActual) {
        Alert.alert(
          'Modalidad no seleccionada',
          'No se encontró una modalidad seleccionada.',
          [
            {
              text: 'Aceptar',
              onPress: () => router.replace('/(admin)/seleccion' as any),
            },
          ]
        );

        return;
      }

      setModalidad(modalidadActual);

      const nombreGuardado = await import(
        '@react-native-async-storage/async-storage'
      ).then(async (modulo) => {
        return modulo.default.getItem('nombreCertamenSeleccionado');
      });

      setNombreCertamen(nombreGuardado ?? '');

      // El servicio agrega automáticamente el filtro de modalidad.
      const respuesta = await getEvaluaciones();

      console.log(
        `EVALUACIONES DE ${modalidadActual}:`,
        JSON.stringify(respuesta, null, 2)
      );

      const evaluaciones = obtenerLista(respuesta);

      const procesados = procesarResultados(evaluaciones);

      setEquipos(procesados.equipos);
      setResultadosCategoria(procesados.resultadosCategoria);
      setIndiceActivo(0);

      if (scrollRef.current) {
        scrollRef.current.scrollTo({
          x: 0,
          animated: false,
        });
      }
    } catch (error: any) {
      console.error('Error al cargar resultados:', error);

      Alert.alert(
        'Error',
        error?.message ?? 'No se pudieron cargar los resultados.'
      );
    } finally {
      setCargando(false);
      setActualizando(false);
    }
  }, [router]);

  useEffect(() => {
    cargarResultados();
  }, [cargarResultados]);

  const cambiarTarjeta = (direccion: number) => {
    if (equipos.length === 0) return;

    const nuevoIndice = Math.max(
      0,
      Math.min(equipos.length - 1, indiceActivo + direccion)
    );

    setIndiceActivo(nuevoIndice);

    scrollRef.current?.scrollTo({
      x: nuevoIndice * (ANCHO_TARJETA + ESPACIO_TARJETAS),
      animated: true,
    });
  };

  const actualizarIndice = (evento: any) => {
    const desplazamiento = evento.nativeEvent.contentOffset.x;

    const nuevoIndice = Math.round(
      desplazamiento / (ANCHO_TARJETA + ESPACIO_TARJETAS)
    );

    setIndiceActivo(
      Math.max(0, Math.min(equipos.length - 1, nuevoIndice))
    );
  };

  const promedioGeneral =
    equipos.length > 0
      ? equipos.reduce((total, equipo) => total + equipo.promedio, 0) /
        equipos.length
      : 0;

  const categorias = Array.from(
    new Set(resultadosCategoria.map((item) => item.categoria))
  );

  const obtenerMedalla = (posicion: number) => {
    if (posicion === 0) return '🥇';
    if (posicion === 1) return '🥈';
    if (posicion === 2) return '🥉';
    return `${posicion + 1}`;
  };

  if (cargando) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#002b45" />
        <Text style={styles.loadingText}>
          Cargando resultados...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ENCABEZADO */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={23} color="#fff" />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>
            Resultados
          </Text>

          <Text style={styles.headerSubtitle}>
            {modalidad ?? 'Sin modalidad'}
            {nombreCertamen ? ` · ${nombreCertamen}` : ''}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={cargarResultados}
          disabled={actualizando}
        >
          {actualizando ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="refresh-outline" size={23} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* RESUMEN GENERAL */}
        <View style={styles.summaryCard}>
          <View>
            <Text style={styles.summaryLabel}>
              PROMEDIO GENERAL
            </Text>

            <Text style={styles.summaryValue}>
              {equipos.length > 0
                ? promedioGeneral.toFixed(2)
                : '—'}
            </Text>

            <Text style={styles.summaryDescription}>
              Promedio de los equipos con calificación
            </Text>
          </View>

          <View style={styles.summaryIcon}>
            <Ionicons
              name="trophy-outline"
              size={32}
              color="#d99b20"
            />
          </View>
        </View>

        {/* CARRUSEL DE EQUIPOS */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Promedio por equipo
            </Text>

            <Text style={styles.sectionSubtitle}>
              Desliza para consultar los resultados
            </Text>
          </View>

          <View style={styles.arrows}>
            <TouchableOpacity
              style={styles.arrowButton}
              onPress={() => cambiarTarjeta(-1)}
              disabled={indiceActivo === 0}
            >
              <Ionicons
                name="chevron-back"
                size={19}
                color={indiceActivo === 0 ? '#b8c1cc' : '#002b45'}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.arrowButton}
              onPress={() => cambiarTarjeta(1)}
              disabled={indiceActivo >= equipos.length - 1}
            >
              <Ionicons
                name="chevron-forward"
                size={19}
                color={
                  indiceActivo >= equipos.length - 1
                    ? '#b8c1cc'
                    : '#002b45'
                }
              />
            </TouchableOpacity>
          </View>
        </View>

        {equipos.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="clipboard-outline"
              size={40}
              color="#94a3b8"
            />

            <Text style={styles.emptyTitle}>
              Todavía no hay resultados
            </Text>

            <Text style={styles.emptyText}>
              Cuando los jurados registren evaluaciones,
              aparecerán aquí los promedios de los equipos.
            </Text>
          </View>
        ) : (
          <>
            <ScrollView
              ref={scrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              snapToInterval={ANCHO_TARJETA + ESPACIO_TARJETAS}
              decelerationRate="fast"
              contentContainerStyle={styles.carouselContent}
              onMomentumScrollEnd={actualizarIndice}
              onScrollEndDrag={actualizarIndice}
            >
              {equipos.map((equipo, index) => (
                <View
                  key={equipo.id}
                  style={[
                    styles.teamCard,
                    index === indiceActivo
                      ? styles.activeTeamCard
                      : styles.inactiveTeamCard,
                  ]}
                >
                  <View style={styles.teamCardTop}>
                    <View style={styles.teamIcon}>
                      <Ionicons
                        name="people"
                        size={25}
                        color="#2563eb"
                      />
                    </View>

                    <Text style={styles.teamPosition}>
                      #{index + 1}
                    </Text>
                  </View>

                  <Text
                    style={styles.teamName}
                    numberOfLines={2}
                  >
                    {equipo.nombre}
                  </Text>

                  <Text style={styles.teamAverageLabel}>
                    PROMEDIO GENERAL
                  </Text>

                  <Text style={styles.teamAverage}>
                    {equipo.promedio.toFixed(2)}
                  </Text>

                  <View style={styles.teamFooter}>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={16}
                      color="#059669"
                    />

                    <Text style={styles.teamFooterText}>
                      {equipo.evaluaciones}{' '}
                      {equipo.evaluaciones === 1
                        ? 'evaluación'
                        : 'evaluaciones'}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.dots}>
              {equipos.map((equipo, index) => (
                <View
                  key={equipo.id}
                  style={[
                    styles.dot,
                    indiceActivo === index && styles.activeDot,
                  ]}
                />
              ))}
            </View>
          </>
        )}

        {/* RANKING POR CATEGORÍA */}
        <View style={styles.rankingHeader}>
          <Text style={styles.sectionTitle}>
            Ranking por categoría
          </Text>

          <Text style={styles.sectionSubtitle}>
            Equipos ordenados por calificación
          </Text>
        </View>

        {categorias.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="podium-outline"
              size={38}
              color="#94a3b8"
            />

            <Text style={styles.emptyTitle}>
              Sin calificaciones por categoría
            </Text>

            <Text style={styles.emptyText}>
              No se encontraron preguntas relacionadas
              con categorías de rúbrica en las evaluaciones.
            </Text>
          </View>
        ) : (
          categorias.map((categoria) => {
            const ranking = resultadosCategoria
              .filter((item) => item.categoria === categoria)
              .sort((a, b) => b.promedio - a.promedio);

            return (
              <View
                key={categoria}
                style={styles.categoryCard}
              >
                <View style={styles.categoryTitleContainer}>
                  <Ionicons
                    name="ribbon-outline"
                    size={21}
                    color="#2563eb"
                  />

                  <Text style={styles.categoryTitle}>
                    {categoria}
                  </Text>
                </View>

                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, { flex: 0.65 }]}>
                    POS.
                  </Text>

                  <Text style={[styles.tableHeaderText, { flex: 2.2 }]}>
                    EQUIPO
                  </Text>

                  <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>
                    PUNTAJE
                  </Text>
                </View>

                {ranking.map((item, index) => (
                  <View
                    key={`${categoria}-${item.equipo}`}
                    style={styles.rankingRow}
                  >
                    <View style={styles.positionContainer}>
                      <Text style={styles.positionText}>
                        {obtenerMedalla(index)}
                      </Text>
                    </View>

                    <Text
                      style={styles.rankingTeam}
                      numberOfLines={2}
                    >
                      {item.equipo}
                    </Text>

                    <Text style={styles.rankingScore}>
                      {item.promedio.toFixed(2)}
                    </Text>
                  </View>
                ))}
              </View>
            );
          })
        )}

        <View style={styles.bottomSpace} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F6FC',
  },

  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F6FC',
  },

  loadingText: {
    marginTop: 14,
    color: '#17365D',
    fontSize: 14,
    fontWeight: '700',
  },

  header: {
    backgroundColor: '#092B49',
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 52,
    paddingHorizontal: 18,
    paddingBottom: 25,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },

  backButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.13)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  headerInfo: {
    flex: 1,
  },

  headerTitle: {
    color: '#FFFFFF',
    fontSize: 23,
    fontWeight: '900',
    letterSpacing: 0.3,
  },

  headerSubtitle: {
    color: '#B8D2E8',
    fontSize: 12,
    marginTop: 5,
    fontWeight: '600',
  },

  refreshButton: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: '#1769AA',
    justifyContent: 'center',
    alignItems: 'center',
  },

  scroll: {
    flex: 1,
  },

  scrollContent: {
    padding: 17,
    paddingBottom: 40,
  },

  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 23,
    padding: 21,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5ECF5',
    marginBottom: 28,
    elevation: 5,
    shadowColor: '#17365D',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },

  summaryLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#8291A6',
    letterSpacing: 1.1,
  },

  summaryValue: {
    color: '#0B3153',
    fontSize: 39,
    fontWeight: '900',
    marginTop: 5,
  },

  summaryDescription: {
    color: '#91A0B4',
    fontSize: 11,
    marginTop: 5,
  },

  summaryIcon: {
    width: 65,
    height: 65,
    borderRadius: 21,
    backgroundColor: '#FFF4D8',
    justifyContent: 'center',
    alignItems: 'center',
  },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 17,
  },

  sectionTitle: {
    fontSize: 19,
    color: '#102F4D',
    fontWeight: '900',
  },

  sectionSubtitle: {
    color: '#8998AC',
    fontSize: 11,
    marginTop: 5,
    fontWeight: '500',
  },

  arrows: {
    flexDirection: 'row',
    gap: 8,
  },

  arrowButton: {
    width: 38,
    height: 38,
    backgroundColor: '#FFFFFF',
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#E1E9F3',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },

  carouselContent: {
    paddingRight: 18,
    gap: ESPACIO_TARJETAS,
    paddingVertical: 5,
  },

  teamCard: {
    width: ANCHO_TARJETA,
    minHeight: 225,
    borderRadius: 23,
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2EAF4',
    elevation: 4,
    shadowColor: '#17365D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 9,
  },

  activeTeamCard: {
    borderColor: '#2878D0',
    borderWidth: 2,
    backgroundColor: '#F8FBFF',
    elevation: 8,
    shadowOpacity: 0.13,
  },

  inactiveTeamCard: {
    opacity: 0.72,
  },

  teamCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  teamIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#E8F2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  teamPosition: {
    color: '#2878D0',
    fontSize: 13,
    fontWeight: '900',
    backgroundColor: '#EAF3FF',
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
  },

  teamName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#102F4D',
    marginTop: 17,
  },

  teamAverageLabel: {
    color: '#8998AC',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 17,
    letterSpacing: 1,
  },

  teamAverage: {
    color: '#1769AA',
    fontSize: 38,
    fontWeight: '900',
    marginTop: 1,
  },

  teamFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 7,
    backgroundColor: '#EAF8F1',
    alignSelf: 'flex-start',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 20,
  },

  teamFooterText: {
    color: '#16845B',
    fontSize: 11,
    fontWeight: '800',
  },

  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 30,
    gap: 7,
  },

  dot: {
    width: 8,
    height: 8,
    borderRadius: 5,
    backgroundColor: '#CCD7E5',
  },

  activeDot: {
    width: 23,
    backgroundColor: '#2878D0',
  },

  rankingHeader: {
    marginBottom: 17,
  },

  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#E5ECF5',
    marginBottom: 17,
    padding: 17,
    elevation: 3,
    shadowColor: '#17365D',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },

  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 18,
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 13,
  },

  categoryTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '900',
    color: '#173B60',
  },

  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#F1F5FA',
    borderRadius: 10,
  },

  tableHeaderText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#718198',
    letterSpacing: 0.6,
  },

  rankingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 60,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF1F6',
  },

  positionContainer: {
    flex: 0.65,
    justifyContent: 'center',
  },

  positionText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#475569',
  },

  rankingTeam: {
    flex: 2.2,
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    paddingRight: 5,
  },

  rankingScore: {
    flex: 1,
    textAlign: 'right',
    fontSize: 15,
    fontWeight: '900',
    color: '#1769AA',
  },

  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#E5ECF5',
    padding: 28,
    alignItems: 'center',
    marginBottom: 25,
    elevation: 2,
  },

  emptyTitle: {
    color: '#263F5B',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 13,
    textAlign: 'center',
  },

  emptyText: {
    color: '#8998AC',
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
  },

  bottomSpace: {
    height: 25,
  },
});
